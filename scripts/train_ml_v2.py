import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_FILE = "data/ml_v2/historical_weather_era5_cds_2021_2025.csv"
MODEL_DIR = "data/ml_v2/models/"

def create_features_and_target(df):
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values(by=['era5_grid_latitude', 'era5_grid_longitude', 'timestamp']).reset_index(drop=True)

    # Seasonal Features
    df['hour'] = df['timestamp'].dt.hour
    df['dayofyear'] = df['timestamp'].dt.dayofyear
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['doy_sin'] = np.sin(2 * np.pi * df['dayofyear'] / 365.25)
    df['doy_cos'] = np.cos(2 * np.pi * df['dayofyear'] / 365.25)
    
    # Target: max apparent temp from t+1 to t+24
    # Group by grid
    target_col = 'NEXT_24H_MAX_APPARENT_TEMPERATURE'
    
    processed_dfs = []
    
    for (lat, lon), group in df.groupby(['era5_grid_latitude', 'era5_grid_longitude']):
        group = group.sort_values('timestamp').copy()
        group = group.set_index('timestamp')
        
        # TARGET
        # We need max of t+1 to t+24. We can do a rolling max of 24h, shifted backwards by 24h
        # shift(-24) shifts the data UP by 24 periods. 
        # rolling(24).max() looks backward. So if we shift(-24) then rolling(24), it is effectively forward.
        # Wait, if we want t+1 to t+24:
        # shifted_series = group['apparent_temperature_c'].shift(-1)
        # target = shifted_series.rolling(24, min_periods=24).max().shift(-23)
        # Let's use index-based rolling to be safe.
        
        # Or simpler: reverse the series, do rolling(24) backward, then reverse back, then shift(-1).
        group[target_col] = group['apparent_temperature_c'].shift(-1)[::-1].rolling(24, min_periods=24).max()[::-1]
        
        # Persistence Baseline
        # max of previous 24h (t-23 to t). 
        # wait, previous 24h: rolling(24, min_periods=24).max()
        group['baseline_persistence'] = group['apparent_temperature_c'].rolling(24, min_periods=24).max()
        
        # Lags
        for lag in [1, 3, 6, 12, 24]:
            for col in ['temperature_c', 'apparent_temperature_c']:
                group[f'{col}_lag_{lag}h'] = group[col].shift(lag)
                
        # Rolling means
        for w in [3, 6, 12, 24]:
            group[f'temperature_c_roll_{w}h_mean'] = group['temperature_c'].rolling(w, min_periods=w).mean()
            
        # 24h aggregates
        group['temperature_c_24h_max'] = group['temperature_c'].rolling(24, min_periods=24).max()
        group['temperature_c_24h_min'] = group['temperature_c'].rolling(24, min_periods=24).min()
        group['dew_point_c_24h_mean'] = group['dew_point_c'].rolling(24, min_periods=24).mean()
        group['relative_humidity_pct_24h_mean'] = group['relative_humidity_pct'].rolling(24, min_periods=24).mean()
        group['precipitation_mm_24h_sum'] = group['precipitation_mm'].rolling(24, min_periods=24).sum()
        group['wind_speed_ms_24h_mean'] = group['wind_speed_ms'].rolling(24, min_periods=24).mean()
        group['wind_speed_ms_24h_min'] = group['wind_speed_ms'].rolling(24, min_periods=24).min()
        group['wind_speed_ms_24h_max'] = group['wind_speed_ms'].rolling(24, min_periods=24).max()
        
        processed_dfs.append(group.reset_index())
        
    df = pd.concat(processed_dfs, ignore_index=True)
    
    # Drop rows where target is missing (the last 24h) or rolling features missing
    df = df.dropna(subset=[target_col, 'baseline_persistence']).dropna()
    
    return df, target_col

