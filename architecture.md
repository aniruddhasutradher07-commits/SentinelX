# ARCHITECTURE.md — SentinelX

## High-level flow
```
DATA SOURCES (Open-Meteo, OpenWeatherMap, Mock IoT, MODIS/Sentinel-2, Census+OSM)
        │
   DATA FUSION (services/ingestion.py, satellite_engine.py)
        │
  ┌─────┼──────────┬───────────────┐
  ↓                ↓               ↓
Thermal Engine   ML Classifier   Vulnerability Engine
(core/thermal_    (ml_models/     (services/risk_engine.py —
stress.py: HI,    heatwave_       Census+OSM multiplier M_v)
WBGT, UTCI)       classifier.py)
  │                ↓               │
  │         2-Stage Surge Model    │
  │         (prediction_engine.py: │
  │         DLNM + XGBoost)        │
  └────────┬───────┴───────────────┘
           ↓
    RISK INDEX (per ward/district, HTSI 0-100)
           ↓
   ┌───────┼────────────┐
   ↓       ↓             ↓
GIS Map  SHAP Panel   AI Copilot (Gemini)
(Folium/  (test_shap   (routers/copilot.py —
Leaflet,  .py)         statutory directives)
sovereign
bounds)
   └───────┼────────────┘
           ↓
    Alert Dispatcher (services/alerts.py, alert_dispatcher.py)
    → SMS / WhatsApp / Email / 108
           ↓
    Collector Directive PDF export
```

## Repo layout (actual, as of latest scan)
```
SentinelX/
├── main.py                      # FastAPI entry — the real backend, 10 responsibilities bundled
├── core/
│   ├── thermal_stress.py        # HI + HTSI
│   └── multi_hazard.py
├── ml_models/heatwave_classifier.py   # Random Forest
├── prediction_engine.py         # 2-stage DLNM + XGBoost hospital surge
├── thermal_stress_engine.py
├── services/
│   ├── ingestion.py              # Open-Meteo + OWM + Mock IoT
│   ├── gis_map.py                 # Folium map generator
│   ├── risk_engine.py             # Vulnerability multiplier (M_v)
│   ├── satellite_engine.py        # MODIS/Sentinel-2
│   ├── pan_india_engine.py        # Spatial grid cache, national engine
│   ├── thermal_engine.py / thermal_processor.py
│   ├── alerts.py / alert_dispatcher.py
│   └── live_weather.py
├── routers/
│   ├── sentinelx.py, mock_api.py  # Advanced ML/telemetry routes
│   ├── copilot.py                 # Gemini AI Incident Commander
│   ├── weather.py, wards.py, risk.py, thermal.py, alerts.py, dashboard.py, live.py, news.py
├── data/                          # joblib models, census CSVs, satellite CSVs
├── src/                           # React/TS frontend (Vite) — WardView, OdishaMap, HospitalSurgeView,
│                                     CitizenAdvisoryView, HThermCalculator, AICopilotModal, etc.
├── tests/                          # test_pan_india_suite, test_satellite_engine, test_vulnerability_engine
└── k8s/, Dockerfile, render.yaml, vercel.json   # deployment
```

## Tech stack
- **Backend:** FastAPI, SQLAlchemy, Pydantic, scikit-learn, XGBoost, SHAP, pythermalcomfort, Folium, Supabase (Postgres, Tokyo region)
- **Frontend:** React + TypeScript + Vite, Recharts, Tailwind (glassmorphism dark theme)
- **ML:** Random Forest (heatwave classifier), 2-stage DLNM + XGBoost (hospital surge), SHAP TreeExplainer
- **Deployment:** Docker (multi-stage), Render (backend), Vercel (frontend), Kubernetes manifests present but not required for SIH demo

## Known architectural debt (fix before final polish)
1. **CORS is `allow_origins=["*"]`** in `main.py` — fine for demo, flag as known limitation, tighten before any real deployment.
2. **No auth layer** on any endpoint — acceptable for hackathon demo, must be called out explicitly rather than silently ignored.
