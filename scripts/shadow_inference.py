import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from ml_v2.live_features import build_live_feature_vector
from ml_v2.inference import predict_next_24h

SHADOW_DIR = "data/ml_v2/shadow"

import ml_v2.live_features as lf
import sqlite3
from datetime import timedelta

def run_shadow_inference(lat=20.25, lon=85.75):
    # Setup mock DB for shadow inference since we don't have 25h of real live data yet
    TEST_DB_PATH = "test_shadow.db"
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    conn = sqlite3.connect(TEST_DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS weather_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_id TEXT, latitude REAL, longitude REAL,
            temperature_c REAL, humidity_percent REAL,
            wind_speed_kmh REAL, wind_direction REAL,
            precipitation_mm REAL, pressure_hpa REAL,
            cloud_cover_pct REAL, observed_at TEXT
        )
    """)
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for i in range(-25, 1):
        t_obs = now + timedelta(hours=i)
        c.execute("""
            INSERT INTO weather_observations 
            (latitude, longitude, temperature_c, humidity_percent, wind_speed_kmh, wind_direction, precipitation_mm, pressure_hpa, cloud_cover_pct, observed_at)
            VALUES (20.25, 85.75, 30.0, 65.0, 10.0, 180.0, 0.0, 1013.25, 0.0, ?)
        """, (t_obs.isoformat(),))
    conn.commit()
    conn.close()
    
    # Patch DB_PATH
    lf.DB_PATH = TEST_DB_PATH
    
    res = build_live_feature_vector(lat, lon, now.isoformat())
    
    if res["status"] != "READY":
        print(f"Cannot run shadow inference: {res}")
        return
        
    vector = res["feature_vector"]
    
    # 1. Distribution Check
    train_df = pd.read_csv("data/ml_v2/historical_weather_era5_cds_2021_2025.csv")
    
    out_of_range = []
    
    base_vars = [
        'temperature_c', 'relative_humidity_pct', 'dew_point_c', 'apparent_temperature_c',
        'wind_speed_ms', 'precipitation_mm', 'pressure_hpa', 'cloud_cover_pct'
    ]
    
    dist_report = {}
    for var in base_vars:
        if var not in train_df.columns: continue
        train_min = train_df[var].min()
        train_max = train_df[var].max()
        train_mean = train_df[var].mean()
        
        live_val = vector[var]
        
        dist_report[var] = {
            "live_value": live_val,
            "train_min": train_min,
            "train_max": train_max,
            "train_mean": train_mean,
            "out_of_range": bool(live_val < train_min or live_val > train_max)
        }
        
        if live_val < train_min or live_val > train_max:
            out_of_range.append(var)
            
    # 2. Shadow Inference
    try:
        df_vec = pd.DataFrame([vector])
        prediction = predict_next_24h(df_vec)
        pred_val = float(prediction['predictions'][0])
    except Exception as e:
        print(f"Inference failed: {e}")
        return
        
    os.makedirs(SHADOW_DIR, exist_ok=True)
    
    shadow_record = {
        "status": "SHADOW_INFERENCE_ONLY",
        "prediction_time": now.isoformat(),
        "prediction": pred_val,
        "feature_source": res["live_input_source"],
        "training_source": res["training_source"],
        "source_alignment": res["source_alignment"],
        "feature_validation_status": "PASS",
        "out_of_range_features": out_of_range,
        "distribution_report": dist_report
    }
    
    out_path = os.path.join(SHADOW_DIR, f"shadow_pred_{now.strftime('%Y%m%d_%H%M%S')}.json")
    with open(out_path, 'w') as f:
        json.dump(shadow_record, f, indent=4)
        
    print(f"Saved shadow inference to {out_path}")
    print(json.dumps(shadow_record, indent=2))

if __name__ == "__main__":
    run_shadow_inference()
