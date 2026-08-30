"""
SentinelX — Complete 30-District Forecast Generator
===================================================
Fetches fresh 120-hour forecast (Today 30 Aug to 3 Sep) for all 30 Odisha districts.
"""

import json
import csv
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DISTRICT_CENTROIDS_PATH = "District/odisha_district_centroids.json"
OUTPUT_CSV_PATH = "District/odisha_district_weather_forecast.csv"

session = requests.Session()
retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
    "apparent_temperature",
]

def main():
    with open(DISTRICT_CENTROIDS_PATH, "r", encoding="utf-8") as f:
        districts = json.load(f)

    all_rows = []
    print(f"Fetching all {len(districts)} districts with robust connection...")
    for i, d in enumerate(districts):
        dname = d["district"]
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": d["centroid_lat"],
            "longitude": d["centroid_lon"],
            "hourly": ",".join(HOURLY_VARS),
            "forecast_days": 5,
            "timezone": "Asia/Kolkata",
        }
        try:
            resp = session.get(url, params=params, timeout=25)
            resp.raise_for_status()
            data = resp.json()
            hourly = data["hourly"]
            timestamps = hourly["time"]

            for j, ts in enumerate(timestamps):
                all_rows.append([
                    d["district"],
                    d["population_2011_est"],
                    d["centroid_lat"],
                    d["centroid_lon"],
                    ts,
                    hourly["temperature_2m"][j],
                    hourly["relative_humidity_2m"][j],
                    hourly["wind_speed_10m"][j],
                    hourly["shortwave_radiation"][j],
                    hourly["apparent_temperature"][j],
                ])
            print(f"  [{i+1}/30] ✓ {dname} ({len(timestamps)} hrs)")
        except Exception as e:
            print(f"  [{i+1}/30] ✗ Error for {dname}: {e}")
        time.sleep(0.3)

    with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "district", "population_2011_est", "centroid_lat", "centroid_lon",
            "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c",
        ])
        writer.writerows(all_rows)

    print(f"\n🎉 Successfully saved {len(all_rows)} hourly records for all 30 districts to {OUTPUT_CSV_PATH}")

if __name__ == "__main__":
    main()
