# ERA5 Historical Map Integration

This document outlines the architecture for integrating historical ERA5 grid data into the spatial map interfaces of SentinelX.

## Ward GeoJSON Source
The geometry is sourced from `wards_bhubaneswar.geojson`, standardizing all 67 wards of Bhubaneswar to ensure consistency across the ML pipeline and frontend maps.

## ERA5 Grid Resolution
Copernicus ERA5 reanalysis data is retrieved at a **0.25° × 0.25°** spatial resolution. 

## Ward → Grid Mapping Method
To associate fine-grained municipal wards with coarse weather grids, we use deterministic nearest-grid-point mapping:
1. Extract the geographic centroid (latitude, longitude) of each ward polygon.
2. Round the centroid coordinates to the nearest 0.25° increment.
3. Calculate the Haversine distance from the centroid to the grid point.
4. This deterministic mapping is stored centrally in `data/ml_v2/era5_grid_mapping.csv`.
*Note: Due to the high resolution of the city versus the coarse 0.25° grid, multiple wards correctly map to the same ERA5 grid point. Data is not duplicated unnecessarily.*

## Live vs Historical Distinction
The `CommandIncidentMap` frontend component strictly segregates operational data:
- **LIVE OPERATIONAL LAYER**: Powered by real-time streams (e.g., `/api/v1/live-feed`) for active telemetry and early-warning alerts.
- **HISTORICAL ERA5 LAYER**: Powered by Copernicus reanalysis, intended strictly for hindcast validation and research, not live telemetry.

## Supported Variables
The mapping architecture supports the following variables for historical overlays:
- `temperature_c` (°C)
- `relative_humidity_pct` (%)
- `apparent_temperature_c` (°C)
- `wind_speed_ms` (m/s)
- `precipitation_mm` (mm)
- `pressure_hpa` (hPa)
- `cloud_cover_pct` (%)

## DATA_PENDING Semantics
Retrieval of the 5-year ERA5 dataset via the CDS API is a long-running process. To maintain system stability without fabricating mock values:
- The backend API (`/api/v1/map/era5`) returns `"status": "DATA_PENDING"` until the extraction completes.
- The map overlay handles this state explicitly, showing **ERA5 DATA PENDING** and visually disabling the data overlay to ensure analysts do not mistake placeholders for real historical data.

## Future ML Map-Layer Hooks
The map architecture is structured to support future predictive layers:
- ML PREDICTED HEAT
- ML PREDICTED RAIN
- ML PREDICTED APPARENT TEMP
These hooks remain disabled and will return `NOT AVAILABLE` until the associated predictive models are fully trained, validated, and deployed to production.
