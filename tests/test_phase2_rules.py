import pytest
from core.risk_rules import evaluate_environmental_risk
from core.thermal_stress import compute_environmental_score

def test_environmental_score_wind_awareness():
    # Base case
    res1 = compute_environmental_score(35.0, 50.0, 5.0, 50.0, 0.5)
    # Higher wind
    res2 = compute_environmental_score(35.0, 50.0, 5.0, 50.0, 10.0)
    
    # Environmental score remains the same (wind is explicit prototype separate)
    assert res1.environmental_score == res2.environmental_score
    # But apparent temp incorporates wind properly
    assert res1.apparent_temperature_c > res2.apparent_temperature_c

def test_evaluate_environmental_risk_imd_context():
    # Coastal station criteria not met (T < 37)
    risk1 = evaluate_environmental_risk(36.0, 50.0, 5.0, 50.0, 2.0)
    assert risk1["imd_heatwave_context"] == "NOT_CONFIRMED"

    # Coastal station criteria met for temperature
    risk2 = evaluate_environmental_risk(38.0, 50.0, 5.0, 50.0, 2.0)
    assert risk2["imd_heatwave_context"] == "CONDITIONS_MET_PENDING_PERSISTENCE"

def test_evaluate_environmental_risk_stale_data():
    risk = evaluate_environmental_risk(30.0, 50.0, 0.0, 20.0, 1.0, is_stale=True)
    assert risk["data_state"] == "STALE"
    
def test_evaluate_environmental_risk_triggers():
    risk = evaluate_environmental_risk(45.0, 80.0, 11.0, 250.0, 2.0)
    triggers = risk["trigger"]
    assert "high heat index" in triggers
    assert "very high uv" in triggers
    assert "unhealthy aqi" in triggers

if __name__ == "__main__":
    pytest.main(["-v", "scratch/test_phase2_rules.py"])
