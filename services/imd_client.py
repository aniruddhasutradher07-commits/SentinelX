import os
import sqlite3
import datetime
import requests
from typing import Dict, Any, Optional
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

DB_PATH = "sentinelx_data.db"
IMD_CACHE_TTL_MINUTES = 30

# Official IMD Warning and Color Codes
# Source: India Meteorological Department API Reference (https://api.imd.gov.in/public/api_reference.html)
IMD_WARNING_CODES = {
    "1": "No Warning",
    "2": "Heavy Rain",
    "3": "Heavy Snow",
    "4": "Thunderstorm & Lightning, Squall etc",
    "5": "Hailstorm",
    "6": "Dust Storm",
    "7": "Dust Raising Winds",
    "8": "Strong Surface Winds",
    "9": "Heat Wave",
    "10": "Hot Day",
    "11": "Warm Night",
    "12": "Cold Wave",
    "13": "Cold Day",
    "14": "Ground Frost",
    "15": "Fog",
    "16": "Very Heavy Rain",
    "17": "Extremely Heavy Rain",
}

IMD_COLOR_CODES = {
    "1": "RED",      # #FF0000
    "2": "ORANGE",   # #ffa500
    "3": "YELLOW",   # #ffff00
    "4": "GREEN",    # #7cfc00
}


