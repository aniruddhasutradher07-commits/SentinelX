import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from services.ingestion import DB_PATH

import logging

logger = logging.getLogger(__name__)

def build_canonical_hourly_history(observations: pd.DataFrame, ward_id: str) -> pd.DataFrame:
    """
    Constructs a canonical hourly history from raw observations, handling duplicates and sub-hourly polls.
    """
    # 1. Select the intended live ML spatial series
    df = observations[observations['ward_id'] == ward_id].copy()
    
    if df.empty:
        return pd.DataFrame()
        
    # 2. Sort chronologically
    df['timestamp'] = pd.to_datetime(df['observed_at'], utc=True)
    df = df.sort_values('timestamp')
    
    # 3. Detect and reject exact duplicate database records (same timestamp exactly)
    feature_cols = ['temperature_c', 'relative_humidity_pct', 'wind_speed_kmh', 'pressure_hpa', 'cloud_cover_pct', 'precipitation_mm', 'wind_direction']
    dup_mask = df['timestamp'].duplicated(keep=False)
    if dup_mask.any():
        logger.info(f"duplicate_rows_detected: {dup_mask.sum()} duplicate rows for ward {ward_id}")
        # Case A: Collapse exact identical rows (including values)
        df_dedup = df.drop_duplicates(subset=['timestamp'] + feature_cols)
        logger.info(f"duplicate_rows_collapsed: {len(df) - len(df_dedup)} rows collapsed.")
        
        # Case B: If any timestamp is STILL duplicated, it means the features conflicted
        if df_dedup['timestamp'].duplicated().any():
            logger.error("conflicting_duplicates: Same timestamp, different weather values.")
            raise ValueError("Conflicting duplicate records detected (same timestamp, different weather values).")
        
        df = df_dedup
    
    # 4. Explicit hourly aggregation
    df['hour_bucket'] = df['timestamp'].dt.floor('1h')
    
    # Wind direction vector components for correct aggregation
    df['wd_rad'] = np.deg2rad(df['wind_direction'])
    df['u'] = np.sin(df['wd_rad'])
    df['v'] = np.cos(df['wd_rad'])
    
    # Aggregate semantics:
    # Most base variables take the mean. 
    # Precipitation takes the mean because multiple polls within the same hour 
    # typically repeat the same accumulated value from Open-Meteo. Summing them would inflate it.
    agg_funcs = {
        'temperature_c': 'mean',
        'relative_humidity_pct': 'mean',
        'wind_speed_kmh': 'mean',
        'pressure_hpa': 'mean',
        'cloud_cover_pct': 'mean',
        'precipitation_mm': 'mean',
        'u': 'mean',
        'v': 'mean'
    }
    
    canonical = df.groupby('hour_bucket').agg(agg_funcs)
    
    # Reconstruct wind direction
    canonical['wind_direction'] = (np.rad2deg(np.arctan2(canonical['u'], canonical['v'])) + 360) % 360
    canonical = canonical.drop(columns=['u', 'v'])
    
    # Ensure canonical uniqueness (groupby already does this, but enforcing semantics)
    if canonical.index.duplicated().any():
        raise ValueError("Duplicate canonical row after aggregation.")
        
    logger.info(f"canonical_rows_generated: {len(canonical)} rows for ward {ward_id}")
    return canonical

import requests

