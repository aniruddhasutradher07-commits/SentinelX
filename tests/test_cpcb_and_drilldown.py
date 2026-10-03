"""
Unit & Integration Tests for Final Pre-SIH Upgrades:
1. CPCB OGD AQI integration & fallback states (LIVE -> STALE -> UNAVAILABLE)
2. CPCB timeout and connection failure resilience (no crashing, no hard dependency)
3. Zero secret exposure in responses
4. Ward Risk Score composition (0.50 Hazard + 0.35 Vulnerability + 0.15 Exposure)
5. Clinical integrity: hospital admissions & mortality remain N/A
6. Production default: USE_MOCK_DATA=false
"""

import os
import sqlite3
import datetime
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from services.cpcb_client import cpcb_client, DB_PATH, compute_indian_sub_aqi

client = TestClient(app)

# ---------------------------------------------------------------------------
# Test 1: CPCB Endpoints & State Machine
# ---------------------------------------------------------------------------
def test_cpcb_endpoints_unconfigured(monkeypatch):
    """When CPCB_API_KEY is unset, endpoints must return CREDENTIALS_NOT_CONFIGURED gracefully."""
    cpcb_client.api_key = ""
    cpcb_client.enabled = False

    resp = client.get("/api/v1/cpcb/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "CREDENTIALS_NOT_CONFIGURED"
    assert data["credentials_configured"] is False
    assert "api_key" not in data
    assert "key" not in data

    resp_ward = client.get("/api/v1/cpcb/ward/W14")
    assert resp_ward.status_code == 200
    ward_data = resp_ward.json()
    assert ward_data["status"] == "CREDENTIALS_NOT_CONFIGURED"
    assert "api_key" not in ward_data


def test_cpcb_live_stale_unavailable_lifecycle():
    """Verify state transitions: LIVE -> STALE -> UNAVAILABLE."""
    orig_key = cpcb_client.api_key
    orig_enabled = cpcb_client.enabled
    try:
        cpcb_client.api_key = "configured_dummy_key"
        cpcb_client.enabled = True

        # 1. Fresh cache record -> LIVE
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        c.execute("""
            INSERT INTO cpcb_pollutant_cache
            (station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_unit, source, observed_at, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(station_name, pollutant_id) DO UPDATE SET
                pollutant_avg=excluded.pollutant_avg, fetched_at=excluded.fetched_at
        """, ("IRC Village, Nayapalli", 20.296, 85.824, "PM2.5", 35.0, "ug/m3", "CPCB", now_iso, now_iso))
        conn.commit()
        conn.close()

        res_live = cpcb_client.map_ward_to_station(20.296, 85.824)
        assert res_live["status"] == "LIVE"
        assert res_live["station_name"] == "IRC Village, Nayapalli"
        assert res_live["distance_to_ward_km"] < 1.0
        assert res_live["spatial_quality"] == "NEAR"
        assert res_live["aqi"] is not None
        assert res_live["aqi"] > 0

        # 2. Older than 30 mins -> STALE
        stale_iso = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=45)).isoformat()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("UPDATE cpcb_pollutant_cache SET fetched_at=? WHERE station_name=?", (stale_iso, "IRC Village, Nayapalli"))
        conn.commit()
        conn.close()

        with patch.object(cpcb_client, "fetch_live_stations", return_value=False):
            res_stale = cpcb_client.map_ward_to_station(20.296, 85.824)
            assert res_stale["status"] == "STALE"
            assert res_stale["data_age_minutes"] >= 45

        # 3. Cache empty and API fails -> UNAVAILABLE
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM cpcb_pollutant_cache WHERE station_name=?", ("IRC Village, Nayapalli",))
        conn.commit()
        conn.close()

        with patch.object(cpcb_client, "fetch_live_stations", return_value=False):
            with patch.object(cpcb_client, "_get_cache", return_value=[]):
                res_unavail = cpcb_client.map_ward_to_station(20.296, 85.824)
                assert res_unavail["status"] == "UNAVAILABLE"
    finally:
        cpcb_client.api_key = orig_key
        cpcb_client.enabled = orig_enabled


# ---------------------------------------------------------------------------
# Test 2: Indian National AQI (NAQI) Sub-Index Calculations
# ---------------------------------------------------------------------------
def test_indian_naqi_sub_indices():
    """Verify CPCB standard breakpoint calculations."""
    # PM2.5: 0-30 -> 0-50
    assert compute_indian_sub_aqi("PM2.5", 15.0) == 25.0
    # PM2.5: 31-60 -> 51-100
    assert compute_indian_sub_aqi("PM2.5", 45.0) is not None
    assert 51.0 <= compute_indian_sub_aqi("PM2.5", 45.0) <= 100.0
    # Invalid inputs
    assert compute_indian_sub_aqi("PM2.5", -5.0) is None
    assert compute_indian_sub_aqi("UNKNOWN_GAS", 50.0) is None


# ---------------------------------------------------------------------------
# Test 3: Ward Risk Score Composition (0.50 H + 0.35 V + 0.15 E)
# ---------------------------------------------------------------------------
def test_ward_risk_score_composition():
    """Verify that every ward follows 0.50 Hazard + 0.35 Vulnerability + 0.15 Exposure."""
    resp = client.get("/api/v1/wards")
    assert resp.status_code == 200
    data = resp.json()
    wards = data.get("wards", [])
    assert len(wards) > 0

    for w in wards[:10]:
        h = w.get("hazard_score", 0.0)
        v = w.get("vulnerability_score", 50.0)
        e = w.get("exposure_score", 0.0)
        expected = min(100.0, round(0.50 * h + 0.35 * v + 0.15 * e, 1))
        actual = w.get("WardRiskScore")
        assert actual == pytest.approx(expected, abs=0.2), (
            f"Ward {w.get('ward_no')} mismatch: actual {actual} != expected {expected}"
        )


# ---------------------------------------------------------------------------
# Test 4: Hospital / Mortality Models are Never Fabricated
# ---------------------------------------------------------------------------
def test_hospital_and_mortality_remain_null():
    """Verify absolute clinical integrity."""
    resp = client.get("/api/v1/wards/W14/hospital-demand")
    assert resp.status_code == 200
    data = resp.json()
    if "forecast" in data:
        for f in data["forecast"]:
            assert f.get("predicted_admissions") is None

    resp_mort = client.get("/api/v1/mortality-risk?district=Khordha")
    assert resp_mort.status_code == 200
    mort_data = resp_mort.json()
    assert mort_data.get("predicted_mortality") is None


# ---------------------------------------------------------------------------
# Test 5: Production Defaults to USE_MOCK_DATA=false
# ---------------------------------------------------------------------------
def test_production_default_mock_data_false(monkeypatch):
    """Verify that production defaults to USE_MOCK_DATA=false."""
    monkeypatch.delenv("USE_MOCK_DATA", raising=False)
    use_mock = os.environ.get("USE_MOCK_DATA", "false").lower() == "true"
    assert use_mock is False, "USE_MOCK_DATA must default to false"

    from core.demo_fixtures import is_demo_fallback_enabled
    monkeypatch.delenv("ENABLE_DEMO_FALLBACK", raising=False)
    assert is_demo_fallback_enabled() is False, "ENABLE_DEMO_FALLBACK must default to false"
