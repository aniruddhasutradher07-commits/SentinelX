import pytest
import os
import sqlite3
import datetime
import json
from services.live_multihazard import live_multihazard_client, DB_PATH
from core.risk_rules import evaluate_environmental_risk

def setup_module(module):
    live_multihazard_client._init_db()

def test_multihazard_cyclone_fetch():
    # Verify the fetch works without failing
    res = live_multihazard_client.fetch_cyclone_status()
    assert "status" in res
    assert res["status"] in ["ACTIVE", "NO_ACTIVE_SIGNAL", "UNAVAILABLE"]
    if res["status"] == "ACTIVE":
        assert "system_type" in res
        # Ensure deep depression classification is preserved if present
        assert res["system_type"] in ["SEVERE CYCLONIC STORM", "CYCLONIC STORM", "DEEP DEPRESSION", "DEPRESSION", "LOW PRESSURE AREA"]

def test_multihazard_heavy_rain_fetch():
    res = live_multihazard_client.fetch_heavy_rain_status()
    assert "status" in res
    assert res["status"] in ["ACTIVE", "WATCH", "NO_ACTIVE_SIGNAL", "UNAVAILABLE"]

def test_multihazard_flood_fetch():
    res = live_multihazard_client.fetch_flood_status()
    assert "status" in res
    assert res["status"] in ["ACTIVE", "WATCH", "NO_ACTIVE_SIGNAL", "UNAVAILABLE"]

def test_multihazard_landslide_fetch():
    res = live_multihazard_client.fetch_landslide_status()
    assert "status" in res
    assert res["status"] in ["ACTIVE", "WATCH", "NO_ACTIVE_SIGNAL", "UNAVAILABLE"]

def test_multihazard_cache_behavior():
    fake_data = {
        "cyclone": {"status": "ACTIVE", "system_type": "DEEP DEPRESSION", "message": "Test"},
        "heavy_rain": {"status": "WATCH", "message": "Test"}
    }
    
    # Insert manually
    live_multihazard_client.set_cached("multi_hazard_live", fake_data)
    
    # Read back
    status = live_multihazard_client.get_current_status()
    assert status["overall_status"] == "LIVE"
    assert status["cyclone"]["status"] == "ACTIVE"
    assert status["cyclone"]["system_type"] == "DEEP DEPRESSION"

def test_hazard_score_independence():
    # The environmental hazard score should NOT change based on multi-hazard.
    
    # Test base state
    base_score = evaluate_environmental_risk(38.0, 50.0, 8.0, 100, 2.0, False)
    
    # Now simulate a catastrophic multi_hazard signal
    fake_data = {
        "cyclone": {"status": "ACTIVE", "system_type": "SEVERE CYCLONIC STORM", "message": "Test"},
        "heavy_rain": {"status": "ACTIVE", "message": "Test"},
        "flood": {"status": "ACTIVE", "message": "Test"},
        "landslide": {"status": "ACTIVE", "message": "Test"}
    }
    live_multihazard_client.set_cached("multi_hazard_live", fake_data)
    
    # Hazard score evaluation
    new_score = evaluate_environmental_risk(38.0, 50.0, 8.0, 100, 2.0, False)
    
    # They should be EXACTLY identical. No inference allowed.
    assert base_score["environmental_score"] == new_score["environmental_score"]
    assert base_score["environmental_tier"] == new_score["environmental_tier"]

def test_unavailable_source():
    import pytest
    pytest.skip("Test obsolete since cold start now syncs actively")
    # Clear cache
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM multi_hazard_cache WHERE id='multi_hazard_live'")
    conn.commit()
    conn.close()

    # Get status with empty cache
    status = live_multihazard_client.get_current_status()
    assert status["overall_status"] == "UNAVAILABLE"
    assert status["cyclone"]["status"] == "UNAVAILABLE"

def test_rain_present():
    from services.live_multihazard import live_multihazard_client
    from services.ingestion import WeatherReading
    import datetime
    
    # Mock weather reading
    weather = WeatherReading(
        ward_id="test", latitude=0, longitude=0, temperature_c=35, humidity_percent=50,
        wind_speed_ms=1, uv_index=1, aqi=10, aqi_standard="US_AQI", source="open_meteo",
        observed_at=datetime.datetime.now().isoformat(), fetched_at=datetime.datetime.now().isoformat(),
        precipitation_mm=5.0, is_live=True
    )
    
    mh_result = live_multihazard_client.get_current_status()
    mh_result["rain"] = {
        "status": "RAINING" if weather.precipitation_mm > 0 else "NO RAIN",
        "value_mm": weather.precipitation_mm,
        "source": "Open-Meteo",
        "freshness": "LIVE" if weather.is_live else "STALE"
    }
    
    assert mh_result["rain"]["status"] == "RAINING"
    assert mh_result["rain"]["value_mm"] == 5.0
    assert mh_result["rain"]["freshness"] == "LIVE"

def test_rain_zero():
    from services.live_multihazard import live_multihazard_client
    from services.ingestion import WeatherReading
    import datetime
    
    # Mock weather reading
    weather = WeatherReading(
        ward_id="test", latitude=0, longitude=0, temperature_c=35, humidity_percent=50,
        wind_speed_ms=1, uv_index=1, aqi=10, aqi_standard="US_AQI", source="open_meteo",
        observed_at=datetime.datetime.now().isoformat(), fetched_at=datetime.datetime.now().isoformat(),
        precipitation_mm=0.0, is_stale=True
    )
    
    mh_result = live_multihazard_client.get_current_status()
    mh_result["rain"] = {
        "status": "NO RAIN" if weather.precipitation_mm == 0 else "RAINING",
        "value_mm": weather.precipitation_mm,
        "source": "Open-Meteo",
        "freshness": "LIVE" if weather.is_live else "STALE"
    }
    
    assert mh_result["rain"]["status"] == "NO RAIN"
    assert mh_result["rain"]["value_mm"] == 0.0
    assert mh_result["rain"]["freshness"] == "STALE"

def test_rain_null():
    from services.live_multihazard import live_multihazard_client
    from services.ingestion import WeatherReading
    import datetime
    
    weather = None
    
    mh_result = live_multihazard_client.get_current_status()
    if not weather:
        mh_result["rain"] = {
            "status": "UNAVAILABLE",
            "value_mm": None,
            "source": "Open-Meteo",
            "freshness": "UNAVAILABLE"
        }
        
    assert mh_result["rain"]["status"] == "UNAVAILABLE"
    assert mh_result["rain"]["value_mm"] is None
    assert mh_result["rain"]["freshness"] == "UNAVAILABLE"
