# MEMORY.md — SentinelX running context log

Append new entries here as the project progresses. Newest at the bottom. Any AI tool picking up this project should read this first.

## 2026-09-20 — Repo audit + 6-file system established
- Full repo scan performed against actual GitHub source (not assumptions). Project is far more mature than earlier informal feature-suggestion notes implied — vulnerability engine, AI Copilot/Action Engine, SHAP explainability, pan-India GIS, 2-stage DLNM+XGBoost hospital surge, satellite engine, and Citizen Advisory view are ALL already built and working.
- **Critical finding:** `routers/copilot.py` had a live Gemini API key hardcoded as a fallback default value, committed to a public repo. Flagged for immediate rotation + removal. Do not reintroduce this pattern (see rules.md).
- Confirmed genuine remaining gaps: Nighttime Recovery Index, Model Validation Dashboard (transparency), explicit data provenance labels, Worker Safety module, School Safety module, `teammate_backend/` vs root router duplication, CORS wide open.
- Decision: prioritize P0 security fix first, then P1 feature gaps (night recovery, model validation, provenance labels), then P2 sector modules (worker/school safety), then P3 architecture cleanup — depth over breadth, matching the project's own stated philosophy in the pitch script.

## Prior context (from earlier project history, summarized)
- SIH 2026 PS 26083: Extreme Heatwave Early Warning and Human Thermal Stress Index, MoES/NCMRWF, Disaster Management theme. Selected in internal hackathon round, now targeting SIH final.
- Competitor: Team K26117 "GeoPulse" (HeatPulse) — same PS, has real IoT hardware (Arduino/DHT22/ThingSpeak) as a differentiator SentinelX currently lacks.
- Hospital Surge Predictor: 3 NDMA historical anchors (1998/2015/2019 Odisha events) + synthetic augmentation (73,000 ward-days), 2-stage Linear+XGBoost, exported as .joblib.
- Supabase Cloud DB (Tokyo region, free tier) integrated for demographic data (elderly%/illiteracy%/outdoor-worker%).
- Deployment: Vercel (frontend) + Render (backend).

## Template for future entries
```
## YYYY-MM-DD — <short title>
- What changed
- Why
- Any new bugs/decisions/constraints future sessions need to know
```

## 2026-09-20 — Task 1: Removed hardcoded Gemini API key fallback
- Removed hardcoded Gemini API key default string from `routers/copilot.py`. Set `GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")`.
- Implemented graceful offline fallback inside `query_gemini()` to return structured mock NDMA advisory text when `GEMINI_API_KEY` is not set or unavailable.
- Verified `.env.example` lists `GEMINI_API_KEY=` as an empty placeholder and confirmed `.env` is listed in `.gitignore`.

## 2026-09-21 — Task 2: Removed hardcoded API key fallbacks from services & routers
- Removed literal fallback API keys from `services/live_weather.py` (`WEATHERAPI_KEY`) and `routers/news.py` (`NEWS_API_KEY`).
- Configured graceful offline fallbacks: `services/live_weather.py` logs unconfigured state cleanly without erroring; `routers/news.py` returns structured mock IMD/OSDMA climate bulletins when unconfigured.
- Confirmed `WEATHERAPI_KEY=` and `NEWS_API_KEY=` are listed as empty placeholders in `.env.example`.

