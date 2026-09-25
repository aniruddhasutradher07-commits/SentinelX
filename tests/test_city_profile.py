import pytest
import os
import json
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_wards_api_returns_city_profile():
    # Fetch wards
    response = client.get("/api/v1/wards")
    assert response.status_code == 200
    data = response.json()
    
    wards = data.get("wards", [])
    assert len(wards) > 0, "No wards returned"
    
    # Check that at least one ward has ward_profile
    found_profile = False
    for ward in wards:
        profile = ward.get("ward_profile")
        if profile:
            assert profile["status"] == "STATIC_REFERENCE"
            assert profile["source"] == "Odisha Government OGD"
            assert profile["dataset"] == "City Profile Bhubaneswar 2019"
            assert profile["dataset_year"] == 2019
            # Verify NA was mapped to null or valid data
            assert "population_total" in profile
            found_profile = True
            break
            
    assert found_profile, "No ward profile found in the API response"
    
def test_city_profile_null_mapping():
    response = client.get("/api/v1/wards")
    data = response.json()
    wards = data.get("wards", [])
    
    # Let's ensure no empty strings or "NA" made it through
    for ward in wards:
        profile = ward.get("ward_profile")
        if profile:
            for key, val in profile.items():
                assert val != "NA", f"Found NA in {key} for ward {ward.get('ward_no')}"
                assert val != "", f"Found empty string in {key} for ward {ward.get('ward_no')}"
