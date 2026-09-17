"""
services/ingestion.py — Unified Weather Data Ingestion Module
==============================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Integrates multiple weather data sources into a single standardized pipeline:
  1. Open-Meteo API (free, no key required) — primary source
  2. OpenWeatherMap API (requires OPENWEATHERMAP_API_KEY) — optional enrichment
  3. Mock IoT sensor feed — offline/demo fallback with realistic patterns

All sources resolve to a unified ``WeatherReading`` dataclass.
"""

from __future__ import annotations

import os
import math
import random
import datetime
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict, Any

import requests


# ═══════════════════════════════════════════════════════════════════════════
# Standardised output
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class WeatherReading:
    """Canonical weather observation / forecast point."""
    temperature_c: float
    humidity_pct: float
    uv_index: float
    aqi: float
    wind_speed_ms: float
    timestamp: str                  # ISO-8601
    source: str                     # "open_meteo" | "openweathermap" | "mock_iot"
    lat: float = 0.0
    lon: float = 0.0
    location_name: str = ""
    cloud_cover_pct: float = 0.0
    pressure_hpa: float = 1013.25
    precipitation_mm: float = 0.0
    wind_gusts_ms: float = 0.0
    forecast_7d_temp: List[float] = field(default_factory=list)
    forecast_7d_precip: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ═══════════════════════════════════════════════════════════════════════════
# 1.  Open-Meteo  (free, no API key)
# ═══════════════════════════════════════════════════════════════════════════

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

def _fetch_open_meteo(lat: float, lon: float, location_name: str = "") -> Optional[WeatherReading]:
    """
    Fetch current conditions from the Open-Meteo free forecast API.
    Returns None on failure (caller should fall through to next source).
    """
    try:
        # Weather data
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,surface_pressure,precipitation,wind_gusts_10m",
            "daily": "uv_index_max,temperature_2m_max,precipitation_sum",
            "timezone": "auto",
            "forecast_days": 7,
        }
        resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=12)
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        daily = data.get("daily", {})

        temp = float(current.get("temperature_2m", 35.0))
        rh = float(current.get("relative_humidity_2m", 60.0))
        wind = float(current.get("wind_speed_10m", 2.0)) / 3.6   # km/h → m/s
        cloud = float(current.get("cloud_cover", 30.0))
        pressure = float(current.get("surface_pressure", 1013.25))
        precip = float(current.get("precipitation", 0.0))
        gusts = float(current.get("wind_gusts_10m", wind * 3.6)) / 3.6

        uv_max_list = daily.get("uv_index_max", [])
        uv = float(uv_max_list[0]) if uv_max_list and uv_max_list[0] is not None else 6.0
        
        forecast_7d_temp = [float(t) if t is not None else temp for t in daily.get("temperature_2m_max", [])]
        forecast_7d_precip = [float(p) if p is not None else precip for p in daily.get("precipitation_sum", [])]

        # AQI (separate endpoint)
        aqi = _fetch_open_meteo_aqi(lat, lon)

        ts = current.get("time", datetime.datetime.now(datetime.timezone.utc).isoformat())

        return WeatherReading(
            temperature_c=round(temp, 1),
            humidity_pct=round(rh, 1),
            uv_index=round(uv, 1),
            aqi=round(aqi, 0),
            wind_speed_ms=round(wind, 2),
            timestamp=ts,
            source="open_meteo",
            lat=lat,
            lon=lon,
            location_name=location_name,
            cloud_cover_pct=round(cloud, 1),
            pressure_hpa=round(pressure, 1),
            precipitation_mm=round(precip, 2),
            wind_gusts_ms=round(gusts, 2),
            forecast_7d_temp=forecast_7d_temp,
            forecast_7d_precip=forecast_7d_precip,
        )
    except Exception as e:
        print(f"[ingestion] Open-Meteo fetch failed for ({lat},{lon}): {e}")
        return None


