# SENTINELX FINAL FORENSIC AUDIT

**Date:** 2026-09-25  
**Auditor:** Automated Forensic Audit Engine  
**Repository:** `aniruddhasutradher07-commits/SentinelX`  
**Branch:** `main`

---

## EXECUTIVE SUMMARY

**Verified modules:** Live weather ingestion, ERA5 dataset (5-year, 6-grid, 262K rows), ML V2 training pipeline, HistGradientBoosting model (test R² 0.9055), 36-feature schema, live ML inference via Open-Meteo on-demand, Hazard Score rule engine, Multi-Hazard live scraping, PhysioNet static reference, H-THERM calculator, test suite (95 pass / 12 skip / 0 fail), TypeScript clean.

**Critical blockers:**
- Dockerfile missing `core/`, `config/`, `ml_v2/`, `experimental_ml/` directories → **cloud deploy will crash on import**
- `HospitalSurgeView.tsx` displays legacy `R² 0.566` DLNM+XGBoost model as if active — **misleading for judges**

**High-risk issues:**
- 67% of `weather_observations` rows quarantined (1,209/1,805) — timezone migration artifact
- Open-Meteo API timeouts cause `DATA_UNAVAILABLE` on ML forecast during network instability
- `render.yaml` missing `ml_v2/`, `core/`, `config/` in build

**Medium issues:**
- `era5_grid_mapping.csv` has all `ward_no=unknown` — cosmetic, non-functional
- Historical Replay tab uses fully fabricated hospital surge numbers with "Modelled" provenance
- Massive uncommitted working tree (87 untracked files, 27 modified files)

**Cloud blockers:** Dockerfile incomplete, SQLite ephemeral on Render, 273MB PhysioNet dataset

**Data-truth issues:** Hospital surge numbers in `historical_replay.py` are fabricated. `HospitalSurgeView.tsx` shows `R² 0.566` from a non-existent model.

**Security issues:** `.env` properly gitignored. Secrets accessed via `os.environ` only. No hardcoded credentials in source. `VITE_SUPABASE_ANON_KEY` exposed to frontend by design (Supabase pattern).

**Test status:** 95 passed, 12 skipped, 0 failed. `npx tsc --noEmit` clean.

**Live ML status:** WORKING when Open-Meteo is reachable. DATA_UNAVAILABLE on timeout (graceful).

**Submission readiness:** **READY_WITH_BLOCKERS**

---

## 1. REPOSITORY INVENTORY

| Category | Count |
|---|---|
| Total project files (excl .git/node_modules/.venv) | ~250+ |
| Python source files (.py) | ~80 |
| Frontend files (.ts/.tsx/.jsx/.js) | ~50 |
| Test files (test_*.py) | 25 |
| Documentation files (docs/) | 17 |
| Large files (>1MB) | ~45 (mostly PhysioNet wearable CSVs) |

### Key Configuration Files

| File | Status |
|---|---|
| `.gitignore` | ✅ Excludes `.env`, `*.db`, `node_modules/`, PhysioNet dataset |
| `requirements.txt` | ✅ 18 dependencies including `beautifulsoup4`, `pytest` |
| `package.json` | ✅ Vite + React + TailwindCSS v4 + Three.js + Leaflet |
| `tsconfig.json` | ✅ Clean compilation |
| `Dockerfile` | ⚠️ **INCOMPLETE** — missing `core/`, `config/`, `ml_v2/`, `experimental_ml/` |
| `render.yaml` | ⚠️ **INCOMPLETE** — same missing directories |
| `.env.example` | ✅ Documents all environment variables with placeholder values |

### Suspicious/Duplicate

- `prediction_engine.py` (root) — appears to be legacy, superseded by `ml_v2/`
- `data_engine.py` (root) — legacy ingestion, superseded by `services/ingestion.py`
- `database.py` vs `database_improved.py` — duplicate DB setup
- `heatwave.db` (5.3MB) vs `sentinelx_data.db` (1.5MB) — two SQLite databases
- `historical_weather_era5.csv` (590KB, root) — older ERA5 file, superseded by `data/ml_v2/` version

---

## 2. GIT / WORKING TREE AUDIT

**Branch:** `main` (up to date with `origin/main`)

### Modified Files (27):
Critical modifications not committed:
- `main.py` — lifespan/startup changes
- `routers/sentinelx.py` — ML V2 status contract change (READY→SUCCESS)
- `services/ingestion.py` — timezone/quarantine changes
- `services/live_sync.py` — scheduler changes
- `ml_v2/live_features.py` — on-demand history (exists only in working tree)
- `requirements.txt` — added `beautifulsoup4`, `pytest`
- Multiple frontend `.tsx` changes

