import os
import time
import pandas as pd
import xarray as xr
import numpy as np

import pytest
pytest.importorskip("gcsfs")
import gcsfs

def run_smoke_test():
    print("ZARR ACCESS: STARTING")
    try:
        fs = gcsfs.GCSFileSystem(token="anon")
        store = fs.get_mapper("gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3")
        ds = xr.open_zarr(store, consolidated=True)
        print("ZARR ACCESS: PASS")
    except Exception as e:
        print(f"ZARR ACCESS: FAIL ({e})")
        return

    # Just one grid cell near Bhubaneswar
    test_lat = 20.25
    test_lon = 85.75
    
    # Slice to nearest
    print("2021 TIME SLICE: STARTING")
    try:
        arco_lats = ds.latitude.values
        arco_lons = ds.longitude.values
        lat_idx = np.abs(arco_lats - test_lat).argmin()
        lon_idx = np.abs(arco_lons - test_lon).argmin()
        n_lat, n_lon = arco_lats[lat_idx], arco_lons[lon_idx]
        
        vars_to_extract = [
            '2m_temperature', '2m_dewpoint_temperature',
            '10m_u_component_of_wind', '10m_v_component_of_wind',
            'mean_sea_level_pressure', 'total_precipitation',
            'total_cloud_cover'
        ]
        
        start_time = "2021-01-01T00:00:00"
        end_time = "2021-01-31T23:00:00"
        
        ds_slice = ds[vars_to_extract].sel(
            time=slice(start_time, end_time),
            latitude=slice(n_lat, n_lat) if ds.latitude[0] < ds.latitude[-1] else slice(n_lat, n_lat),
            longitude=slice(n_lon, n_lon)
        )
        print("2021 TIME SLICE: PASS")
        print(f"Lazy Dimensions: {ds_slice.dims}")
        print("REQUIRED VARIABLES: PASS")
    except Exception as e:
        print(f"2021 TIME SLICE: FAIL ({e})")
        return
        
    print("1-MONTH SMOKE TEST: STARTING")
    t0 = time.time()
    try:
        df = ds_slice.compute().to_dataframe().reset_index()
        t1 = time.time()
        print(f"1-MONTH SMOKE TEST: PASS (took {t1-t0:.2f}s)")
        print(f"ROWS: {len(df)}")
        print(f"MEMORY: {df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB")
        
        # Verify columns exist
        print(df.head())
    except Exception as e:
        print(f"1-MONTH SMOKE TEST: FAIL ({e})")
        
if __name__ == "__main__":
    run_smoke_test()
