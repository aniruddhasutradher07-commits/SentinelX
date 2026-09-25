# ML V2 Live Feature History & Canonicalization

## Overview
This document specifies the exact data transformation pipeline from the raw telemetry buffer into the 36-feature vector expected by the SentinelX ML V2 `HistGradientBoosting` model. Because the model was trained on ECMWF ERA5 (which represents strict, singular hourly grids), the live telemetry must be dynamically canonicalized to exactly match this semantic behavior without dropping legitimate sub-hourly data or hallucinating missing gaps.

## Frequencies
- **Raw Observation Frequency**: Open-Meteo and live IoT sensors may poll at valid sub-hourly intervals (e.g. 15m, 30m) or push multiple identical data rows per hour due to concurrent background sync operations.
- **Canonical Hourly Frequency**: ML V2 strictly enforces an aligned 1-hour resolution grid matching the top of the hour `floor('1h')`.

## Canonicalization Pipeline

### 1. Spatial Series Isolation
A spatial bounding box may return multiple wards (e.g. W65, W25, W51). Before any processing, the pipeline strictly isolates the single true spatial series by identifying the coordinate matching the minimal Euclidean distance to the requested target. This avoids merging separate locations into a corrupted chronological timeline.

### 2. Duplicate Semantics & Rejection
- **Natural Observation Identity & Ingestion Idempotency**: The ingestion layer (`services/ingestion.py`) implements a rigid database idempotency check. It enforces a natural composite key comprising `(ward_id, observed_at)`. If an observation for the identical timestamp and ward already exists, the ingestion layer safely rejects the insertion to prevent polluting the history buffer.
- **Exact Identical Duplicates**: For historical database records that were ingested prior to the idempotency patch, the pipeline canonicalizer safely collapses (`drop_duplicates()`) exact byte-for-byte identical database rows.
- **Conflicting Duplicate Semantics**: If multiple records exist for the exact same `(ward_id, observed_at)` timestamp but report conflicting weather conditions (e.g. 35°C vs 40°C), the data source is ambiguous. The canonicalizer aborts processing and strictly returns `DATA_UNAVAILABLE`. Mixing conflicting source data is forbidden.
- **Legitimate Sub-Hourly Data**: Multiple distinct timestamps within the *same* hour (e.g. 21:15, 21:45) are perfectly valid. These do NOT fail the duplicate check. They are grouped into an hourly bucket and subjected to aggregation.
- **Canonical Row Duplication**: If the final aggregation produces multiple rows for the same top-of-the-hour index, it represents an engineering failure and throws an explicit `ValueError`.

### 3. Missing Hour Behavior & No Interpolation Policy
The `predict_next_24h` shadow inference demands exactly 25 contiguous hourly observations (`t-24` to `t`).
- **No Interpolation**: If a canonical hourly bucket is missing (or filled with `NaN` due to Pandas resampling), the pipeline will **immediately abort** and return `DATA_UNAVAILABLE`.
- Forward-filling, backward-filling, or linear interpolation are strictly forbidden to prevent compounding errors in causal lags.

## Per-Variable Aggregation Semantics
When valid sub-hourly observations fall into the same canonical hour bucket, they are aggregated using the following semantics to match the ERA5 training distributions:

| Variable | Aggregation | Rationale |
|----------|-------------|-----------|
| `temperature_c` | Mean | Standard scalar average |
| `relative_humidity_pct` | Mean | Standard scalar average |
| `wind_speed_kmh` | Mean | Standard scalar average |
| `pressure_hpa` | Mean | Standard scalar average |
| `cloud_cover_pct` | Mean | Standard scalar average |
| `precipitation_mm` | Mean | Cumulative/rate data provided by Open-Meteo `current` responses replicate the total hour's accumulation at sub-hourly polls. Summing them would multiply the accumulation erroneously. Averaging them preserves the exact identical hourly accumulation. |
| `wind_direction` | Vector Mean | Directly averaging angles (e.g., 350° and 10°) produces wildly incorrect scalars (180°). The pipeline converts angles to $u$ and $v$ components, averages them, and converts back via $\arctan2(u, v)$ to preserve accurate directional momentum. |
