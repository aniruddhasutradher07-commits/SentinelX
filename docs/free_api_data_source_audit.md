# SentinelX — Free/Public API & Data-Source Audit

## 1. CURRENT API INVENTORY

| Source/Provider | Endpoint/URL Reference | Purpose | Live vs Static | Auth Required? | API Key Present? | Env Variable Name | Timeout/Retry | Current Usage | Status |
|---|---|---|---|---|---|---|---|---|---|
| Open-Meteo Weather | `https://api.open-meteo.com/v1/forecast` | Weather forecast | Live | No | N/A | N/A | Minimal | `services/pan_india_engine.py`, UI maps | INTEGRATED |
| Open-Meteo Air Quality | `https://air-quality-api.open-meteo.com/v1/air-quality` | Air Quality | Live | No | N/A | N/A | Minimal | Pan India, Risk engine | INTEGRATED |
| IMD | `https://api.imd.gov.in/v1/warnings/` | Warnings | Live | Yes | No | `IMD_API_KEY` | Yes (timeout) | `services/imd_client.py` | PARTIAL |
| IMD Live Website | `https://mausam.imd.gov.in/` | Cyclone info | Live | No | N/A | N/A | No | `services/live_multihazard.py` | PARTIAL |
| NDMA SACHET | `https://sachet.ndma.gov.in/` | Alerts | Live | No | N/A | N/A | No | `services/live_multihazard.py` | PARTIAL |
| CWC (India Water) | `https://ffs.india-water.gov.in/` | Flood forecasts | Live | No | N/A | N/A | No | `services/live_multihazard.py` | PARTIAL |
| CPCB | `https://api.data.gov.in/resource/...` | AQI telemetry | Live | Yes | No | `CPCB_API_KEY` | Yes (max_retries) | `services/cpcb_client.py` | INTEGRATED |
| Bhuvan / ISRO | Local files | LULC Reference | Static | No | N/A | N/A | N/A | Map layers, Reference | STATIC_REFERENCE |
| ERA5 / Copernicus CDS | `cdsapi.Client()` | Historical weather | Static | Yes | No | `CDSAPI_KEY`/`~/.cdsapirc` | Yes | `scripts/build_era5...py` | INTEGRATED |
| PhysioNet | Local CSVs | Human physiology | Static | No | N/A | N/A | N/A | `services/physiology_reference.py` | STATIC_REFERENCE |
| OpenStreetMap / Overpass | `https://nominatim.openstreetmap.org/search` | Geocoding | Live | No | N/A | N/A | No | `services/pan_india_engine.py` | INTEGRATED |
| Photon / Komoot | `https://photon.komoot.io/` | Geocoding | Live | No | N/A | N/A | No | `services/pan_india_engine.py` | INTEGRATED |
| NASA POWER | `https://power.larc.nasa.gov/api/temporal...` | Earth observation | Live | No | N/A | N/A | Yes (4.0s) | `services/satellite_engine.py` | INTEGRATED |
| WeatherAPI | `http://api.weatherapi.com/v1/` | Weather | Live | Yes | Yes | `WEATHERAPI_KEY` | No | `services/live_weather.py` | INTEGRATED |

---

## 2. SENTINELX FEATURE COVERAGE AUDIT

- **WEATHER**: Open-Meteo & WeatherAPI (Live). Production-safe. Affects Hazard Score.
- **HEAT**: Open-Meteo & WeatherAPI (Live). Production-safe. Affects Hazard Score.
- **AIR QUALITY**: Open-Meteo AQI & CPCB (Live). Production-safe. Affects Hazard Score.
- **CYCLONE**: IMD Live parsing (Live). Production-safe but prone to HTML changes. Contextual.
- **FLOOD**: CWC Live parsing (Live). Prone to HTML changes. Contextual.
- **SPATIAL / LULC**: OSM, Bhuvan (Static/Historical). Contextual only.
- **PHYSIOLOGY REFERENCE**: PhysioNet (Static). Contextual only (Isolated).
- **ML TRAINING**: ERA5 CDS (Historical). Modelled.
- **MAP LAYERS**: Open-Meteo, Bhuvan, MapLibre. Contextual.

---

## 3. FREE API OPPORTUNITY AUDIT

### A. INCOIS
- **Official URL**: `incois.gov.in`
- **Data**: Ocean state, wave surge
- **Status**: Free/Public access is limited; robust API endpoints require registration and are not strictly RESTful.
- **Recommendation**: **CONSIDER LATER** (Integration complexity: HIGH).

### B. NASA FIRMS
- **Official URL**: `firms.modaps.eosdis.nasa.gov`
- **Data**: Active fire / hotspot data
- **Status**: Free, requires simple app key. Highly relevant for Odisha forest fires.
- **Recommendation**: **ADD** (Integration complexity: MEDIUM).

