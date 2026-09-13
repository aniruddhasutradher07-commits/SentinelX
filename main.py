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
  6. Interactive Swagger Documentation at /docs & ReDoc at /redoc
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy import text

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
2-stage machine learning hospital surge predictions, and real-time news wire intelligence.
    """,
    version="2.0.0",
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
app.include_router(sentinelx.router)
app.include_router(news.router)
app.include_router(copilot.router)


# ---------------------------------------------------------------------------
# Interactive Command Center Dashboards (100% Pan-India Sovereign Platform)
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse, tags=["Interactive Command Dashboards"])
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
        from build_national_dashboard import STATES_DATA
        return {
            "status": "success",
            "jurisdiction": "Pan-India National Disaster Management Authority (NDMA) & MoES",
            "total_states_covered": len(STATES_DATA),
            "red_alert_count": sum(1 for s in STATES_DATA if s.get("tier") == "Red"),
            "orange_alert_count": sum(1 for s in STATES_DATA if s.get("tier") == "Orange"),
            "states": STATES_DATA
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


@app.get("/api/v1/live-stress", tags=["Pan-India Spatial Engine"])
def get_live_stress(lat: float, lon: float, name: str = ""):
    """
    Fetches real-time weather & computes WBGT, UTCI, Heat Index, and 2-Stage hospital surge
    for ANY coordinate in India. Cached by spatial grid to prevent rate limits.
    """
    from services.pan_india_engine import fetch_live_coordinate_stress
    return fetch_live_coordinate_stress(lat, lon, name)


@app.on_event("startup")
def _launch_background_tasks():
    # Starts the background live weather thread
    start_background_refresh()


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
        "service": "SentinelX / THERMO-SHIELD Unified Pan-India Engine",
        "jurisdiction": "Sovereign Territory of India (MoES / NCMRWF / NDMA)",
        "database": database_status,
        "swagger_docs": "/docs",
        "redoc": "/redoc",
        "gis_explorer": "/map",
        "national_situation_room": "/national"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