## 2026-09-21 — Task 3: Nighttime Recovery Failure Index & 24h Cumulative Thermal Burden
- Added `compute_night_recovery()` and `compute_24h_thermal_burden()` functions in `core/thermal_stress.py`. Evaluates nocturnal cooling deficits and applies a 15% compounding penalty per consecutive night without body cooling (capped at 2.5x).
- Added `GET/POST /api/v1/thermal/night-recovery` route in `routers/thermal.py` exposing calculated night recovery metrics and 24h burden.
- Created `src/components/NightRecoveryCard.tsx` implementing a glass card with 4-tier risk colors (`Green`/`Yellow`/`Orange`/`Red`) and explicit `[CALCULATED]` provenance tags.
## 2026-09-21 — Task 5: Data Provenance Labels Audit (Completed)
- Applied explicit data-provenance tags (`[REAL]`, `[CALCULATED]`, `[MODELLED]`, `[SYNTHETIC]`) across all UI screens: `WardView.tsx`, `HospitalSurgeView.tsx`, `DemographicsTab.tsx`, `CitizenAdvisoryView.tsx`, `SolarNoonFluxWidget.tsx`, `OrganStrainHologram.tsx`, `WhatIfSimulator.tsx`, `HThermCalculator.tsx`, `BenchmarksView.tsx`, `CommandTab.tsx`, and `OverviewTab.tsx`.
- Maintained consistent provenance-badge color/placement discipline (`REAL` = emerald, `CALCULATED` = cyan, `MODELLED` = purple, `SYNTHETIC` = amber), separate from the 4-tier risk severity scale.
- Verified TypeScript types (`npx tsc --noEmit`) and Vite production build (`npm run build`). Marked Task 5 fully complete in `task.md`.
## 2026-09-21 — CodeRabbit Review Fixes (Copilot Fallbacks, Weather Input Validation, WardView Endpoint Consolidation)
- **copilot.py**: Extracted `_build_fallback_response()` helper function. Replaced empty candidate responses, missing candidate text/parts, missing API keys, and exception handlers with consistent, structured fallback metadata (`engine = "SentinelX Emergency Fallback Engine"` and `is_fallback = True`).
- **thermal.py & core/thermal_stress.py**: Added FastAPI query validation constraints (`ge`/`le`) and an internal `_sanitize_float` helper function to validate, bound, and sanitize weather inputs (`temperature`, `humidity`, `wind_speed`, `solar_radiation`, `uv_index`, `aqi`) against NaN/Inf and non-physical values. Added safe non-negative guards (`max(0.0, ...)`) inside `heat_index_celsius` square-root calculations.
- **WardView.tsx**: Removed duplicated local night-recovery arithmetic (`(nightMinTemp - 22) * 8.5` and local 24h burden formula). Added API fetch to `/api/v1/thermal/night-recovery` as the single source of truth for `NightRecoveryCard` and 3-value Recharts bar chart.
## 2026-09-21 — Task 4: Model Validation Dashboard (Completed)
- **Backend**: Created `data/model_validation_metrics.json` and added new router `routers/model_validation.py` mounted at `/api/v1/model-validation` in `main.py`. Exposes train/validation/test period splits, accuracy, precision, recall, F1, ROC-AUC, confusion matrix, feature importances/lag weights, and explicit **False-Negative Rate (FNR)** for both core models (Random Forest Heatwave Classifier & 2-Stage DLNM+XGBoost ER Surge Forecaster).
- **Frontend**: Created `src/components/ModelValidationView.tsx` and registered the `validation` tab in `Header.tsx` and `App.tsx`. Features side-by-side model comparison, prominent high-priority alert cards highlighting critical FNR (2.28% for RF classifier, 5.92% for 2-stage surge model), interactive confusion matrix visualizers, and dataset split progress bars.
- **Rules.md Compliance**: All returned metrics carry explicit `[MODELLED]` provenance badges per design.md and rules.md.
## 2026-09-21 — Task 6: Construction Worker Safety Module (Completed)
- **Backend**: Created `routers/worker_safety.py` mounted at `/api/v1/worker-safety` in `main.py`. Computes time-sliced 2-hour shift thermal exposure (LOW/MODERATE/HIGH/EXTREME), effective WBGT adjustments based on activity type (Roofing, Masonry, Paving, Steel Rebar, Excavation) and intensity (Light, Moderate, Heavy, Very Heavy), shade/water mitigation offsets, required site water/ORS liters, and mandatory work-rest directives aligned with Odisha Factories Act & NDMA Heat Action Plan guidance.
- **Frontend**: Created `src/components/tabs/WorkerSafetyTab.tsx` and registered the `worker_safety` tab (`Worker Safety`) in `Header.tsx` and `App.tsx`. Features site configuration input form, summary KPI cards, time-sliced effective WBGT bar chart, and time-block recovery directive cards.
- **Rules.md Compliance**: All returned metrics and UI numbers carry explicit `[CALCULATED]` provenance badges. Input validation constraints (`ge`/`le` and float sanitization) enforced per `thermal.py` fix pattern.
## 2026-09-21 — Task 7: School Heat Safety Module (Completed)
- **Backend**: Created `routers/school_safety.py` mounted at `/api/v1/school-safety` in `main.py`. Evaluates classroom and playground heat stress curves across school hours (06:30 AM – 01:30 PM), incorporating child age group thermoregulation physiology (Primary ages 5-10, Middle, Secondary), classroom ventilation penalties (Tin/asbestos roof +4.5°C, Natural windows, Fans, HVAC), and outdoor PE/sports peak solar radiation penalties. Generates Action Engine directives (Morning Assembly shorten/relocation, sports cancellation, classroom floor shifts, ORS hydration bells, and morning shift transition advisories).
- **Frontend**: Created `src/components/tabs/SchoolSafetyTab.tsx` and registered the `school_safety` tab (`School Safety`) in `Header.tsx` and `App.tsx`. Features school configuration form, KPI cards, hourly classroom WBGT bar chart, and SentinelX Action Engine directive cards.
- **Rules.md Compliance**: All returned metrics and UI numbers carry explicit `[CALCULATED]` provenance badges. Enforced input validation bounds (`ge`/`le` and float sanitization).
## 2026-09-21 — Task 8: Architecture Cleanup — Resolved `teammate_backend/` Duplication (Completed)
- **Investigation**: Inspected `render.yaml` and `main.py`. Confirmed production deployment uses root `main:app` which imports directly from root `routers/` (`routers.weather`, `routers.wards`, `routers.risk`, `routers.thermal`, `routers.alerts`, `routers.dashboard`, `routers.live`, `routers.sentinelx`, `routers.copilot`, `routers.model_validation`, `routers.worker_safety`, `routers.school_safety`).
- **Uniqueness Check**: Audited all 7 routers and 5 service files in `teammate_backend/`. Confirmed zero unique functionality — all endpoints/models exist in root `routers/` and `services/` (with root having security fixes, input sanitization, and extra endpoints).
- **Cleanup**: Deleted legacy `teammate_backend/` directory (`rm -rf teammate_backend`). Updated fallback GeoJSON candidate paths in `server.ts`, `scripts/seed_wards.py`, and `routers/sentinelx.py` to reference root `wards_bhubaneswar.geojson`. Updated `architecture.md` tree diagram.
- **Verification**: Verified clean TypeScript types (`npx tsc --noEmit`), Vite production build (`npm run build`), and Python compilation (`py_compile`). Marked Task 8 complete in `task.md`.

