# ML V2 ERA5 7-Day Test Report

**RAW FILE:** /Users/aniruddhasutradhar/Downloads/5e28c98dfe9943b2e83d7d40eb13e0d9.grib
**ATMOSPHERIC GROUP:** t2m, d2m, u10, v10, msl (Parsed from GRIB, extracted 168 hours)
**PRECIPITATION GROUP:** total_precipitation (Requested via CDS API)
**CLOUD COVER GROUP:** total_cloud_cover (Requested via CDS API)

**TIME RANGE:** 2024-01-01 to 2024-01-07
**EXPECTED HOURS:** 168 (per grid point)
**ACTUAL HOURS:** 168

**GRID:**
**LATITUDES:** [20.5, 20.25]
**LONGITUDES:** [85.75, 86.0]

**VARIABLES:** timestamp, era5_grid_latitude, era5_grid_longitude, temperature_c, dew_point_c, wind_u_ms, wind_v_ms, wind_speed_ms, wind_direction_deg, pressure_hpa, precipitation_mm, cloud_cover_pct
**UNITS:**
- temperature_c: Celsius (converted from Kelvin)
- dew_point_c: Celsius (converted from Kelvin)
- wind_u_ms: m/s (from u10)
- wind_v_ms: m/s (from v10)
- wind_speed_ms: m/s (derived)
- wind_direction_deg: degrees (derived)
- pressure_hpa: hPa (converted from Pa)
- precipitation_mm: mm (converted from metres)
- cloud_cover_pct: % (converted from fraction)

**MISSINGNESS:**
timestamp              0
era5_grid_latitude     0
era5_grid_longitude    0
temperature_c          0
dew_point_c            0
wind_u_ms              0
wind_v_ms              0
wind_speed_ms          0
wind_direction_deg     0
pressure_hpa           0
precipitation_mm       0
cloud_cover_pct        0

**DATA QUALITY:**
All variables converted, merged, and cleanly aligned to 168 hours exactly.
