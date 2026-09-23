import os
import sqlite3
import datetime
import requests
from typing import Dict, Any

DB_PATH = "sentinelx_data.db"
IMD_CACHE_TTL_MINUTES = 30

class IMDClient:
    def __init__(self):
        self.enabled = os.environ.get("IMD_ENABLED", "false").lower() == "true"
        self.api_key = os.environ.get("IMD_API_KEY", "")
        self.timeout = int(os.environ.get("IMD_TIMEOUT_SECONDS", 15))

    def _get_cache(self, district: str) -> Dict[str, Any]:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT warning_level, nowcast, source, observed_at, fetched_at FROM imd_context_cache WHERE district=?", (district,))
        row = c.fetchone()
        conn.close()

        if not row:
            return None

        fetched_at_dt = datetime.datetime.fromisoformat(row[4])
        now = datetime.datetime.now(datetime.timezone.utc)
        age_minutes = int((now - fetched_at_dt).total_seconds() / 60.0)

        return {
            "status": "LIVE" if age_minutes <= IMD_CACHE_TTL_MINUTES else "STALE",
            "district": district,
            "warning_level": row[0],
            "nowcast": row[1],
            "source": row[2],
            "source_type": "official_government",
            "observed_at": row[3],
            "fetched_at": row[4],
            "data_age_minutes": age_minutes
        }

    def _save_cache(self, data: Dict[str, Any]):
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
        conn.close()

    def fetch_live_district_context(self, district: str) -> bool:
        """Fetches from official IMD API and saves to cache. Returns True if successful."""
        if not self.enabled or not self.api_key:
            return False

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

        try:
            # We would normally make the official API call here:
            # resp = requests.get(f"https://api.imd.gov.in/v1/warnings/district/{district}", headers={"Authorization": f"Bearer {self.api_key}"}, timeout=self.timeout)
            # resp.raise_for_status()
            
            # Since the actual API keys are missing and endpoint mapping is pending integration:
            raise requests.exceptions.ConnectionError("IMD API Key / Endpoints pending.")
        except Exception as e:
            return False

    def get_district_context(self, district: str) -> Dict[str, Any]:
        """Gets IMD context prioritizing LIVE API fetch (if just refreshed), falling back to cache."""
        if not self.enabled or not self.api_key:
            return {
                "status": "CREDENTIALS_NOT_CONFIGURED" if not self.api_key else "UNAVAILABLE",
                "district": district,
                "reason": "IMD_API_KEY_NOT_CONFIGURED" if not self.api_key else "IMD_DISABLED"
            }
            
        cache = self._get_cache(district)
        if cache:
            return cache
        
        return {
            "status": "UNAVAILABLE",
            "district": district,
            "reason": "CACHE_MISS_AND_API_UNAVAILABLE"
        }

imd_client = IMDClient()
