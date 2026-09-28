# HeatGuard AI — Technical Documentation Index

Welcome to the comprehensive engineering documentation repository for **HeatGuard AI** (SentinelX) — an Impact-Based Heat Health Early Warning and Environmental Risk Intelligence Platform developed for **Smart India Hackathon 2026** (Problem Statement: **PS 26083**).

---

## 📑 Canonical Project Reports

| Document | Format | Description |
| :--- | :--- | :--- |
| **[End-to-End Project Report](HEATGUARD_AI_END_TO_END_PROJECT_REPORT.md)** | Markdown (`.md`) | **Primary Submission Document:** 120KB+ rigorous architectural, scientific, and empirical evaluation of the actual implementation. |
| **[Printable Project Report](HEATGUARD_AI_END_TO_END_PROJECT_REPORT.html)** | HTML / Print Ready | Interactive, styled HTML report with inline figures, tables, and audit matrices. |
| **[Judge Submission Report](HEATGUARD_AI_SIH_END_TO_END_PROJECT_REPORT.md)** | Markdown (`.md`) | Canonical SIH judge-ready report reference. |

---

## 🏛️ Documentation Sections

### 1. [System Architecture](architecture/README.md)
Detailed breakdown of the 8-tier system architecture:
- User Presentation Layer (React 18 + TypeScript + Leaflet)
- API Gateway & Ingestion Layer (FastAPI 0.115 + Uvicorn)
- Deterministic Bio-Meteorological Engines (Steadman, ISO 7243 WBGT, UTCI)
- Ward Risk Scoring & Vulnerability Multipliers
- Machine Learning V2 Pipeline (HistGradientBoostingRegressor)
- GIS & Spatial Mapping Engine (67-Ward GeoJSON polygons)
- Realtime CDC Telemetry & Alert Dry-Run Audit Layer
- External Source Integrations (Open-Meteo, Copernicus CDS, CPCB, IMD, ISRO Bhuvan)

### 2. [Thermal Science & Methodology](methodology/README.md)
Mathematical specifications, standard operating procedures, and scientific formulations:
- Steadman Heat Index formulation
- ISO 7243 Wet Bulb Globe Temperature (WBGT) estimation
- Universal Thermal Climate Index (UTCI) polynomial regression
- Ward Risk Composite Formula: $\text{Score} = 0.50 \times \text{Hazard} + 0.35 \times \text{Vulnerability} + 0.15 \times \text{Exposure}$
- Census demographic & OpenStreetMap infrastructure vulnerability scoring

### 3. [Validation & Engineering Evidence](validation/README.md)
Empirical verification data and test reproducibility:
- ML V2 Chronological Holdout (2025 unseen test: MAE 1.0829°C, RMSE 1.3862°C, $R^2$ 0.9055)
- Automated Pytest Suite: 97 passed, 10 skipped, 0 failed across 25 test suites
- Frontend TypeScript Strict Typecheck & Vite Production Bundle Verification
- Data Truth Badging audit matrices

### 4. [API Quick Reference](api/README.md)
Complete endpoint catalog of all 21 verified REST endpoints across:
- Telemetry & Environmental Observation (`/api/v1/live-feed`, `/api/v1/summary`)
- Spatial & GIS Feeds (`/api/v1/odisha-geojson`, `/api/v1/wards-geojson`)
- Analytical & ML V2 Forecasts (`/api/v1/forecast-risk`, `/api/v1/ml-v2/forecast`)
- External Feeds Status (`/api/v1/cpcb/status`, `/api/v1/imd/status`, `/api/v1/bhuvan/status`)
- Alert Audit Logs (`/api/v1/alerts/audit-log`, `/api/v1/broadcast/dispatch`)

### 5. [Deployment & Operations](deployment/README.md)
Containerization, live cloud hosting, and local development:
- Production Deployment on Railway (`https://sentinelx-thermal-api-production-aa42.up.railway.app`)
- Multi-stage Docker configuration (`Dockerfile`)
- Kubernetes manifests (`k8s/`)
- Environment configuration & security best practices

### 6. [Research & Experimental Boundaries](research/README.md)
Clear distinction between operational core and research modules:
- ML V2 Environmental Model scope (predicts thermal variables, NOT clinical outcomes)
- Hospital surge capacity & mortality impact architecture (clinical outcomes remain unavailable / NULL)
- PhysioNet physiological reference dataset boundaries
- Dry-run simulated emergency dispatch protocols
