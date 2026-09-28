# 🛡️ HEATGUARD AI — Predict Heat. Protect People.
### Impact-Based Heat Health Early Warning & Environmental Risk Intelligence Platform
**Smart India Hackathon 2026 · Problem Statement PS 26083**  
*Ministry of Earth Sciences (MoES) / NCMRWF / Disaster Management Authorities*  
*Primary Geographic Validation Domain: Bhubaneswar Municipal Corporation (67 Wards), Odisha, India*

[![Live Production](https://img.shields.io/badge/Production-Live%20on%20Railway-00C7B7?style=for-the-badge&logo=railway&logoColor=white)](https://sentinelx-thermal-api-production-aa42.up.railway.app)
[![API Documentation](https://img.shields.io/badge/OpenAPI%203.1-Interactive%20Swagger-059669?style=for-the-badge&logo=fastapi&logoColor=white)](https://sentinelx-thermal-api-production-aa42.up.railway.app/docs)
[![Pytest Suite](https://img.shields.io/badge/Tests-97%20Passed%20%7C%2010%20Skipped-10B981?style=for-the-badge&logo=pytest&logoColor=white)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5%20Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](src/)
[![ML Pipeline](https://img.shields.io/badge/ML%20V2-HistGradientBoosting%20%28ERA5%29-FF6F00?style=for-the-badge&logo=scikit-learn&logoColor=white)](data/ml_v2/)
[![Full Project Report](https://img.shields.io/badge/Docs-Complete%20SIH%20Report%20(14k%20words)-6366F1?style=for-the-badge&logo=gitbook&logoColor=white)](docs/HEATGUARD_AI_END_TO_END_PROJECT_REPORT.md)

---

## 🌐 Live Deployments & Key Links

* **🚀 Production Cloud Application:** [https://sentinelx-thermal-api-production-aa42.up.railway.app](https://sentinelx-thermal-api-production-aa42.up.railway.app)
* **📖 Interactive Swagger API Docs:** [https://sentinelx-thermal-api-production-aa42.up.railway.app/docs](https://sentinelx-thermal-api-production-aa42.up.railway.app/docs)
* **📑 Comprehensive 14,000-Word Project Report:** [`docs/HEATGUARD_AI_END_TO_END_PROJECT_REPORT.md`](docs/HEATGUARD_AI_END_TO_END_PROJECT_REPORT.md)
* **📄 Printable Standalone HTML Executive Report:** [`docs/HEATGUARD_AI_END_TO_END_PROJECT_REPORT.html`](docs/HEATGUARD_AI_END_TO_END_PROJECT_REPORT.html)

---

## 🌡️ Executive Overview: "What Will the Weather DO to People?"

Traditional heatwave warning systems in India rely almost exclusively on macro-scale ambient dry-bulb thermometer thresholds (e.g., standard IMD alerts triggered when temperature exceeds 40°C in the plains). However, **temperature alone is a dangerously incomplete indicator of human thermal stress**:
1. **Humidity Masking:** 37°C at 75% relative humidity completely shuts down evaporative perspiration, inducing lethal hyperthermia at air temperatures conventionally classified as "normal summer heat".
2. **Solar Radiation & Radiant Load:** High downward insolation directly superheats urban masonry and human tissue, driving Wet Bulb Globe Temperature (WBGT) and Universal Thermal Climate Index (UTCI) far above ambient air temperature.
3. **Absence of Hyperlocal Spatial Differentiation:** Macro-scale citywide alerts treat metropolitan areas as single homogeneous points, ignoring localized Urban Heat Islands (UHI), informal slum heat traps, and tree canopy deficits.
4. **Disconnection from Population Vulnerability:** Extreme temperatures disproportionately harm geriatric populations (aged $\ge 60$), infants (aged $\le 5$), outdoor daily-wage laborers, and informal settlement residents with asbestos/tin roofing.

**HeatGuard AI** (engineered on the `SentinelX` architecture) transforms raw meteorological and satellite observations into proactive, ward-level decision support. Moving from crude weather forecasts to impact-based human heat-stress intelligence, HeatGuard continuously synthesizes atmospheric physics, socio-demographic vulnerability, supervised machine learning, and multi-channel automated alerting across **67 municipal administrative wards of Bhubaneswar, Odisha**.

---

## ⚡ Core Platform Capabilities

| Capability Domain | Implemented Engineering Architecture | Operational Provenance Status |
| :--- | :--- | :--- |
| **Biometeorological Science** | Real-time calculation of **WBGT** (ISO 7243 via Liljegren & Stull physics), **UTCI** (187-node Fiala model regression), **Heat Index** (NOAA/Rothfusz), and **Steadman Apparent Temperature**. | `CALCULATED / LIVE` |
| **67-Ward GIS Mapping** | Hardware-accelerated Leaflet vector choropleth mapping 67 BMC wards (`wards_bhubaneswar.geojson`) with switchable layers: WBGT stress, composite risk tiers, cooling centers, and schools. | `STATIC GIS REFERENCE` |
| **5-Day Forward Outlook** | Rolling 120-hour deterministic forecasting predicting daily maxima, minima, diurnal stress peaks, and **Tropical Night Warnings** ($T_{\text{min}} \ge 28.0^\circ\text{C}$). | `FORECAST` |
| **Supervised ML V2 Pipeline** | `HistGradientBoostingRegressor` trained across **262,656 hourly records** of Copernicus ECMWF ERA5 reanalysis (2021–2025). Predicts `NEXT_24H_MAX_APPARENT_TEMPERATURE` with Holdout **MAE 1.0829°C** and **$R^2$ 0.9055**. | `MODELLED (ERA5 ML V2)` |
| **AI Copilot with Fallback** | Natural language operational assistant using **Google Gemini 1.5 Flash** with instantaneous fallback to **`HeatGuard Domain Assistant — Rule-Based`**. Sorts by "Highest Current Temperature Wards" with strict truthfulness disclaimers. | `LIVE / HYBRID` |
| **Multi-Channel Alerting** | Automated notification engine supporting SMS (Twilio/Gupshup) and WhatsApp dispatch with SQLite audit logging and safe simulation drill mode (`dry_run=true`). | `DEMO ACTION / SIMULATED` |
| **11-State Data Provenance** | Immutable data-truth taxonomy (`LIVE`, `CACHED OBSERVATION`, `STALE`, `CALCULATED`, `FORECAST`, `MODELLED`, `EXPERIMENTAL_NOT_VALIDATED`, `STATIC REFERENCE`, `STATIC GIS REFERENCE`, `PENDING_ROLLOUT`, `CREDENTIALS_NOT_CONFIGURED`, `DEMO ACTION`). | `RADICAL DATA TRUTH` |
| **Hospital Surge Research** | 5-day healthcare surge research prototype (`/api/v1/wards/{ward_no}/hospital-demand`). Explicitly returns `admissions_prediction: null` to prevent clinical data fabrication. | `EXPERIMENTAL_NOT_VALIDATED` |
| **Mortality Impact Research** | Environmental exposure proxy (`/api/v1/mortality-risk`). Strictly outputs `predicted_mortality: null` until authenticated civil mortality registries are connected. | `EXPERIMENTAL_NOT_VALIDATED` |

---

## 🏗️ System Architecture Topology

```mermaid
graph TD
    subgraph Client Layer
        Browser[Modern Web Browser / Field Tablet]
        ReactSPA[React 18 + Vite TypeScript SPA]
        GISMap[Leaflet 67-Ward Interactive GIS Choropleth]
        CopilotModal[AI Copilot Tactical Assistant Drawer]
    end

    subgraph API & Gateway Layer
        FastAPIEntry[FastAPI Master Application - main.py]
        CORSMiddleware[CORS Security & Static Mount]
        APIRouterCatalog[76 Registered REST Endpoints]
    end

    subgraph Computational Engines
        ThermalEngine[Deterministic Thermal Engine<br/>WBGT ISO 7243 | UTCI | Heat Index]
        WardRiskEngine[Ward Vulnerability Scorer<br/>50% Hazard + 35% Vulnerability + 15% Exposure]
        ForecastEngine[5-Day Forward Outlook Aggregator]
        MLV2Engine[Supervised ML V2 Regressor<br/>HistGradientBoosting on 262k ERA5 Rows]
        CopilotEngine[Copilot Hybrid Engine<br/>Google Gemini + Deterministic Rule Fallback]
        HealthResearchEngine[Health Surge & Mortality Research Proxies]
        AlertDispatchEngine[SMS & WhatsApp Dispatch Pipeline]
    end

    subgraph Data & Persistence Layer
        SQLiteDB[(SQLite Database - sentinelx_data.db)]
        ObsCache[Weather Observations Table - 600s Sync]
        AuditLogs[Alert Dispatch Audit Log Table]
        MLArtifacts[ML V2 Model Artifact - 438 KB Joblib]
        WardGeoJSON[BMC 67 Wards - wards_bhubaneswar.geojson]
    end

    subgraph External Observation Feeds
        OpenMeteoAPI[Open-Meteo Weather Surface Grid API]
        ERA5CDS[Copernicus CDS / ECMWF ERA5 Reanalysis 2021-2025]
        CPCBAPI[CPCB OGD Air Quality Platform]
        IMDAPI[IMD Mausam National API]
        BhuvanWMS[ISRO / NRSC Bhuvan LULC 50K WMS]
        TwilioGupshup[Twilio / Gupshup Gateways]
    end

    Browser --> ReactSPA
    ReactSPA --> GISMap
    ReactSPA --> CopilotModal
    ReactSPA -->|Async Fetch API| FastAPIEntry
    FastAPIEntry --> CORSMiddleware
    CORSMiddleware --> APIRouterCatalog

    APIRouterCatalog --> ThermalEngine
    APIRouterCatalog --> WardRiskEngine
    APIRouterCatalog --> ForecastEngine
    APIRouterCatalog --> MLV2Engine
    APIRouterCatalog --> CopilotEngine
    APIRouterCatalog --> HealthResearchEngine
    APIRouterCatalog --> AlertDispatchEngine

    ThermalEngine --> ObsCache
    WardRiskEngine --> WardGeoJSON
    WardRiskEngine --> ObsCache
    MLV2Engine --> MLArtifacts
    AlertDispatchEngine --> AuditLogs

    ObsCache --> SQLiteDB
    AuditLogs --> SQLiteDB

    ThermalEngine -.->|Polling Loop (600s)| OpenMeteoAPI
    MLV2Engine -.->|Offline Supervised Training| ERA5CDS
    APIRouterCatalog -.->|Station Lookup| CPCBAPI
    APIRouterCatalog -.->|District Warning| IMDAPI
    GISMap -.->|Satellite WMS| BhuvanWMS
    AlertDispatchEngine -.->|Webhook Alert| TwilioGupshup
```

---

## 📂 Repository Directory Tree

```
/Users/aniruddhasutradhar/Desktop/SIH
├── main.py                     # Master FastAPI ASGI application entrypoint & static mount
├── database.py                 # SQLite database engine & session management
├── models.py                   # SQLAlchemy ORM models (WeatherObservation, ForecastCache, AlertAuditLog)
├── schemas.py                  # Pydantic schemas for request/response serialization
├── requirements.txt            # Python production dependencies
├── package.json                # Frontend NPM packages and build scripts
├── Dockerfile                  # Production multi-stage Docker build specification
├── .env.example                # Environment variable template (zero committed secrets)
├── wards_bhubaneswar.geojson   # Formal BMC 67-ward polygon boundary features with demographics
├── odisha_districts.geojson    # Sovereign Odisha 30-district boundary polygons
│
├── routers/                    # Modular FastAPI REST API Routers (76 registered endpoints)
│   ├── weather.py              # Live observation endpoints (/api/v1/dashboard)
│   ├── forecast.py             # 5-day horizon forecasting (/api/v1/forecast-risk)
│   ├── wards.py                # Ward-level risk intelligence and ranking (/api/v1/wards, /api/v1/wards/{id})
│   ├── thermal.py              # Thermal index calculations (/api/v1/thermal/thermal-stress)
│   ├── copilot.py              # AI Copilot hybrid chat engine (/api/v1/ai/copilot, /api/v1/ai/advisory)
│   ├── health_research.py      # Research endpoints (/api/v1/wards/{id}/hospital-demand, /api/v1/mortality-risk)
│   ├── cpcb.py                 # CPCB air quality integration (/api/v1/cpcb/status)
│   ├── imd.py                  # IMD official warning integration (/api/v1/imd/status)
│   ├── alerts.py               # Multi-channel notification dispatch (/api/v1/alerts/dispatch)
│   ├── htherm.py               # Human thermal stress & metabolic balance (/api/v1/h-therm/calculate)
│   ├── model_validation.py     # ML validation metrics & confusion matrices (/api/v1/model-validation)
│   ├── ml_v2.py                # HistGradientBoosting temperature predictor (/api/v1/ml-v2/forecast)
│   └── sentinelx.py            # Comprehensive telemetry, multi-hazard, and GeoJSON endpoints
│
├── services/                   # Core Business Logic & Scientific Computation
│   ├── ingestion.py            # Open-Meteo ingestion, grid batching, and SQLite caching
│   ├── thermal_engine.py       # Deterministic implementations of WBGT, UTCI, HI, and Apparent Temp
│   ├── risk_engine.py          # Composite 3-tier Ward Risk Scorer (Hazard, Vulnerability, Exposure)
│   ├── live_sync.py            # Unified daemon synchronizer (Open-Meteo: 600s, IMD: 900s, CPCB: 900s)
│   ├── notification_service.py # SMS & WhatsApp adapter pipeline with dry-run support
│   ├── cpcb_client.py          # CPCB OGD API client and Haversine nearest-station matcher
│   ├── imd_client.py           # IMD Mausam API client and district warning normalizer
│   ├── bhuvan_lulc.py          # Bhuvan LULC AOI statistics cache service
│   └── htherm_engine.py        # Physiological thermal comfort and organ stress modeling
│
├── src/                        # React 18 TypeScript Frontend Source
│   ├── App.tsx                 # Root application component, tab router, and live header status chips
│   ├── index.css               # Design system tokens, tactical dark palette, and CSS utilities
│   ├── services/apiConfig.ts   # Centralized API base URL resolver and proxy router
│   ├── components/             # Reusable UI Components
│   │   ├── AICopilotModal.tsx  # Natural language AI Copilot drawer with safety disclaimers
│   │   ├── ModelValidationView.tsx # ML metrics, ROC curves, and confusion matrix tables
│   │   ├── BenchmarksView.tsx  # Historical NDMA heatwave benchmarks (1998, 2015, 2019)
│   │   └── tabs/               # Primary Screen Views
│   │       ├── CommandTab.tsx          # Municipal Command & Control Center view
│   │       ├── MapViewTab.tsx          # Interactive 67-ward GIS choropleth and layer selector
│   │       ├── OdishaStateTab.tsx      # Macro state-level Odisha meteorological overview
│   │       ├── CitizenViewTab.tsx      # Public-facing citizen advisory and cooling center locator
│   │       ├── WorkerSafetyTab.tsx     # ISO 7243 occupational work-rest advisory
│   │       ├── SchoolSafetyTab.tsx     # School schedule and student outdoor activity guidance
│   │       ├── HospitalDemandTab.tsx   # Healthcare surge research view (explicit research proxy)
│   │       ├── HThermTab.tsx           # Interactive metabolic heat balance calculator
│   │       ├── SimulatorTab.tsx        # Environmental parameter stress-testing simulator
│   │       └── HistoricalReplayTab.tsx # Replay interface for historic heatwave scenarios
│
├── data/                       # Datasets, Model Artifacts & Baselines
│   ├── sentinelx_data.db       # Active production SQLite database
│   ├── ml_v2/                  # Supervised ML V2 Pipeline
│   │   ├── historical_weather_era5_cds_2021_2025.csv # 262,656 processed rows of cleaned ERA5 data
│   │   └── models/
│   │       ├── ml_v2_model.joblib # Serialized HistGradientBoosting model artifact (438 KB)
│   │       └── ml_v2_model_metadata.json # 36-feature training metadata and test evaluation metrics
│   └── physiology_reference/   # Offline research/reference physiology data (PhysioNet, 36 subjects)
│
├── tests/                      # Automated Quality Assurance & Verification Suite
│   ├── test_forecast.py        # 5-day forecast structure and date validation tests
│   ├── test_pipeline.py        # End-to-end data ingestion and thermal calculation tests
│   ├── test_ml_v2.py           # ML V2 inference, shape verification, and feature alignment
│   ├── test_live_features.py   # Live API status, graceful degradation, and provenance checks
│   └── ... (25 test files total covering 97 passing test cases)
│
└── docs/                       # Technical Documentation & Architectural Audits
    ├── HEATGUARD_AI_END_TO_END_PROJECT_REPORT.md   # 14,000+ word comprehensive SIH project report
    └── HEATGUARD_AI_END_TO_END_PROJECT_REPORT.html # Polished, printable executive HTML document
```

---

## 🤖 Supervised Machine Learning Pipeline (ML V2)

HeatGuard AI incorporates a dedicated histogram-based gradient boosting regressor (`HistGradientBoostingRegressor`) designed to forecast maximum apparent temperature 24 hours in advance without target leakage.

```
[=================== TRAIN SET ===================] [=== VAL SET ===] [=== TEST SET ===]
Jan 2, 2021                       Dec 31, 2023     Jan 1, 2024       Jan 1, 2025    Dec 30, 2025
Rows: 157,536 (26,256 hrs/grid)                    Rows: 52,704      Rows: 52,416 (8,736 hrs/grid)
Total Dataset: 262,656 processed rows across 6 ERA5 grid points (43,776 hourly timesteps)
```

### Verified Holdout Evaluation Metrics (Unseen 2025 Calendar Year)
* **Target Variable:** `NEXT_24H_MAX_APPARENT_TEMPERATURE` (°C)
* **Dataset:** Copernicus Climate Change Service (C3S) ECMWF ERA5 Reanalysis
* **Feature Vector:** 36 strictly backward-looking features (instantaneous meteorology, cyclical sin/cos encodings, autoregressive lags at 1h/3h/6h/12h/24h, and 24h rolling extrema).
* **Holdout MAE:** **1.0829 °C** (reduced error by ~0.12°C over strong persistence baseline)
* **Holdout RMSE:** **1.3862 °C**
* **Holdout $R^2$ Score:** **0.9055**
* **Inference Latency:** **< 1.2 ms** per sample
* **Model Artifact:** `data/ml_v2/models/ml_v2_model.joblib` (438 KB)

---

## 🔬 Radical Data Truth & Provenance Framework

In life-critical disaster management platforms, misrepresenting simulated numbers as real observations can result in tragic misallocations of municipal resources. HeatGuard AI formally categorizes every data point into one of **11 explicit engineering states**:

```
+---------------------------------------------------------------------------------------------------+
|                            HEATGUARD DATA-TRUTH TAXONOMY (11 STATES)                              |
+---------------------------------------------------------------------------------------------------+
|  1. LIVE                        | Direct real-time sensor / API observation fetched < 10 min ago  |
|  2. CACHED OBSERVATION          | Fresh observation from local SQLite cache (< 6 hours old)       |
|  3. STALE                       | Observation older than 6 hours; upstream network feed interrupted|
|  4. CALCULATED                  | Deterministic mathematical transformation of valid meteorology   |
|  5. FORECAST                    | Numerical weather model projection over 24h to 120h horizon      |
|  6. MODELLED (ERA5 ML V2)       | Supervised machine learning inference trained on ERA5 reanalysis|
|  7. EXPERIMENTAL_NOT_VALIDATED  | Research proxy model; explicitly returns null clinical outcomes  |
|  8. STATIC REFERENCE            | Pre-loaded municipal baselines (Census, hospital locations)     |
|  9. STATIC GIS REFERENCE        | Local bundled GeoJSON polygons (wards_bhubaneswar.geojson)      |
|  10. PENDING_ROLLOUT            | Satellite layer connected but awaiting color palette calibration|
|  11. CREDENTIALS_NOT_CONFIGURED | Real API client implemented, but agency secret key unconfigured |
|  12. DEMO ACTION / SIMULATED    | Simulated action flow (e.g., alert dry-run, QRT dispatch drill) |
+---------------------------------------------------------------------------------------------------+
```

### Examples of Enforced Truthfulness:
1. **Hospital Admissions:** `/api/v1/wards/{ward_no}/hospital-demand` returns `admissions_prediction: null` with status `EXPERIMENTAL_NOT_VALIDATED`. The legacy 2-stage DLNM model was removed from production alerting due to target leakage.
2. **Mortality Prediction:** `/api/v1/mortality-risk` returns `predicted_mortality: null`. It provides an `ENVIRONMENTAL EXPOSURE PROXY` while explicitly disclaiming clinical mortality prediction until civil death registries are linked.
3. **Government Credentials:** CPCB and IMD endpoints report `CREDENTIALS_NOT_CONFIGURED` when official agency API keys are unset, refusing to fabricate synthetic air quality or synoptic warnings.
4. **AI Copilot Transparency:** The Copilot titles its warmest-wards response as *"Highest Current Temperature Wards"* and appends the mandatory disclaimer: *"Ranked by current dry-bulb temperature; this is not the overall SentinelX thermal-risk ranking."*
5. **Emergency Alerts:** The dispatcher defaults to `dry_run: true`, recording a simulated alert in the SQLite audit log (`DEMO ACTION`) rather than claiming non-existent carrier delivery.

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.12 or 3.13
* Node.js 18+ and npm
* Docker (optional, for containerized run)

### 1. Clone the Repository
```bash
git clone https://github.com/aniruddhasutradher07-commits/SentinelX.git
cd SentinelX
```

### 2. Backend Setup (FastAPI)
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install production dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run FastAPI backend with Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be available at **`http://localhost:8000`** (Swagger docs at `/docs`).

### 3. Frontend Setup (React 18 + Vite)
```bash
# In a separate terminal
npm install
npm run dev
```
Interactive frontend will launch at **`http://localhost:5173`**.

### 4. Running with Docker (Production Multi-Stage Build)
```bash
# Build production multi-stage image
docker build -t heatguard-ai .

# Run container (serves both API and static frontend from port 8000)
docker run -p 8000:8000 -e PORT=8000 heatguard-ai
```
Visit **`http://localhost:8000`** in your browser.

---

## 🧪 Verification & Quality Assurance

HeatGuard AI maintains continuous automated verification across scientific calculations, API endpoints, and type contracts:

```bash
# 1. Run full Python automated test suite
python -m pytest tests/ -q --tb=line

# Verified Output:
# ======================== 97 passed, 10 skipped in 21.10s ========================

# 2. Run TypeScript compiler strict check
npx tsc --noEmit

# 3. Build optimized production bundle
npm run build
```

---

## 📊 Problem Statement Mapping Matrix (SIH PS 26083)

| SIH Requirement | HeatGuard Implementation | Verified Status |
| :--- | :--- | :--- |
| **Multi-Parameter Meteorological Sensing** | 2m temp, relative humidity, wind speed, downward solar radiation, dew point, surface pressure. | `LIVE (Open-Meteo, 600s sync)` |
| **Comprehensive Thermal Stress Indices** | Deterministic formulations for WBGT (ISO 7243), UTCI (Fiala model), NOAA Heat Index, and Apparent Temp. | `CALCULATED / LIVE` |
| **Hyperlocal Spatial Granularity** | 67 BMC wards mapped with polygon boundaries, demographic density, and vulnerability multipliers. | `STATIC GIS REFERENCE` |
| **3–5 Day Forward Forecast** | 120-hour forecast horizon predicting daily thermal peaks and tropical night recovery deficits. | `FORECAST` |
| **Supervised Machine Learning** | HistGradientBoosting regressor trained on 262k ERA5 hourly records (Holdout MAE: 1.08°C). | `MODELLED (ERA5 ML V2)` |
| **Role-Specific Public Health Guidance** | Actionable advisories tailored for citizens, outdoor construction laborers (ISO 7243), and schools. | `CALCULATED ADVISORY` |
| **Emergency Early Warning Notification** | Automated multi-channel SMS and WhatsApp alert dispatcher with immutable SQLite audit logging. | `DEMO ACTION / DISPATCH` |

---

## 👥 Contributors & Acknowledgements

* **Team:** HeatGuard AI Engineering & Research Team (Smart India Hackathon 2026)
* **Problem Statement:** PS 26083 — Extreme Heatwave Early Warning & Impact Advisory System
* **Data Providers:** Open-Meteo API, Copernicus Climate Change Service (ECMWF ERA5), Central Pollution Control Board (CPCB), India Meteorological Department (IMD), ISRO/NRSC Bhuvan, Survey of India, and Census of India.

---
*Predict Heat. Protect People. — HeatGuard AI © 2026*
