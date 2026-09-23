import os
import math
import sqlite3
import datetime
import json
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from typing import Dict, Any, List

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

class CPCBClient:
    def __init__(self):
        self.enabled = os.environ.get("CPCB_ENABLED", "false").lower() == "true"
        self.api_key = os.environ.get("CPCB_API_KEY", "")
        self.resource_id = os.environ.get("CPCB_RESOURCE_ID", "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69")
        self.timeout = int(os.environ.get("CPCB_TIMEOUT_SECONDS", 15))
        
        self.session = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[ 429, 500, 502, 503, 504 ])
        self.session.mount("https://", HTTPAdapter(max_retries=retries))
        
        self.stations_meta = {}
        if os.path.exists(STATIONS_META_PATH):
            with open(STATIONS_META_PATH, "r") as f:
                data = json.load(f)
                for st in data:
                    self.stations_meta[st["station_name"].lower()] = st

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

    def map_ward_to_station(self, ward_lat: float, ward_lon: float) -> Dict[str, Any]:
        if not self.enabled or not self.api_key:
            return {
                "status": "CREDENTIALS_NOT_CONFIGURED" if not self.api_key else "UNAVAILABLE",
                "reason": "CPCB_API_KEY_NOT_CONFIGURED" if not self.api_key else "CPCB_DISABLED"
            }
            
        stations = self._get_cache()
        if not stations:
            return {
                "status": "UNAVAILABLE",
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
            return {"status": "UNAVAILABLE", "reason": "NO_STATION_WITH_COORDINATES"}
            
        fetched_at_dt = datetime.datetime.fromisoformat(nearest["fetched_at"])
        now = datetime.datetime.now(datetime.timezone.utc)
        age_minutes = int((now - fetched_at_dt).total_seconds() / 60.0)
        
        return {
            "status": "LIVE" if age_minutes <= CPCB_CACHE_TTL_MINUTES else "STALE",
            "aqi": None,
            "source": "CPCB",
            "source_type": "official_government",
            "station_name": nearest["station_name"],
            "distance_to_ward_km": round(min_dist, 2),
            "spatial_quality": get_spatial_quality(min_dist),
            "pollutants": nearest["pollutants"],
            "observed_at": nearest["observed_at"],
            "fetched_at": nearest["fetched_at"],
            "data_age_minutes": age_minutes
        }

cpcb_client = CPCBClient()
