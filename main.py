"""
SentinelX / THERMO-SHIELD AI — Unified FastAPI Master Backend
==============================================================
Smart India Hackathon 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Integrates:
  1. Teammate's Core FastAPIs: /weather, /wards, /risk, /thermal, /alerts, /dashboard, /live
  2. SentinelX Advanced ML: 2-Stage DLNM + XGBoost Hospital Surge Forecasts
  3. H-THERM Biotech / Physiotherapy Human Strain Engine
  4. Real-time NewsAPI Weather & Heatwave Wire with Threat Scoring
  5. 30 Odisha Districts Statewide Command Center & Leaflet Visualization
  6. AI-Powered Heatwave Classifier (Random Forest 3-class predictor)
  7. Human Thermal Stress Index (HTSI) — composite 0-100 score
  8. Interactive GIS Risk Map (Folium/Leaflet with emergency infrastructure)
  9. Multi-channel Emergency Alert Dispatcher
  10. Interactive Swagger Documentation at /docs & ReDoc at /redoc
"""

import os
import datetime
from typing import Optional
from fastapi import FastAPI, Request, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

# New module imports
from core.thermal_stress import compute_htsi, heat_index_celsius
from core.multi_hazard import evaluate_multi_hazards
from services.ingestion import fetch_weather_data, WeatherReading
from services.gis_map import generate_risk_map
from services import alerts as alert_service

# Load .env file into os.environ
if os.path.exists(".env"):
    try:
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ[k.strip()] = v.strip()
    except Exception:
        pass

from database import SessionLocal, engine, Base
from routers import weather, wards, risk, thermal, alerts, dashboard, live, news, sentinelx, copilot
from services.live_weather import start_background_refresh

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="🛡️ SentinelX / THERMO-SHIELD AI — Master Intelligence API",
    description="""
### Smart India Hackathon 2026 · Problem Statement 26083
**MoES / NCMRWF / Disaster Management**

Unified API system for extreme heatwave early warning, human thermal stress assessment (WBGT/UTCI/HI), 
AI-powered heatwave risk classification (Random Forest), Human Thermal Stress Index (HTSI),
interactive GIS risk visualization, multi-channel emergency alerts,
2-stage machine learning hospital surge predictions, and real-time news wire intelligence.
    """,
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ---------------------------------------------------------------------------
# Router Inclusions
# ---------------------------------------------------------------------------
# Teammate's core routers
app.include_router(weather.router, tags=["Weather Ingestion"])
app.include_router(wards.router, tags=["Ward Management"])
app.include_router(risk.router, tags=["Risk Calculation"])
app.include_router(thermal.router, tags=["Thermal Stress (UTCI/WBGT)"])
app.include_router(alerts.router, tags=["Alert Management & Emergency Dispatch"])
app.include_router(dashboard.router, tags=["Dashboard Aggregation (JSON)"])
app.include_router(live.router, tags=["Live Ward Conditions"])

# SentinelX ML, Intel & Copilot routers
from routers import mock_api
app.include_router(mock_api.router)
app.include_router(sentinelx.router)
app.include_router(news.router)
app.include_router(copilot.router)


