"""
SentinelX — Weather Data Fetcher (STATEWIDE / 30-DISTRICT VERSION)
=====================================================================
Scaled-up version of fetch_weather_data.py: instead of one city-level
reading applied uniformly to 67 wards, this pulls a SEPARATE 5-day hourly
forecast for each of Odisha's 30 districts (using each district's centroid),
since districts span a huge area and genuinely have different weather —
unlike the single-city Bhubaneswar case, city-level uniform weather would
be wrong at state scale.

HOW TO RUN:
1. Make sure `odisha_district_centroids.json` is in the same folder as this
   script.
2. Install dependencies:
       pip install requests
3. Run:
       python fetch_weather_data_odisha.py
4. Output: `odisha_district_weather_forecast.csv` — one row per district per
   forecast hour. Takes ~1-2 minutes (30 sequential API calls, rate-limited
   slightly to be polite to the free API).

No API key needed — Open-Meteo is free for non-commercial use.
Run this on your own laptop or Google Colab (sandboxed environments often
block this domain).
"""

import json
import csv
import time
import requests

# ---- CONFIG ----
FORECAST_DAYS = 5
DISTRICT_CENTROIDS_PATH = "odisha_district_centroids.json"
OUTPUT_CSV_PATH = "odisha_district_weather_forecast.csv"

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
    "apparent_temperature",
]


def fetch_district_weather(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(HOURLY_VARS),
        "forecast_days": FORECAST_DAYS,
        "timezone": "Asia/Kolkata",
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def load_district_centroids(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    print(f"Loading district centroids from {DISTRICT_CENTROIDS_PATH}...")
    districts = load_district_centroids(DISTRICT_CENTROIDS_PATH)
    print(f"Loaded {len(districts)} districts")

    print(f"Writing {OUTPUT_CSV_PATH} (fetching weather per district, "
          f"~{len(districts)} API calls)...")

    with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "district", "population_2011_est", "centroid_lat", "centroid_lon",
            "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c",
        ])

        for i, d in enumerate(districts):
            print(f"  [{i+1}/{len(districts)}] Fetching {d['district']}...")
            try:
                weather = fetch_district_weather(d["centroid_lat"], d["centroid_lon"])
                hourly = weather["hourly"]
                timestamps = hourly["time"]

                for j, ts in enumerate(timestamps):
                    writer.writerow([
                        d["district"], d["population_2011_est"],
                        d["centroid_lat"], d["centroid_lon"],
                        ts,
                        hourly["temperature_2m"][j],
                        hourly["relative_humidity_2m"][j],
                        hourly["wind_speed_10m"][j],
                        hourly["shortwave_radiation"][j],
                        hourly["apparent_temperature"][j],
                    ])
            except Exception as e:
                print(f"    WARNING: failed for {d['district']}: {e}")

            time.sleep(0.3)  # be polite to the free API

    print("Done! Output:", OUTPUT_CSV_PATH)


if __name__ == "__main__":
    main()
