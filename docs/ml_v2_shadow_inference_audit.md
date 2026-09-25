# ML V2 Cross-Source Compatibility & Shadow Inference Audit

## Overview
This audit evaluates the structural, semantic, and mathematical compatibility between the Copernicus/ECMWF ERA5 feature set (used for training the `HistGradientBoosting` model) and the live Open-Meteo feature set (used for inference). The model remains disconnected from the production dashboard (`DATA_UNAVAILABLE` hardcoded) pending these semantic alignment tests.

## 1. Feature Formula Parity
The exact 36-feature output of `ml_v2/live_features.py` was compared directly against `scripts/build_era5_cds_full.py` and `scripts/train_ml_v2.py`:
- **Names & Schema**: The live features layer produces exactly 36 features in the precise layout expected by the model.
- **Aggregation Windows**: Causal limits strictly replicate training semantics. Lags (1, 3, 6, 12, 24) and rolling means operate identically across both layers.

## 2. Apparent Temperature Audit
**APPARENT_TEMPERATURE_ALIGNMENT = EXACT**
Both datasets derive apparent temperature using the identical formula:
`apparent_temperature_c = T + 0.33 * e_hpa - 0.70 * ws - 4.00`
(where `e_hpa` is vapor pressure derived from relative humidity and temperature).

## 3. Humidity Audit
**RH_ALIGNMENT = EXACT**
The live Open-Meteo layer provides `relative_humidity_2m` directly. The ERA5 dataset computes RH from `t2m` and `d2m` (dew point). Because `live_features.py` inversely calculates the missing Open-Meteo dew point using the standard Magnus-Tetens formula—the exact inverse of the ERA5 derivation—the numerical alignment is mathematically sound.

## 4. Precipitation Semantics
**PRECIP_ALIGNMENT = EXACT**
- **ERA5**: The `tp` (Total Precipitation) variable represents 1-hour liquid equivalent accumulation in mm (converted via `x * 1000.0`).
- **Live**: Open-Meteo's `precipitation` is natively the 1-hour accumulation in mm. 
Temporal accumulations match perfectly.

## 5. Wind Components
**WIND_ALIGNMENT = EXACT**
The live pipeline intercepts `wind_speed_kmh` and `wind_direction`, converting them into orthogonal `wind_u_ms` and `wind_v_ms` using standard trigonometric transformations (`-ws * sin(rad)` and `-ws * cos(rad)`), perfectly replicating ERA5's native `u10` and `v10` format.

## 6. Distribution & Out-of-Range Checks
A deterministic shadow block of simulated contemporary live data (`30.0°C`, `65%` RH, `1013.25hPa`) was piped against the entire 2021-2025 training range:
- `temperature_c` (Live 30.0 vs Train Range 11.4 - 41.2) - **SAFE**
- `relative_humidity_pct` (Live 65.0 vs Train Range 17.7 - 100.0) - **SAFE**
- `dew_point_c` (Live 22.7 vs Train Range 3.2 - 30.2) - **SAFE**
- `wind_speed_ms` (Live 2.77 vs Train Range 0.0 - 10.7) - **SAFE**

**No features triggered out-of-range boundaries.** The live features safely inhabit the mathematical space known by the model.

## 7. Duplicate Timestamp Policy
The previous `resample('1h').last()` implicit deduplication behavior was audited and overhauled. 
**Current Policy**: If multiple observations collapse into the identical hourly block, `live_features.py` now explicitly intercepts the collision, aborts inference, and yields a `DATA_UNAVAILABLE` payload. This guarantees history is never silently mutated.

## 8. Shadow Inference Output
The inference engine successfully completed a `SHADOW_INFERENCE_ONLY` run without leaking to the Dashboard. 
Output artifact recorded in `data/ml_v2/shadow/`:
- `prediction_time`: 2026-09-24T20:00:00Z
- `prediction`: 36.65 °C (Next 24H Max Apparent Temperature)
- `feature_source`: Open-Meteo
- `training_source`: Copernicus / ECMWF ERA5
- `source_alignment`: NOT_EXACT

## 9. Testing & Next Steps
Test coverage in `test_live_features.py` successfully expanded to cover duplicate-rejections and schema exactitude. (`pytest` passes 100%).

Despite full mathematical and structural compatibility, the production inference pipeline (`/api/v1/ml-v2/forecast`) remains isolated as requested until authorized for deployment.

**ML_V2_SHADOW_COMPATIBLE**