## 2026-09-21 — Task 9: CORS Hardening & Jury Pitch Defense Scoping (Completed)
- **main.py**: Replaced `allow_origins=["*"]` with explicit frontend origins. Reads comma-separated origins from `FRONTEND_ORIGIN` env variable with defaults for production Vercel apps (`https://sentinelx.vercel.app`, `https://sentinel-4b8v5lb81-aniruddha-fittrack.vercel.app`) and local development ports (`http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:3000`). Added security comment clarifying that RBAC/OAuth2 authentication middleware is un-enforced in demo mode for hackathon review.
- **SIH_2026_WINNING_PITCH_AND_DEMO_SCRIPT.md**: Added Q6 in the "Jury Technical Defense — Hard Questions & Winning Answers" section, documenting restricted CORS origins and the enterprise deployment auth roadmap (Gov-SSO / Keycloak RBAC).
- **Verification**: Verified clean backend Python compilation (`py_compile main.py`), frontend TypeScript checks (`npx tsc --noEmit`), and Vite bundle creation (`npm run build`). Marked Task 9 complete in `task.md`.

## 2026-09-21 — Task 10: Cooling-Center Optimization & Emergency Routing (Completed)
- **Backend**: Created `routers/resource_allocation.py` mounted at `/api/v1/resource-allocation` in `main.py`. Features `/cooling-gaps` (cross-references ward HTSI, demographic vulnerability, and Haversine distance to cooling shelters to detect coverage deficits and recommend misting canopies/ORS points) and `/emergency-routing` (computes straight-line Haversine distance, urban ambulance transit time estimates, and response priority tiers for nearest tertiary healthcare centers with explicit **Advisory Only** disclaimer).
- **Frontend**: Created `src/components/tabs/ResourceAllocationTab.tsx` and registered `resource_allocation` tab (`Resource Allocation`) in `Header.tsx` and `App.tsx`. Features KPI summary cards, filterable cooling-center spatial gap table, and interactive ward emergency hospital routing lookup.
- **Rules.md Compliance**: All spatial and risk metrics carry explicit `[CALCULATED]` provenance badges; facility catalogs carry `[SYNTHETIC]` badges per rules.md.
- **Verification**: Verified zero TypeScript errors (`npx tsc --noEmit`), clean Vite build (`npm run build`), and 12/12 passing backend routes (`test_e2e_all_routes.py`). Marked Task 10 complete in `task.md`.

