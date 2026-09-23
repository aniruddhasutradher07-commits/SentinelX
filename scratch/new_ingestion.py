from __future__ import annotations
import os
import math
import random
import sqlite3
import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict, Any

DB_PATH = "sentinelx_data.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS weather_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_id TEXT,
            latitude REAL,
            longitude REAL,
            temperature_c REAL,
            humidity_percent REAL,
            wind_speed_kmh REAL,
            uv_index REAL,
            pm25 REAL,
            pm10 REAL,
            aqi REAL,
            aqi_standard TEXT,
            source TEXT,
            observed_at TEXT,
            fetched_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@dataclass
class WeatherReading:
    ward_id: str
    latitude: float
    longitude: float
    temperature_c: Optional[float]
    humidity_percent: Optional[float]
    wind_speed_ms: Optional[float]
    uv_index: Optional[float]
    aqi: Optional[float]
    aqi_standard: str
    source: str
    observed_at: str
    fetched_at: str
    is_live: bool = False
    is_stale: bool = False
    data_age_minutes: int = 0
    wind_gusts_ms: float = 0.0
    precipitation_mm: float = 0.0
    pressure_hpa: float = 1013.25
    cloud_cover_pct: float = 0.0
    forecast_7d_precip: List[float] = field(default_factory=lambda: [0.0]*7)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def get_config():
    use_mock = os.environ.get("USE_MOCK_DATA", "false").lower() == "true"
    stale_thresh = int(os.environ.get("DATA_STALE_AFTER_MINUTES", "30"))
    batch_size = int(os.environ.get("OPEN_METEO_BATCH_SIZE", "10"))
    timeout = int(os.environ.get("OPEN_METEO_TIMEOUT_SECONDS", "15"))
    max_retries = int(os.environ.get("OPEN_METEO_MAX_RETRIES", "3"))
    backoff = int(os.environ.get("OPEN_METEO_BACKOFF_SECONDS", "1"))
    return use_mock, stale_thresh, batch_size, timeout, max_retries, backoff

# Persistent Session
_session = None
def get_session():
    global _session
    if _session is None:
        _, _, _, _, max_retries, backoff = get_config()
        _session = requests.Session()
        retry = Retry(
            total=max_retries,
            backoff_factor=backoff,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        adapter = HTTPAdapter(max_retries=retry)
        _session.mount("http://", adapter)
        _session.mount("https://", adapter)
    return _session

def _fetch_open_meteo_batch(locations: List[Dict[str, Any]]) -> Dict[str, Optional[WeatherReading]]:
    _, _, _, timeout, _, _ = get_config()
    session = get_session()
    
    lats = ",".join(str(loc["lat"]) for loc in locations)
    lons = ",".join(str(loc["lon"]) for loc in locations)
    
    results = {f"{round(loc['lat'], 2)},{round(loc['lon'], 2)}": None for loc in locations}
    
    try:
        # Weather API
        params = {
            "latitude": lats,
            "longitude": lons,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,precipitation,surface_pressure,cloud_cover",
            "hourly": "uv_index",
            "daily": "precipitation_sum",
            "timezone": "auto",
            "forecast_days": 7,
        }
        w_resp = session.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=timeout)
        w_resp.raise_for_status()
        w_data = w_resp.json()
        if isinstance(w_data, dict) and "current" in w_data:
            w_data = [w_data]
            
        # Air Quality API
        aqi_params = {
            "latitude": lats,
            "longitude": lons,
            "current": "us_aqi",
        }
        a_resp = session.get("https://air-quality-api.open-meteo.com/v1/air-quality", params=aqi_params, timeout=timeout)
        a_resp.raise_for_status()
        a_data = a_resp.json()
        if isinstance(a_data, dict) and "current" in a_data:
            a_data = [a_data]
            
        now_ts = datetime.datetime.now(datetime.timezone.utc)
        fetched_dt = now_ts.isoformat()
        
        for i, loc in enumerate(locations):
            try:
                grid_key = f"{round(loc['lat'], 2)},{round(loc['lon'], 2)}"
                wd = w_data[i]
                ad = a_data[i] if i < len(a_data) else {}
                
                current = wd.get("current", {})
                a_current = ad.get("current", {})
                
                temp = current.get("temperature_2m")
                rh = current.get("relative_humidity_2m")
                wind_kmh = current.get("wind_speed_10m")
                wind_ms = wind_kmh / 3.6 if wind_kmh is not None else None
                
                if temp is not None and (temp < -20 or temp > 60): temp = None
                if rh is not None and (rh < 0 or rh > 100): rh = None
                if temp is None or rh is None:
                    continue # Missing critical data
                
                uv = None
                if "hourly" in wd and "time" in wd["hourly"]:
                    try:
                        current_hour_iso = now_ts.strftime("%Y-%m-%dT%H:00")
                        times = wd["hourly"]["time"]
                        uvs = wd["hourly"]["uv_index"]
                        closest_idx = 0
                        for idx_h, t in enumerate(times):
                            if t.startswith(current_hour_iso[:13]):
                                closest_idx = idx_h
                                break
                        uv = float(uvs[closest_idx]) if uvs[closest_idx] is not None else None
                    except:
                        pass
                
                aqi = a_current.get("us_aqi")
                
                obs_time = current.get("time")
                if obs_time:
                    obs_dt = datetime.datetime.fromisoformat(obs_time.replace("Z", "+00:00"))
                    if obs_dt.tzinfo is None:
                        obs_dt = obs_dt.replace(tzinfo=datetime.timezone.utc)
                else:
                    obs_dt = now_ts
                
                results[grid_key] = WeatherReading(
                    ward_id="", # Assigned later
                    latitude=loc["lat"],
                    longitude=loc["lon"],
                    temperature_c=float(temp),
                    humidity_percent=float(rh),
                    wind_speed_ms=float(wind_ms) if wind_ms else 0.0,
                    uv_index=float(uv) if uv is not None else None,
                    aqi=float(aqi) if aqi is not None else None,
                    aqi_standard="US_AQI",
                    source="open_meteo",
                    observed_at=obs_dt.isoformat(),
                    fetched_at=fetched_dt,
                    wind_gusts_ms=(current.get("wind_gusts_10m") or 0.0) / 3.6,
                    precipitation_mm=current.get("precipitation") or 0.0,
                    pressure_hpa=current.get("surface_pressure") or 1013.25,
                    cloud_cover_pct=current.get("cloud_cover") or 0.0,
                    forecast_7d_precip=[float(x) if x is not None else 0.0 for x in wd.get("daily", {}).get("precipitation_sum", [])]
                )
            except Exception as e:
                print(f"[OPEN_METEO] Error parsing location {loc} in batch: {e}")
                
    except Exception as e:
        print(f"[OPEN_METEO] Batch FAILED: {e}")
        
    return results

