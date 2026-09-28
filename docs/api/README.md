# HeatGuard AI — API Quick Reference

Production Base URL: **`https://sentinelx-thermal-api-production-aa42.up.railway.app`**  
Local Base URL: **`http://localhost:8000`**

Interactive OpenAPI Documentation: **`/docs`** (Swagger UI) & **`/redoc`**

---

## 📡 Verified Core REST Endpoints

### 1. System Health & Summary

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root API status, system uptime, and version identifier | `LIVE` |
| `GET` | `/health` | Healthcheck probe used by Docker and cloud load balancers | `LIVE` |
| `GET` | `/api/v1/summary` | Statewide summary of thermal indices, active tiers, and sensor status | `CALCULATED` |
| `GET` | `/api/v1/live-feed` | High-frequency telemetry stream of ambient temp, humidity, and wind | `LIVE` |

### 2. Spatial & Municipal Ward Intelligence

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/odisha-geojson` | GeoJSON administrative boundaries for Odisha's 30 districts | `STATIC REFERENCE` |
| `GET` | `/api/v1/wards-geojson` | High-resolution GeoJSON polygon boundaries for Bhubaneswar's 67 wards | `STATIC REFERENCE` |
| `GET` | `/api/v1/districts` | Risk metrics, population, and vulnerability data across 30 districts | `CALCULATED` |
| `GET` | `/api/v1/wards` | Complete 67-ward risk ranking, hazard, vulnerability, and exposure scores | `CALCULATED` |

### 3. Forecasting & Machine Learning

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/forecast-risk` | 5-day daily environmental thermal forecast by district (`?district=Khordha&horizon=5`) | `FORECAST` |
| `GET` | `/api/v1/ml-v2/forecast` | ML V2 24-hour ahead apparent temperature prediction based on 36 features | `EXPERIMENTAL` |
| `GET` | `/api/v1/benchmarks` | Comparison against NDMA Heat Action Plan historical benchmarks | `STATIC REFERENCE` |

### 4. External Data Source Status & Multi-Hazard

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cpcb/status` | Connectivity and authentication audit for CPCB air quality feeds | `CREDENTIALS_NOT_CONFIGURED` |
| `GET` | `/api/v1/cpcb/ward/{ward_no}` | Ward-mapped PM2.5, PM10, AQI co-exposure metrics | `FALLBACK / UNAVAILABLE` |
| `GET` | `/api/v1/imd/status` | Operational status of IMD synoptic weather feeds (`?district=Khordha`) | `CREDENTIALS_NOT_CONFIGURED` |
| `GET` | `/api/v1/bhuvan/status` | Status of ISRO-NRSC Bhuvan land cover / surface temperature feed | `PENDING LEGEND ROLLOUT` |

### 5. Research & Clinical Demand Boundaries

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/wards/{ward_no}/hospital-demand` | Demonstrates clinical capacity architecture. Returns explicit `null` for admissions/mortality pending validated epidemiological data | `UNAVAILABLE / NULL` |
| `GET` | `/api/v1/physiology-reference` | Research schema for offline biometric stress modeling (PhysioNet reference) | `EXPERIMENTAL` |

### 6. Emergency Broadcast & Audit Workflow

| Method | Endpoint | Description | Data Truth State |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/broadcast/dispatch` | Executes dry-run emergency advisory broadcast for simulated field response | `SIMULATED RESPONSE FLOW` |
| `GET` | `/api/v1/alerts/audit-log` | Verifiable audit log of all issued emergency advisories with DPDP masked contacts | `SIMULATED` |