## 2026-09-21 — Task 11: Multi-Layer GIS Map & Underserved High-Risk Overlay (Completed)
- **Backend (`services/gis_map.py`)**: Added Folium multi-layer feature group support, emergency hospital vector connections, and sovereign India bounding box clamping (`maxBounds: [[5.0, 65.0], [38.5, 98.5]]`, `minZoom: 5`).
- **Frontend (`src/components/OdishaMap.tsx`)**: Integrated Task 10 API endpoints (`/cooling-gaps` and `/emergency-routing`). Built a Bento-Glass Layer Controls Panel overlay on the map UI with toggle switches for Thermal Stress (HTSI), Population Vulnerability Index, Cooling Hubs & Gap Tiers, and Hospitals & Emergency Transport Vectors. Added dedicated **"Show Underserved High-Risk Areas"** action filter highlighting wards with `HIGH/CRITICAL` thermal risk AND `DEFICIT` cooling access using glowing, pulsating red-bordered circles (`#f43f5e`, `dashArray: '6, 6'`).
- **Skipped Dynamic Layers Rationale**: *Construction Sites* and *Schools* layers were omitted from static map catalogs because `routers/worker_safety.py` and `routers/school_safety.py` compute thermal stress curves dynamically on worker shift/classroom input parameters without static GIS coordinate catalogs.
- **Verification**: Verified zero TypeScript errors (`npx tsc --noEmit`), clean Vite bundle creation (`npm run build`), clean Python execution (`py_compile main.py`), and 12/12 passing backend API routes (`test_e2e_all_routes.py`). Marked Task 11 complete in `task.md`.

## 2026-09-21 — Task 12: Historical Event Replay (Completed)
- **Backend (`routers/historical_replay.py`)**: Mounted at `/api/v1/historical-replay` in `main.py`. Exposes sourced NDMA historical benchmarks (`/events`) and day-by-day disaster replay sequences (`/playback`) reconstructing SentinelX HTSI thermal strain, 2-Stage DLNM+XGBoost hospital admissions surge, and Disaster Action Engine statutory directives across 3 landmark Odisha heatwaves (1998, 2015, 2019).
- **Provenancing Discipline**: Rigorously tagged historical weather/casualty benchmarks as `[REAL / REPORTED ESTIMATE]` (with official citations to Odisha SRC reports, Union MoES Parliamentary replies, and NDMA PDNA audits) while tagging reconstructed HTSI, ER surge, and Action Engine directives as `[MODELLED RECONSTRUCTION]`.
- **Frontend (`HistoricalReplayTab.tsx`)**: Registered `historical_replay` tab (`Historical Replay`) in `Header.tsx` and `App.tsx`. Features event selector buttons, interactive playback controller (Play/Pause/Step slider), and a dual-provenance bento grid.
- **Verification**: Verified zero TypeScript errors (`npx tsc --noEmit`), clean Vite production build (`npm run build`), clean Python compilation (`py_compile main.py`), and 14/14 passing backend API routes (`test_e2e_all_routes.py`). Marked Task 12 complete in `task.md`.

