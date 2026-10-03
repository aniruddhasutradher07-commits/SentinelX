# HeatGuard AI — Validation & Engineering Evidence

HeatGuard AI adheres to rigorous empirical validation standards, combining automated unit testing, strict static typechecking, chronological machine learning holdout evaluation, and data provenance auditing.

---

## 🤖 Machine Learning V2 Empirical Validation

The core environmental forecasting model (`ml_v2_model.joblib`) was trained using historical ECMWF ERA5 reanalysis data from Copernicus Climate Data Store (CDS) spanning 2021 through 2025 across Odisha coordinate grids.

### Training & Validation Protocol:
- **Algorithm:** `HistGradientBoostingRegressor` (Scikit-Learn)
- **Target Variable:** `NEXT_24H_MAX_APPARENT_TEMPERATURE`
- **Feature Space:** 36 engineered meteorological, lag (1h, 3h, 6h, 12h, 24h), rolling window (6h, 24h), and diurnal/seasonal features.
- **Data Splitting (Chronological, Zero Leakage):**
  - **Train Set (2021–2023):** 26,256 hourly records per grid
  - **Validation Set (2024):** 8,784 hourly records per grid
  - **Unseen Test Set (2025):** 8,760 hourly records per grid

### Benchmark Results on Unseen 2025 Test Holdout:

| Metric | Measured Value | Standard Target | Assessment |
| :--- | :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | **1.0829 °C** | < 1.50 °C | **Passed** — Sub-1.1°C thermal accuracy |
| **Root Mean Squared Error (RMSE)** | **1.3862 °C** | < 2.00 °C | **Passed** — Bounded variance |
| **Coefficient of Determination ($R^2$)** | **0.9055** | > 0.85 | **Passed** — Strong predictive fidelity |

*Model Scope Clarification:* ML V2 predicts continuous ambient thermal sensation (apparent temperature). It does **not** predict clinical outcomes, hospital admissions, or mortality rates.

---

## 🧪 Automated Test Suite (Pytest)

The backend automated test suite verifies API stability, edge cases, thermal mathematics, and graceful degradation across 28 independent test modules:

```text
================== 117 passed, 10 skipped, 1 warning in 35.93s ==================
```

### Verified Test Categories:
- **Bio-Meteorological Math (`tests/test_vulnerability_engine.py`, `tests/test_rain_display.py`):** 100% equation verification against ISO 7243 and Steadman bounds.
- **ML V2 Pipelines (`tests/ml_v2/`):** Feature schema validation, chronological sequence integrity, holdout reproducibility.
- **Graceful Fallbacks (`tests/test_mock_api_graceful.py`, `tests/test_live_sources.py`):** Confirmed system remains functional even when external APIs report `CREDENTIALS_NOT_CONFIGURED` or simulated cold starts.
- **Spatial Coverage (`tests/test_city_profile.py`, `tests/test_era5_map.py`):** Verified geometry coverage across all 67 Bhubaneswar municipal wards.

---

## 💻 Frontend Static Verification & Build Integrity

- **TypeScript Typecheck:** Run via `npm run lint` (`tsc --noEmit`) — **0 errors**.
- **Production Bundle:** Run via `npm run build` — Clean Vite production build in `dist/`.
- **GIS Geometry Validation:** All 67 polygons in `wards_bhubaneswar.geojson` pass GeoJSON specification checks with complete coordinate closure.

---

## 🛡️ Data Provenance & Safety Verification

| Dimension | Verification Method | Status |
| :--- | :--- | :--- |
| **Credential Hygiene** | Repository-wide regex audit | Zero exposed tokens or private keys |
| **DPDP Compliance** | Emergency dispatch audit log | Recipient phone numbers masked (`+91 98****1234`) |
| **Clinical Integrity** | Hospital demand API audit | Admissions and mortality return explicit `NULL` / `UNAVAILABLE` |
| **Dispatch Mode** | Broadcast gateway execution | Strictly flagged as `SIMULATED RESPONSE FLOW` |