def run_training():
    print("Loading data...")
    df = pd.read_csv(DATA_FILE)
    df, target_col = create_features_and_target(df)
    
    features = [
        'temperature_c', 'relative_humidity_pct', 'dew_point_c', 'apparent_temperature_c',
        'wind_u_ms', 'wind_v_ms', 'wind_speed_ms', 'precipitation_mm', 'pressure_hpa', 'cloud_cover_pct',
        'hour_sin', 'hour_cos', 'doy_sin', 'doy_cos',
        'temperature_c_lag_1h', 'apparent_temperature_c_lag_1h',
        'temperature_c_lag_3h', 'apparent_temperature_c_lag_3h',
        'temperature_c_lag_6h', 'apparent_temperature_c_lag_6h',
        'temperature_c_lag_12h', 'apparent_temperature_c_lag_12h',
        'temperature_c_lag_24h', 'apparent_temperature_c_lag_24h',
        'temperature_c_roll_3h_mean', 'temperature_c_roll_6h_mean',
        'temperature_c_roll_12h_mean', 'temperature_c_roll_24h_mean',
        'temperature_c_24h_max', 'temperature_c_24h_min',
        'dew_point_c_24h_mean', 'relative_humidity_pct_24h_mean',
        'precipitation_mm_24h_sum',
        'wind_speed_ms_24h_mean', 'wind_speed_ms_24h_min', 'wind_speed_ms_24h_max'
    ]
    
    # Chronological Split
    train_mask = (df['timestamp'] >= '2021-01-01') & (df['timestamp'] <= '2023-12-31 23:59:59')
    val_mask = (df['timestamp'] >= '2024-01-01') & (df['timestamp'] <= '2024-12-31 23:59:59')
    test_mask = (df['timestamp'] >= '2025-01-01') & (df['timestamp'] <= '2025-12-31 23:59:59')
    
    train_df = df[train_mask]
    val_df = df[val_mask]
    test_df = df[test_mask]
    
    print("\n==================================================")
    print("TRAINING SAFETY: PRE-TRAINING CHECKS")
    print("==================================================")
    print(f"DATASET:\nRows total: {len(df)}\nGrids: {df['era5_grid_latitude'].nunique()}\nDate Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"\nFEATURES:\nCount: {len(features)}\nNames: {features}")
    print(f"\nTARGET:\nName: {target_col}\nDefinition: max(apparent_temperature_c[t+1 ... t+24])")
    print(f"\nSPLITS:\nTrain: {len(train_df)} rows ({train_df['timestamp'].min()} to {train_df['timestamp'].max()})")
    print(f"Validation: {len(val_df)} rows ({val_df['timestamp'].min()} to {val_df['timestamp'].max()})")
    print(f"Test: {len(test_df)} rows ({test_df['timestamp'].min()} to {test_df['timestamp'].max()})")
    print("==================================================\n")
    
    # Evaluate Baseline on Val
    def eval_model(y_true, y_pred, name="Model"):
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        r2 = r2_score(y_true, y_pred)
        return mae, rmse, r2
        
    base_mae, base_rmse, base_r2 = eval_model(val_df[target_col], val_df['baseline_persistence'])
    print(f"BASELINE (Persistence) on VAL - MAE: {base_mae:.4f}, RMSE: {base_rmse:.4f}, R2: {base_r2:.4f}")
    
    X_train, y_train = train_df[features], train_df[target_col]
    X_val, y_val = val_df[features], val_df[target_col]
    X_test, y_test = test_df[features], test_df[target_col]
    
    print("\nTraining RandomForest...")
    rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_val_preds = rf.predict(X_val)
    rf_mae, rf_rmse, rf_r2 = eval_model(y_val, rf_val_preds)
    print(f"RandomForest on VAL - MAE: {rf_mae:.4f}, RMSE: {rf_rmse:.4f}, R2: {rf_r2:.4f}")
    
    print("\nTraining HistGradientBoosting...")
    hgb = HistGradientBoostingRegressor(random_state=42)
    hgb.fit(X_train, y_train)
    hgb_val_preds = hgb.predict(X_val)
    hgb_mae, hgb_rmse, hgb_r2 = eval_model(y_val, hgb_val_preds)
    print(f"HistGradientBoosting on VAL - MAE: {hgb_mae:.4f}, RMSE: {hgb_rmse:.4f}, R2: {hgb_r2:.4f}")
    
    # Select Best Model based on MAE on VAL
    if rf_mae < hgb_mae:
        best_model = rf
        best_name = "RandomForest"
    else:
        best_model = hgb
        best_name = "HistGradientBoosting"
        
    print(f"\nSelected Model: {best_name}")
    
    # Test Evaluation
    print("\nEvaluating on untouched TEST set (2025)...")
    test_preds = best_model.predict(X_test)
    test_mae, test_rmse, test_r2 = eval_model(y_test, test_preds)
    
    base_test_mae, base_test_rmse, base_test_r2 = eval_model(y_test, test_df['baseline_persistence'])
    
    print(f"TEST BASELINE - MAE: {base_test_mae:.4f}, RMSE: {base_test_rmse:.4f}, R2: {base_test_r2:.4f}")
    print(f"TEST {best_name} - MAE: {test_mae:.4f}, RMSE: {test_rmse:.4f}, R2: {test_r2:.4f}")
    
    # Error Analysis
    test_df = test_df.copy()
    test_df['error'] = np.abs(test_df[target_col] - test_preds)
    test_df['month'] = test_df['timestamp'].dt.month
    
    print("\nMAE by Month (2025):")
    month_mae = test_df.groupby('month')['error'].mean()
    print(month_mae)
    
    print("\nMAE by Grid Point:")
    grid_mae = test_df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])['error'].mean()
    print(grid_mae)
    
    # Save Model Artifacts
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, "ml_v2_model.joblib")
    joblib.dump(best_model, model_path)
    
    metadata = {
        "model_type": best_name,
        "target_definition": "NEXT_24H_MAX_APPARENT_TEMPERATURE",
        "features": features,
        "train_period": [str(train_df['timestamp'].min()), str(train_df['timestamp'].max())],
        "val_period": [str(val_df['timestamp'].min()), str(val_df['timestamp'].max())],
        "test_period": [str(test_df['timestamp'].min()), str(test_df['timestamp'].max())],
        "training_timestamp": datetime.now().isoformat(),
        "source_dataset": DATA_FILE,
        "provenance": "Copernicus / ECMWF ERA5",
        "test_metrics": {
            "mae": float(test_mae),
            "rmse": float(test_rmse),
            "r2": float(test_r2)
        }
    }
    
    with open(os.path.join(MODEL_DIR, "ml_v2_model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nModel saved to {model_path}")
    print("ML_V2_FIRST_TRAINING_PASS")
    
if __name__ == "__main__":
    run_training()
