import os
import cdsapi
import xarray as xr
import pandas as pd
import numpy as np
import json
import zipfile
import glob
import time
import shutil
import traceback
from datetime import datetime
from dateutil.relativedelta import relativedelta

def get_bounding_box_and_mapping():
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
    
    # Bhubaneswar is approx 20.15 to 20.45 Lat, 85.7 to 85.95 Lon
    # We will just fetch a box covering it: N: 20.5, W: 85.5, S: 20.0, E: 86.0
    # Actually, let's look at the exact bounds of the requested coordinates:
    min_lat = ward_df['requested_latitude'].min()
    max_lat = ward_df['requested_latitude'].max()
    min_lon = ward_df['requested_longitude'].min()
    max_lon = ward_df['requested_longitude'].max()
    
    # ERA5 grid is 0.25 deg. Round to nearest 0.25
    def round_to_quarter(x):
        return round(x * 4) / 4
        
    # Make sure bounding box covers all wards
    era_n = round_to_quarter(max_lat + 0.125)
    era_s = round_to_quarter(min_lat - 0.125)
    era_w = round_to_quarter(min_lon - 0.125)
    era_e = round_to_quarter(max_lon + 0.125)
    
    area = [era_n, era_w, era_s, era_e]
    return ward_df, area

def extract_nc_from_zip(file_path, extract_dir):
    if zipfile.is_zipfile(file_path):
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        nc_files = glob.glob(f"{extract_dir}/*.nc")
        datasets = [xr.open_dataset(f) for f in nc_files]
        ds = xr.merge(datasets)
        return ds, extract_dir
    else:
        return xr.open_dataset(file_path), None

def process_chunk(ds):
    df = ds.to_dataframe().reset_index()
    # Handle different index names
    if 'time' in df.columns and 'valid_time' not in df.columns:
        df = df.rename(columns={'time': 'valid_time'})
        
    df['temperature_c'] = df['t2m'] - 273.15
    df['dew_point_c'] = df['d2m'] - 273.15
    df['pressure_hpa'] = df['msl'] / 100.0
    df['precipitation_mm'] = df['tp'].apply(lambda x: max(0.0, x * 1000.0))
    df['cloud_cover_pct'] = df['tcc'].apply(lambda x: min(100.0, max(0.0, x * 100.0)))
    
    df['wind_u_ms'] = df['u10']
    df['wind_v_ms'] = df['v10']
    df['wind_speed_ms'] = np.sqrt(df['u10']**2 + df['v10']**2)
    df['wind_direction_deg'] = (270 - np.rad2deg(np.arctan2(df['v10'], df['u10']))) % 360
    
    T = df['temperature_c']
    Td = df['dew_point_c']
    df['relative_humidity_pct'] = 100 * (np.exp((17.625 * Td) / (243.04 + Td)) / np.exp((17.625 * T) / (243.04 + T)))
    
    e_hpa = (df['relative_humidity_pct'] / 100.0) * 6.105 * np.exp(17.27 * T / (237.7 + T))
    ws = df['wind_speed_ms']
    df['apparent_temperature_c'] = T + 0.33 * e_hpa - 0.70 * ws - 4.00
    
    cols = [
        'valid_time', 'latitude', 'longitude', 'temperature_c', 'dew_point_c', 
        'relative_humidity_pct', 'apparent_temperature_c',
        'wind_u_ms', 'wind_v_ms', 'wind_speed_ms', 'wind_direction_deg', 
        'pressure_hpa', 'precipitation_mm', 'cloud_cover_pct'
    ]
    
    df = df[cols].rename(columns={'valid_time': 'timestamp', 'latitude': 'era5_grid_latitude', 'longitude': 'era5_grid_longitude'})
    return df

