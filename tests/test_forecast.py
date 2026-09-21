from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)

def test_forecast_risk_endpoint():
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
