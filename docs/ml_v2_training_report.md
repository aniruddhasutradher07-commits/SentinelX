# ML V2 Training Report: Next-24-Hour Environmental Heat Forecast

> ML V2 is experimental and does not override the SentinelX Environmental Hazard Score or production risk rules.

## 1. Goal and Target Definition
The objective of this first experiment is to build a "next-24-hour environmental heat forecast." 

**Target Definition:** 
`NEXT_24H_MAX_APPARENT_TEMPERATURE` = `max(apparent_temperature_c[t+1 ... t+24])`
This represents the maximum apparent temperature that will occur over the 24 hours immediately following the forecast issue time (`t`). The current time `t` is strictly excluded from the target window to prevent leakage.

## 2. Dataset and Chronological Splits
The model was trained exclusively on the validated `Copernicus / ECMWF ERA5` historical reanalysis dataset.

**Data Range:** 2021-01-02 to 2025-12-30
**Total Rows Processed:** 262,656
**Spatial Coverage:** 6 unique ERA5 grid points mapping to 67 SentinelX wards.

**Chronological Split (Strictly Preserved):**
- **Train:** 157,536 rows (2021-01-02 to 2023-12-31)
- **Validation:** 52,704 rows (2024-01-01 to 2024-12-31)
- **Test:** 52,416 rows (2025-01-01 to 2025-12-30)

*Random splits were disabled to strictly prevent data leakage from the future into the past.*

## 3. Features and Leakage Controls
A total of **36** features were provided to the model.
All features are strictly backward-looking.

**Current State:** `temperature_c`, `relative_humidity_pct`, `dew_point_c`, `apparent_temperature_c`, `wind_u_ms`, `wind_v_ms`, `wind_speed_ms`, `precipitation_mm`, `pressure_hpa`, `cloud_cover_pct`
**Lags:** `1h`, `3h`, `6h`, `12h`, `24h` for temperature and apparent temperature.
**Rolling Means (Backward):** `3h`, `6h`, `12h`, `24h` for temperature.
**24h Aggregates (Backward):** `24h_max`/`min` temperature, `24h_mean` dew point / humidity, `24h_sum` precipitation, `24h_mean`/`min`/`max` wind speed.
**Seasonal:** `hour_sin`, `hour_cos`, `doy_sin`, `doy_cos`.

**Leakage Controls:**
- Target `t+1...t+24` window drops rows near the end of the dataset.
- Rolling features explicitly configured as backward-looking (`shift` and `min_periods`).
- Centered rolling windows and future data are strictly avoided.
- Bhuvan, demographics, health infra, PhysioNet, CPCB, and IMD signals were fully excluded from this meteorological model.

## 4. Model Configuration and Baselines

**Persistence Baseline:**
The maximum apparent temperature observed in the *previous* 24 hours (`t-23` to `t`).

**Models Evaluated:**
- `RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)`
- `HistGradientBoostingRegressor(random_state=42)`

## 5. Validation Metrics (2024)
- **Persistence Baseline:** MAE: 1.3449 °C | RMSE: 1.7952 °C | R²: 0.8738
- **RandomForest:** MAE: 1.2243 °C | RMSE: 1.6134 °C | R²: 0.8981
- **HistGradientBoosting:** MAE: 1.1669 °C | RMSE: 1.5297 °C | R²: 0.9084

**Selected Model:** `HistGradientBoosting` (Best Validation MAE and R²)

## 6. Final Test Metrics (Untouched 2025 Set)
The selected HistGradientBoosting model was evaluated ONCE on the untouched 2025 Test dataset.

- **TEST BASELINE:** MAE: 1.2024 °C | RMSE: 1.5675 °C | R²: 0.8791
- **TEST MODEL (HGB):** MAE: 1.0829 °C | RMSE: 1.3862 °C | R²: 0.9055

*The model successfully reduced the mean absolute error by ~0.12°C compared to simple persistence forecasting.*

## 7. Error Analysis (2025 Test Set)

**MAE by Month:**
- Jan: 0.82 °C
- Feb: 1.21 °C
- Mar: 1.27 °C *(Highest Error Period)*
- Apr: 1.13 °C
- May: 1.16 °C
- Jun: 1.18 °C
- Jul: 1.26 °C
- Aug: 1.14 °C
- Sep: 1.15 °C
- Oct: 0.92 °C
- Nov: 0.99 °C
- Dec: 0.77 °C

**MAE by Grid Point:**
- (20.00, 85.75): 1.04 °C
- (20.00, 86.00): 1.00 °C *(Lowest Error)*
- (20.25, 85.75): 1.10 °C
- (20.25, 86.00): 1.09 °C
- (20.50, 85.75): 1.14 °C *(Highest Error)*
- (20.50, 86.00): 1.13 °C

## 8. Artifacts & Inference Integration
- **Model Artifact:** `data/ml_v2/models/ml_v2_model.joblib`
- **Metadata:** `data/ml_v2/models/ml_v2_model_metadata.json`
- **Inference Status:** The model has been wired into `ml_v2/inference.py` which actively validates the feature schema prior to yielding predictions. Predictions are isolated and do not interact with the production hazard score.

## Limitations
- Predictions are strictly tied to raw ERA5 reanalysis and do not incorporate live sensory adjustments or micro-climate telemetry.
- Monthly error analysis shows that transition seasons (March, July) tend to have larger error margins (up to 1.27°C).
- ML V2 is experimental and serves only as a predictive supplement, never overriding established risk rules.

## 9. Dashboard Integration
The model has been successfully integrated into the SentinelX API (`/api/v1/ml-v2/forecast`) and frontend Dashboard. See `docs/ml_v2_dashboard_integration.md` for full implementation details, including strict isolation measures taken to prevent the model from influencing live production hazard logic.
