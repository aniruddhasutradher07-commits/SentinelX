"""
SentinelX — Weather Data Fetcher (WeatherAPI.com, STATEWIDE / 30-DISTRICT VERSION)
=====================================================================================
Same role as fetch_weather_data_odisha.py, switched to WeatherAPI.com. Fetches
a separate 5-day forecast for each of Odisha's 30 district centroids.

SETUP: same as fetch_weather_data_weatherapi.py — sign up free at
https://www.weatherapi.com/, paste your key into WEATHERAPI_KEY below.

NOTE: 30 sequential API calls. On the free plan (2 requests/second limit),
this takes well under a minute; a small delay is added between calls to stay
safely under any rate limit.

HOW TO RUN:
1. Make sure `odisha_district_centroids.json` is in the same folder.
2. Install dependencies:
       pip install requests
3. Set WEATHERAPI_KEY below.
4. Run:
       python fetch_weather_data_odisha_weatherapi.py
5. Output: `odisha_district_weather_forecast.csv` — same column schema as the
   Open-Meteo version, so thermal_stress_engine_odisha.py needs NO changes.
"""

import json
import csv
import time
import requests

WEATHERAPI_KEY = "34b0083b19ed408b8ad65436263008"
FORECAST_DAYS = 5  # lower to 3 if your plan doesn't allow 5
DISTRICT_CENTROIDS_PATH = "odisha_district_centroids.json"
OUTPUT_CSV_PATH = "odisha_district_weather_forecast.csv"


def fetch_district_weather(lat, lon):
    url = "http://api.weatherapi.com/v1/forecast.json"
    params = {
        "key": WEATHERAPI_KEY, "q": f"{lat},{lon}",
        "days": FORECAST_DAYS, "aqi": "no", "alerts": "no",
    }
    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"WeatherAPI.com request failed ({resp.status_code}): {resp.text}")
    return resp.json()


def load_district_centroids(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    if WEATHERAPI_KEY == "PASTE_YOUR_WEATHERAPI_KEY_HERE":
        print("ERROR: Set WEATHERAPI_KEY at the top of this script first — "
              "sign up free at https://www.weatherapi.com/")
        return

    print(f"Loading district centroids from {DISTRICT_CENTROIDS_PATH}...")
    districts = load_district_centroids(DISTRICT_CENTROIDS_PATH)
    print(f"Loaded {len(districts)} districts")

    print(f"Writing {OUTPUT_CSV_PATH} (fetching weather per district)...")
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
                for day in weather["forecast"]["forecastday"]:
                    for hour in day["hour"]:
                        ts = hour["time"].replace(" ", "T")
                        wind_ms = round(hour["wind_kph"] / 3.6, 2)
                        solar = hour.get("short_rad", 0) or 0
                        writer.writerow([
                            d["district"], d["population_2011_est"],
                            d["centroid_lat"], d["centroid_lon"],
                            ts, hour["temp_c"], hour["humidity"], wind_ms, solar,
                            hour["feelslike_c"],
                        ])
            except Exception as e:
                print(f"    WARNING: failed for {d['district']}: {e}")

            time.sleep(0.5)  # stay comfortably under free-tier rate limits

    print("Done! Output:", OUTPUT_CSV_PATH)


if __name__ == "__main__":
    main()
