# SentinelX ML V2 — Clean History Monitor Report

## 1. DATABASE HEALTH
**Analysis of `weather_observations` for Ward W65:**
- **Total rows**: 19
- **Quarantined rows**: 18
- **Non-quarantined rows**: 1 (fresh fetch after strict quarantine applied)
- **Latest observed_at**: `2026-09-24T21:00:00+00:00`
- **Latest fetched_at**: `2026-09-24T21:08:18.495609+00:00`
- **Oldest non-quarantined observation**: `2026-09-24T21:00:00+00:00`
- **Canonical hourly observations in last 25h**: 1

## 2. UTC SANITY
**Analysis of newest valid fetching for W65:**
- **observed_at timezone**: `+00:00` (UTC)
- **fetched_at timezone**: `+00:00` (UTC)
- **Sanity check (`observed_at <= fetched_at`)**: `True` (e.g., `21:00` <= `21:08:18`)
- **No future observations**: Verified. `diff_hrs` is negative (approx `-0.14h`), confirming observations are firmly in the past.
- **No 5h30m timezone offset**: Verified. The exact offset was eliminated. The observations are now appropriately delayed by minutes (Open-Meteo polling intervals) rather than corrupted by a 5.5h futuristic delta.
- **Monotonic chronology**: Verified for clean rows.

## 3. HOURLY CONTINUITY
**Canonical Hourly Series Build for W65:**
- **latest canonical hour**: `2026-09-24 21:00:00+00:00`
- **history_start**: `2026-09-24 21:00:00+00:00`
- **history_end**: `2026-09-24 21:00:00+00:00`
- **contiguous_hours_available**: 1
- **required_hours**: 25
- **missing hourly buckets**: 24
- **duplicate canonical buckets**: 0
- **conflicting duplicates**: 0

## 4. ML READINESS
**Execution of Existing Feature Pipeline (`build_live_feature_vector`) for W65:**
- **Status**: `DATA_UNAVAILABLE`
- **Exact reason**: `Insufficient recent hourly history. Found 1, require 25.`
- **available history hours**: 1
- **required 25 hours**: 25
- **36-feature schema validation**: Safely gated prior to schema validation due to lack of historical accumulation.

## 5. LIVE FORECAST CHECK
**Execution against `/api/v1/ml-v2/forecast` (Production Endpoint)**
- **Response**:
```json
{
    "status": "DATA_UNAVAILABLE",
    "message": "Insufficient recent hourly history. Found 1, require 25.",
    "experimental": true,
    "source": "Copernicus / ECMWF ERA5 trained model",
    "model_version": "HistGradientBoosting"
}
```
- **Validation**: Strict gating successfully enforced. No inference generated on an incomplete history graph. No bugs bypassed.

## 6. PRODUCTION TELEMETRY CHECK
**Execution against `/api/v1/live-feed` (Legacy & Telemetry Endpoint)**
- **Response**: Normal / Active (`HTTP 200 OK`)
- **Telemetry Validation**: The environmental risk engine and raw telemetry feeds (`weather`, `cyclone`, `rain`) remain actively responsive and `LIVE`. Freshness confirms `observed_at < fetched_at` (e.g., `21:00:00` vs `21:09:52`).

## 7. TEST QUALITY
**`tests/test_live_features.py`**:
- Updated `test_fetched_observed_sanity` with a deterministic assertion validating strict causality (`observed_at <= prediction_time` and rejection of strictly futuristic observations).
- `pytest -q tests/test_live_features.py`: 15 tests passed.
- `npx tsc --noEmit`: Completed with 0 errors.

## 8. NO NEW FEATURE
- No UI modifications were made.
- No new APIs introduced.
- Historical ERA5/ML artifacts remain untouched.
- Core inference structure unmutated.

***

ML_V2_CLEAN_HISTORY_HEALTHY