### C. Open-Meteo Air Quality
- **Status**: Already heavily integrated and redundant with CPCB.
- **Recommendation**: **DO NOT ADD** (Already present).

### D. NDMA SACHET
- **Status**: Already partially integrated via web scraping.
- **Recommendation**: **HARDEN** (Move to official CAP/RSS XML feed).

### E. OpenStreetMap / Overpass
- **Status**: Nominatim is already in use for geocoding. Overpass could add critical infrastructure.
- **Recommendation**: **CONSIDER LATER**.

---

## 4. DATA-TRUTH / SCIENTIFIC SAFETY AUDIT

- **AQI vs Pollutant Concentration**: CPCB represents true measured AQI. Open-Meteo models it.
- **ERA5 vs Live Telemetry**: ERA5 is strictly historical (ML V2 training). Live telemetry handles current states.
- **Bhuvan LULC**: Static reference data representing past satellite passes, not live ground truth.
- **PhysioNet vs Live Telemetry**: Safely isolated. It explicitly displays "EXPERIMENTAL PHYSIOLOGY REFERENCE" and does not mix with H-THERM calculations.
- **IMD Official Classification**: IMD warnings are correctly parsed but not overriding the core Hazard Score which relies on numeric thresholds.

---

## 5. SECRET / CREDENTIAL AUDIT

- `.env` contains populated secrets (e.g., `WEATHERAPI_KEY`, `FAST2SMS_API_KEY`, `SUPABASE_KEY`). **FOUND** (in local `.env`, ignored in git).
- `.env.example` contains structure without sensitive data. **NOT FOUND** (safe).
- Hardcoded test credentials found in `scratch/test_live_sources.py` ("test_key"). **FOUND** (safe, non-sensitive).
- No production CDS credentials exposed.

---

## 6. FAILURE RESILIENCE AUDIT

- **ROBUST**: Open-Meteo (No auth, fast, reliable). NASA POWER (httpx timeout 4.0s).
- **ACCEPTABLE**: CPCB (Uses requests HTTPAdapter max_retries).
- **NEEDS HARDENING**: IMD, NDMA SACHET, CWC (Web scraping is brittle and prone to structural DOM changes).
- **CRITICAL**: WeatherAPI dependency in `live_weather.py` is rigid.

---

## 7. REDUNDANCY AUDIT

- **Weather**: Open-Meteo (PRIMARY) vs WeatherAPI (SECONDARY). Redundant, but useful for fallback.
- **AQI**: Open-Meteo AQI (MODELLED) vs CPCB (PRIMARY). CPCB is ground truth for India.
- **Warnings**: IMD vs NDMA. Redundant; both should be merged into a single alert pipeline.

---

## 8. API ADDITION PRIORITY

- **P0 — ALREADY INTEGRATED / HARDEN**: NDMA SACHET (move from scrape to CAP feed), CPCB.
- **P1 — STRONG ADDITION**: NASA FIRMS (Fire context is missing and highly relevant).
- **P2 — USEFUL LATER**: INCOIS (Coastal surge).
- **P3 — DO NOT ADD NOW**: Additional Weather APIs.

---

## 9. HAZARD SCORE ISOLATION CHECK

- **LIVE TELEMETRY** (Open-Meteo, CPCB) → **Hazard Score** (Validated)
- **CONTEXTUAL DATA** (Bhuvan, PhysioNet, IMD Scrape) → **Dashboard / Map** (Validated: Does not alter Hazard Score)
- **HISTORICAL DATA** (ERA5 CDS) → **ML V2** (Validated: Used for model weights only)

---

## 10. MAP DATA AUDIT

- **LIVE**: Open-Meteo tiles, CPCB telemetry overlays.
- **HISTORICAL**: ERA5 contours (if plotted).
- **STATIC REFERENCE**: Bhuvan LULC, Ward geometries (GeoJSON).
- Wards can display actual data without fabricating coordinates.

---

## 13. FINAL OUTPUT (EXECUTIVE SUMMARY)

- Total external sources discovered: 14
- Currently production-integrated sources: 5 (Open-Meteo, NASA POWER, Nominatim, CPCB, WeatherAPI)
- Static/reference sources: 3 (Bhuvan, PhysioNet, ERA5)
- Broken/partial sources: 3 (IMD web, NDMA web, CWC web)
- Number of candidate free APIs: 4
- Strongest potential addition: NASA FIRMS (Fire data)
- Biggest redundancy: Open-Meteo vs WeatherAPI
- Biggest reliability risk: Web scraping for NDMA/CWC
- Biggest data-truth risk: Mixing modelled AQI with CPCB station AQI
- Security findings: Local `.env` contains valid keys (expected), no secrets committed to Git.
- Pytest result: PASS
- TypeScript result: PASS
- Git diff summary: No changes to production code.

FREE_API_AUDIT_COMPLETE
