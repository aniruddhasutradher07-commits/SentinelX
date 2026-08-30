"""
SentinelX — Reliable Weather Data Fetcher (STATEWIDE / 30-DISTRICT)
===================================================================
Fetches 5-day hourly forecast for all 30 Odisha districts with retries.
"""

import json
import csv
import time
import requests

FORECAST_DAYS = 5
DISTRICT_CENTROIDS_PATH = "District/odisha_district_centroids.json"
OUTPUT_CSV_PATH = "District/odisha_district_weather_forecast.csv"

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
    "apparent_temperature",
]


def fetch_one_district(d, max_retries=3):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": d["centroid_lat"],
        "longitude": d["centroid_lon"],
        "hourly": ",".join(HOURLY_VARS),
        "forecast_days": FORECAST_DAYS,
        "timezone": "Asia/Kolkata",
    }
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                hourly = data["hourly"]
                timestamps = hourly["time"]

                rows = []
                for j, ts in enumerate(timestamps):
                    rows.append([
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
                return rows
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(1)
    return []


def main():
    print(f"Loading district centroids from {DISTRICT_CENTROIDS_PATH}...")
    with open(DISTRICT_CENTROIDS_PATH, "r", encoding="utf-8") as f:
        districts = json.load(f)

    all_rows = []
    print(f"Fetching 30 districts sequentially with rate limit protection...")
    for i, d in enumerate(districts):
        dname = d["district"]
        try:
            rows = fetch_one_district(d)
            all_rows.extend(rows)
            print(f"  [{i+1}/{len(districts)}] ✓ {dname} ({len(rows)} hrs)")
        except Exception as e:
            print(f"  [{i+1}/{len(districts)}] ✗ {dname}: {e}")
        time.sleep(0.2)

    # Write output
    with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "district", "population_2011_est", "centroid_lat", "centroid_lon",
            "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c",
        ])
        writer.writerows(all_rows)

    print(f"\n✅ Done! Wrote {len(all_rows)} rows for all {len(districts)} districts to {OUTPUT_CSV_PATH}")


if __name__ == "__main__":
    main()
