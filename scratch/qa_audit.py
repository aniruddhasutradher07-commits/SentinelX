import requests
import json
import sqlite3
import datetime
from services.ingestion import DB_PATH

print("--- STEP 2: Verify Open-Meteo & Backend API ---")
# Call backend API
try:
    resp = requests.get("http://127.0.0.1:8000/api/v1/wards")
    if resp.status_code == 200:
        wards = resp.json().get("wards", [])
        w9 = next((w for w in wards if w["ward_no"] == "W9"), None)
        if w9:
            print("W9 Backend:", w9["temperature_c"], "C, Hum:", w9["relative_humidity_pct"], "%, Source:", w9["source"], "Live:", w9["is_live"])
        else:
            print("W9 not found in backend")
    else:
        print("Backend API not reachable. Please start the server.")
except Exception as e:
    print("Backend API failed:", e)

print("\n--- STEP 3: Verify Database ---")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT ward_id, temperature_c, humidity_percent, observed_at, fetched_at, source FROM weather_observations WHERE ward_id = 'W9' ORDER BY id DESC LIMIT 1")
row = c.fetchone()
if row:
    print(f"DB W9: Temp={row[1]}, Hum={row[2]}, Source={row[5]}, Obs={row[3]}, Fetch={row[4]}")
else:
    print("No DB entry for W9")
conn.close()
