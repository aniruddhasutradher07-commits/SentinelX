import pytest
from unittest.mock import patch
from services.ingestion import WeatherReading
from routers.sentinelx import get_live_feed

def test_rain_status_weather_code_raining():
    weather = WeatherReading(
        ward_id="Bhubaneswar", latitude=20.3, longitude=85.8,
        temperature_c=25.0, humidity_percent=80.0, wind_speed_ms=2.0,
        uv_index=1.0, aqi=50.0, aqi_standard="US_AQI",
        source="Open-Meteo", observed_at="2026-09-24T18:00:00Z", fetched_at="2026-09-24T18:00:00Z",
        precipitation_mm=0.0, weather_code=53
    )
    
    with patch("services.ingestion.fetch_weather_data", return_value=weather):
        res = get_live_feed()
        assert res["multi_hazard"]["rain"]["status"] == "RAINING"
        assert res["multi_hazard"]["rain"]["value_mm"] == 0.0

def test_rain_status_weather_code_clear():
    weather = WeatherReading(
        ward_id="Bhubaneswar", latitude=20.3, longitude=85.8,
        temperature_c=25.0, humidity_percent=80.0, wind_speed_ms=2.0,
        uv_index=1.0, aqi=50.0, aqi_standard="US_AQI",
        source="Open-Meteo", observed_at="2026-09-24T18:00:00Z", fetched_at="2026-09-24T18:00:00Z",
        precipitation_mm=0.0, weather_code=0
    )
    
    with patch("services.ingestion.fetch_weather_data", return_value=weather):
        res = get_live_feed()
        assert res["multi_hazard"]["rain"]["status"] == "NO RAIN"
        assert res["multi_hazard"]["rain"]["value_mm"] == 0.0

def test_rain_status_fallback_unavailable():
    weather = WeatherReading(
        ward_id="Bhubaneswar", latitude=20.3, longitude=85.8,
        temperature_c=25.0, humidity_percent=80.0, wind_speed_ms=2.0,
        uv_index=1.0, aqi=50.0, aqi_standard="US_AQI",
        source="Open-Meteo", observed_at="2026-09-24T18:00:00Z", fetched_at="2026-09-24T18:00:00Z",
        precipitation_mm=0.0, weather_code=None
    )
    
    with patch("services.ingestion.fetch_weather_data", return_value=weather):
        res = get_live_feed()
        assert res["multi_hazard"]["rain"]["status"] == "UNAVAILABLE"
        assert res["multi_hazard"]["rain"]["value_mm"] == 0.0

def test_rain_status_fallback_precip():
    weather = WeatherReading(
        ward_id="Bhubaneswar", latitude=20.3, longitude=85.8,
        temperature_c=25.0, humidity_percent=80.0, wind_speed_ms=2.0,
        uv_index=1.0, aqi=50.0, aqi_standard="US_AQI",
        source="Open-Meteo", observed_at="2026-09-24T18:00:00Z", fetched_at="2026-09-24T18:00:00Z",
        precipitation_mm=2.5, weather_code=None
    )
    
    with patch("services.ingestion.fetch_weather_data", return_value=weather):
        res = get_live_feed()
        assert res["multi_hazard"]["rain"]["status"] == "RAINING"
        assert res["multi_hazard"]["rain"]["value_mm"] == 2.5

def test_null_weather():
    with patch("services.ingestion.fetch_weather_data", return_value=None):
        res = get_live_feed()
        assert res["multi_hazard"]["rain"]["status"] == "UNAVAILABLE"
        assert res["multi_hazard"]["rain"]["value_mm"] is None
