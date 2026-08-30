"""
SentinelX — Weather Data Fetcher (WeatherAPI.com version)
=============================================================
Same role as the original fetch_weather_data.py, switched from Open-Meteo to
WeatherAPI.com. Pulls a 5-day hourly forecast for Bhubaneswar and applies it
to every ward centroid (city-level reading, same as before — per-ward calls
are commented at the bottom if you want true per-ward variation).

HOW TO GET AN API KEY (free):
1. Go to https://www.weatherapi.com/ and click "Sign Up" (top right).
2. Verify your email, then go to your Dashboard — your API key is shown
   there immediately (no card required for the free tier).
3. Paste it into WEATHERAPI_KEY below.

NOTE ON FREE-TIER FORECAST LENGTH: WeatherAPI.com's free plan currently
supports up to 3 days of forecast (not 5) per the pricing page at the time
this script was written — if you hit a "days" error, lower FORECAST_DAYS to
3 below, or check your account dashboard for your plan's actual limit.

HOW TO RUN:
1. Make sure `wards_bhubaneswar.geojson` is in the same folder.
2. Install dependencies:
       pip install requests
3. Set WEATHERAPI_KEY below to your key.
4. Run:
       python fetch_weather_data.py
5. Output: `ward_weather_forecast.csv` — same column schema as the
   Open-Meteo version, so thermal_stress_engine.py needs NO changes.
"""

import json
import csv
import requests

# ---- CONFIG ----
WEATHERAPI_KEY = "34b0083b19ed408b8ad65436263008"
BHUBANESWAR_QUERY = "20.2961,85.8245"  # lat,lon — WeatherAPI accepts this directly
FORECAST_DAYS = 5  # lower to 3 if your plan doesn't allow 5
WARDS_GEOJSON_PATH = "wards_bhubaneswar.geojson"
OUTPUT_CSV_PATH = "ward_weather_forecast.csv"


def fetch_city_weather():
    url = "http://api.weatherapi.com/v1/forecast.json"
    params = {
        "key": WEATHERAPI_KEY,
        "q": BHUBANESWAR_QUERY,
        "days": FORECAST_DAYS,
        "aqi": "no",
        "alerts": "no",
    }
    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(
            f"WeatherAPI.com request failed ({resp.status_code}): {resp.text}\n"
            f"Common causes: invalid/missing API key, or 'days' exceeds your "
            f"plan's limit (try FORECAST_DAYS = 3)."
        )
    return resp.json()


def load_ward_centroids(path):
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
        if geom["type"] == "Polygon":
            ring = coords[0]
        elif geom["type"] == "MultiPolygon":
            ring = coords[0][0]
        else:
            continue

        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
        wards.append({
            "ward_no": ward_no, "zone": zone, "population": population,
            "centroid_lat": sum(lats) / len(lats), "centroid_lon": sum(lons) / len(lons),
        })
    return wards


def main():
    if WEATHERAPI_KEY == "PASTE_YOUR_WEATHERAPI_KEY_HERE":
        print("ERROR: Set WEATHERAPI_KEY at the top of this script first — "
              "sign up free at https://www.weatherapi.com/")
        return

    print("Fetching Bhubaneswar forecast from WeatherAPI.com...")
    weather = fetch_city_weather()

    forecast_days = weather["forecast"]["forecastday"]
    print(f"Got {len(forecast_days)} forecast day(s)")

    print(f"Loading ward centroids from {WARDS_GEOJSON_PATH}...")
    wards = load_ward_centroids(WARDS_GEOJSON_PATH)
    print(f"Loaded {len(wards)} wards")

    print(f"Writing {OUTPUT_CSV_PATH}...")
    with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ward_no", "zone", "population", "centroid_lat", "centroid_lon",
            "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c",
        ])
        for w in wards:
            for day in forecast_days:
                for hour in day["hour"]:
                    ts = hour["time"].replace(" ", "T")  # "2026-08-28 00:00" -> "2026-08-28T00:00"
                    wind_ms = round(hour["wind_kph"] / 3.6, 2)
                    solar = hour.get("short_rad", 0) or 0  # W/m^2; may be 0/absent on some plans
                    writer.writerow([
                        w["ward_no"], w["zone"], w["population"],
                        w["centroid_lat"], w["centroid_lon"],
                        ts,
                        hour["temp_c"], hour["humidity"], wind_ms, solar,
                        hour["feelslike_c"],
                    ])

    print("Done! Output:", OUTPUT_CSV_PATH)
    total_rows = len(wards) * sum(len(d["hour"]) for d in forecast_days)
    print(f"Rows: {total_rows}")


if __name__ == "__main__":
    main()

# To fetch TRUE per-ward weather instead of one city-level reading applied to
# all wards, loop fetch_city_weather() per ward centroid (67 calls, ~1-2 min):
#
# for w in wards:
#     r = requests.get("http://api.weatherapi.com/v1/forecast.json", params={
#         "key": WEATHERAPI_KEY, "q": f"{w['centroid_lat']},{w['centroid_lon']}",
#         "days": FORECAST_DAYS, "aqi": "no", "alerts": "no",
#     })
#     ward_weather[w["ward_no"]] = r.json()
