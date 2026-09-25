import os
import pytest
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

import ml_v2.live_features as lf
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

def generate_mock_om_response(t_base: datetime, count=25, skip_idx=None, duplicate_idx=None, malformed_idx=None):
    times = []
    temps = []
    
    for i in range(-count, 5):
        if skip_idx == i:
            continue
            
        t_obs = t_base + timedelta(hours=i)
        
        t_str = t_obs.strftime("%Y-%m-%dT%H:00")
        if malformed_idx == i:
            t_str = "invalid_timestamp"
            
        times.append(t_str)
        temps.append(30.0 + i)
        
        if duplicate_idx == i:
            times.append(t_str)
            temps.append(30.0 + i)

    return {
        "hourly": {
            "time": times,
            "temperature_2m": temps,
            "relative_humidity_2m": [65.0] * len(times),
            "wind_speed_10m": [10.0] * len(times),
            "wind_direction_10m": [180.0] * len(times),
            "precipitation": [0.0] * len(times),
            "surface_pressure": [1013.25] * len(times),
            "cloud_cover": [0.0] * len(times),
            "weather_code": [0.0] * len(times),
            "wind_gusts_10m": [0.0] * len(times),
        }
    }

def test_successful_ondemand_25h(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        return MockResponse(generate_mock_om_response(t_base, count=25))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    res = lf.build_live_feature_vector(20.25, 85.75, t_base.isoformat())
    assert res["status"] == "SUCCESS"
    assert "feature_vector" in res
    assert len(res["feature_vector"]) == 36
    assert res["training_source"] == "Copernicus / ECMWF ERA5"
    assert res["live_input_source"] == "Open-Meteo"
    assert res["source_alignment"] == "NOT_EXACT"

def test_missing_hourly_timestamp(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        return MockResponse(generate_mock_om_response(t_base, count=25, skip_idx=-10))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    res = lf.build_live_feature_vector(20.25, 85.75, t_base.isoformat())
    assert res["status"] == "DATA_UNAVAILABLE"
    assert "Insufficient recent hourly history" in res["reason"] or "Missing hourly observations" in res["reason"]

def test_malformed_timestamp(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        return MockResponse(generate_mock_om_response(t_base, count=25, malformed_idx=0))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    res = lf.build_live_feature_vector(20.25, 85.75, t_base.isoformat())
    assert res["status"] == "DATA_UNAVAILABLE"
    assert "Malformed timestamp" in res["reason"]

def test_duplicate_timestamp(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        return MockResponse(generate_mock_om_response(t_base, count=25, duplicate_idx=-5))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    res = lf.build_live_feature_vector(20.25, 85.75, t_base.isoformat())
    assert res["status"] == "DATA_UNAVAILABLE"
    assert "Conflicting duplicate records" in res["reason"]

def test_future_timestamp_exclusion(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        # We request prediction at t_base - 5 hours
        return MockResponse(generate_mock_om_response(t_base, count=30))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    prediction_time = t_base - timedelta(hours=5)
    res = lf.build_live_feature_vector(20.25, 85.75, prediction_time.isoformat())
    expected_end = prediction_time - timedelta(hours=1)
    assert res["status"] == "SUCCESS"
    assert res["prediction_time"] == expected_end.isoformat()
    assert res["history_end"] == expected_end.isoformat()

def test_insufficient_api_history(monkeypatch):
    t_base = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    
    def mock_get(url, *args, **kwargs):
        return MockResponse(generate_mock_om_response(t_base, count=15))
        
    monkeypatch.setattr(requests, "get", mock_get)
    
    res = lf.build_live_feature_vector(20.25, 85.75, t_base.isoformat())
    assert res["status"] == "DATA_UNAVAILABLE"
    assert "Insufficient recent hourly history" in res["reason"]

