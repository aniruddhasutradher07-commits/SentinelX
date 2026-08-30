"""
services/live_weather.py
===========================
Background thread that periodically fetches ONE lightweight "current
conditions" reading for Bhubaneswar from WeatherAPI.com, applies a
per-ward urban-heat-island offset, and runs it through the SAME
process_thermal_reading() pipeline the manual /thermal-stress endpoint
uses — so every ward's Weather/RiskPrediction/Alert rows stay fresh
automatically, and the existing GET /dashboard, GET /risk, and
GET /wards/{id}/risk endpoints reflect live conditions with NO changes
needed to those routers.

SETUP: sign up free at https://www.weatherapi.com/, set WEATHERAPI_KEY
below (or via the WEATHERAPI_KEY environment variable).
"""

import os
import time
import threading
import datetime

import requests

from database import SessionLocal
from models import Ward
from services.thermal_processor import process_thermal_reading
from services import thermal_engine

WEATHERAPI_KEY = os.environ.get("WEATHERAPI_KEY", "PASTE_YOUR_WEATHERAPI_KEY_HERE")
BHUBANESWAR_LAT = 20.2961
BHUBANESWAR_LON = 85.8245
LIVE_REFRESH_INTERVAL_SECONDS = 600  # 10 minutes

last_refresh_status = {"last_updated": None, "ok": False, "detail": None}


def _fetch_current_weather():
    resp = requests.get("http://api.weatherapi.com/v1/current.json", params={
        "key": WEATHERAPI_KEY, "q": f"{BHUBANESWAR_LAT},{BHUBANESWAR_LON}", "aqi": "no",
    }, timeout=15)
    if resp.status_code != 200:
        raise RuntimeError(f"WeatherAPI.com error {resp.status_code}: {resp.text[:200]}")
    return resp.json()["current"]


def _estimate_solar(cloud_pct):
    try:
        from zoneinfo import ZoneInfo
        hour_now = datetime.datetime.now(ZoneInfo("Asia/Kolkata")).hour
    except Exception:
        hour_now = datetime.datetime.now().hour
    cloud_frac = max(0.0, 1.0 - float(cloud_pct or 30) / 100.0)
    if 6 <= hour_now <= 18:
        return max(700.0 * cloud_frac * (1 - abs(hour_now - 12) / 6.5), 0.0)
    return 0.0


def refresh_all_wards():
    global last_refresh_status

    if WEATHERAPI_KEY == "PASTE_YOUR_WEATHERAPI_KEY_HERE":
        last_refresh_status = {
            "last_updated": None, "ok": False,
            "detail": "WEATHERAPI_KEY not set — sign up free at https://www.weatherapi.com/",
        }
        print("[live] " + last_refresh_status["detail"])
        return

    db = SessionLocal()
    try:
        cur = _fetch_current_weather()
        T = float(cur["temp_c"])
        RH = float(cur["humidity"])
        wind_ms = float(cur["wind_kph"]) / 3.6
        solar = _estimate_solar(cur.get("cloud"))

        wards = db.query(Ward).all()
        if not wards:
            last_refresh_status = {
                "last_updated": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
                "ok": False, "detail": "No wards in database — run scripts/seed_wards.py first.",
            }
            print("[live] " + last_refresh_status["detail"])
            return

        uhi_offsets = thermal_engine.load_ward_uhi_offsets(wards)

        for ward in wards:
            T_adj = T + uhi_offsets.get(ward.id, 0.0)
            process_thermal_reading(db, ward, T_adj, RH, wind_ms, solar)

        last_refresh_status = {
            "last_updated": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "ok": True,
            "detail": f"Refreshed {len(wards)} wards — T={T}C RH={RH}% (Bhubaneswar, WeatherAPI.com)",
        }
        print(f"[live] {last_refresh_status['detail']}")

    except Exception as e:
        last_refresh_status = {
            "last_updated": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "ok": False, "detail": f"refresh failed: {e}",
        }
        print(f"[live] refresh failed (will retry in {LIVE_REFRESH_INTERVAL_SECONDS}s): {e}")
    finally:
        db.close()


def _loop():
    while True:
        refresh_all_wards()
        time.sleep(LIVE_REFRESH_INTERVAL_SECONDS)


def start_background_refresh():
    threading.Thread(target=_loop, daemon=True).start()
