from fastapi.testclient import TestClient
import sys
import os
from unittest.mock import patch, Mock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)

def test_forecast_risk_endpoint():
    dummy_weather_data = {
        "hourly": {
            "time": [
                "2026-09-24T12:00",
                "2026-09-25T12:00",
                "2026-09-26T12:00"
            ],
            "temperature_2m": [38.5, 39.0, 37.5],
            "relative_humidity_2m": [60.0, 65.0, 55.0],
            "wind_speed_10m": [12.0, 10.0, 15.0],
            "shortwave_radiation": [800.0, 850.0, 750.0]
        }
    }
    
    mock_response = Mock()
    mock_response.json.return_value = dummy_weather_data
    mock_response.raise_for_status.return_value = None

    with patch("routers.forecast.requests.get", return_value=mock_response):
        # Test valid request
        response = client.get("/api/v1/forecast-risk?district=Khordha&horizon=3")
        assert response.status_code == 200
        data = response.json()
    
    assert len(data) == 3
    
    day_one = data[0]
    # Check structure
    assert "date" in day_one
    assert "weather" in day_one
    assert "thermal" in day_one
    assert "risk" in day_one
    
    # Check provenance
    assert day_one["provenance"] == "[FORECAST]"
    assert day_one["model_status"] == "[EXPERIMENTAL MODEL RISK HORIZON]"
    
    # Check weather fields
    assert "temperature_c" in day_one["weather"]
    assert "relative_humidity_pct" in day_one["weather"]
    
    # Check thermal fields
    assert "hi_celsius" in day_one["thermal"]
    assert "wbgt_celsius" in day_one["thermal"]
    assert "utci_celsius" in day_one["thermal"]
    
    # Check risk fields
    assert "risk_score" in day_one["risk"]
    assert "risk_tier" in day_one["risk"]
