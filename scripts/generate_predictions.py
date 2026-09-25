import os
import json
import pandas as pd
import numpy as np

# We'll use the feature generation from train_ml_v2.py
from train_ml_v2 import create_features_and_target
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))
import ml_v2.inference as inference

DATA_FILE = "data/ml_v2/historical_weather_era5_cds_2021_2025.csv"
PREDICTIONS_DIR = "data/ml_v2/predictions/"

def generate_predictions():
    print("Loading data for inference...")
    df = pd.read_csv(DATA_FILE)
    
    # We use the same feature engineering as training
    df_features, target_col = create_features_and_target(df)
    
    # Run inference
    result = inference.predict_next_24h(df_features)
    
    if result["status"] != "SUCCESS":
        print("Inference failed:", result)
        return
        
    preds = result["predictions"]
    model_version = result["model_type"]
    
    # Create prediction dataframe
    df_pred = pd.DataFrame({
        "timestamp": df_features["timestamp"],
        "era5_grid_latitude": df_features["era5_grid_latitude"],
        "era5_grid_longitude": df_features["era5_grid_longitude"],
        "target_name": "NEXT_24H_MAX_APPARENT_TEMPERATURE",
        "prediction": preds,
        "model_version": model_version
    })
    
    os.makedirs(PREDICTIONS_DIR, exist_ok=True)
    out_path = os.path.join(PREDICTIONS_DIR, "predictions.csv")
    df_pred.to_csv(out_path, index=False)
    print(f"Generated {len(df_pred)} predictions to {out_path}")

if __name__ == "__main__":
    generate_predictions()