def run_pipeline():
    os.makedirs('data/ml_v2/raw_era5/cds_chunks', exist_ok=True)
    os.makedirs('docs', exist_ok=True)
    
    ward_df, area = get_bounding_box_and_mapping()
    print(f"Bounding Box for CDS: {area}")
    
    c = cdsapi.Client()
    
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2025, 12, 31)
    
    current_date = start_date
    all_dfs = []
    
    completed_chunks = 0
    failed_chunks = 0
    total_download_size_mb = 0
    
    # 2021 to 2025 by month
    while current_date <= end_date:
        year_str = current_date.strftime("%Y")
        month_str = current_date.strftime("%m")
        
        # Calculate days in month
        next_month = current_date + relativedelta(months=1)
        days_in_month = (next_month - current_date).days
        
        chunk_path = f"data/ml_v2/raw_era5/cds_chunks/era5_cds_{year_str}_{month_str}.nc"
        
        if os.path.exists(chunk_path):
            print(f"Skipping download for {year_str}-{month_str} (already cached)")
        else:
            print(f"Downloading CDS chunk for {year_str}-{month_str}...")
            payload = {
                'product_type': 'reanalysis',
                'format': 'netcdf',
                'variable': [
                    '2m_temperature', '2m_dewpoint_temperature', '10m_u_component_of_wind',
                    '10m_v_component_of_wind', 'mean_sea_level_pressure', 'total_precipitation',
                    'total_cloud_cover',
                ],
                'year': year_str,
                'month': month_str,
                'day': [f"{d:02d}" for d in range(1, days_in_month + 1)],
                'time': [f"{h:02d}:00" for h in range(24)],
                'area': area,
            }
            try:
                c.retrieve('reanalysis-era5-single-levels', payload, chunk_path)
            except Exception as e:
                print(f"Failed to download {year_str}-{month_str}: {e}")
                failed_chunks += 1
                current_date = next_month
                continue
                
        try:
            total_download_size_mb += os.path.getsize(chunk_path) / (1024*1024)
            extract_dir = f"data/ml_v2/raw_era5/cds_chunks/extracted_{year_str}_{month_str}"
            ds, temp_dir = extract_nc_from_zip(chunk_path, extract_dir)
            df_chunk = process_chunk(ds)
            all_dfs.append(df_chunk)
            completed_chunks += 1
            
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                
        except Exception as e:
            print(f"Failed to process chunk {year_str}-{month_str}: {e}")
            traceback.print_exc()
            failed_chunks += 1
            
        current_date = next_month
        
    if failed_chunks > 0:
        print(f"Pipeline completed with {failed_chunks} failures. Cannot proceed to merge.")
        print("CDS_FULL_DATASET_FAIL")
        return
        
    if not all_dfs:
        print("No data processed.")
        print("CDS_FULL_DATASET_FAIL")
        return
        
    print("Merging chunks...")
    final_df = pd.concat(all_dfs, ignore_index=True)
    final_df = final_df.sort_values(by=['era5_grid_latitude', 'era5_grid_longitude', 'timestamp']).reset_index(drop=True)
    
    # Map wards to unique grid cells
    unique_grids = final_df[['era5_grid_latitude', 'era5_grid_longitude']].drop_duplicates().values
    
    def find_nearest_grid(lat, lon):
        dists = np.sqrt((unique_grids[:, 0] - lat)**2 + (unique_grids[:, 1] - lon)**2)
        idx = np.argmin(dists)
        return unique_grids[idx][0], unique_grids[idx][1]
        
    mapped_lats, mapped_lons = zip(*[find_nearest_grid(r['requested_latitude'], r['requested_longitude']) for _, r in ward_df.iterrows()])
    ward_df['era5_grid_latitude'] = mapped_lats
    ward_df['era5_grid_longitude'] = mapped_lons
    
    final_df.to_csv("data/ml_v2/historical_weather_era5_cds_2021_2025.csv", index=False)
    ward_df.to_csv("data/ml_v2/era5_grid_mapping.csv", index=False)
    
    missing_count = final_df.isnull().sum().sum()
    unique_pts = len(unique_grids)
    expected_rows = 5 * 365.25 * 24 * unique_pts # approx
    actual_rows = len(final_df)
    
    report_md = f"""# CDS ERA5 2021-2025 Full Dataset Report

## Summary
- **Source**: Copernicus/ECMWF ERA5 (reanalysis-era5-single-levels)
- **Retrieval Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Period**: 2021-01-01 to 2025-12-31
- **Unique ERA5 Grid Points**: {unique_pts}
- **Variables**: temperature_c, dew_point_c, relative_humidity_pct, apparent_temperature_c, wind_u_ms, wind_v_ms, wind_speed_ms, wind_direction_deg, pressure_hpa, precipitation_mm, cloud_cover_pct

## Download Metrics
- **Completed Monthly Chunks**: {completed_chunks}
- **Failed/Retried Chunks**: {failed_chunks}
- **Total Download Size (Raw NCs)**: {total_download_size_mb:.2f} MB

## Dataset Metrics
- **Date Range**: {final_df['timestamp'].min()} to {final_df['timestamp'].max()}
- **Expected Hourly Rows (Approx)**: {int(expected_rows)}
- **Actual Rows**: {actual_rows}
- **Missing Value Count**: {missing_count}

## Outputs
- **Dataset**: `data/ml_v2/historical_weather_era5_cds_2021_2025.csv`
- **Mapping**: `data/ml_v2/era5_grid_mapping.csv`

## Final Status
**PASS**
"""
    with open("docs/ml_v2_cds_2021_2025_report.md", "w") as f:
        f.write(report_md)
        
    print("CDS_FULL_DATASET_PASS")
    
if __name__ == "__main__":
    run_pipeline()
