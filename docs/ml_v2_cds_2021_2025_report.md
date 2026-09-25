# ERA5 ML V2 CDS 2021-2025 Validation Report

## 1. Inventory & Period
- Extraction Period: 2021-01-01 to 2025-12-31
- 60/60 month confirmation: PASS (Found 60 monthly NetCDF chunks)
- Expected rows: 262944
- Actual rows: 262944
- Unique ERA5 grid points: 6

## 2. Spatial Mapping
- Validated via `data/ml_v2/era5_grid_mapping.csv`
- Wards covered: 67
- ERA5 Grids mapped: 6

## 3. Variables & Units
- `temperature_c`: Celsius
- `dew_point_c`: Celsius
- `relative_humidity_pct`: %
- `apparent_temperature_c`: Celsius
- `wind_u_ms`: m/s
- `wind_v_ms`: m/s
- `wind_speed_ms`: m/s
- `wind_direction_deg`: degrees
- `pressure_hpa`: hPa
- `precipitation_mm`: mm (de-accumulated from hourly steps)
- `cloud_cover_pct`: %

## 4. Quality & Missing Data
- Missing values: 0
- Duplicate rows: 0
- Timestamp gaps: 0 (if rows exactly match expected)
- Invalid physical values: 0

## 5. Provenance
- `data_source` column: Copernicus / ECMWF ERA5

## 6. Validation Status
ERA5_DATASET_VALIDATED
