import time
import threading
import traceback
import datetime
from services.imd_client import imd_client
from services.cpcb_client import cpcb_client
from services.ingestion import fetch_multi_location
import json
import os

# Configurable intervals
IMD_REFRESH_SECONDS = 900
CPCB_REFRESH_SECONDS = 900
OPEN_METEO_REFRESH_SECONDS = 600

_scheduler_running = False

def _run_imd_loop():
    while True:
        try:
            imd_client.fetch_live_district_context("Khordha")
        except Exception as e:
            print(f"[live_sync] IMD Sync failed: {e}")
        time.sleep(IMD_REFRESH_SECONDS)

def _run_cpcb_loop():
    while True:
        try:
            cpcb_client.fetch_live_stations()
        except Exception as e:
            print(f"[live_sync] CPCB Sync failed: {e}")
        time.sleep(CPCB_REFRESH_SECONDS)

def _run_open_meteo_loop():
    while True:
        try:
            geojson_path = "wards_bhubaneswar.geojson"
            features = []
            if os.path.exists(geojson_path):
                with open(geojson_path, "r", encoding="utf-8") as f:
                    features = json.load(f).get("features", [])
            locations = []
            for idx, feat in enumerate(features):
                p = feat.get("properties", {})
                w_no = p.get("wardno") or f"W{idx + 1}"
                lat = p.get("latitudei") or (20.29 + idx * 0.001)
                lon = p.get("longitudei") or (85.82 + idx * 0.001)
                locations.append({"lat": lat, "lon": lon, "name": w_no})
            fetch_multi_location(locations)
        except Exception as e:
            print(f"[live_sync] Open-Meteo Sync failed: {e}")
        time.sleep(OPEN_METEO_REFRESH_SECONDS)

def start_unified_scheduler():
    global _scheduler_running
    if _scheduler_running:
        return
    _scheduler_running = True
    
    print(f"[{datetime.datetime.now().isoformat()}] [live_sync] Starting unified provider synchronizer...")
    
    # Startup log
    print(f"[CONFIG] IMD_ENABLED={imd_client.enabled} IMD_API_KEY={'configured' if imd_client.api_key else 'not-configured'}")
    print(f"[CONFIG] CPCB_ENABLED={cpcb_client.enabled} CPCB_API_KEY={'configured' if cpcb_client.api_key else 'not-configured'}")
    
    # Startup Sync (non-blocking)
    threading.Thread(target=_run_imd_loop, daemon=True, name="Sync-IMD").start()
    threading.Thread(target=_run_cpcb_loop, daemon=True, name="Sync-CPCB").start()
    threading.Thread(target=_run_open_meteo_loop, daemon=True, name="Sync-OpenMeteo").start()

