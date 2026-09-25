import os
import json
import time
import requests
import pandas as pd
from datetime import datetime, date, timedelta

GEOJSON_PATH = "wards_bhubaneswar.geojson"
OUTPUT_DIR = "data/ml_v2"
RAW_DIR = os.path.join(OUTPUT_DIR, "raw")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "historical_weather_clean.csv")
REPORT_PATH = "docs/ml_v2_data_foundation_report.md"

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs("docs", exist_ok=True)

def get_ward_centroids():
    with open(GEOJSON_PATH, "r") as f:
        data = json.load(f)
    
    wards = []
    for feat in data["features"]:
        prop = feat["properties"]
        geom = feat["geometry"]
        ward_no = prop.get("wardno", "Unknown")
        
        # Simple centroid approximation
        if geom["type"] == "Polygon":
            coords = geom["coordinates"][0]
        elif geom["type"] == "MultiPolygon":
            coords = geom["coordinates"][0][0]
        else:
            continue
            
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        centroid_lon = sum(lons) / len(lons)
        centroid_lat = sum(lats) / len(lats)
        
        wards.append({
            "ward_no": ward_no,
            "requested_latitude": centroid_lat,
            "requested_longitude": centroid_lon
        })
    return pd.DataFrame(wards)

def fetch_batch_with_cache(session, batch_idx, lat_list, lon_list, start_date, end_date, years):
    cache_file = os.path.join(RAW_DIR, f"batch_{batch_idx}_{years}y.json")
    if os.path.exists(cache_file):
        print(f"  Batch {batch_idx} ({years}y) found in cache.")
        with open(cache_file, "r") as f:
            return json.load(f), False
            
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": ",".join(map(str, lat_list)),
        "longitude": ",".join(map(str, lon_list)),
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover",
        "timezone": "GMT"
    }
    
    print(f"  Fetching Batch {batch_idx} from API...")
    time.sleep(2) # rate limit backoff
    response = session.get(url, params=params, timeout=60)
    
    if response.status_code == 429:
        raise Exception("429 Too Many Requests")
    elif response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")
        
    data = response.json()
    if isinstance(data, dict) and "hourly" in data:
        data = [data] # Convert single location response to list format
        
    with open(cache_file, "w") as f:
        json.dump(data, f)
        
    return data, True

def process_data(all_data, wards_df, unique_coords):
    all_records = []
    quality_issues = 0
    
    for b_idx, chunk_resp in enumerate(all_data):
        for i, resp in enumerate(chunk_resp):
            global_idx = b_idx * 5 + i
            if global_idx >= len(unique_coords):
                continue
                
            loc_row = unique_coords.iloc[global_idx]
            source_lat = resp["latitude"]
            source_lon = resp["longitude"]
            
            # Wards exactly matching these requested coords
            associated_wards = wards_df[(wards_df["requested_latitude"] == loc_row["requested_latitude"]) & 
                                        (wards_df["requested_longitude"] == loc_row["requested_longitude"])]
            
            hourly = resp["hourly"]
            times = hourly["time"]
            
            for t_idx, ts in enumerate(times):
                temp = hourly["temperature_2m"][t_idx]
                hum = hourly["relative_humidity_2m"][t_idx]
                dew = hourly["dew_point_2m"][t_idx]
                app = hourly["apparent_temperature"][t_idx]
                precip = hourly["precipitation"][t_idx]
                rain = hourly["rain"][t_idx]
                wind_s = hourly["wind_speed_10m"][t_idx]
                wind_d = hourly["wind_direction_10m"][t_idx]
                pressure = hourly["surface_pressure"][t_idx]
                cloud = hourly["cloud_cover"][t_idx]
                
                if hum is not None and (hum < 0 or hum > 100): quality_issues += 1
                if precip is not None and precip < 0: quality_issues += 1
                if wind_s is not None and wind_s < 0: quality_issues += 1
                
                for _, w_row in associated_wards.iterrows():
                    all_records.append({
                        "timestamp": ts,
                        "ward_no": w_row["ward_no"],
                        "requested_latitude": w_row["requested_latitude"],
                        "requested_longitude": w_row["requested_longitude"],
                        "source_latitude": source_lat,
                        "source_longitude": source_lon,
                        "temperature_c": temp,
                        "humidity_pct": hum,
                        "dew_point_c": dew,
                        "apparent_temperature_c": app,
                        "precipitation_mm": precip,
                        "rain_mm": rain,
                        "wind_speed_ms": wind_s / 3.6 if wind_s is not None else None,
                        "wind_direction_deg": wind_d,
                        "pressure_hpa": pressure,
                        "cloud_cover_pct": cloud
                    })
    
    return pd.DataFrame(all_records), quality_issues

