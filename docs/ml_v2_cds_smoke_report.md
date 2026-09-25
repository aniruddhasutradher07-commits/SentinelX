# CDS ERA5 1-Month Smoke Test Report (Jan 2021)

## Request Payload
```json
{
  "product_type": "reanalysis",
  "format": "netcdf",
  "variable": [
    "2m_temperature",
    "2m_dewpoint_temperature",
    "10m_u_component_of_wind",
    "10m_v_component_of_wind",
    "mean_sea_level_pressure",
    "total_precipitation",
    "total_cloud_cover"
  ],
  "year": "2021",
  "month": "01",
  "day": [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31"
  ],
  "time": [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00"
  ],
  "area": [
    20.25,
    85.75,
    20.25,
    85.75
  ]
}
```

## Dataset Info
- **Download Size (NC)**: 0.20 MB
- **Row Count**: 744
- **Variable Names**: ['timestamp', 'era5_grid_latitude', 'era5_grid_longitude', 'temperature_c', 'dew_point_c', 'relative_humidity_pct', 'apparent_temperature_c', 'wind_u_ms', 'wind_v_ms', 'wind_speed_ms', 'wind_direction_deg', 'pressure_hpa', 'precipitation_mm', 'cloud_cover_pct']
- **Min Timestamp**: 2021-01-01 00:00:00
- **Max Timestamp**: 2021-01-31 23:00:00

## Missing Value Counts
```json
{
  "timestamp": 0,
  "era5_grid_latitude": 0,
  "era5_grid_longitude": 0,
  "temperature_c": 0,
  "dew_point_c": 0,
  "relative_humidity_pct": 0,
  "apparent_temperature_c": 0,
  "wind_u_ms": 0,
  "wind_v_ms": 0,
  "wind_speed_ms": 0,
  "wind_direction_deg": 0,
  "pressure_hpa": 0,
  "precipitation_mm": 0,
  "cloud_cover_pct": 0
}
```

## Derived Feature Checks
- **Relative Humidity (Min/Max)**: 35.27% / 99.59%
- **Apparent Temperature (Min/Max)**: 14.48°C / 35.31°C
- **Wind Speed (Min/Max)**: 0.10 m/s / 4.45 m/s

## Final Status
**PASS**