## 2026-09-21 — Production Rendering Bug Fixes (Bugs 1, 2, and 3 Completed)
- **Bug 1 (GIS Map Tiles & Bounds Clamping Fix)**:
  - *Root Cause*: CartoDB tile URLs (`cartocdn.com/dark_all/...`) enforced API key requirements on standard requests, rendering "API KEY REQUIRED" watermarks across map tiles. Additionally, Folium initialized `max_bounds=True` (boolean instead of LatLng bounds array) which Leaflet ignored, and Leaflet initialized in un-invalidated flex containers causing map views to render zoomed out across Asia.
  - *Fix*: Switched tile providers in both `services/gis_map.py` and `src/components/OdishaMap.tsx` to Esri World Dark Gray Canvas (`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`), eliminating watermarks. Set strict India bounds clamping (`INDIA_BOUNDS = [[5.0, 65.0], [38.5, 98.5]]`, `maxBoundsViscosity: 1.0`, `minZoom: 5`, `m.fit_bounds(india_bounds)`), and added post-mount `map.invalidateSize()` calls.
- **Bug 2 (Command Center / Bhubaneswar Core Top Stat Cards Fix)**:
  - *Root Cause*: Open-Meteo API utility (`src/services/weatherAPi.js`) requested only basic parameters (`temperature_2m,relative_humidity_2m,apparent_temperature`), omitting `wind_speed_10m`, `wind_direction_10m`, `surface_solar_radiation`, and `uv_index`. When Open-Meteo returned `null` on fetch failures or missing parameters, several card values in `OverviewTab.tsx` evaluated to `undefined`, causing the top stat card value fields to render blank.
  - *Fix*: Updated `getWeatherData()` parameters in `src/services/weatherAPi.js` to include wind speed, wind direction, surface solar radiation, and UV index with a try/catch wrapper. Enhanced `src/components/tabs/OverviewTab.tsx` to compute robust dynamic fallback values for all 7 top row stat cards (ambient temp delta, vapor load, wind direction, solar radiation, stroke probability, UV index, and solar noon countdown) using `activeDistrict` and astronomical zenith calculations.
- **Bug 3 ("Odisha Statewide" Tab Blank Page Fix)**:
  - *Root Cause*: `src/components/OdishaMap.tsx` crashed during initial render when `districts` prop was empty or undefined on component mount, executing `districts.reduce(...)` on undefined. Furthermore, line 1000 performed an unsafe non-optional property access (`currentDistrict.uhi_anomaly_c >= 0`) when `currentDistrict` was undefined, throwing an unhandled `TypeError` that crashed React rendering to a completely blank page.
  - *Fix*: Added safe array guards `(districts || []).reduce(...)`, constructed a comprehensive `fallbackDistrict` record object for initial mount states, replaced unsafe property dereferences with optional chaining (`((currentDistrict?.uhi_anomaly_c ?? 0) >= 0)`), and added `map.invalidateSize()` inside map initialization effects.
- **Verification**: Verified zero TypeScript errors (`npx tsc --noEmit`), clean Vite production build (`npm run build`), clean Python execution (`py_compile main.py`), and successful Folium map HTML rendering (`generate_risk_map`).
