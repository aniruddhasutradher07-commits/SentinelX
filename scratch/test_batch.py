import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scratch.new_ingestion import fetch_multi_location

locations = [
    {"lat": 20.29, "lon": 85.80, "name": "W1"},
    {"lat": 20.291, "lon": 85.801, "name": "W2"}, # same grid
    {"lat": 20.30, "lon": 85.82, "name": "W3"},
    {"lat": 20.31, "lon": 85.83, "name": "W4"},
]

res = fetch_multi_location(locations)
for i, r in enumerate(res):
    print(f"Location {locations[i]['name']}: Temp={r.temperature_c if r else None}, UV={r.uv_index if r else None}, AQI={r.aqi if r else None}, Stale={r.is_stale if r else None}")
