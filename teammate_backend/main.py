from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import SessionLocal
from routers import weather, wards, risk, thermal, alerts, dashboard, live
from services.live_weather import start_background_refresh

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
app.include_router(wards.router)
app.include_router(risk.router)
app.include_router(thermal.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(live.router)


@app.on_event("startup")
def _launch_live_weather_refresh():
    # Starts the background thread that keeps every ward's weather/risk/
    # alerts fresh automatically (see services/live_weather.py). Safe to
    # leave running even if WEATHERAPI_KEY isn't set yet -- it just logs a
    # reminder and skips refreshing until you set it.
    start_background_refresh()


@app.get("/health")
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
        "service": "Heatwave Early Warning Backend",
        "database": database_status
    }
