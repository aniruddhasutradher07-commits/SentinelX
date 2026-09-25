import os
import json
import numpy as np
import pandas as pd
import xarray as xr

import pytest
pytest.importorskip("gcsfs")
import gcsfs

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

def run_metadata_test():
    print("=== ARCO METADATA TEST ===")
    
    # 2. OPEN PUBLIC ZARR (Lazy)
    fs = gcsfs.GCSFileSystem(token="anon", client_kwargs={'ssl': False})
    store = fs.get_mapper("gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3")
    ds = xr.open_zarr(store, consolidated=True)
    
    print(f"Dimensions: {ds.dims}")
    print(f"Coordinates: {list(ds.coords)}")
    
    valid_start = pd.to_datetime(ds.time.values[0])
    valid_stop = pd.to_datetime(ds.time.values[-1])
    print(f"Dataset valid_time_start: {valid_start}")
    print(f"Dataset valid_time_stop: {valid_stop}")
    
    # Check if 2025 exists completely. ARCO might not have 2025 yet.
    # Usually it lags by 2-3 months.
    print(f"Available until: {valid_stop}")
    
    # 3. LOCATION STRATEGY
    with open("data/wards_bhubaneswar.geojson", "r") as f:
        wards_data = json.load(f)
        
    ward_coords = []
    for feature in wards_data['features']:
        props = feature['properties']
        geom = feature['geometry']
        if geom['type'] == 'Polygon':
            poly = np.array(geom['coordinates'][0])
            lon, lat = poly.mean(axis=0)
        elif geom['type'] == 'MultiPolygon':
            poly = np.array(geom['coordinates'][0][0])
            lon, lat = poly.mean(axis=0)
        ward_coords.append({
            'ward_no': props.get('ward_no', 'unknown'),
            'ward_name': props.get('ward_name', 'unknown'),
            'requested_latitude': lat,
            'requested_longitude': lon
        })
        
    ward_df = pd.DataFrame(ward_coords)
    
    # Map to nearest ARCO grid
    arco_lats = ds.latitude.values
    arco_lons = ds.longitude.values
    
    def find_nearest_arco(lat, lon):
        lat_idx = np.abs(arco_lats - lat).argmin()
        lon_idx = np.abs(arco_lons - lon).argmin()
        return arco_lats[lat_idx], arco_lons[lon_idx]
        
    arco_grid_lats = []
    arco_grid_lons = []
    for _, row in ward_df.iterrows():
        n_lat, n_lon = find_nearest_arco(row['requested_latitude'], row['requested_longitude'])
        arco_grid_lats.append(n_lat)
        arco_grid_lons.append(n_lon)
        
    ward_df['arco_grid_latitude'] = arco_grid_lats
    ward_df['arco_grid_longitude'] = arco_grid_lons
    
    unique_grids = ward_df[['arco_grid_latitude', 'arco_grid_longitude']].drop_duplicates()
    print(f"\nFound {len(unique_grids)} unique ARCO grid cells for {len(ward_df)} wards.")
    
    # 4. LAZY SPATIAL/TEMPORAL SLICE
    # For testing, we just slice 2021-01
    start_time = "2021-01-01T00:00:00"
    end_time = "2021-01-31T23:00:00"
    
    # 5. VARIABLES
    vars_to_extract = [
        '2m_temperature', '2m_dewpoint_temperature',
        '10m_u_component_of_wind', '10m_v_component_of_wind',
        'mean_sea_level_pressure', 'total_precipitation',
        'total_cloud_cover'
    ]
    
    # Subset
    # Note: ARCO lats are often descending (e.g. 90 to -90), need to handle slicing carefully
    lat_min, lat_max = unique_grids['arco_grid_latitude'].min(), unique_grids['arco_grid_latitude'].max()
    lon_min, lon_max = unique_grids['arco_grid_longitude'].min(), unique_grids['arco_grid_longitude'].max()
    
    # Lats are descending in ERA5
    if ds.latitude[0] > ds.latitude[-1]:
        lat_slice = slice(lat_max, lat_min)
    else:
        lat_slice = slice(lat_min, lat_max)
        
    ds_slice = ds[vars_to_extract].sel(
        time=slice(start_time, end_time),
        latitude=lat_slice,
        longitude=slice(lon_min, lon_max)
    )
    
    print("\nLazy Slice Dimensions:", ds_slice.dims)
    
    # 9. DATASET SIZE TEST (One month)
    print("\nMaterializing one month (2021-01) for performance testing...")
    
    # We use .compute() to pull data into memory
    import time
    t0 = time.time()
    df_month = ds_slice.compute().to_dataframe().reset_index()
    t1 = time.time()
    
    # Drop rows not in our unique grids
    # Because spatial slice gives a bounding box, we might have grids we don't need
    valid_coords = list(zip(unique_grids['arco_grid_latitude'], unique_grids['arco_grid_longitude']))
    df_month = df_month[df_month.apply(lambda row: (row['latitude'], row['longitude']) in valid_coords, axis=1)]
    
    mem_usage = df_month.memory_usage(deep=True).sum() / (1024 * 1024)
    
    print(f"Materialized {len(df_month)} rows in {t1-t0:.2f} seconds.")
    print(f"Grid cells extracted: {len(df_month[['latitude', 'longitude']].drop_duplicates())}")
    print(f"Memory usage: {mem_usage:.2f} MB")
    
if __name__ == "__main__":
    run_metadata_test()