def build_dataset():
    # 1. Load Wards and Deduplicate
    wards_df = get_ward_centroids()
    # Deduplicate strictly on requested coordinates
    unique_coords = wards_df[["requested_latitude", "requested_longitude"]].drop_duplicates().reset_index(drop=True)
    
    today = date.today()
    end_date = (today - timedelta(days=5)).isoformat()
    
    session = requests.Session()
    chunk_size = 5
    
    report_lines = [
        "# ML V2 Data Foundation Report",
        "\n## Overview",
        "- **SOURCE:** Open-Meteo Historical Weather API (historical meteorological reanalysis data)",
        f"- **TOTAL WARDS:** {len(wards_df)}",
        f"- **UNIQUE REQUEST LOCATIONS:** {len(unique_coords)}",
        "\n## Backup Source Design",
        "If Open-Meteo remains rate-limited, Copernicus ERA5 direct access via CDS API is the designated fallback source.",
        "\n## Acquisition Log"
    ]
    
    best_df = None
    best_years = 0
    hit_429 = False
    
    for years in [1, 3, 5]:
        if hit_429:
            report_lines.append(f"\n### {years}-YEAR BATCH: SKIPPED (Prior 429 Error)")
            break
            
        start_date = (today - timedelta(days=5 + 365*years)).isoformat()
        print(f"\nAttempting {years} year(s): {start_date} to {end_date}")
        report_lines.append(f"\n### {years}-YEAR BATCH")
        report_lines.append(f"- **Period:** {start_date} to {end_date}")
        
        all_data = []
        success = True
        
        for i in range(0, len(unique_coords), chunk_size):
            chunk = unique_coords.iloc[i:i + chunk_size]
            lats = chunk["requested_latitude"].tolist()
            lons = chunk["requested_longitude"].tolist()
            batch_idx = i // chunk_size
            
            try:
                data, fetched_live = fetch_batch_with_cache(session, batch_idx, lats, lons, start_date, end_date, years)
                all_data.append(data)
            except Exception as e:
                print(f"  Error on batch {batch_idx}: {e}")
                if "429" in str(e):
                    hit_429 = True
                    report_lines.append(f"- **Status:** FAILED (HTTP 429 on batch {batch_idx})")
                else:
                    report_lines.append(f"- **Status:** FAILED ({e} on batch {batch_idx})")
                success = False
                break
                
        if success:
            df, quality_issues = process_data(all_data, wards_df, unique_coords)
            best_df = df
            best_years = years
            report_lines.append(f"- **Status:** SUCCESS")
            report_lines.append(f"- **Rows Extracted:** {len(df)}")
            print(f"Successfully processed {years} year(s) of data.")
    
    if best_years >= 2: # At least 2 years is minimum fallback for actual ML
        best_df.to_csv(OUTPUT_CSV, index=False)
        report_lines.append("\n## Final Dataset")
        report_lines.append(f"- **Dataset Created:** {OUTPUT_CSV}")
        report_lines.append(f"- **Final Period:** {best_years} Years")
        report_lines.append(f"- **Unique Source Grid Locations:** {best_df[['source_latitude', 'source_longitude']].drop_duplicates().shape[0]}")
        missingness = best_df.isnull().mean() * 100
        report_lines.append("\n### Missingness")
        report_lines.append("```\n" + missingness.to_string() + "\n```")
    else:
        report_lines.append("\n## Final Dataset")
        report_lines.append("- **Dataset Created:** BLOCKED")
        report_lines.append("- **Reason:** Failed to extract at least 2 complete years of historical data. No dataset was created.")
    
    with open(REPORT_PATH, "w") as f:
        f.write("\n".join(report_lines))
        
    print(f"\nScript finished. Output written to {REPORT_PATH}")
    
if __name__ == "__main__":
    build_dataset()
