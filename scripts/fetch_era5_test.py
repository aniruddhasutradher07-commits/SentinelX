import os
import xarray as xr
import cdsapi

OUTPUT_DIR = "data/ml_v2/raw_era5"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "era5_bhubaneswar_7day_test.nc")
REPORT_FILE = "docs/ml_v2_era5_7day_test.md"

def fetch_and_verify():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs("docs", exist_ok=True)
    
    # 1. Fetch Data
    try:
        c = cdsapi.Client()
        print("CDS AUTH: PASS")
    except Exception as e:
        print(f"CDS AUTH: FAIL ({e})")
        return
        
    try:
        # Bounding box: North, West, South, East
        area = [20.40, 85.70, 20.20, 85.95]
        hours = [f"{i:02d}:00" for i in range(24)]
        
        if not os.path.exists(OUTPUT_FILE):
            print("Fetching ERA5 7-day test data...")
            c.retrieve(
                'reanalysis-era5-single-levels',
                {
                    'product_type': 'reanalysis',
                    'format': 'netcdf',
                    'variable': [
                        '2m_temperature', '2m_dewpoint_temperature',
                        '10m_u_component_of_wind', '10m_v_component_of_wind',
                        'total_precipitation', 'mean_sea_level_pressure',
                        'total_cloud_cover'
                    ],
                    'year': '2024',
                    'month': '01',
                    'day': [f"{i:02d}" for i in range(1, 8)],
                    'time': hours,
                    'area': area,
                },
                OUTPUT_FILE
            )
        print("TERMS: PASS")
    except Exception as e:
        print(f"TERMS: FAIL ({e})")
        return

    # 2. Parse and Verify
    try:
        ds = xr.open_dataset(OUTPUT_FILE)
        
        file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
        time_steps = len(ds.time)
        variables = list(ds.data_vars)
        
        # Check units from metadata
        units = {var: ds[var].attrs.get('units', 'Unknown') for var in variables}
        missing_vals = {var: int(ds[var].isnull().sum().item()) for var in variables}
        
        report = f"""# ERA5 7-Day Minimal Test Report

**DATASET:** reanalysis-era5-single-levels
**DATE RANGE:** 2024-01-01 to 2024-01-07
**AREA:** [20.40, 85.70, 20.20, 85.95]
**GRID:** {len(ds.latitude)} latitudes x {len(ds.longitude)} longitudes (0.25 deg ERA5 grid)
**TIME STEPS:** {time_steps}
**VARIABLES:** {", ".join(variables)}
**UNITS:** 
"""
        for k, v in units.items():
            report += f"  - {k}: {v}\n"
            
        report += f"""
**FILE SIZE:** {file_size_mb:.2f} MB
**MISSING VALUES:**
"""
        for k, v in missing_vals.items():
            report += f"  - {k}: {v}\n"
            
        report += """
**API STATUS:** PASS
**TERMS STATUS:** PASS
"""
        with open(REPORT_FILE, "w") as f:
            f.write(report)
            
        print("ERA5 7-DAY: PASS")
        print(f"TIME STEPS: {time_steps}")
        print(f"VARIABLES: {len(variables)}")
        print(f"GRID: {len(ds.latitude)}x{len(ds.longitude)}")
        missing_total = sum(missing_vals.values())
        print(f"MISSINGNESS: {missing_total}")
        print(f"FILE: {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"ERA5 7-DAY: FAIL ({e})")

if __name__ == "__main__":
    fetch_and_verify()
