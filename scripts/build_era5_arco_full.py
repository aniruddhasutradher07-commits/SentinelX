import os
import json
import numpy as np
import pandas as pd
import xarray as xr
import gcsfs
import time
import warnings
warnings.filterwarnings('ignore')

def run_pipeline():
    print("=== 1. INSTALL / VERIFY ===")
    print("Libraries loaded.")
    
    print("\n=== 2. OPEN PUBLIC ZARR ===")
    fs = gcsfs.GCSFileSystem(token="anon")
    store = fs.get_mapper("gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3")
    ds = xr.open_zarr(store, consolidated=True)
    
    print(f"Dimensions: {ds.dims}")
    
    print("\n=== 3. LOCATION STRATEGY ===")
    with open("wards_bhubaneswar.geojson", "r") as f:
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
    
    arco_lats = ds.latitude.values
    arco_lons = ds.longitude.values
    
    def find_nearest_arco(lat, lon):
        lat_idx = np.abs(arco_lats - lat).argmin()
        lon_idx = np.abs(arco_lons - lon).argmin()
        return arco_lats[lat_idx], arco_lons[lon_idx]
        
    arco_grid_lats, arco_grid_lons = zip(*[find_nearest_arco(r['requested_latitude'], r['requested_longitude']) for _, r in ward_df.iterrows()])
    ward_df['arco_grid_latitude'] = arco_grid_lats
    ward_df['arco_grid_longitude'] = arco_grid_lons
    
    unique_grids = ward_df[['arco_grid_latitude', 'arco_grid_longitude']].drop_duplicates()
    
    print(f"Found {len(unique_grids)} unique ARCO grid cells for {len(ward_df)} wards.")
    
    print("\n=== 4. TIME RANGE ===")
    start_time = "2021-01-01T00:00:00"
    end_time = "2025-12-31T23:00:00"
    print(f"Extraction Range: {start_time} to {end_time}")
    
    print("\n=== 5/6. VARIABLES & LAZY SLICE ===")
    vars_to_extract = [
        '2m_temperature', '2m_dewpoint_temperature',
        '10m_u_component_of_wind', '10m_v_component_of_wind',
        'mean_sea_level_pressure', 'total_precipitation',
        'total_cloud_cover'
    ]
    
    lat_min, lat_max = unique_grids['arco_grid_latitude'].min(), unique_grids['arco_grid_latitude'].max()
    lon_min, lon_max = unique_grids['arco_grid_longitude'].min(), unique_grids['arco_grid_longitude'].max()
    
    if ds.latitude[0] > ds.latitude[-1]:
        lat_slice = slice(lat_max, lat_min)
    else:
        lat_slice = slice(lat_min, lat_max)
        
    ds_slice = ds[vars_to_extract].sel(
        time=slice(start_time, end_time),
        latitude=lat_slice,
        longitude=slice(lon_min, lon_max)
    )
    print(f"Lazy Slice Dimensions: {ds_slice.dims}")
    
    print("\n=== 7/8. MATERIALIZE AND UNIT CONVERSIONS ===")
    t0 = time.time()
    df_raw = ds_slice.compute().to_dataframe().reset_index()
    t1 = time.time()
    print(f"Downloaded and materialized in {t1-t0:.2f} seconds.")
    
    # Drop future padded NaNs (e.g. late 2024 to 2025 if not populated yet)
    df_raw = df_raw.dropna(subset=['2m_temperature'])
    
    valid_coords = set(zip(unique_grids['arco_grid_latitude'], unique_grids['arco_grid_longitude']))
    df = df_raw[df_raw.apply(lambda row: (row['latitude'], row['longitude']) in valid_coords, axis=1)].copy()
    
    df = df.rename(columns={'time': 'timestamp', 'latitude': 'arco_grid_latitude', 'longitude': 'arco_grid_longitude'})
    
    df['temperature_c'] = df['2m_temperature'] - 273.15
    df['dew_point_c'] = df['2m_dewpoint_temperature'] - 273.15
    df['pressure_hpa'] = df['mean_sea_level_pressure'] / 100.0
    df['precipitation_mm'] = df['total_precipitation'].apply(lambda x: max(0.0, x * 1000.0))
    df['cloud_cover_pct'] = df['total_cloud_cover'] * 100.0
    
    df['wind_u_ms'] = df['10m_u_component_of_wind']
    df['wind_v_ms'] = df['10m_v_component_of_wind']
    df['wind_speed_ms'] = np.sqrt(df['10m_u_component_of_wind']**2 + df['10m_v_component_of_wind']**2)
    df['wind_direction_deg'] = (270 - np.rad2deg(np.arctan2(df['10m_v_component_of_wind'], df['10m_u_component_of_wind']))) % 360
    
    cols = ['timestamp', 'arco_grid_latitude', 'arco_grid_longitude', 
            'temperature_c', 'dew_point_c', 'wind_u_ms', 'wind_v_ms', 
            'wind_speed_ms', 'wind_direction_deg', 'pressure_hpa', 
            'precipitation_mm', 'cloud_cover_pct']
    df = df[cols]
    
    os.makedirs("data/ml_v2", exist_ok=True)
    df.to_csv("data/ml_v2/historical_weather_arco_2021_2025.csv", index=False)
    ward_df.to_csv("data/ml_v2/ward_arco_grid_mapping.csv", index=False)
    
    print("\n=== 10. FULL DATASET MATERIALIZED ===")
    print(f"Total Rows: {len(df)}")
    print(f"Memory Usage: {df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB")
    
    print("\n=== 14. REPORT ===")
    missingness = df.isnull().sum().sum()
    report = f"""# ML V2 ARCO Dataset Report

SOURCE:
ARCO ERA5

STORE:
gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3

ARCO DATA COVERAGE:
2021-01-01 to 2025-12-31

TRAINING PERIOD:
{df['timestamp'].min()} to {df['timestamp'].max()}

UNIQUE WARDS:
{len(ward_df)}

UNIQUE ARCO GRID CELLS:
{len(unique_grids)}

ROWS:
{len(df)}

VARIABLES:
temperature_c, dew_point_c, wind_u_ms, wind_v_ms, wind_speed_ms, wind_direction_deg, pressure_hpa, precipitation_mm, cloud_cover_pct

UNITS:
Converted from Kelvin, Pa, m, fraction to canonical Celsius, hPa, mm, percentage.

MISSINGNESS:
{missingness} total missing values

DUPLICATES:
{df.duplicated(subset=['timestamp', 'arco_grid_latitude', 'arco_grid_longitude']).sum()}

DATASET SIZE:
{df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB

WARD→GRID MAPPING:
Saved to data/ml_v2/ward_arco_grid_mapping.csv
"""
    with open("docs/ml_v2_arco_data_report.md", "w") as f:
        f.write(report)
        
    print("\nExtraction complete.")

if __name__ == "__main__":
    run_pipeline()
