import os
import math
import sqlite3
import datetime
import json
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from typing import Dict, Any, List, Optional

DB_PATH = "sentinelx_data.db"
CPCB_CACHE_TTL_MINUTES = 30
STATIONS_META_PATH = "data/cpcb_stations_odisha.json"

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_spatial_quality(distance_km: float) -> str:
    if distance_km <= 5.0:
        return "NEAR"
    elif distance_km <= 10.0:
        return "MODERATE"
    elif distance_km <= 20.0:
        return "FAR"
    return "VERY_FAR"

def compute_indian_sub_aqi(pollutant_id: str, conc: float) -> Optional[float]:
    """
    Computes Indian National AQI (NAQI) sub-index based on standard CPCB breakpoints.
    """
    if conc is None or conc < 0:
        return None
    p = str(pollutant_id).upper()
    if p in ("PM2.5", "PM25"):
        # CPCB PM2.5 breakpoints (ug/m3 -> AQI): 0-30: 0-50, 31-60: 51-100, 61-90: 101-200, 91-120: 201-300, 121-250: 301-400, 250+: 401-500
        breakpoints = [(0.0, 30.0, 0.0, 50.0), (31.0, 60.0, 51.0, 100.0), (61.0, 90.0, 101.0, 200.0), (91.0, 120.0, 201.0, 300.0), (121.0, 250.0, 301.0, 400.0), (250.0, 500.0, 401.0, 500.0)]
    elif p in ("PM10",):
        # CPCB PM10 breakpoints: 0-50: 0-50, 51-100: 51-100, 101-250: 101-200, 251-350: 201-300, 351-430: 301-400, 430+: 401-500
        breakpoints = [(0.0, 50.0, 0.0, 50.0), (51.0, 100.0, 51.0, 100.0), (101.0, 250.0, 101.0, 200.0), (251.0, 350.0, 201.0, 300.0), (351.0, 430.0, 301.0, 400.0), (430.0, 600.0, 401.0, 500.0)]
    else:
        return None

    for b_lo, b_hi, i_lo, i_hi in breakpoints:
        if b_lo <= conc <= b_hi:
            return round(((i_hi - i_lo) / (b_hi - b_lo)) * (conc - b_lo) + i_lo, 1)
    if conc > 500.0:
        return 500.0
    return None

