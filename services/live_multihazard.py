import os
import sqlite3
import datetime
import json
import requests
from bs4 import BeautifulSoup

DB_PATH = "sentinelx_data.db"
CACHE_TTL_MINUTES = 15

def haversine(lat1, lon1, lat2, lon2):
    import math
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class LiveMultiHazard:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS multi_hazard_cache (
                id TEXT PRIMARY KEY,
                data TEXT,
                fetched_at TEXT
            )
        """)
        conn.commit()
        conn.close()

    def get_cached(self, key: str):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT data, fetched_at FROM multi_hazard_cache WHERE id=?", (key,))
        row = c.fetchone()
        conn.close()
        if row:
            return json.loads(row[0]), row[1]
        return None, None

    def set_cached(self, key: str, data: dict):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        c.execute("""
            INSERT INTO multi_hazard_cache (id, data, fetched_at)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data=excluded.data, fetched_at=excluded.fetched_at
        """, (key, json.dumps(data), now))
        conn.commit()
        conn.close()
        return now

    def _safe_fetch(self, url: str):
        try:
            resp = self.session.get(url, timeout=20)
            if resp.status_code == 200:
                return resp.text
            return None
        except Exception:
            return None

    def fetch_cyclone_status(self):
        url = "https://mausam.imd.gov.in/responsive/cycloneinformation.php"
        html = self._safe_fetch(url)
        if not html:
            return {"status": "UNAVAILABLE", "message": "Source unreachable"}

        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text().upper()

        system_types = ["SEVERE CYCLONIC STORM", "CYCLONIC STORM", "DEEP DEPRESSION", "DEPRESSION", "LOW PRESSURE AREA"]
        detected_type = None
        for st in system_types:
            if st in text:
                detected_type = st
                break

        if detected_type:
            # Try to extract lat/lon using basic regex for standard IMD format
            # e.g., "Lat. 19.5 N and Long. 86.5 E" or "Lat. 19.5°N and Long. 86.5°E"
            import re
            lat_match = re.search(r"LAT\.\s*(\d+\.\d+)\s*(?:°|DEGREES)?\s*N", text)
            lon_match = re.search(r"LONG\.\s*(\d+\.\d+)\s*(?:°|DEGREES)?\s*E", text)
            
            lat = float(lat_match.group(1)) if lat_match else None
            lon = float(lon_match.group(1)) if lon_match else None
            
            distance_str = None
            if lat and lon:
                d = haversine(20.2961, 85.8245, lat, lon)
                distance_str = f"{d:.1f} km from Bhubaneswar"
            
            return {
                "status": "ACTIVE",
                "system_type": detected_type,
                "message": f"{detected_type} reported by IMD. {distance_str if distance_str else ''}".strip(),
                "latitude": lat,
                "longitude": lon,
                "source": "India Meteorological Department",
                "source_url": url,
            }
        
        return {
            "status": "NO_ACTIVE_SIGNAL",
            "message": "No active cyclonic disturbance reported",
            "source": "India Meteorological Department",
            "source_url": url
        }

    def fetch_heavy_rain_status(self):
        url = "https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=10"
        html = self._safe_fetch(url)
        if not html:
            return {"status": "UNAVAILABLE", "message": "Source unreachable"}
        
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text().upper()

        status = "NO_ACTIVE_SIGNAL"
        msg = "No heavy rain warning"
        
        if "ODISHA" in text or "KHORDHA" in text or "KHURDA" in text or "BHUBANESWAR" in text:
            if "EXTREMELY HEAVY RAIN" in text:
                status = "ACTIVE"
                msg = "EXTREMELY HEAVY RAIN"
            elif "VERY HEAVY RAIN" in text:
                status = "ACTIVE"
                msg = "VERY HEAVY RAIN"
            elif "HEAVY RAIN" in text:
                status = "WATCH"
                msg = "HEAVY RAIN"

        return {
            "status": status,
            "message": msg,
            "source": "India Meteorological Department",
            "source_url": url
        }

    def fetch_flood_status(self):
        url = "https://ffs.india-water.gov.in/"
        html = self._safe_fetch(url)
        if not html:
            return {"status": "UNAVAILABLE", "message": "Source unreachable"}

        # CWC site requires complex interaction. In a real scenario we'd use their JSON API.
        # Just searching for "Odisha" or "Khordha" in text for alerts.
        text = html.upper()
        if "EXTREME FLOOD" in text and ("ODISHA" in text or "KHORDHA" in text or "KHURDA" in text or "BHUBANESWAR" in text):
            return {"status": "ACTIVE", "message": "Extreme Flood Alert in Region", "source": "CWC", "source_url": url}
        elif "SEVERE FLOOD" in text and ("ODISHA" in text or "KHORDHA" in text or "KHURDA" in text or "BHUBANESWAR" in text):
            return {"status": "WATCH", "message": "Severe Flood Alert in Region", "source": "CWC", "source_url": url}
        
        return {
            "status": "NO_ACTIVE_SIGNAL",
            "message": "No active flood alerts",
            "source": "CWC Flood Forecasting",
            "source_url": url
        }

    def fetch_landslide_status(self):
        url = "https://sachet.ndma.gov.in/"
        html = self._safe_fetch(url)
        if not html:
            return {"status": "UNAVAILABLE", "message": "Source unreachable"}

        text = html.upper()
        if "LANDSLIDE" in text and ("ODISHA" in text or "KHORDHA" in text or "KHURDA" in text or "BHUBANESWAR" in text):
            return {"status": "WATCH", "message": "Landslide Alert", "source": "NDMA SACHET", "source_url": url}

        return {
            "status": "NO_ACTIVE_SIGNAL",
            "message": "No active landslide alerts",
            "source": "NDMA SACHET",
            "source_url": url
        }

    def sync(self):
        old_cache, _ = self.get_cached("multi_hazard_live")
        old_cache = old_cache or {}
        
        c_status = self.fetch_cyclone_status()
        h_status = self.fetch_heavy_rain_status()
        f_status = self.fetch_flood_status()
        l_status = self.fetch_landslide_status()

        data = {
            "cyclone": c_status if c_status["status"] != "UNAVAILABLE" else old_cache.get("cyclone", c_status),
            "heavy_rain": h_status if h_status["status"] != "UNAVAILABLE" else old_cache.get("heavy_rain", h_status),
            "flood": f_status if f_status["status"] != "UNAVAILABLE" else old_cache.get("flood", f_status),
            "landslide": l_status if l_status["status"] != "UNAVAILABLE" else old_cache.get("landslide", l_status)
        }
        
        now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        for k, v in data.items():
            if "observed_at" not in v:
                v["observed_at"] = now
            v["fetched_at"] = now

        self.set_cached("multi_hazard_live", data)
        return data

    def get_current_status(self):
        cached, fetched_at = self.get_cached("multi_hazard_live")
        now = datetime.datetime.now(datetime.timezone.utc)
        
        if not cached:
            try:
                cached = self.sync()
                _, fetched_at = self.get_cached("multi_hazard_live")
            except Exception as e:
                print(f"[LiveMultiHazard] Sync failed during cold start: {e}")
                return {
                    "updated_at": now.isoformat(timespec="seconds"),
                    "overall_status": "UNAVAILABLE",
                    "cyclone": {"status": "UNAVAILABLE", "message": "Initializing"},
                    "heavy_rain": {"status": "UNAVAILABLE", "message": "Initializing"},
                    "flood": {"status": "UNAVAILABLE", "message": "Initializing"},
                    "landslide": {"status": "UNAVAILABLE", "message": "Initializing"}
                }

        fetched_dt = datetime.datetime.fromisoformat(fetched_at)
        age = (now - fetched_dt).total_seconds() / 60.0

        overall_status = "LIVE" if age <= CACHE_TTL_MINUTES else "LAST VERIFIED"
        
        return {
            "updated_at": fetched_at,
            "overall_status": overall_status,
            "cyclone": cached.get("cyclone", {"status": "UNAVAILABLE"}),
            "heavy_rain": cached.get("heavy_rain", {"status": "UNAVAILABLE"}),
            "flood": cached.get("flood", {"status": "UNAVAILABLE"}),
            "landslide": cached.get("landslide", {"status": "UNAVAILABLE"})
        }

live_multihazard_client = LiveMultiHazard()
