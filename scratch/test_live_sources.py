import pytest
from services.imd_client import imd_client
from services.cpcb_client import cpcb_client
from services.live_sync import start_unified_scheduler
import sqlite3
import datetime
import os

DB_PATH = "sentinelx_data.db"

def test_imd_unconfigured():
    # If not configured, should return UNAVAILABLE
    res = imd_client.get_district_context("Khordha")
    assert res["status"] == "UNAVAILABLE"

def test_cpcb_unconfigured():
    res = cpcb_client.map_ward_to_station(20.3, 85.8)
    assert res["status"] == "UNAVAILABLE"

def test_imd_cache_fallback():
    # Inject a cached value directly
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO imd_context_cache (district, warning_level, nowcast, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(district) DO UPDATE SET warning_level=excluded.warning_level
    """, ("Khordha", "WATCH", "Rain", "IMD", "2026-09-23T00:00:00", datetime.datetime.now(datetime.timezone.utc).isoformat()))
    conn.commit()
    conn.close()
    
    # Even if API is configured but fails, or unconfigured, we should hit cache?
    # Wait, the logic says if API_KEY is NOT configured, it returns UNAVAILABLE immediately to not fake data.
    # So we temporarily set ENABLED and API_KEY
    imd_client.enabled = True
    imd_client.api_key = "test_key"
    
    # Try fetch live -> fails -> hits cache
    res = imd_client.get_district_context("Khordha")
    assert res["status"] == "LIVE"
    assert res["warning_level"] == "WATCH"

def test_cpcb_spatial_quality():
    # Insert a fake station in cache
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO cpcb_station_cache (station_id, station_name, latitude, longitude, aqi, prominent_pollutant, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(station_id) DO UPDATE SET aqi=excluded.aqi
    """, ("ST_001", "Test Station", 20.3, 85.8, 120, "PM2.5", "CPCB", "2026-09-23T00:00:00", datetime.datetime.now(datetime.timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    cpcb_client.enabled = True
    cpcb_client.api_key = "test_key"
    
    res = cpcb_client.map_ward_to_station(20.3, 85.8) # exact match
    assert res["status"] == "LIVE"
    assert res["spatial_quality"] == "NEAR"
    assert res["distance_to_ward_km"] < 1.0
    
    res2 = cpcb_client.map_ward_to_station(20.5, 85.8) # approx 22 km away
    assert res2["spatial_quality"] == "VERY_FAR"
    assert res2["distance_to_ward_km"] > 20.0

if __name__ == "__main__":
    pytest.main(["-v", "scratch/test_live_sources.py"])