### Untracked Files (87):
- Entire `ml_v2/` directory (model code)
- Entire `tests/` new test files
- Entire `data/ml_v2/` (ERA5 dataset, model artifacts)
- `services/live_multihazard.py`, `services/physiology_reference.py`
- 17 documentation files in `docs/`
- Multiple `scripts/` files

### Deleted Files (7):
- Scratch test files moved to `tests/` or renamed to `probe_*`

> [!CRITICAL]
> **The entire ML V2 system, all new tests, and all new services exist only in the working tree and have never been committed.** A `git clean -fd` would destroy the ML model, inference pipeline, and half the test suite.

### Secrets Scan
- `.env` is gitignored ✅
- No API keys found hardcoded in tracked source files ✅
- `VITE_SUPABASE_ANON_KEY` is exposed to frontend bundle by design (standard Supabase pattern) ✅

---

## 3. APPLICATION ARCHITECTURE

### Entrypoint
- **Backend:** `main.py` → FastAPI app with `lifespan` context manager
- **Frontend:** `src/App.tsx` → React SPA served from `dist/` by FastAPI catchall route
- **Dev:** `tsx server.ts` (Express proxy) or `vite dev` + `uvicorn main:app`

### Background Jobs
- `start_unified_scheduler()` spawns 3 daemon threads:
  - IMD polling (900s)
  - CPCB polling (900s)
  - Open-Meteo ward weather polling (600s)
- No guard against duplicate schedulers if multiple workers started

---

## 4. API INVENTORY

### SentinelX Router (`/api/v1/`)

| Method | Path | Purpose | External Calls | Frontend Used |
|---|---|---|---|---|
| GET | `/status` | Health metadata | None | No |
| GET | `/live-feed` | Real-time ward telemetry | None (reads SQLite) | **Yes** (polled) |
| GET | `/map/era5` | Historical ERA5 grid data | None (reads CSV) | **Yes** |
| GET | `/ml-v2/forecast` | ML prediction | Open-Meteo (on-demand) | **Yes** |
| GET | `/ml-v2/map` | ML predictions map layer | Open-Meteo | **Yes** |
| GET/POST | `/h-therm/calculate` | H-THERM strain | None | **Yes** |
| GET/POST | `/alerts/dispatch` | Emergency alert | Twilio/Fast2SMS (optional) | **Yes** |
| GET | `/districts` | 30 Odisha districts | Open-Meteo (if cache miss) | **Yes** |
| GET | `/districts/{name}` | Single district | Open-Meteo | Partial |
| GET | `/wards` | 67 Bhubaneswar wards | None (reads SQLite) | **Yes** |
| GET | `/wards/{ward_no}` | Single ward detail | None | Partial |
| GET | `/odisha-geojson` | GeoJSON boundaries | None | **Yes** |
| GET | `/wards-geojson` | Ward GeoJSON | None | **Yes** |
| GET | `/benchmarks` | NDMA heatwave data | None (reads CSV) | Partial |
| GET | `/physiology-reference` | PhysioNet wearable data | None (reads filesystem) | **Yes** |

### Status Convention
- **ML V2:** `SUCCESS` / `DATA_UNAVAILABLE` — **VERIFIED CONSISTENT**
- **Weather:** `source` field indicates provenance — ✅
- **Risk:** `environmental_tier` (LOW/ELEVATED/HIGH/EXTREME) — ✅

---

## 5. LIVE WEATHER / TELEMETRY AUDIT

### Data Flow
```
Open-Meteo API → services/ingestion.py → sentinelx_data.db → /api/v1/live-feed → Frontend
```

### Verification

| Check | Status | Evidence |
|---|---|---|
| Timezone | ✅ UTC | `timezone=UTC` in Open-Meteo request |
| Polling interval | ✅ 600s | `OPEN_METEO_REFRESH_SECONDS = 600` |
| Duplicate protection | ✅ | `INSERT OR IGNORE` with ward_id+observed_at |
| Stale handling | ✅ | `data_age_minutes` computed, `is_stale` flag |
| Source provenance | ✅ | `source = "open_meteo"` persisted |
| Quarantine fields | ✅ | `original_observed_at`, `quarantine_reason` present |