def _get_cached_reading(ward_id: str) -> Optional[WeatherReading]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT * FROM weather_observations
        WHERE ward_id = ?
        ORDER BY fetched_at DESC LIMIT 1
    """, (ward_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return WeatherReading(
        ward_id=row["ward_id"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        temperature_c=row["temperature_c"],
        humidity_percent=row["humidity_percent"],
        wind_speed_ms=row["wind_speed_kmh"] / 3.6 if row["wind_speed_kmh"] is not None else None,
        uv_index=row["uv_index"],
        aqi=row["aqi"],
        aqi_standard=row["aqi_standard"],
        source=row["source"],
        observed_at=row["observed_at"],
        fetched_at=row["fetched_at"]
    )

def _save_reading(r: WeatherReading):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    wind_kmh = r.wind_speed_ms * 3.6 if r.wind_speed_ms is not None else None
    c.execute("""
        INSERT INTO weather_observations 
        (ward_id, latitude, longitude, temperature_c, humidity_percent, wind_speed_kmh, uv_index, pm25, pm10, aqi, aqi_standard, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)
    """, (r.ward_id, r.latitude, r.longitude, r.temperature_c, r.humidity_percent, wind_kmh, r.uv_index, r.aqi, r.aqi_standard, r.source, r.observed_at, r.fetched_at))
    conn.commit()
    conn.close()

def _generate_mock_iot(lat: float, lon: float, ward_id: str) -> WeatherReading:
    now = datetime.datetime.now(datetime.timezone.utc)
    return WeatherReading(
        ward_id=ward_id,
        latitude=lat,
        longitude=lon,
        temperature_c=31.4 + random.gauss(0, 1),
        humidity_percent=72.0 + random.gauss(0, 5),
        wind_speed_ms=2.5,
        uv_index=4.2,
        aqi=148.0,
        aqi_standard="US_AQI",
        source="mock_iot",
        observed_at=now.isoformat(),
        fetched_at=now.isoformat()
    )

def calculate_freshness(r: WeatherReading, stale_thresh: int):
    now = datetime.datetime.now(datetime.timezone.utc)
    obs_dt = datetime.datetime.fromisoformat(r.observed_at.replace("Z", "+00:00"))
    if obs_dt.tzinfo is None:
        obs_dt = obs_dt.replace(tzinfo=datetime.timezone.utc)
    age_min = int((now - obs_dt).total_seconds() / 60)
    age_min = max(0, age_min)
    
    r.data_age_minutes = age_min
    r.is_live = age_min <= 10
    r.is_stale = age_min > stale_thresh

def fetch_weather_data(lat: float, lon: float, ward_id: str = "") -> Optional[WeatherReading]:
    # Backward compatible single fetch (used by tests/mock)
    use_mock, stale_thresh, _, _, _, _ = get_config()
    
    if use_mock:
        r = _generate_mock_iot(lat, lon, ward_id)
        calculate_freshness(r, stale_thresh)
        return r

    cached = _get_cached_reading(ward_id)
    if cached:
        calculate_freshness(cached, stale_thresh)
        if cached.is_live:
            return cached

    batch_res = _fetch_open_meteo_batch([{"lat": lat, "lon": lon, "name": ward_id}])
    grid_key = f"{round(lat, 2)},{round(lon, 2)}"
    r = batch_res.get(grid_key)
    
    if r:
        r.ward_id = ward_id
        r.latitude = lat
        r.longitude = lon
        _save_reading(r)
        calculate_freshness(r, stale_thresh)
        return r

    if cached:
        print(f"[WEATHER] Ward {ward_id} Source: Open-Meteo Status: API ERROR Fallback: Last valid database observation")
        calculate_freshness(cached, stale_thresh)
        return cached

    return None

def fetch_multi_location(locations: List[Dict[str, Any]]) -> List[Optional[WeatherReading]]:
    import time
    use_mock, stale_thresh, batch_size, _, _, _ = get_config()
    results = [None] * len(locations)
    
    if use_mock:
        for i, loc in enumerate(locations):
            r = _generate_mock_iot(loc["lat"], loc["lon"], loc.get("name", ""))
            calculate_freshness(r, stale_thresh)
            results[i] = r
        return results

    # 1. Check cache first to see which ones are live
    pending_locs = []
    grid_map = {} # Maps grid_key -> { representative: loc, indices: [] }
    
    for i, loc in enumerate(locations):
        ward_id = loc.get("name", "")
        cached = _get_cached_reading(ward_id)
        if cached:
            calculate_freshness(cached, stale_thresh)
            if cached.is_live:
                results[i] = cached
                continue
                
        # Needs fetching, add to deduplication
        lat_grid = round(loc["lat"], 2)
        lon_grid = round(loc["lon"], 2)
        grid_key = f"{lat_grid},{lon_grid}"
        
        if grid_key not in grid_map:
            grid_map[grid_key] = {"representative": loc, "indices": []}
            pending_locs.append(loc)
            
        grid_map[grid_key]["indices"].append(i)
        
    if not pending_locs:
        return results
        
    print(f"[OPEN_METEO] Initiating batched requests for {len(pending_locs)} unique grids...")
    
    unique_results = {}
    
    # 2. Sequential batch fetching
    for i in range(0, len(pending_locs), batch_size):
        batch = pending_locs[i:i+batch_size]
        t0 = time.time()
        batch_res = _fetch_open_meteo_batch(batch)
        dur = round(time.time() - t0, 2)
        
        # Check if the batch returned results
        success_count = sum(1 for v in batch_res.values() if v is not None)
        status = "SUCCESS" if success_count > 0 else "FAILED"
        print(f"[OPEN_METEO] Batch {i//batch_size + 1}/{math.ceil(len(pending_locs)/batch_size)} (Size: {len(batch)}) Status: {status} Duration: {dur}s")
        
        unique_results.update(batch_res)

    # 3. Map back the results to the original array, updating the ward_id and fallback if needed
    for grid_key, data in grid_map.items():
        base_reading = unique_results.get(grid_key)
        
        for idx in data["indices"]:
            ward_id = locations[idx].get("name", "")
            
            if base_reading:
                import copy
                cloned = copy.deepcopy(base_reading)
                cloned.ward_id = ward_id
                cloned.latitude = locations[idx]["lat"]
                cloned.longitude = locations[idx]["lon"]
                _save_reading(cloned)
                calculate_freshness(cloned, stale_thresh)
                results[idx] = cloned
            else:
                # Absolute fallback to cache if batch failed
                cached = _get_cached_reading(ward_id)
                if cached:
                    print(f"[OPEN_METEO] Ward {ward_id} Batch FAILED. Fallback: SQLite cache.")
                    calculate_freshness(cached, stale_thresh)
                    results[idx] = cached
                else:
                    results[idx] = None
                    
    return results
