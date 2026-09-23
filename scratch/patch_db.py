import re
import sqlite3

def init_all_db():
    conn = sqlite3.connect("sentinelx_data.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS imd_context_cache (
            district TEXT PRIMARY KEY,
            warning_level TEXT,
            nowcast TEXT,
            weather TEXT,
            source TEXT,
            observed_at TEXT,
            fetched_at TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS cpcb_station_cache (
            station_id TEXT PRIMARY KEY,
            station_name TEXT,
            latitude REAL,
            longitude REAL,
            aqi REAL,
            prominent_pollutant TEXT,
            source TEXT,
            observed_at TEXT,
            fetched_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_all_db()
print("DB initialized with IMD and CPCB tables.")
