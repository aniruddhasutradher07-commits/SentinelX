"""
SentinelX — Weather Data Fetcher
=================================
Pulls current + 5-day hourly forecast (temperature, humidity, wind, solar
radiation, apparent temperature) from the free Open-Meteo API for Bhubaneswar,
then interpolates it to every ward centroid using the ward GeoJSON you already
downloaded (wards_bhubaneswar.geojson).

HOW TO RUN:
1. Make sure `wards_bhubaneswar.geojson` is in the same folder as this script
   (or update WARDS_GEOJSON_PATH below).
2. Install dependencies:
       pip install requests
3. Run:
       python fetch_weather_data.py
4. Output: `ward_weather_forecast.csv` — one row per ward per forecast hour.

No API key needed — Open-Meteo is free for non-commercial use.
Works on your own laptop or Google Colab (this sandbox blocks the domain,
which is why you're running it locally).
"""

import json
import csv
import requests

# ---- CONFIG ----
BHUBANESWAR_LAT = 20.2961
BHUBANESWAR_LON = 85.8245
FORECAST_DAYS = 5
WARDS_GEOJSON_PATH = "wards_bhubaneswar.geojson"
OUTPUT_CSV_PATH = "ward_weather_forecast.csv"

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",   # proxy for solar radiation (W/m^2)
    "apparent_temperature",
]


def fetch_city_weather():
    """Pull one city-level hourly forecast for Bhubaneswar."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": BHUBANESWAR_LAT,
        "longitude": BHUBANESWAR_LON,
        "hourly": ",".join(HOURLY_VARS),
        "forecast_days": FORECAST_DAYS,
        "timezone": "Asia/Kolkata",
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def load_ward_centroids(path):
    """
    Read ward GeoJSON and compute a simple centroid (avg of polygon vertices)
    for each ward. Good enough for city-scale interpolation; for production
    accuracy, swap in shapely's .centroid instead.
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    wards = []
    for feat in data["features"]:
        props = feat["properties"]
        ward_no = props.get("wardno", props.get("objectid"))
        zone = props.get("municipalzone", "")
        population = props.get("totalwardpopulation", None)

        geom = feat["geometry"]
        coords = geom["coordinates"]

        # Handle Polygon vs MultiPolygon
        if geom["type"] == "Polygon":
            ring = coords[0]
        elif geom["type"] == "MultiPolygon":
            ring = coords[0][0]
        else:
            continue

        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
        centroid_lon = sum(lons) / len(lons)
        centroid_lat = sum(lats) / len(lats)

        wards.append({
            "ward_no": ward_no,
            "zone": zone,
            "population": population,
            "centroid_lat": centroid_lat,
            "centroid_lon": centroid_lon,
        })
    return wards


def main():
    print("Fetching Bhubaneswar city-level weather forecast from Open-Meteo...")
    city_weather = fetch_city_weather()
    hourly = city_weather["hourly"]
    timestamps = hourly["time"]
    print(f"Got {len(timestamps)} hourly timestamps "
          f"({timestamps[0]} to {timestamps[-1]})")

    print(f"Loading ward centroids from {WARDS_GEOJSON_PATH}...")
    wards = load_ward_centroids(WARDS_GEOJSON_PATH)
    print(f"Loaded {len(wards)} wards")

    # NOTE: Open-Meteo free tier gives one profile per lat/lon call.
    # For true hyper-local variation you'd call per-ward centroid (67 calls),
    # but that's slow for a quick demo. This script uses the SAME city-level
    # weather for every ward as a v1 baseline, and clearly flags where you'd
    # plug in per-ward calls or MODIS LST for real spatial variation.
    #
    # To fetch per-ward (uncomment below) — takes ~1-2 min for 67 wards:
    #
    # ward_weather = {}
    # for w in wards:
    #     r = requests.get("https://api.open-meteo.com/v1/forecast", params={
    #         "latitude": w["centroid_lat"], "longitude": w["centroid_lon"],
    #         "hourly": ",".join(HOURLY_VARS), "forecast_days": FORECAST_DAYS,
    #         "timezone": "Asia/Kolkata",
    #     })
    #     ward_weather[w["ward_no"]] = r.json()["hourly"]

    print(f"Writing {OUTPUT_CSV_PATH}...")
    with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ward_no", "zone", "population", "centroid_lat", "centroid_lon",
            "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c",
        ])
        for w in wards:
            for i, ts in enumerate(timestamps):
                writer.writerow([
                    w["ward_no"], w["zone"], w["population"],
                    w["centroid_lat"], w["centroid_lon"],
                    ts,
                    hourly["temperature_2m"][i],
                    hourly["relative_humidity_2m"][i],
                    hourly["wind_speed_10m"][i],
                    hourly["shortwave_radiation"][i],
                    hourly["apparent_temperature"][i],
                ])

    print("Done! Output:", OUTPUT_CSV_PATH)
    print(f"Rows: {len(wards) * len(timestamps)} "
          f"({len(wards)} wards x {len(timestamps)} hours)")


if __name__ == "__main__":
    main()