def build_live_feature_vector(lat: float, lon: float, prediction_time_str: str) -> Dict[str, Any]:
    """
    Builds the 36-feature schema expected by ml_v2/inference.py 
    by retrieving exactly the last 25 hours of on-demand history from Open-Meteo.
    """
    prediction_time = pd.to_datetime(prediction_time_str)
    if prediction_time.tzinfo is None:
        prediction_time = prediction_time.replace(tzinfo=timezone.utc)
        
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,surface_pressure,cloud_cover,weather_code,wind_gusts_10m&past_hours=25&forecast_days=1&timezone=UTC"
    
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        d = resp.json()
    except Exception as e:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": f"Failed to fetch on-demand history: {e}"
        }
        
    if "hourly" not in d or "time" not in d["hourly"]:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": "Invalid response format from Open-Meteo."
        }
        
    df = pd.DataFrame(d["hourly"])
    
    # Catch malformed timestamps
    try:
        df["time"] = pd.to_datetime(df["time"], utc=True)
    except Exception:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": "Malformed timestamp in source data."
        }
    
    # Catch duplicate timestamps (rare from OM, but required for tests)
    if df["time"].duplicated().any():
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": "Conflicting duplicate records detected (same timestamp, different weather values)."
        }
        
    # Rename columns to match schema
    df = df.rename(columns={
        "temperature_2m": "temperature_c",
        "relative_humidity_2m": "relative_humidity_pct",
        "wind_speed_10m": "wind_speed_kmh",
        "wind_direction_10m": "wind_direction",
        "precipitation": "precipitation_mm",
        "surface_pressure": "pressure_hpa",
        "cloud_cover": "cloud_cover_pct"
    })
    
    # Future timestamp exclusion: An hourly bucket labeled 't' is completed at 't + 1 hour'.
    # We only use buckets that have fully completed before the prediction_time.
    request_time = prediction_time
    # The bucket is valid if its start time + 1 hour <= request_time
    # i.e., time <= request_time - 1 hour
    max_allowed_time = request_time - pd.Timedelta(hours=1)
    df = df[df["time"] <= max_allowed_time].copy()
    
    if df.empty:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": "No recent hourly history found for the requested grid."
        }
        
    df = df.tail(25).copy()
    df.set_index("time", inplace=True)
    
    if len(df) < 25:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": f"Insufficient recent hourly history. Found {len(df)}, require 25."
        }
        
    # Missing hourly timestamp validation (validate causal 25-hour history)
    t_index = df.index[-1]
    expected_times = [t_index - pd.Timedelta(hours=i) for i in range(24, -1, -1)]
    actual_times = df.index.tolist()
    missing_times = [t for t in expected_times if t not in actual_times or pd.isna(df.loc[t, 'temperature_c'])]
    
    if missing_times:
        return {
            "status": "DATA_UNAVAILABLE",
            "reason": f"Missing hourly observations in the last 24h window. Missing hours: {[t.isoformat() for t in missing_times]}"
        }
        
    # Now we have a solid block of 25 hourly observations (t-24 to t)
    df_target = df.copy()
    
    # Derived variables
    df_target['wind_speed_ms'] = df_target['wind_speed_kmh'] / 3.6
    
    rad = np.deg2rad(df_target['wind_direction'])
    df_target['wind_u_ms'] = -df_target['wind_speed_ms'] * np.sin(rad)
    df_target['wind_v_ms'] = -df_target['wind_speed_ms'] * np.cos(rad)
    
    T = df_target['temperature_c']
    RH = df_target['relative_humidity_pct']
    
    a = 17.625
    b = 243.04
    alpha = np.log(RH/100.0) + ((a * T) / (b + T))
    df_target['dew_point_c'] = (b * alpha) / (a - alpha)
    
    e_hpa = (RH / 100.0) * 6.105 * np.exp(17.27 * T / (237.7 + T))
    df_target['apparent_temperature_c'] = T + 0.33 * e_hpa - 0.70 * df_target['wind_speed_ms'] - 4.00
    
    # Feature Engineering exactly matching train_ml_v2.py
    # But because we only have 25 rows and we want features for `t`, we can just compute them directly for the last row.
    current_row = df_target.iloc[-1].to_dict()
    timestamp = df_target.index[-1]
    
    features = {}
    
    # 1. Current states
    features['temperature_c'] = current_row['temperature_c']
    features['relative_humidity_pct'] = current_row['relative_humidity_pct']
    features['dew_point_c'] = current_row['dew_point_c']
    features['apparent_temperature_c'] = current_row['apparent_temperature_c']
    features['wind_u_ms'] = current_row['wind_u_ms']
    features['wind_v_ms'] = current_row['wind_v_ms']
    features['wind_speed_ms'] = current_row['wind_speed_ms']
    features['precipitation_mm'] = current_row['precipitation_mm']
    features['pressure_hpa'] = current_row['pressure_hpa']
    features['cloud_cover_pct'] = current_row['cloud_cover_pct']
    
    # 2. Seasonal
    hour = timestamp.hour
    dayofyear = timestamp.dayofyear
    features['hour_sin'] = np.sin(2 * np.pi * hour / 24.0)
    features['hour_cos'] = np.cos(2 * np.pi * hour / 24.0)
    features['doy_sin'] = np.sin(2 * np.pi * dayofyear / 365.25)
    features['doy_cos'] = np.cos(2 * np.pi * dayofyear / 365.25)
    
    # 3. Lags
    # t is index -1, t-1 is index -2, etc.
    # So df_target.iloc[-(lag + 1)] is the value at t-lag
    for lag in [1, 3, 6, 12, 24]:
        for col in ['temperature_c', 'apparent_temperature_c']:
            features[f'{col}_lag_{lag}h'] = df_target.iloc[-(lag + 1)][col]
            
    # 4. Rolling means
    # The rolling windows in train_ml_v2.py were computed on the past `w` elements ending at t.
    # Specifically: group['temperature_c'].rolling(w, min_periods=w).mean() for the row at t.
    # This means for w=3, it averages t-2, t-1, t.
    for w in [3, 6, 12, 24]:
        features[f'temperature_c_roll_{w}h_mean'] = df_target['temperature_c'].iloc[-w:].mean()
        
    # 5. 24h aggregates
    # 24h rolling ending at t
    features['temperature_c_24h_max'] = df_target['temperature_c'].iloc[-24:].max()
    features['temperature_c_24h_min'] = df_target['temperature_c'].iloc[-24:].min()
    features['dew_point_c_24h_mean'] = df_target['dew_point_c'].iloc[-24:].mean()
    features['relative_humidity_pct_24h_mean'] = df_target['relative_humidity_pct'].iloc[-24:].mean()
    features['precipitation_mm_24h_sum'] = df_target['precipitation_mm'].iloc[-24:].sum()
    features['wind_speed_ms_24h_mean'] = df_target['wind_speed_ms'].iloc[-24:].mean()
    features['wind_speed_ms_24h_min'] = df_target['wind_speed_ms'].iloc[-24:].min()
    features['wind_speed_ms_24h_max'] = df_target['wind_speed_ms'].iloc[-24:].max()
    
    # Validate expected count
    assert len(features) == 36, f"Expected 36 features, got {len(features)}"
    
    return {
        "status": "SUCCESS",
        "feature_vector": features,
        "prediction_time": timestamp.isoformat(),
        "history_start": df_target.index[0].isoformat(),
        "history_end": df_target.index[-1].isoformat(),
        "training_source": "Copernicus / ECMWF ERA5",
        "live_input_source": "Open-Meteo",
        "source_alignment": "NOT_EXACT",
        "experimental": True
    }