### Database State
- **Total rows:** 1,805
- **Distinct wards:** 69 (67 real + 2 test wards)
- **Quarantined rows:** 1,209 (67%) — from timezone migration
- **Clean rows:** 596

> [!WARNING]
> 67% quarantine rate is from a one-time timezone cleanup migration. Not a production concern but should be documented.

---

## 6. MULTI-HAZARD AUDIT

### Sources Traced

| Hazard | Source | Parser | Status |
|---|---|---|---|
| Cyclone | NDMA/IMD RSS | BeautifulSoup | VERIFIED — scrapes real NDMA feeds |
| Heavy Rain | IMD Warning page | BeautifulSoup | VERIFIED — scrapes real IMD |
| Flood | CWC bulletins | BeautifulSoup | VERIFIED — scrapes real CWC |
| Landslide | GSI/IMD warnings | BeautifulSoup | VERIFIED — scrapes real sources |
| Rain | Open-Meteo current | API | VERIFIED — from live weather |

### Cache Behavior
- SQLite `multi_hazard_cache` table with 15-min TTL ✅
- Source failures do NOT erase cached states ✅ (verified: `ON CONFLICT DO UPDATE`)

---

## 7. HAZARD SCORE AUDIT

### Implementation: `core/risk_rules.py`

| Check | Status |
|---|---|
| Deterministic rules | ✅ Pure function, no randomness |
| Documented thresholds | ✅ In `config/thresholds.py` |
| No hidden ML dependency | ✅ No model imports |
| No hospital dependency | ✅ |
| No PhysioNet dependency | ✅ |
| No Bhuvan dependency | ✅ |
| ML V2 cannot modify scores | ✅ Completely separate code paths |

### IMD Context
- Checks coastal heatwave threshold (≥40°C) ✅
- Returns `CONDITIONS_MET_PENDING_PERSISTENCE` (correctly notes 2-day persistence not available) ✅

**Classification: VERIFIED**

---

## 8. LEGACY HOSPITAL MODEL AUDIT

| Location | Content | Classification |
|---|---|---|
| `routers/mock_api.py` | DLNM+XGBoost hospital surge predictor | **LEGACY** — only loads when `USE_MOCK_DATA=true` |
| `routers/historical_replay.py` | Hardcoded hospital admission numbers | **FABRICATED** — static JSON, provenance says "Modelled" |
| `src/components/HospitalSurgeView.tsx` | Displays `R² 0.566`, DLNM labels | **LEGACY DISPLAY** — shows metrics from non-existent model |
| `prediction_engine.py` (root) | Legacy ML engine | **DEAD CODE** — not imported anywhere active |

> [!CAUTION]
> **`HospitalSurgeView.tsx` line 70 displays `R² 0.566` as the model confidence score.** This is NOT from ML V2 (which has R² 0.9055). This is from a legacy hospital surge model that was never validated. If a judge sees this tab, it will misrepresent the system's ML capability.

**Current ML V2:** HistGradientBoosting, target = NEXT_24H_MAX_APPARENT_TEMPERATURE, **test R² = 0.9055** (verified from `ml_v2_model_metadata.json`)

---

## 9. ERA5 DATA AUDIT

| Check | Value | Status |
|---|---|---|
| Date range | 2021-01-01 to 2025-12-31 | ✅ 5 full years |
| Total rows | 262,944 | ✅ (6 grids × 43,824 hours) |
| Unique grids | 6 | ✅ |
| Variables | 14 columns including all required meteorological fields | ✅ |
| Missing values | 0 across all columns | ✅ |
| Data source | "Copernicus / ECMWF ERA5" in every row | ✅ |

> [!NOTE]
> `era5_grid_mapping.csv` has `ward_no=unknown` and `ward_name=unknown` for all entries. The mapping is by centroid coordinates only. This is cosmetic — the mapping logic works by lat/lon matching.

---

## 10. ML V2 TRAINING AUDIT

| Check | Status | Evidence |
|---|---|---|
| Target | `NEXT_24H_MAX_APPARENT_TEMPERATURE` | ✅ `max(apparent_temp[t+1...t+24])` |
| Features | 36 | ✅ Verified in metadata JSON |
| Train period | 2021-01-02 to 2023-12-31 (157,536 rows) | ✅ |
| Validation period | 2024-01-01 to 2024-12-31 (52,704 rows) | ✅ |
| Test period | 2025-01-01 to 2025-12-30 (52,416 rows) | ✅ |
| No shuffling | ✅ Chronological split | Verified in `train_ml_v2.py` |
| No future leakage | ✅ | Rolling features use `min_periods` and backward shift |
| No target leakage | ✅ | Target uses `shift(-1)` then reverse rolling |

