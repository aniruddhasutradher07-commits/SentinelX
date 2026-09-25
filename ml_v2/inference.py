import os
import json
import joblib
import pandas as pd

MODEL_DIR = "data/ml_v2/models/"
MODEL_PATH = os.path.join(MODEL_DIR, "ml_v2_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "ml_v2_model_metadata.json")

def predict_next_24h(features: pd.DataFrame):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(META_PATH):
        return {"status": "MODEL_NOT_FOUND"}
        
    with open(META_PATH, "r") as f:
        meta = json.load(f)
        
    required_features = meta["features"]
    missing = [f for f in required_features if f not in features.columns]
    
    if missing:
        raise ValueError(f"Missing required features: {missing}")
        
    model = joblib.load(MODEL_PATH)
    
    # Ensure column order matches
    X = features[required_features]
    
    preds = model.predict(X)
    
    return {
        "status": "SUCCESS",
        "model_type": meta["model_type"],
        "target": meta["target_definition"],
        "predictions": preds.tolist()
    }
