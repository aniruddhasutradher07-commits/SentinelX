from fastapi import APIRouter
from services import live_weather

router = APIRouter()


@router.get("/live/status")
def live_status():
    """
    Returns when the background live-weather refresh last ran and whether
    it succeeded — the existing /dashboard, /risk, and /wards/{id}/risk
    endpoints automatically reflect this data once it lands, no separate
    "live" endpoint needed for the data itself.
    """
    return live_weather.last_refresh_status


@router.post("/live/refresh")
def live_refresh_now():
    """Manually trigger a live-weather refresh right now (normally this
    runs automatically every LIVE_REFRESH_INTERVAL_SECONDS)."""
    live_weather.refresh_all_wards()
    return live_weather.last_refresh_status
