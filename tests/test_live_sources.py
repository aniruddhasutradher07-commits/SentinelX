import pytest
from services.imd_client import imd_client
from services.cpcb_client import cpcb_client
from services.live_sync import start_unified_scheduler
import sqlite3
import datetime
import os

DB_PATH = "sentinelx_data.db"

def test_imd_unconfigured():
    res = imd_client.get_district_context("Khordha")
    assert res["status"] in ["UNAVAILABLE", "CREDENTIALS_NOT_CONFIGURED"]

def test_cpcb_unconfigured():
    res = cpcb_client.map_ward_to_station(20.3, 85.8)
    assert res["status"] in ["UNAVAILABLE", "CREDENTIALS_NOT_CONFIGURED"]

def test_imd_cache_fallback():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO imd_context_cache (district, warning_level, nowcast, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(district) DO UPDATE SET warning_level=excluded.warning_level
    """, ("Khordha", "WATCH", "Rain", "IMD", "2026-09-23T00:00:00", datetime.datetime.now(datetime.timezone.utc).isoformat()))
    conn.commit()
    conn.close()
    
    imd_client.enabled = True
    imd_client.api_key = "test_key"
    
    res = imd_client.get_district_context("Khordha")
    assert res["status"] in ["LIVE", "STALE"]

def test_cpcb_spatial_quality():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # The actual schema is cpcb_pollutant_cache
    c.execute("""
        CREATE TABLE IF NOT EXISTS cpcb_pollutant_cache (
            station_name TEXT, latitude REAL, longitude REAL, pollutant_id TEXT, 
            pollutant_avg REAL, pollutant_min REAL, pollutant_max REAL, pollutant_unit TEXT, 
            source TEXT, observed_at TEXT, fetched_at TEXT, PRIMARY KEY(station_name, pollutant_id))
    """)
    c.execute("""
        INSERT INTO cpcb_pollutant_cache (station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_unit, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(station_name, pollutant_id) DO UPDATE SET pollutant_avg=excluded.pollutant_avg
    """, ("Test Station", 20.3, 85.8, "PM2.5", 120, "ug/m3", "CPCB", "2026-09-23T00:00:00", datetime.datetime.now(datetime.timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    cpcb_client.enabled = True
    cpcb_client.api_key = "test_key"
    
    res = cpcb_client.map_ward_to_station(20.3, 85.8)
    assert res["status"] in ["LIVE", "STALE"]
    assert res["spatial_quality"] == "NEAR"
    assert res["distance_to_ward_km"] < 1.0
    
    res2 = cpcb_client.map_ward_to_station(20.5, 85.8) # approx 22 km away
    assert res2["spatial_quality"] == "VERY_FAR"
    assert res2["distance_to_ward_km"] > 20.0

if __name__ == "__main__":
    pytest.main(["-v", "scratch/test_live_sources.py"])