def _fetch_open_meteo_aqi(lat: float, lon: float) -> float:
    """Fetch US EPA AQI from Open-Meteo Air Quality API."""
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "us_aqi",
        }
        resp = requests.get(OPEN_METEO_AQI_URL, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        return float(data.get("current", {}).get("us_aqi", 50))
    except Exception:
        return 50.0   # safe default


# ═══════════════════════════════════════════════════════════════════════════
# 2.  OpenWeatherMap  (requires API key)
# ═══════════════════════════════════════════════════════════════════════════

OWM_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
OWM_AQI_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
OWM_UVI_URL = "https://api.openweathermap.org/data/2.5/uvi"


def _get_owm_key() -> Optional[str]:
    key = os.environ.get("OPENWEATHERMAP_API_KEY", "")
    return key if key and key != "YOUR_KEY_HERE" else None


def _fetch_openweathermap(lat: float, lon: float, location_name: str = "") -> Optional[WeatherReading]:
    """
    Fetch current conditions from OpenWeatherMap.
    Returns None if key is missing or request fails.
    """
    api_key = _get_owm_key()
    if not api_key:
        return None

    try:
        # Main weather
        resp = requests.get(OWM_WEATHER_URL, params={
            "lat": lat, "lon": lon, "appid": api_key, "units": "metric"
        }, timeout=10)
        resp.raise_for_status()
        w = resp.json()

        temp = float(w["main"]["temp"])
        rh = float(w["main"]["humidity"])
        wind = float(w.get("wind", {}).get("speed", 2.0))
        gusts = float(w.get("wind", {}).get("gust", wind))
        cloud = float(w.get("clouds", {}).get("all", 30))
        pressure = float(w["main"].get("pressure", 1013))
        
        precip = 0.0
        if "rain" in w:
            precip = float(w["rain"].get("1h", 0.0))

        # AQI
        aqi = 50.0
        try:
            aqi_resp = requests.get(OWM_AQI_URL, params={
                "lat": lat, "lon": lon, "appid": api_key
            }, timeout=8)
            aqi_resp.raise_for_status()
            aqi_data = aqi_resp.json()
            # OWM returns 1-5 scale; map to US EPA approximate
            owm_aqi = int(aqi_data["list"][0]["main"]["aqi"])
            aqi = {1: 25, 2: 60, 3: 110, 4: 180, 5: 350}.get(owm_aqi, 50)
        except Exception:
            pass

        # UV Index
        uv = 6.0
        try:
            uv_resp = requests.get(OWM_UVI_URL, params={
                "lat": lat, "lon": lon, "appid": api_key
            }, timeout=8)
            uv_resp.raise_for_status()
            uv = float(uv_resp.json().get("value", 6.0))
        except Exception:
            pass

        ts = datetime.datetime.fromtimestamp(
            w.get("dt", 0), tz=datetime.timezone.utc
        ).isoformat()

        return WeatherReading(
            temperature_c=round(temp, 1),
            humidity_pct=round(rh, 1),
            uv_index=round(uv, 1),
            aqi=round(aqi, 0),
            wind_speed_ms=round(wind, 2),
            timestamp=ts,
            source="openweathermap",
            lat=lat,
            lon=lon,
            location_name=location_name or w.get("name", ""),
            cloud_cover_pct=round(cloud, 1),
            pressure_hpa=round(pressure, 1),
            precipitation_mm=round(precip, 2),
            wind_gusts_ms=round(gusts, 2),
            forecast_7d_temp=[temp] * 7, # Mock OWM 7d
            forecast_7d_precip=[precip] * 7,
        )
    except Exception as e:
        print(f"[ingestion] OpenWeatherMap fetch failed for ({lat},{lon}): {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# 3.  Mock IoT Sensor Feed  (offline / demo fallback)
# ═══════════════════════════════════════════════════════════════════════════

def _generate_mock_iot(lat: float, lon: float, location_name: str = "") -> WeatherReading:
    """
    Generate a realistic mock weather reading with seasonal and diurnal
    variance calibrated to Indian tropical / subtropical conditions.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    hour = now.hour + 5.5  # approx IST
    doy = now.timetuple().tm_yday

    # Seasonal base temperature (pre-monsoon peak mid-May ≈ doy 135)
    seasonal = 32.0 + 8.0 * math.exp(-((doy - 135) ** 2) / (2 * 30 ** 2))
    # Diurnal cycle: peak at ~14:00 IST
    diurnal = math.sin((hour - 8) * math.pi / 12) * 5.0 if 6 <= hour <= 20 else -3.0
    temp = seasonal + diurnal + random.gauss(0, 1.2)
    temp = max(18.0, min(50.0, temp))

    rh = max(15.0, min(98.0, 65.0 - diurnal * 2.5 + random.gauss(0, 5)))
    uv = max(0.0, min(14.0, 6.0 + diurnal * 0.8 + random.gauss(0, 1)))
    aqi = max(10, min(400, int(80 + random.gauss(0, 30))))
    wind = max(0.2, min(15.0, 2.5 + random.gauss(0, 1.0)))
    gusts = wind * random.uniform(1.2, 1.8)
    cloud = max(0, min(100, int(40 + random.gauss(0, 20))))
    precip = max(0.0, random.gauss(-2, 5)) if cloud > 50 else 0.0
    
    mock_7d_temp = [round(seasonal + random.gauss(0, 2.0), 1) for _ in range(7)]
    mock_7d_precip = [round(max(0.0, random.gauss(-2, 5)), 1) for _ in range(7)]

    return WeatherReading(
        temperature_c=round(temp, 1),
        humidity_pct=round(rh, 1),
        uv_index=round(uv, 1),
        aqi=float(aqi),
        wind_speed_ms=round(wind, 2),
        timestamp=now.isoformat(),
        source="mock_iot",
        lat=lat,
        lon=lon,
        location_name=location_name or "Mock Sensor",
        cloud_cover_pct=float(cloud),
        pressure_hpa=round(1010 + random.gauss(0, 3), 1),
        precipitation_mm=round(precip, 2),
        wind_gusts_ms=round(gusts, 2),
        forecast_7d_temp=mock_7d_temp,
        forecast_7d_precip=mock_7d_precip,
    )


def generate_mock_sensor_batch(
    locations: List[Dict[str, Any]],
) -> List[WeatherReading]:
    """
    Generate mock IoT readings for a batch of locations.
    Each location dict should have keys: lat, lon, name (optional).
    """
    return [
        _generate_mock_iot(
            loc.get("lat", 20.3),
            loc.get("lon", 85.8),
            loc.get("name", f"Sensor-{i}")
        )
        for i, loc in enumerate(locations)
    ]


# ═══════════════════════════════════════════════════════════════════════════
# 4.  Unified fetcher  (auto-selects best available source)
# ═══════════════════════════════════════════════════════════════════════════

def fetch_weather_data(
    lat: float,
    lon: float,
    location_name: str = "",
    prefer_source: Optional[str] = None,
) -> WeatherReading:
    """
    Fetch real-time weather for a coordinate.  Tries sources in priority:
      1. ``prefer_source`` if specified  ("openweathermap" | "open_meteo" | "mock_iot")
      2. Open-Meteo  (free, always available)
      3. OpenWeatherMap  (if API key is set)
      4. Mock IoT  (guaranteed fallback)
    """
    if prefer_source == "mock_iot":
        return _generate_mock_iot(lat, lon, location_name)

    if prefer_source == "openweathermap":
        result = _fetch_openweathermap(lat, lon, location_name)
        if result:
            return result

    # Default priority: Open-Meteo first (free & reliable)
    result = _fetch_open_meteo(lat, lon, location_name)
    if result:
        return result

    # Fallback: try OWM if key is present
    result = _fetch_openweathermap(lat, lon, location_name)
    if result:
        return result

    # Ultimate fallback: mock data
    print(f"[ingestion] All live sources failed for ({lat},{lon}) — using mock IoT fallback")
    return _generate_mock_iot(lat, lon, location_name)


def fetch_multi_location(
    locations: List[Dict[str, Any]],
    prefer_source: Optional[str] = None,
) -> List[WeatherReading]:
    """Fetch weather for multiple locations. Each dict needs 'lat' and 'lon'."""
    return [
        fetch_weather_data(
            loc["lat"], loc["lon"],
            loc.get("name", ""),
            prefer_source,
        )
        for loc in locations
    ]