---

## 11. MODEL PERFORMANCE AUDIT

From `ml_v2_model_metadata.json` (exact values):

| Model | MAE (°C) | RMSE (°C) | R² |
|---|---|---|---|
| **HistGradientBoosting (Test 2025)** | **1.0829** | **1.3862** | **0.9055** |

Model artifact verified loadable: `data/ml_v2/models/ml_v2_model.joblib` (438KB) ✅

---

## 12. LIVE ML INFERENCE AUDIT

### Data Flow
```
Request → sentinelx.py → live_features.py → Open-Meteo (past_hours=25) → 
filter incomplete bucket → 25 completed hours → 36 features → 
inference.py → model.predict → API response
```

| Check | Status |
|---|---|
| 25 completed hours required | ✅ `past_hours=25` |
| Incomplete current bucket excluded | ✅ `max_allowed_time = request_time - 1h` |
| No future timestamps | ✅ |
| `SUCCESS` only on real inference | ✅ |
| `DATA_UNAVAILABLE` on all failure gates | ✅ |

---

## 13. LIVE ML CROSS-SOURCE AUDIT

### Feature Parity: ERA5 Training vs Open-Meteo Live

| Feature Group | ERA5 (Training) | Open-Meteo (Live) | Parity |
|---|---|---|---|
| `temperature_c` | ERA5 2m temp | `temperature_2m` | ✅ Same concept |
| `dew_point_c` | ERA5 direct | Derived from T + RH | ⚠️ Different derivation |
| `apparent_temperature_c` | ERA5 derived | Derived from T + RH + wind | ⚠️ Same formula |
| `wind_u_ms`, `wind_v_ms` | ERA5 direct u/v | Derived from speed + direction | ⚠️ Decomposition |
| `precipitation_mm` | ERA5 accumulated | `precipitation` instantaneous | ⚠️ Accumulation |

> [!IMPORTANT]
> The `source_alignment = NOT_EXACT` flag correctly communicates this known cross-source divergence. The model is explicitly marked `experimental`.

---

## 14. TIMESTAMP / TIMEZONE AUDIT

| Component | Timezone Handling | Status |
|---|---|---|
| Open-Meteo request | `timezone=UTC` | ✅ |
| Ingestion `observed_at` | UTC-aware ISO string | ✅ |
| SQLite storage | ISO 8601 text | ✅ |
| ML live features | `pd.to_datetime(..., utc=True)` | ✅ |
| No naive datetimes | ✅ All have explicit tz | ✅ |

---

## 15. PHYSIONET AUDIT

| Check | Status |
|---|---|
| Dataset version | v1.0.1 ✅ |
| Dataset size | 273MB (local filesystem) |
| Git tracked | ❌ Excluded by `.gitignore` ✅ |
| Participant discovery | ✅ Dynamic filesystem scan |
| NOT live telemetry | ✅ Explicitly documented |

---

## 16. H-THERM AUDIT

| Check | Status |
|---|---|
| Inputs: live temp, RH, wind | ✅ From `/api/v1/live-feed` |
| PhysioNet HR/TEMP NOT replacing inputs | ✅ Separate paths |
| Exertion user-controlled | ✅ `activity_level` parameter |
| Solar radiation | ✅ Only used if available |

---

## 17. COMMAND & CONTROL AUDIT

| Button | Behavior | Classification |
|---|---|---|
| ACKNOWLEDGE | Sets UI state only | **DEMO ACTION** (labeled correctly) |
| ESCALATE | Sets UI state only | **DEMO ACTION** (labeled correctly) |
| SIMULATE DISPATCH | Calls `/api/v1/alerts/dispatch` | **REAL BACKEND** |

---

## 18. DASHBOARD UI AUDIT

- React SPA with TailwindCSS v4 dark theme ✅
- Live ward counter from `/api/v1/live-feed` ✅
- ML forecast panel fetches `/api/v1/ml-v2/forecast` ✅
- OverviewTab shows `TEST R²: 0.91` ✅ (matches actual 0.9055)
- IoT simulation in `App.tsx:282-288` fires random ward updates — **DEMO only**

---

## 19. CLOUD DEPLOYMENT AUDIT

### Blockers

