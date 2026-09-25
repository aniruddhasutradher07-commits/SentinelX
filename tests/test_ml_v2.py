import sys
import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app
from ml_v2.inference import predict_next_24h

client = TestClient(app)

def test_ml_v2_forecast_api_insufficient_history(monkeypatch):
    import requests
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code

        def json(self):
            return self.json_data

        def raise_for_status(self):
            if self.status_code != 200:
                raise requests.exceptions.HTTPError("Error")

    def mock_get(url, *args, **kwargs):
        # Return insufficient history (only 10 hours instead of 25)
        return MockResponse({
            "hourly": {
                "time": ["2026-09-24T12:00:00"] * 10,
                "temperature_2m": [30.0] * 10,
                "relative_humidity_2m": [65.0] * 10,
                "wind_speed_10m": [10.0] * 10,
                "wind_direction_10m": [180.0] * 10,
                "precipitation": [0.0] * 10,
                "surface_pressure": [1013.25] * 10,
                "cloud_cover": [0.0] * 10,
                "weather_code": [0.0] * 10,
                "wind_gusts_10m": [0.0] * 10,
            }
        })
        
    monkeypatch.setattr(requests, "get", mock_get)

    response = client.get("/api/v1/ml-v2/forecast?lat=20.25&lon=85.75")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    
    assert data["status"] == "DATA_UNAVAILABLE"
    assert "message" in data
    assert data["experimental"] is True

def test_ml_v2_forecast_api_success(monkeypatch):
    import ml_v2.live_features as lf
    import requests
    from datetime import datetime, timezone, timedelta
    
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code

        def json(self):
            return self.json_data

        def raise_for_status(self):
            if self.status_code != 200:
                raise requests.exceptions.HTTPError("Error")

    def mock_get(url, *args, **kwargs):
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        times = []
        temps = []
        for i in range(-25, 5):
            t_obs = now + timedelta(hours=i)
            times.append(t_obs.strftime("%Y-%m-%dT%H:00"))
            temps.append(30.0 + i)
            
        return MockResponse({
            "hourly": {
                "time": times,
                "temperature_2m": temps,
                "relative_humidity_2m": [65.0] * 30,
                "wind_speed_10m": [10.0] * 30,
                "wind_direction_10m": [180.0] * 30,
                "precipitation": [0.0] * 30,
                "surface_pressure": [1013.25] * 30,
                "cloud_cover": [0.0] * 30,
                "weather_code": [0.0] * 30,
                "wind_gusts_10m": [0.0] * 30,
            }
        })
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    response = client.get("/api/v1/ml-v2/forecast?lat=20.25&lon=85.75")
    assert response.status_code == 200
    data = response.json()
    
    print(data)
    assert data["status"] == "SUCCESS"
    assert "prediction" in data
    assert data["target"] == "NEXT_24H_MAX_APPARENT_TEMPERATURE"
    assert data["forecast_horizon"] == "Next 24 hours"
    assert data["training_source"] == "Copernicus / ECMWF ERA5"
    assert data["live_input_source"] == "Open-Meteo"
    assert data["source_alignment"] == "NOT_EXACT"
    assert data["experimental"] is True

def test_ml_v2_map_api():
    response = client.get("/api/v1/ml-v2/map")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    if data["status"] == "SUCCESS":
        assert isinstance(data["data"], list)
        if len(data["data"]) > 0:
            row = data["data"][0]
            assert "timestamp" in row
            assert "era5_grid_latitude" in row
            assert "prediction" in row

def test_inference_missing_features():
    # Test that missing features raise ValueError
    df_bad = pd.DataFrame({"temperature_c": [35.0]})
    with pytest.raises(ValueError, match="Missing required features"):
        predict_next_24h(df_bad)

def test_hazard_score_isolation():
    # Prove that the ML V2 model does not modify the environmental hazard score
    from core.risk_rules import evaluate_environmental_risk
    
    # Simple risk evaluation
    result = evaluate_environmental_risk(39.5, 68.0, 9.0, 142.0, 1.8, False)
    
    # Assert that ML predictions are not part of the standard risk result output dict
    assert "ml_prediction" not in result
    assert "forecast" not in result
    
    # Ensure risk tiers follow normal static rules
    assert result["environmental_tier"] in ["EXTREME", "CRITICAL", "HIGH", "ELEVATED", "MODERATE", "LOW"]
