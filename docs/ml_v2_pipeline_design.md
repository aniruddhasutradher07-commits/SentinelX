# SentinelX ML V2 Pipeline Design

## Objective
Provide next-24-hour environmental heat-exposure prediction based on historical ERA5 meteorology.

## Input Data Schema
Expects strictly chronological hourly ERA5 grid point records:
- timestamp
- era5_grid_latitude
- era5_grid_longitude
- temperature_c, dew_point_c, relative_humidity_pct, apparent_temperature_c
- wind_u_ms, wind_v_ms, wind_speed_ms, wind_direction_deg
- pressure_hpa, precipitation_mm, cloud_cover_pct

## Feature Groups
- Current weather features
- Lag features: 1h, 3h, 6h, 12h, 24h
- Rolling features (strictly causal using `.shift(1)`): 24h min/max/mean of temp, humidity, wind
- Seasonal features: hour_sin, hour_cos, doy_sin, doy_cos

## Target Options
- Target Temperature at t+24
- Target Max Temperature during t+1 to t+24
- Target Apparent Temperature at t+24
- Target Max Apparent Temperature during t+1 to t+24
- Binary Heat Exposure Threshold 

## Leakage Rules
- No silent imputation
- Strict forward rolling windows for targets
- Strict backward rolling windows for features (with offset)

## Chronological Split Design
Data split sequentially (e.g., 2021-2023 Train, 2024 Val, 2025 Test). Random splits are strictly rejected.

## Baseline Design
Persistence and Seasonal averages for basic sanity checks.

## Candidate Model Interfaces
- RandomForestRegressor
- HistGradientBoostingRegressor

## Evaluation Metrics
- Regression: MAE, RMSE, R2
- Classification: Balanced Accuracy, Macro F1, Brier Score

**CRITICAL RULE**: 
ML predictions MUST NOT override the SentinelX Environmental Hazard Score or transparent production risk rules.
ML is experimental until trained and validated on real held-out data.
