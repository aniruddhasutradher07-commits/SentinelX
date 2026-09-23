import os
import sqlite3
import datetime
import pytest
from services.ingestion import fetch_weather_data, fetch_multi_location, get_config, WeatherReading, DB_PATH, get_session

def setup_module(module):
    # Ensure DB exists
    from services.ingestion import init_db
    init_db()
    # Clear test wards
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM weather_observations WHERE ward_id LIKE 'TEST_%'")
    conn.commit()
    conn.close()

def test_mock_data_enabled():
    os.environ["USE_MOCK_DATA"] = "true"
    r = fetch_weather_data(20.29, 85.82, "TEST_WARD_MOCK")
    assert r is not None
    assert r.source == "mock_iot"
    assert r.is_live is True
    assert r.is_stale is False

def test_mock_data_disabled_success():
    os.environ["USE_MOCK_DATA"] = "false"
    r = fetch_weather_data(20.29, 85.82, "TEST_WARD_API")
    assert r is not None
    assert r.source == "open_meteo"
    assert r.is_live is True
    assert r.is_stale is False
    assert r.temperature_c > -20
    assert r.uv_index is not None or r.uv_index is None

def test_stale_data_fallback():
    now = datetime.datetime.now(datetime.timezone.utc)
    old_time = now - datetime.timedelta(minutes=45)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO weather_observations 
        (ward_id, latitude, longitude, temperature_c, humidity_percent, wind_speed_kmh, uv_index, aqi, aqi_standard, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("TEST_WARD_STALE", -90.0, -180.0, 30.0, 50.0, 10.0, 5.0, 100.0, "US_AQI", "open_meteo", old_time.isoformat(), old_time.isoformat()))
    conn.commit()
    conn.close()
    
    import requests
    original_get = requests.Session.get
    def mock_get(*args, **kwargs):
        raise requests.exceptions.Timeout("Timeout")
    requests.Session.get = mock_get
    
    try:
        r = fetch_weather_data(-90.0, -180.0, "TEST_WARD_STALE")
        assert r is not None
        assert r.is_live is False
        assert r.is_stale is True
        assert r.data_age_minutes >= 45
    finally:
        requests.Session.get = original_get

def test_batch_coordinate_mapping():
    os.environ["USE_MOCK_DATA"] = "false"
    locs = [
        {"lat": 20.32, "lon": 85.83, "name": "TEST_BATCH_W1"},
        {"lat": 20.32, "lon": 85.83, "name": "TEST_BATCH_W2"}, # Dupe coordinate
        {"lat": 20.25, "lon": 85.80, "name": "TEST_BATCH_W3"}
    ]
    res = fetch_multi_location(locs)
    
    assert len(res) == 3
    assert res[0].ward_id == "TEST_BATCH_W1"
    assert res[1].ward_id == "TEST_BATCH_W2"
    assert res[2].ward_id == "TEST_BATCH_W3"
    
    assert res[0].latitude == 20.32
    assert res[1].latitude == 20.32
    assert res[2].latitude == 20.25

if __name__ == "__main__":
    pytest.main(["-v", "scratch/test_pipeline.py"])
