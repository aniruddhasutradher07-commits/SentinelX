"""
SentinelX Automated Pan-India Production Test Suite
===================================================
Validates system endpoints, spatial bounding, biometeorology math,
2-Stage ML hospital surge, and AI Copilot responses.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Validates that system health check returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Sovereign Territory of India" in data["jurisdiction"]


def test_pan_india_map_serving():
    """Validates that root and /map serve the GIS Explorer HTML."""
    response = client.get("/map")
    assert response.status_code == 200
    assert "SentinelX" in response.text
    assert "Pan-India Real-Data Heatwave" in response.text


def test_national_situation_room_serving():
    """Validates that /national serves the 36-States Situation Room."""
    response = client.get("/national")
    assert response.status_code == 200
    assert "National Situation Room" in response.text or "SentinelX" in response.text


def test_national_feed_api():
    """Validates that /api/v1/national-feed returns synoptic state data."""
    response = client.get("/api/v1/national-feed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_states_covered"] >= 30


def test_geocode_india_restricted():
    """Validates that geocoding works and returns Indian locations."""
    response = client.get("/api/v1/geocode?q=Bhubaneswar")
    assert response.status_code == 200
    data = response.json()
    results = data.get("results", [])
    assert len(results) > 0
    first = results[0]
    assert "India" in first.get("formatted_label", "") or "Odisha" in first.get("formatted_label", "")


def test_live_stress_computation():
    """Validates real-time weather and thermal stress calculation."""
    # New Delhi coordinates
    response = client.get("/api/v1/live-stress?lat=28.6139&lon=77.2090&name=New%20Delhi")
    assert response.status_code == 200
    data = response.json()
    assert "wbgt_c" in data
    assert "utci_c" in data
    assert "evap_efficiency_pct" in data
    assert "predicted_hospital_surge_pct" in data
    assert "hospitals" in data


def test_ai_copilot_endpoint():
    """Validates the NDMA AI Copilot decision support."""
    payload = {
        "query": "What are the priority actions under Red Alert?",
        "location": "Phalodi, Rajasthan",
        "wbgt": 34.5,
        "tier": "RED",
        "surge": 42.0
    }
    response = client.post("/api/v1/ai/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "ai_response" in data
    assert len(data["ai_response"]) > 50


def test_ai_multilingual_advisory():
    """Validates the multilingual Heat Action Plan generator."""
    payload = {
        "district": "Phalodi",
        "state": "Rajasthan",
        "language": "hi",
        "wbgt": 33.5,
        "tier": "Red"
    }
    response = client.post("/api/v1/ai/advisory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["language"] == "Hindi (हिन्दी)"
    assert "advisory" in data
