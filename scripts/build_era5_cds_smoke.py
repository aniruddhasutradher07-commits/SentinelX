import os
import cdsapi
import xarray as xr
import pandas as pd
import numpy as np
import json

def run_cds_smoke_test():
    os.makedirs('data/ml_v2/raw_era5', exist_ok=True)
    os.makedirs('docs', exist_ok=True)
    
    nc_path = 'data/ml_v2/raw_era5/era5_cds_jan2021_smoke.nc'
    csv_path = 'data/ml_v2/era5_cds_jan2021_smoke.csv'
    report_path = 'docs/ml_v2_cds_smoke_report.md'
    
    request_payload = {
        'product_type': 'reanalysis',
        'format': 'netcdf',
        'variable': [
            '2m_temperature', '2m_dewpoint_temperature', '10m_u_component_of_wind',
            '10m_v_component_of_wind', 'mean_sea_level_pressure', 'total_precipitation',
            'total_cloud_cover',
        ],
        'year': '2021',
        'month': '01',
        'day': [f"{d:02d}" for d in range(1, 32)],
        'time': [f"{h:02d}:00" for h in range(24)],
        # North, West, South, East -> Just one point
        'area': [20.25, 85.75, 20.25, 85.75],
    }
    
    print("=== DOWNLOADING CDS DATA ===")
    if not os.path.exists(nc_path):
        try:
            c = cdsapi.Client()
            c.retrieve('reanalysis-era5-single-levels', request_payload, nc_path)
        except Exception as e:
            print(f"CDS_SMOKE_TEST_FAIL (API error: {e})")
            return
            
    if not os.path.exists(nc_path):
        print("CDS_SMOKE_TEST_FAIL (File not downloaded)")
        return
        
    print("=== PROCESSING CDS DATA ===")
    try:
        import zipfile
        import glob
        
        # New CDS API returns a ZIP when instantaneous and accumulated variables are mixed
        if zipfile.is_zipfile(nc_path):
            print("Detected ZIP archive, extracting...")
            extract_dir = "data/ml_v2/raw_era5/extracted_smoke"
            os.makedirs(extract_dir, exist_ok=True)
            with zipfile.ZipFile(nc_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            nc_files = glob.glob(f"{extract_dir}/*.nc")
            datasets = [xr.open_dataset(f) for f in nc_files]
            ds = xr.merge(datasets)
        else:
            ds = xr.open_dataset(nc_path)
        
        # Verify 1 spatial grid point
        if ds.latitude.size != 1 or ds.longitude.size != 1:
            print(f"CDS_SMOKE_TEST_FAIL (Expected 1 grid point, got {ds.latitude.size}x{ds.longitude.size})")
            return
            
        df = ds.to_dataframe().reset_index()
        
        if len(df) != 31 * 24:
            print(f"CDS_SMOKE_TEST_FAIL (Expected 744 rows, got {len(df)})")
            return
            
        required_vars = ['t2m', 'd2m', 'u10', 'v10', 'msl', 'tp', 'tcc']
        for v in required_vars:
            if v not in df.columns:
                print(f"CDS_SMOKE_TEST_FAIL (Missing variable: {v})")
                return
                
        # 5. Conversions
        df['temperature_c'] = df['t2m'] - 273.15
        df['dew_point_c'] = df['d2m'] - 273.15
        df['pressure_hpa'] = df['msl'] / 100.0
        df['precipitation_mm'] = df['tp'].apply(lambda x: max(0.0, x * 1000.0))
        df['cloud_cover_pct'] = df['tcc'].apply(lambda x: min(100.0, max(0.0, x * 100.0)))
        
        df['wind_u_ms'] = df['u10']
        df['wind_v_ms'] = df['v10']
        df['wind_speed_ms'] = np.sqrt(df['u10']**2 + df['v10']**2)
        df['wind_direction_deg'] = (270 - np.rad2deg(np.arctan2(df['v10'], df['u10']))) % 360
        
        # 6. Derivations
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
        
        df.to_csv(csv_path, index=False)
        
        # 8. Report
        file_size = os.path.getsize(nc_path) / (1024*1024)
        missing_counts = df.isnull().sum().to_dict()
        
        report_md = f"""# CDS ERA5 1-Month Smoke Test Report (Jan 2021)

## Request Payload
```json
{json.dumps(request_payload, indent=2)}
```

## Dataset Info
- **Download Size (NC)**: {file_size:.2f} MB
- **Row Count**: {len(df)}
- **Variable Names**: {list(df.columns)}
- **Min Timestamp**: {df['timestamp'].min()}
- **Max Timestamp**: {df['timestamp'].max()}

## Missing Value Counts
```json
{json.dumps(missing_counts, indent=2)}
```

## Derived Feature Checks
- **Relative Humidity (Min/Max)**: {df['relative_humidity_pct'].min():.2f}% / {df['relative_humidity_pct'].max():.2f}%
- **Apparent Temperature (Min/Max)**: {df['apparent_temperature_c'].min():.2f}°C / {df['apparent_temperature_c'].max():.2f}°C
- **Wind Speed (Min/Max)**: {df['wind_speed_ms'].min():.2f} m/s / {df['wind_speed_ms'].max():.2f} m/s

## Final Status
**PASS**
"""
        with open(report_path, "w") as f:
            f.write(report_md)
            
        print("CDS_SMOKE_TEST_PASS")
    except Exception as e:
        print(f"CDS_SMOKE_TEST_FAIL (Processing error: {e})")
        import traceback
        traceback.print_exc()
        
if __name__ == "__main__":
    run_cds_smoke_test()