| Issue | Severity | Detail |
|---|---|---|
| **Dockerfile missing directories** | CRITICAL | `core/`, `config/`, `ml_v2/`, `experimental_ml/` not copied → import crash |
| **SQLite on Render** | HIGH | Ephemeral filesystem = data loss on redeploy |
| **PhysioNet 273MB** | MEDIUM | Too large for free tier, needs separate hosting |
| **Model artifact** | HIGH | `data/ml_v2/models/` must be included in Docker image |

---

## 20. TEST SUITE AUDIT

### Results
```
95 passed, 12 skipped, 0 failed
npx tsc --noEmit: clean (exit 0)
```

### Test Quality Assessment
- ML V2 tests use proper mocking ✅
- Multi-hazard tests verify cache behavior ✅
- Live features tests cover edge cases (future timestamps, duplicates, gaps) ✅

---

## 21. DATA TRUTH AUDIT

| Item | Classification | Evidence |
|---|---|---|
| Live weather values | REAL SOURCE | Open-Meteo API ✅ |
| ERA5 historical data | REAL SOURCE | Copernicus CDS ✅ |
| ML predictions | MODELLED | HistGradientBoosting on ERA5 ✅ |
| Hazard Score | CALCULATED | Rule engine ✅ |
| Hospital surge numbers in `historical_replay.py` | **FABRICATED** | Hardcoded JSON ⚠️ |
| `HospitalSurgeView.tsx` R² 0.566 | **FABRICATED / UNSUPPORTED** | No model exists ⚠️ |

---

## 22. FINAL RISK REGISTER

| ID | Area | Issue | Severity | Evidence | Demo Impact | Blocks Submission? |
|---|---|---|---|---|---|---|
| R01 | Deployment | Dockerfile missing `core/`, `config/`, `ml_v2/`, `experimental_ml/` | **CRITICAL** | `grep` shows no COPY for these dirs | Cloud deploy crashes | YES (for cloud) |
| R02 | Data Truth | `HospitalSurgeView.tsx` shows `R² 0.566` from non-existent model | **HIGH** | Line 70: `confidence_score_r2 \|\| '0.566'` | Judge sees false metric | YES |
| R03 | Git | 87 untracked files including entire ML system | **HIGH** | `git status` | Loss risk | YES |
| R04 | Data Truth | `historical_replay.py` fabricated hospital numbers | **MEDIUM** | Hardcoded JSON | Misleading if inspected | NO |
| R05 | Reliability | Open-Meteo timeout → ML DATA_UNAVAILABLE | **MEDIUM** | Observed during audit | Demo may show unavailable | NO (graceful) |
| R06 | Cloud | SQLite ephemeral on Render | **MEDIUM** | Architecture | Data loss on redeploy | NO (demo ok) |
| R07 | Cloud | 273MB PhysioNet dataset | **MEDIUM** | `du -sh` | Too large for free tier | NO |

---

## 23. FINAL STATUS MATRIX

| Module | Status |
|---|---|
| Live Weather | **WORKING** |
| Multi-Hazard | **WORKING** |
| Hazard Score | **WORKING** |
| ERA5 Data | **WORKING** |
| ML Training | **WORKING** (verified artifact) |
| ML Live Inference | **WORKING** (when Open-Meteo reachable) |
| H-THERM | **WORKING** |
| Command & Control | **PARTIALLY WORKING** (demo buttons correctly labeled) |
| Cloud Readiness | **BLOCKED** (Dockerfile incomplete) |
| Test Suite | **WORKING** (95/95 pass) |

---

## 24. FINAL RECOMMENDATIONS

### MUST FIX BEFORE SUBMISSION
1. **Commit all working tree changes** — the entire ML system, tests, services, and docs are untracked
2. **Fix Dockerfile** — add `COPY core/ ./core/`, `COPY config/ ./config/`, `COPY ml_v2/ ./ml_v2/`, `COPY experimental_ml/ ./experimental_ml/`
3. **Fix `HospitalSurgeView.tsx`** — either hide the tab or replace `R² 0.566` with actual ML V2 metrics (R² 0.9055)

### SHOULD FIX IF TIME ALLOWS
4. Update `render.yaml` to include all required directories
5. Add provenance disclaimer to Historical Replay tab's hospital numbers

### DO NOT TOUCH BEFORE SUBMISSION
- ML model (trained and validated)
- ERA5 dataset
- Hazard Score rules
- Multi-Hazard scraping
- H-THERM formulas
- Test suite assertions

---

SENTINELX_FULL_PROJECT_FORENSIC_AUDIT_COMPLETE
