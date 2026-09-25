# ML V2 Dashboard Integration

## Overview
This document outlines the operational integration of the ML V2 `HistGradientBoosting` model into the SentinelX production dashboard. The layer strictly maintains isolation from the deterministic hazard matrix while providing forward-looking environmental intelligence.

## Live Forecast Enablement
The ML V2 endpoint (`GET /api/v1/ml-v2/forecast`) is now **ENABLED** for live inference.
- **Telemetry Source**: Real-time Open-Meteo observations (snapped to an hourly grid).
- **Inference Engine**: ML V2 `HistGradientBoosting` trained exclusively on Copernicus/ECMWF ERA5 (2021-2025).
- **Target**: Next 24H Max Apparent Temperature (°C).

## Dashboard UI
The dashboard presents the forecast under a dedicated, isolated panel:

> **ML V2 ENVIRONMENTAL FORECAST**
> **Next 24h Max Apparent Temperature: [Value] °C**

### Metadata & Provenance Tags
To prevent clinical misinterpretation or data source confusion, the dashboard explicitly surfaces the following immutable provenance tags alongside every prediction:
- **Status**: `EXPERIMENTAL` (Amber badge)
- **Training**: `ERA5 2021-2025`
- **Live Input**: `Open-Meteo`
- **Source Alignment**: `NOT EXACT`

*(Note: The UI strictly avoids medicalized terms such as "AI Prediction" or "Hospital Forecast", aligning precisely with the mathematical bounds of the model).*

## Failure Gates
The `/api/v1/ml-v2/forecast` endpoint actively defends against generating fabricated or interpolated predictions. It will immediately abort and return `DATA_UNAVAILABLE` under the following conditions:
1. **Insufficient History**: If fewer than 25 contiguous hourly observations exist in the local SQLite cache.
2. **Missing Gaps**: If any specific hour (e.g., `t-1`, `t-6`) within the 24-hour causal window is missing.
3. **Duplicate Timestamps**: If the telemetry feed provides multiple overlapping records for the same hourly block, the system rejects the vector to prevent silent data mutation.
4. **Schema Mismatch**: If any of the required 36 features cannot be engineered (e.g., missing base variables like cloud cover or pressure).
5. **NaN/Inf**: Mathematical impossibilities in derived variables (like Magnus-Tetens dew point limits).

*Under no circumstances are historical 2025 predictions from `predictions.csv` served as current live forecasts.*

## Hazard Score Isolation
The ML V2 pipeline is mathematically and architecturally severed from the SentinelX deterministic alerting matrix.
- **Environmental Hazard Score**: Remains purely static, driven by immediate IMD heatwave thresholds, PM2.5, and current relative humidity.
- **Risk Tiers**: Status (e.g., `EXTREME`, `CRITICAL`) cannot be upgraded or downgraded by an ML V2 forecast.
- **Multi-Hazard Logic**: Remains independent. The ML output is supplementary intelligence, not a directive trigger.