# ---------------------------------------------------------------------------
# Interactive Command Center Dashboards (100% Pan-India Sovereign Platform)
# ---------------------------------------------------------------------------
@app.get("/map", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
@app.get("/explore", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
def serve_pan_india_map():
    """Serves Flagship Pan-India Real-Data Google Maps-Style Explorer (Strictly India)."""
    if os.path.exists("SentinelX_PanIndia_Map.html"):
        return FileResponse("SentinelX_PanIndia_Map.html", media_type="text/html")
    return HTMLResponse("<h3>SentinelX_PanIndia_Map.html not found.</h3>", status_code=404)


@app.get("/national", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
@app.get("/situation-room", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
@app.get("/dashboard/national", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
def serve_national_dashboard():
    """Serves Pan-India National Early Warning & Thermal Stress Situation Room (36 States & UTs)."""
    if os.path.exists("SentinelX_National_Dashboard.html"):
        return FileResponse("SentinelX_National_Dashboard.html", media_type="text/html")
    return HTMLResponse("<h3>SentinelX_National_Dashboard.html not found. Run 'python build_national_dashboard.py'.</h3>", status_code=404)


@app.get("/api/v1/national-feed", tags=["National Situation Feed"])
def get_national_feed():
    """Returns real-time synoptic thermal stress metrics for all 36 States & UTs."""
    try:
        from build_national_dashboard import STATES_METADATA
        return {
            "status": "success",
            "jurisdiction": "Pan-India National Disaster Management Authority (NDMA) & MoES",
            "total_states_covered": len(STATES_METADATA),
            "red_alert_count": sum(1 for s in STATES_METADATA if s.get("tier") == "Red"),
            "orange_alert_count": sum(1 for s in STATES_METADATA if s.get("tier") == "Orange"),
            "states": STATES_METADATA
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.get("/api/v1/geocode", tags=["Pan-India Spatial Engine"])
def geocode_india(q: str):
    """
    Instant autocomplete geocoding for ANY state, district, city, ward, or PIN code in India.
    Strictly filtered to the Sovereign Territory of India.
    """
    from services.pan_india_engine import search_india_locations
    return {"query": q, "results": search_india_locations(q)}


@app.get("/api/v1/reverse-geocode", tags=["Pan-India Spatial Engine"])
def reverse_geocode(lat: float, lon: float):
    """
    Reverse geocodes GPS coordinates (lat, lon) to exact Indian locality, district, and PIN code.
    """
    from services.pan_india_engine import reverse_geocode_india
    return reverse_geocode_india(lat, lon)


@app.get("/api/v1/detect-location", tags=["Pan-India Spatial Engine"])
def auto_detect_location(request: Request):
    """
    Auto-detects client real-time location via IP / Network telemetry.
    Zero-permission real-time location detection for instant map positioning.
    """
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    from services.pan_india_engine import detect_ip_location
    return detect_ip_location(client_ip)


@app.get("/api/v1/india-mask", tags=["Pan-India Spatial Engine"])
def get_india_mask():
    """Returns inverted world mask GeoJSON to obscure all territory outside India."""
    if os.path.exists("india_mask.geojson"):
        return FileResponse("india_mask.geojson", media_type="application/json")
    return {"status": "error", "detail": "india_mask.geojson not found"}


@app.get("/api/v1/india-boundary", tags=["Pan-India Spatial Engine"])
def get_india_boundary():
    """Returns sovereign India boundary GeoJSON (Survey of India standard)."""
    if os.path.exists("india_simplified.geojson"):
        return FileResponse("india_simplified.geojson", media_type="application/json")
    return {"status": "error", "detail": "india_simplified.geojson not found"}


@app.get("/api/v1/live-stress", tags=["Pan-India Spatial Engine"])

def get_live_stress(lat: float, lon: float, name: str = ""):
    """
    Fetches real-time weather & computes WBGT, UTCI, Heat Index, and 2-Stage hospital surge
    for ANY coordinate in India. Cached by spatial grid to prevent rate limits.
    """
    from services.pan_india_engine import fetch_live_coordinate_stress
    return fetch_live_coordinate_stress(lat, lon, name)




# ---------------------------------------------------------------------------
# NEW: AI-Powered Heatwave Early Warning Endpoints
# ---------------------------------------------------------------------------

# Default coordinates: Bhubaneswar, Odisha
DEFAULT_LAT = 20.2961
DEFAULT_LON = 85.8245


@app.post("/api/v1/predict", tags=["AI Heatwave Prediction"],
          summary="Predict 24-hour heatwave risk from location or weather data")
def predict_heatwave(
    payload: dict = Body(
        ...,
        examples=[{
            "lat": 20.2961,
            "lon": 85.8245,
            "location_name": "Bhubaneswar"
        }]
    )
):
    """
    AI-powered heatwave risk prediction endpoint.

    Accepts either (lat, lon) for automatic weather fetch, or raw weather
    readings (temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms).

    Returns: HTSI score, ML risk prediction (Low/Warning/Critical),
    confidence, 48-hour trend, and auto-dispatched alerts.
    """
    from ml_models.heatwave_classifier import predict_heatwave_risk

    lat = float(payload.get("lat", DEFAULT_LAT))
    lon = float(payload.get("lon", DEFAULT_LON))
    name = payload.get("location_name", "")

    # Use provided weather data or fetch automatically
    if "temperature_c" in payload:
        temp = float(payload["temperature_c"])
        rh = float(payload.get("humidity_pct", 60))
        uv = float(payload.get("uv_index", 6))
        aqi = float(payload.get("aqi", 50))
        wind = float(payload.get("wind_speed_ms", 2))
        source = "user_provided"
    else:
        weather = fetch_weather_data(lat, lon, name)
        temp = weather.temperature_c
        rh = weather.humidity_pct
        uv = weather.uv_index
        aqi = weather.aqi
        wind = weather.wind_speed_ms
        source = weather.source

    # Compute HTSI
    htsi_result = compute_htsi(temp, rh, uv, aqi, wind)

    # ML Prediction
    trend_24h = float(payload.get("temp_trend_24h", 0.0))
    ml_pred = predict_heatwave_risk(temp, rh, uv, aqi, wind, trend_24h)

    # Auto-dispatch alert if warranted
    alert_result = None
    if alert_service.should_alert(ml_pred.risk_level, htsi_result.htsi_score):
        alert_result = alert_service.dispatch_alert(
            zone=name or f"({lat:.2f}, {lon:.2f})",
            risk_level=ml_pred.risk_level,
            htsi_score=htsi_result.htsi_score,
            weather_data={
                "temperature_c": temp, "humidity_pct": rh,
                "uv_index": uv, "aqi": aqi, "wind_speed_ms": wind,
            },
        )

    return {
        "location": {"lat": lat, "lon": lon, "name": name},
        "data_source": source,
        "weather": {
            "temperature_c": temp,
            "humidity_pct": rh,
            "uv_index": uv,
            "aqi": aqi,
            "wind_speed_ms": wind,
        },
        "thermal_stress": {
            "heat_index_c": htsi_result.heat_index_c,
            "htsi_score": htsi_result.htsi_score,
            "risk_tier": htsi_result.risk_tier,
            "feels_like_c": htsi_result.feels_like_c,
            "components": {
                "hi_normalised": htsi_result.hi_normalised,
                "uv_normalised": htsi_result.uv_normalised,
                "aqi_normalised": htsi_result.aqi_normalised,
            },
        },
        "ml_prediction": {
            "risk_level": ml_pred.risk_level,
            "risk_label": ml_pred.risk_label,
            "confidence": ml_pred.confidence,
            "probabilities": ml_pred.probabilities,
            "temperature_trend_48h": ml_pred.temperature_trend_48h,
        },
        "alert": alert_result,
    }


@app.get("/api/v1/gis-map", response_class=HTMLResponse,
         tags=["GIS Risk Visualization"],
         summary="Interactive heat risk map with emergency infrastructure")
@app.get("/gis-map", response_class=HTMLResponse, include_in_schema=False)
def get_gis_map(
    lat: float = Query(DEFAULT_LAT, description="Center latitude"),
    lon: float = Query(DEFAULT_LON, description="Center longitude"),
    zoom: int = Query(11, description="Zoom level"),
):
    """
    Returns a full interactive Folium/Leaflet HTML map with:
    - Multi-zone heat risk overlay circles (Green/Yellow/Orange/Red)
    - Nearby hospitals, cooling centers, and emergency responders
    - Thermal intensity heatmap layer
    """
    # Build zone data from the existing SentinelX wards/districts
    from services.ingestion import _generate_mock_iot
    from core.thermal_stress import compute_htsi as _htsi

    # Generate sample zones around the center point
    zones = []
    import random
    random.seed(42)
    for i in range(20):
        z_lat = lat + random.uniform(-0.06, 0.06)
        z_lon = lon + random.uniform(-0.06, 0.06)
        mock = _generate_mock_iot(z_lat, z_lon, f"Zone-{i+1}")
        htsi = _htsi(mock.temperature_c, mock.humidity_pct, mock.uv_index, mock.aqi, mock.wind_speed_ms)
        zones.append({
            "name": f"Zone {i+1}",
            "lat": z_lat,
            "lon": z_lon,
            "risk_tier": htsi.risk_tier,
            "temperature_c": mock.temperature_c,
            "humidity_pct": mock.humidity_pct,
            "htsi_score": htsi.htsi_score,
            "uv_index": mock.uv_index,
            "aqi": mock.aqi,
            "radius_m": random.randint(400, 1000),
        })

    html = generate_risk_map(
        zones=zones, center_lat=lat, center_lon=lon, zoom=zoom
    )
    return HTMLResponse(content=html)


@app.get("/api/v1/live-status", tags=["Live Dashboard Feed"],
         summary="Real-time system status for dashboard consumption")
def get_live_status(
    lat: float = Query(DEFAULT_LAT, description="Location latitude"),
    lon: float = Query(DEFAULT_LON, description="Location longitude"),
):
    """
    Unified live status endpoint consumed by the interactive dashboard.
    Returns: weather metrics, HTSI gauge, ML prediction, and active alerts.
    """
    from ml_models.heatwave_classifier import predict_heatwave_risk

    weather = fetch_weather_data(lat, lon, "Bhubaneswar")
    htsi_result = compute_htsi(
        weather.temperature_c, weather.humidity_pct,
        weather.uv_index, weather.aqi, weather.wind_speed_ms
    )
    ml_pred = predict_heatwave_risk(
        weather.temperature_c, weather.humidity_pct,
        weather.uv_index, weather.aqi, weather.wind_speed_ms
    )
    
    mh_result = evaluate_multi_hazards(
        weather.precipitation_mm,
        weather.wind_gusts_ms,
        weather.forecast_7d_precip
    )

    return {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "data_source": weather.source,
        "weather": weather.to_dict(),
        "thermal_stress": {
            "heat_index_c": htsi_result.heat_index_c,
            "htsi_score": htsi_result.htsi_score,
            "risk_tier": htsi_result.risk_tier,
            "feels_like_c": htsi_result.feels_like_c,
        },
        "ml_prediction": {
            "risk_level": ml_pred.risk_level,
            "risk_label": ml_pred.risk_label,
            "confidence": ml_pred.confidence,
            "probabilities": ml_pred.probabilities,
            "temperature_trend_48h": ml_pred.temperature_trend_48h,
        },
        "multi_hazard": mh_result.to_dict(),
        "active_alerts": alert_service.get_alert_history(limit=5),
        "alert_stats": alert_service.get_alert_stats(),
    }


# ---------------------------------------------------------------------------
# React Frontend Serving
# ---------------------------------------------------------------------------
react_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
if os.path.exists(react_dist):
    # Mount Vite static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(react_dist, "assets")), name="react-assets")

    @app.get("/{catchall:path}", response_class=FileResponse, tags=["React Command Center"])
    def serve_react_app(catchall: str):
        """Serves the React Vite SPA. Any unmatched route falls back to index.html"""
        file_path = os.path.join(react_dist, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(react_dist, "index.html"))
else:
    @app.get("/", response_class=HTMLResponse, tags=["Fallback Dashboard"])
    def serve_ai_dashboard(request: Request):
        return HTMLResponse("<h1>React Build Not Found. Please run `npm run build`</h1>")


@app.get("/api/v1/alert-history", tags=["Emergency Alerts"],
         summary="Recent emergency alert dispatch history")
def get_alert_history(limit: int = Query(20, description="Max records")):
    return {
        "alerts": alert_service.get_alert_history(limit),
        "stats": alert_service.get_alert_stats(),
    }


# ---------------------------------------------------------------------------
# Startup Events
# ---------------------------------------------------------------------------

@app.on_event("startup")
def _launch_background_tasks():
    # Starts the background live weather thread
    start_background_refresh()

    # Pre-train the ML model so first request is fast
    try:
        from ml_models.heatwave_classifier import get_model
        model = get_model()
        model.train()
    except Exception as e:
        print(f"[startup] ML model pre-training skipped: {e}")


@app.get("/health", tags=["System Health"])
def health_check():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "disconnected"
    finally:
        db.close()
    return {
        "status": "healthy",
        "service": "SentinelX / THERMO-SHIELD AI — Heatwave Early Warning Platform v3.0",
        "jurisdiction": "Sovereign Territory of India (MoES / NCMRWF / NDMA)",
        "database": database_status,
        "endpoints": {
            "swagger_docs": "/docs",
            "redoc": "/redoc",
            "ai_dashboard": "/dashboard",
            "gis_explorer": "/map",
            "gis_risk_map": "/api/v1/gis-map",
            "predict": "/api/v1/predict",
            "live_status": "/api/v1/live-status",
            "national_situation_room": "/national",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