class CPCBClient:
    def __init__(self):
        self._refresh_env()
        self.resource_id = os.environ.get("CPCB_RESOURCE_ID", "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69")
        self.timeout = int(os.environ.get("CPCB_TIMEOUT_SECONDS", 15))
        
        self.session = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[ 429, 500, 502, 503, 504 ])
        self.session.mount("https://", HTTPAdapter(max_retries=retries))
        
        self.stations_meta = {}
        if os.path.exists(STATIONS_META_PATH):
            try:
                with open(STATIONS_META_PATH, "r") as f:
                    data = json.load(f)
                    for st in data:
                        self.stations_meta[st["station_name"].lower()] = st
            except Exception:
                pass

    def _refresh_env(self):
        if not os.environ.get("CPCB_API_KEY") and os.path.exists(".env"):
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if "=" in line and not line.startswith("#"):
                            k, v = line.strip().split("=", 1)
                            k_s, v_s = k.strip(), v.strip()
                            if k_s in ("CPCB_API_KEY", "CPCB_ENABLED", "CPCB_RESOURCE_ID", "CPCB_TIMEOUT_SECONDS") and v_s:
                                os.environ[k_s] = v_s
            except Exception:
                pass
        self.api_key = os.environ.get("CPCB_API_KEY", "")
        cpcb_env = os.environ.get("CPCB_ENABLED")
        if cpcb_env is not None:
            self.enabled = cpcb_env.lower() == "true"
        else:
            self.enabled = bool(self.api_key)

    def _init_db(self):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS cpcb_pollutant_cache (
                station_name TEXT,
                latitude REAL,
                longitude REAL,
                pollutant_id TEXT,
                pollutant_avg REAL,
                pollutant_min REAL,
                pollutant_max REAL,
                pollutant_unit TEXT,
                source TEXT,
                observed_at TEXT,
                fetched_at TEXT,
                PRIMARY KEY(station_name, pollutant_id)
            )
        """)
        conn.commit()
        conn.close()

    def fetch_live_stations(self) -> bool:
        self._refresh_env()
        if not self.enabled or not self.api_key:
            return False
            
        url = f"https://api.data.gov.in/resource/{self.resource_id}?api-key={self.api_key}&format=json&filters[state]=Odisha"
        try:
            resp = self.session.get(url, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            records = data.get("records", [])
            
            if not records:
                return False
                
            self._init_db()
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            fetched_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
            
            for r in records:
                if r.get("city", "").lower() != "bhubaneswar":
                    continue
                    
                st_name = r.get("station", "")
                st_meta = self.stations_meta.get(st_name.lower())
                
                lat, lon = None, None
                if st_meta:
                    lat, lon = st_meta["latitude"], st_meta["longitude"]
                
                c.execute("""
                    INSERT INTO cpcb_pollutant_cache 
                    (station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_min, pollutant_max, pollutant_unit, source, observed_at, fetched_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(station_name, pollutant_id) DO UPDATE SET
                        latitude=excluded.latitude,
                        longitude=excluded.longitude,
                        pollutant_avg=excluded.pollutant_avg,
                        pollutant_min=excluded.pollutant_min,
                        pollutant_max=excluded.pollutant_max,
                        pollutant_unit=excluded.pollutant_unit,
                        source=excluded.source,
                        observed_at=excluded.observed_at,
                        fetched_at=excluded.fetched_at
                """, (
                    st_name, lat, lon, r.get("pollutant_id", "Unknown"), 
                    float(r.get("pollutant_avg")) if r.get("pollutant_avg") and r.get("pollutant_avg") != "NA" else None,
                    float(r.get("pollutant_min")) if r.get("pollutant_min") and r.get("pollutant_min") != "NA" else None,
                    float(r.get("pollutant_max")) if r.get("pollutant_max") and r.get("pollutant_max") != "NA" else None,
                    r.get("pollutant_unit"), "CPCB", r.get("last_update"), fetched_at
                ))
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"[CPCB] Sync failed: {e}")
            return False

    def _get_cache(self) -> List[Dict[str, Any]]:
        self._init_db()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_unit, observed_at, fetched_at FROM cpcb_pollutant_cache")
        rows = c.fetchall()
        conn.close()
        
        stations = {}
        for row in rows:
            st_name = row[0]
            if st_name not in stations:
                stations[st_name] = {
                    "station_name": st_name,
                    "latitude": row[1],
                    "longitude": row[2],
                    "observed_at": row[6],
                    "fetched_at": row[7],
                    "pollutants": {}
                }
            
            if row[7] and row[7] > stations[st_name]["fetched_at"]:
                stations[st_name]["fetched_at"] = row[7]
                stations[st_name]["observed_at"] = row[6]
                
            stations[st_name]["pollutants"][row[3]] = {
                "avg": row[4],
                "unit": row[5]
            }
            
        return list(stations.values())

    def get_status(self) -> Dict[str, Any]:
        """
        Exposes source health, station count, and timestamps for CPCB OGD feed.
        """
        if not self.api_key:
            return {
                "status": "CREDENTIALS_NOT_CONFIGURED",
                "source": "CPCB / National Air Quality Monitoring Programme (NAMP)",
                "source_type": "official_government",
                "portal": "https://data.gov.in / CPCB",
                "credentials_configured": False,
                "stations_reporting": 0,
                "observed_at": None,
                "fetched_at": None,
                "reason": "CPCB_API_KEY_NOT_CONFIGURED",
                "message": "CPCB OGD API key is not configured in .env. Ambient air quality is served via independent Open-Meteo European/Copernicus atmospheric models."
            }

        stations = self._get_cache()
        if not stations:
            # Attempt sync once
            self.fetch_live_stations()
            stations = self._get_cache()

        if not stations:
            return {
                "status": "UNAVAILABLE",
                "source": "CPCB / National Air Quality Monitoring Programme (NAMP)",
                "source_type": "official_government",
                "portal": "https://data.gov.in / CPCB",
                "credentials_configured": True,
                "stations_reporting": 0,
                "observed_at": None,
                "fetched_at": None,
                "reason": "CACHE_MISS_AND_API_UNAVAILABLE",
                "message": "Configured CPCB station telemetry is currently unavailable from upstream data.gov.in."
            }

        latest_fetched = max((s["fetched_at"] for s in stations if s.get("fetched_at")), default=None)
        latest_observed = max((s["observed_at"] for s in stations if s.get("observed_at")), default=None)
        age_minutes = 999
        if latest_fetched:
            try:
                dt = datetime.datetime.fromisoformat(latest_fetched)
                now = datetime.datetime.now(datetime.timezone.utc)
                age_minutes = int((now - dt).total_seconds() / 60.0)
            except Exception:
                pass

        status = "LIVE" if age_minutes <= CPCB_CACHE_TTL_MINUTES else "STALE"
        return {
            "status": status,
            "source": "CPCB / National Air Quality Monitoring Programme (NAMP)",
            "source_type": "official_government",
            "portal": "https://data.gov.in / CPCB",
            "credentials_configured": True,
            "stations_reporting": len(stations),
            "station_names": [s["station_name"] for s in stations],
            "observed_at": latest_observed,
            "fetched_at": latest_fetched,
            "data_age_minutes": age_minutes
        }

    def map_ward_to_station(self, ward_lat: float, ward_lon: float) -> Dict[str, Any]:
        """
        Maps a ward coordinate to the nearest CPCB monitoring station.
        Implements fallback: LIVE -> STALE/CACHED -> UNAVAILABLE
        """
        if not self.enabled or not self.api_key:
            return {
                "status": "CREDENTIALS_NOT_CONFIGURED" if not self.api_key else "UNAVAILABLE",
                "source": "CPCB",
                "source_type": "official_government",
                "station_name": None,
                "observed_at": None,
                "fetched_at": None,
                "reason": "CPCB_API_KEY_NOT_CONFIGURED" if not self.api_key else "CPCB_DISABLED"
            }
            
        stations = self._get_cache()
        if not stations:
            # Attempt live fetch on cache miss
            if self.fetch_live_stations():
                stations = self._get_cache()

        if not stations:
            return {
                "status": "UNAVAILABLE",
                "source": "CPCB",
                "source_type": "official_government",
                "station_name": None,
                "observed_at": None,
                "fetched_at": None,
                "reason": "CACHE_MISS_AND_API_UNAVAILABLE"
            }

        nearest = None
        min_dist = float("inf")
        for st in stations:
            if st["latitude"] is not None and st["longitude"] is not None:
                d = haversine(ward_lat, ward_lon, st["latitude"], st["longitude"])
                if d < min_dist:
                    min_dist = d
                    nearest = st

        if not nearest:
            return {
                "status": "UNAVAILABLE",
                "source": "CPCB",
                "source_type": "official_government",
                "station_name": None,
                "observed_at": None,
                "fetched_at": None,
                "reason": "NO_STATION_WITH_COORDINATES"
            }

        age_minutes = 999
        if nearest.get("fetched_at"):
            try:
                fetched_at_dt = datetime.datetime.fromisoformat(nearest["fetched_at"])
                now = datetime.datetime.now(datetime.timezone.utc)
                age_minutes = int((now - fetched_at_dt).total_seconds() / 60.0)
            except Exception:
                pass

        status = "LIVE" if age_minutes <= CPCB_CACHE_TTL_MINUTES else "STALE"

        # Calculate sub-index AQI from available pollutants
        computed_aqi = None
        aqi_std = "IN_NAQI"
        pollutants = nearest.get("pollutants", {})
        for p_id in ("PM2.5", "PM25", "PM10"):
            if p_id in pollutants and pollutants[p_id].get("avg") is not None:
                sub_aqi = compute_indian_sub_aqi(p_id, pollutants[p_id]["avg"])
                if sub_aqi is not None:
                    if computed_aqi is None or sub_aqi > computed_aqi:
                        computed_aqi = sub_aqi
        
        return {
            "status": status,
            "aqi": computed_aqi,
            "aqi_standard": aqi_std if computed_aqi is not None else None,
            "source": "CPCB",
            "source_type": "official_government",
            "station_name": nearest["station_name"],
            "distance_to_ward_km": round(min_dist, 2),
            "spatial_quality": get_spatial_quality(min_dist),
            "pollutants": pollutants,
            "observed_at": nearest.get("observed_at"),
            "fetched_at": nearest.get("fetched_at"),
            "data_age_minutes": age_minutes
        }

cpcb_client = CPCBClient()
