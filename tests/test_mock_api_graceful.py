import pytest
import os
os.environ["USE_MOCK_DATA"] = "true"
from fastapi.testclient import TestClient
from main import app
import sys

client = TestClient(app)

def test_no_xgboost_dependency():
    """Verify xgboost is not in requirements.txt to prevent Docker NCCL bloat."""
    with open("requirements.txt", "r") as f:
        reqs = f.read()
    assert "xgboost" not in reqs.lower()

def test_mock_api_ward_graceful_degradation():
    """
    Test that the 5-day forecast endpoint /api/v1/wards/{ward_no} 
    gracefully handles missing legacy hospital models.
    """
    from routers import mock_api
    
    # Simulate missing xgboost dependency
    mock_api.stage2_model = None
    mock_api.stage1_model = None
    
    data = mock_api.ward_detail("W21")
    
    # 5-day forecast response remains valid
    assert "hospital_demand_forecast" in data
    
    # SHAP unavailable is handled correctly
    assert data["shap_explainability"] is None
    
    # Check that fallback predicted_admissions is either None or valid
    # In our case it should be None, representing explicitly unavailable state
    forecast = data["hospital_demand_forecast"]
    if forecast:
        for day in forecast:
            assert day["predicted_admissions"] is None