class IMDClient:
    def __init__(self):
        self._refresh_env()
        self._init_session()
        self._init_db()

    def _refresh_env(self):
        """Refreshes configuration from environment variables without logging secrets."""
        self.enabled = os.environ.get("IMD_ENABLED", "false").lower() == "true"
        self.api_key = os.environ.get("IMD_API_KEY", "").strip()
        self.jwt_token = os.environ.get("IMD_JWT_TOKEN", "").strip()
        self.timeout = int(os.environ.get("IMD_TIMEOUT_SECONDS", 15))
        self.warning_url = os.environ.get("IMD_WARNING_API_URL", "https://api.imd.gov.in/api/v1/districtwarning")
        self.nowcast_url = os.environ.get("IMD_NOWCAST_API_URL", "https://api.imd.gov.in/api/v1/districtnowcast")
        self.district_id = os.environ.get("IMD_DISTRICT_ID", "").strip()

    def _init_session(self):
        """Configures persistent HTTP session with finite retries for transient HTTP errors."""
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def _init_db(self):
        """Initializes the SQLite cache table if not present. Preserves existing records."""
        conn = None
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""
                CREATE TABLE IF NOT EXISTS imd_context_cache (
                    district TEXT PRIMARY KEY,
                    warning_level TEXT,
                    nowcast TEXT,
                    source TEXT,
                    observed_at TEXT,
                    fetched_at TEXT
                )
            """)
            conn.commit()
        except Exception as e:
            print(f"[IMDClient] Database initialization warning: {e}")
        finally:
            if conn:
                conn.close()

    def _get_cache(self, district: str) -> Optional[Dict[str, Any]]:
        self._init_db()
        row = None
        conn = None
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT warning_level, nowcast, source, observed_at, fetched_at FROM imd_context_cache WHERE district=?", (district,))
            row = c.fetchone()
        except Exception:
            return None
        finally:
            if conn:
                conn.close()

        if not row or not row[4]:
            return None

        try:
            fetched_at_dt = datetime.datetime.fromisoformat(row[4])
            now = datetime.datetime.now(datetime.timezone.utc)
            # Ensure timezone-aware comparison
            if fetched_at_dt.tzinfo is None:
                fetched_at_dt = fetched_at_dt.replace(tzinfo=datetime.timezone.utc)
            age_minutes = max(0, int((now - fetched_at_dt).total_seconds() / 60.0))
        except Exception:
            age_minutes = 999

        return {
            "status": "LIVE" if age_minutes <= IMD_CACHE_TTL_MINUTES else "STALE",
            "district": district,
            "spatial_resolution": "district",
            "geographic_context": "Khordha",
            "warning_level": row[0],
            "nowcast": row[1],
            "source": row[2] or "India Meteorological Department (IMD)",
            "source_type": "official_government",
            "observed_at": row[3],
            "fetched_at": row[4],
            "data_age_minutes": age_minutes
        }

    def _save_cache(self, data: Dict[str, Any]):
        self._init_db()
        conn = None
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""
                INSERT INTO imd_context_cache (district, warning_level, nowcast, source, observed_at, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(district) DO UPDATE SET
                    warning_level=excluded.warning_level,
                    nowcast=excluded.nowcast,
                    source=excluded.source,
                    observed_at=excluded.observed_at,
                    fetched_at=excluded.fetched_at
            """, (
                data["district"], data["warning_level"], data.get("nowcast"), data["source"],
                data.get("observed_at"), data["fetched_at"]
            ))
            conn.commit()
        except Exception as e:
            print(f"[IMDClient] Cache save error: {e}")
        finally:
            if conn:
                conn.close()

    def fetch_live_district_context(self, district: str) -> bool:
        """
        Fetches official warning data from IMD API and updates SQLite cache.
        Returns True if successful, False otherwise.
        Never fabricates synthetic warning or weather data.
        """
        if not self.enabled or not self.api_key:
            return False

        headers = {
            "X-API-KEY": self.api_key,
            "Accept": "application/json"
        }
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"

        params = {}
        if self.district_id:
            params["id"] = self.district_id

        try:
            resp = self.session.get(
                self.warning_url,
                headers=headers,
                params=params,
                timeout=self.timeout
            )
            if resp.status_code != 200:
                print(f"[IMDClient] Upstream returned HTTP {resp.status_code}")
                return False

            payload = resp.json()
            records = []
            if isinstance(payload, list):
                records = payload
            elif isinstance(payload, dict):
                records = payload.get("records") or payload.get("data") or [payload]
            else:
                return False

            if not records:
                return False

            # Search for district match (e.g. Khordha)
            target_norm = district.strip().lower()
            matched_record = None
            for rec in records:
                if not isinstance(rec, dict):
                    continue
                d_name = str(rec.get("District") or rec.get("district") or rec.get("Station") or "").strip().lower()
                if d_name and (d_name == target_norm or target_norm in d_name):
                    matched_record = rec
                    break

            if not matched_record:
                # If district query parameter was supplied or records has single object
                if len(records) == 1 and isinstance(records[0], dict) and ("Day1_Color" in records[0] or "Day_1" in records[0]):
                    matched_record = records[0]
                else:
                    return False

            # Parse documented IMD response fields
            warning_code = str(matched_record.get("Day_1", "1")).split(",")[0].strip()
            color_code = str(matched_record.get("Day1_Color", "4")).strip()
            warning_desc = IMD_WARNING_CODES.get(warning_code, f"Code {warning_code}")
            color_desc = IMD_COLOR_CODES.get(color_code, "GREEN")
            warning_level = f"{color_desc} - {warning_desc}"

            observed_date = matched_record.get("Date") or ""
            observed_utc = matched_record.get("UTC") or matched_record.get("toi") or ""
            observed_at = f"{observed_date} {observed_utc}".strip() or None
            nowcast = matched_record.get("message") or matched_record.get("Cat16")

            now_str = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

            self._save_cache({
                "district": district,
                "warning_level": warning_level,
                "nowcast": nowcast,
                "source": "India Meteorological Department (IMD)",
                "observed_at": observed_at,
                "fetched_at": now_str
            })
            return True

        except requests.exceptions.RequestException as re:
            print(f"[IMDClient] Upstream request failure: {re.__class__.__name__}")
            return False
        except Exception as e:
            print(f"[IMDClient] Parsing failure: {e.__class__.__name__}")
            return False

    def get_district_context(self, district: str) -> Dict[str, Any]:
        """
        Gets IMD context:
        - If credentials unconfigured or disabled -> CREDENTIALS_NOT_CONFIGURED / UNAVAILABLE
        - If valid cache exists -> LIVE (<= 30m) or STALE (> 30m)
        - If cache miss and upstream fails -> UNAVAILABLE
        """
        if not self.enabled or not self.api_key:
            return {
                "status": "CREDENTIALS_NOT_CONFIGURED" if not self.api_key else "UNAVAILABLE",
                "district": district,
                "spatial_resolution": "district",
                "geographic_context": "Khordha",
                "source": "India Meteorological Department (IMD)",
                "source_type": "official_government",
                "reason": "IMD_API_KEY_NOT_CONFIGURED" if not self.api_key else "IMD_DISABLED"
            }

        cache = self._get_cache(district)
        if cache:
            return cache

        return {
            "status": "UNAVAILABLE",
            "district": district,
            "spatial_resolution": "district",
            "geographic_context": "Khordha",
            "source": "India Meteorological Department (IMD)",
            "source_type": "official_government",
            "reason": "CACHE_MISS_AND_API_UNAVAILABLE"
        }

imd_client = IMDClient()

