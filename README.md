# 🛡️ SentinelX — AI-Powered Extreme Heatwave Early Warning & Human Thermal Stress Index Platform

> **Smart India Hackathon 2026 · Problem Statement 26083**  
> **Ministry of Earth Sciences (MoES) / NCMRWF / Disaster Management**

---

## 🌡️ Overview

SentinelX is an AI-powered platform for **extreme heatwave early warning** and **human thermal stress assessment** across India. It combines real-time weather data ingestion, biometeorological index computation, machine learning-based risk classification, interactive GIS visualization, and multi-channel emergency alert dispatching.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| 🌡️ **HTSI Calculator** | Human Thermal Stress Index (0-100) combining Heat Index (60%), UV (25%), AQI (15%) |
| 🤖 **AI Risk Classifier** | Random Forest model predicting 24-hour heatwave risk: Low / Warning / Critical |
| 🗺️ **GIS Risk Maps** | Interactive Folium/Leaflet maps with risk overlays and emergency infrastructure |
| 🚨 **Alert Dispatcher** | Automated multi-channel alerts (SMS, WhatsApp, Email, 108 Ambulance) |
| 📊 **Live Dashboard** | Real-time glassmorphism UI with gauges, charts, and embedded map |
| 🌐 **Multi-Source Ingestion** | Open-Meteo + OpenWeatherMap + Mock IoT sensor feeds |

---

## 📁 Architecture

```
SentinelX/
├── core/                          # Core calculation engine
│   ├── __init__.py
│   └── thermal_stress.py          # NOAA Heat Index + HTSI (0-100)
│
├── ml_models/                     # ML model package
│   ├── __init__.py
│   └── heatwave_classifier.py     # Random Forest 3-class classifier
│
├── services/                      # Service layer
│   ├── ingestion.py               # Open-Meteo + OWM + Mock IoT
│   ├── gis_map.py                 # Folium interactive map generator
│   ├── alerts.py                  # Emergency alert dispatcher
│   ├── alert_dispatcher.py        # Legacy multi-channel dispatcher
│   ├── live_weather.py            # Background weather refresh
│   ├── risk_engine.py             # Vulnerability multiplier engine
│   ├── thermal_engine.py          # HI/WBGT/UTCI computation
│   ├── thermal_processor.py       # Thermal reading pipeline
│   ├── pan_india_engine.py        # National spatial engine
│   └── satellite_engine.py        # MODIS/Sentinel-2 integration
│
├── routers/                       # FastAPI route handlers
│   ├── sentinelx.py               # Advanced ML & telemetry routes
│   ├── weather.py, wards.py, risk.py, thermal.py, alerts.py
│   ├── dashboard.py, live.py, news.py, copilot.py
│
├── templates/
│   └── dashboard.html             # Interactive AI dashboard
│
├── static/
│   └── style.css                  # Dark-mode glassmorphism CSS
│
├── main.py                        # FastAPI application entry point
├── database.py                    # SQLAlchemy configuration
├── models.py                      # SQLAlchemy ORM models
├── schemas.py                     # Pydantic request/response schemas
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys (optional — system works without them)
```

### 3. Run the Server

```bash
python main.py
```

The server starts at **http://localhost:8000**. On first startup, the Random Forest model trains automatically (~3 seconds).

### 4. Access the Platform

| URL | Description |
|-----|-------------|
| `http://localhost:8000/dashboard` | 🎯 **AI Heatwave Dashboard** — main interactive UI |
| `http://localhost:8000/docs` | 📖 Swagger API documentation |
| `http://localhost:8000/api/v1/gis-map` | 🗺️ Interactive GIS risk map |
| `http://localhost:8000/map` | 🌏 Pan-India explorer |
| `http://localhost:8000/national` | 🇮🇳 National situation room |

---

## 📡 API Endpoints

### New AI Heatwave Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/predict` | AI heatwave risk prediction (HTSI + ML + auto-alerts) |
| `GET`  | `/api/v1/gis-map` | Interactive Folium risk map with infrastructure |
| `GET`  | `/api/v1/live-status` | Real-time dashboard data feed |
| `GET`  | `/api/v1/alert-history` | Recent emergency alert dispatch log |
| `GET`  | `/dashboard` | Interactive AI dashboard HTML |

### Example: Predict Heatwave Risk

```bash
# By coordinates (auto-fetches weather)
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"lat": 20.2961, "lon": 85.8245, "location_name": "Bhubaneswar"}'

# By raw weather data
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "temperature_c": 42.5,
    "humidity_pct": 65,
    "uv_index": 10,
    "aqi": 120,
    "wind_speed_ms": 1.5
  }'
```

### Legacy Endpoints (preserved)

All existing endpoints continue to work unchanged:
`/api/v1/districts`, `/api/v1/wards`, `/api/v1/h-therm/calculate`, `/api/v1/live-feed`, `/api/v1/summary`, `/api/v1/national-feed`, `/health`, etc.

---

## 🧠 Technical Details

### Human Thermal Stress Index (HTSI)

```
HTSI = 100 × [ 0.60 × N(HeatIndex) + 0.25 × N(UV) + 0.15 × N(AQI) ]
```

| Band | Score | Action |
|------|-------|--------|
| Normal | 0-30 | Standard precautions |
| Elevated | 30-50 | Reduce outdoor activity |
| Warning | 50-70 | Mandatory hydration breaks, alert dispatched |
| Critical | 70-100 | Emergency protocols, outdoor work suspended |

### ML Classifier

- **Algorithm**: Random Forest (200 trees, max depth 12, balanced classes)
- **Features**: temperature, humidity, UV, AQI, wind, heat index, HTSI, day of year, 24h trend
- **Classes**: 0 = Low/Normal, 1 = High Warning, 2 = Critical Emergency
- **Training**: Synthetic Indian weather data (3 years, seasonal patterns)

### Data Sources (Priority Order)

1. **Open-Meteo** — Free, no API key required (primary)
2. **OpenWeatherMap** — Requires `OPENWEATHERMAP_API_KEY` (optional)
3. **Mock IoT** — Realistic fallback for offline/demo use

---

## 📦 Dependencies

- **FastAPI** — High-performance async web framework
- **Scikit-Learn** — Random Forest classifier
- **Folium** — Interactive Leaflet map generation
- **Pandas / NumPy** — Data processing
- **Chart.js** — Frontend trend visualization (CDN)

---

## 🏗️ Deployment

### Docker

```bash
docker build -t sentinelx .
docker run -p 8000:8000 sentinelx
```

### Render / Railway

Deploy via `render.yaml` or connect the GitHub repo directly.

---

## 📜 License

Built for **Smart India Hackathon 2026** — Problem Statement 26083.  
Ministry of Earth Sciences (MoES) / National Centre for Medium Range Weather Forecasting (NCMRWF).
