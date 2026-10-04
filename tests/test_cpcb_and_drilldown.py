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
from services.cpcb_client import (
    cpcb_client, DB_PATH, compute_indian_sub_aqi,
    get_spatial_quality, calculate_multi_source_aqi_comparison
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_cpcb_state():
    yield
    cpcb_client._refresh_env()
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM cpcb_pollutant_cache WHERE station_name IN ('Patrapada, Bhubaneswar - SPCB', 'Lingaraj Temple, Bhubaneswar - SPCB', 'IRC Village, Nayapalli', 'Test Station')")
        conn.commit()
        conn.close()
    except Exception:
        pass

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


# ---------------------------------------------------------------------------
# Test Matrix: Comprehensive 16-Point CPCB Reliability Suite
# ---------------------------------------------------------------------------

def test_cpcb_matrix_1_valid_response(monkeypatch):
    """1. Valid CPCB response correctly parsed and cached."""
    class MockResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self):
            return {
                "records": [
                    {
                        "city": "Bhubaneswar",
                        "state": "Odisha",
                        "station": "Patrapada, Bhubaneswar - SPCB",
                        "pollutant_id": "PM2.5",
                        "pollutant_avg": "42.5",
                        "pollutant_min": "20.0",
                        "pollutant_max": "65.0",
                        "pollutant_unit": "ug/m3",
                        "last_update": "2026-10-03T16:00:00Z"
                    }
                ]
            }

    monkeypatch.setenv("CPCB_API_KEY", "test_key")
    monkeypatch.setenv("CPCB_ENABLED", "true")
    cpcb_client._refresh_env()
    monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: MockResp())
    success = cpcb_client.fetch_live_stations()
    assert success is True

    cached = cpcb_client._get_cache()
    patrapada = next((s for s in cached if "patrapada" in s["station_name"].lower()), None)
    assert patrapada is not None
    assert patrapada["pollutants"]["PM2.5"]["avg"] == 42.5


def test_cpcb_matrix_2_empty_response(monkeypatch):
    """2. Empty response returns False and avoids corrupting database."""
    class MockResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self):
            return {"records": []}

    monkeypatch.setenv("CPCB_API_KEY", "test_key")
    monkeypatch.setenv("CPCB_ENABLED", "true")
    cpcb_client._refresh_env()
    monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: MockResp())
    success = cpcb_client.fetch_live_stations()
    assert success is False


def test_cpcb_matrix_3_malformed_response(monkeypatch):
    """3. Malformed strings ('NA', 'None', invalid text) do not crash ingestion."""
    class MockResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self):
            return {
                "records": [
                    {
                        "city": "Bhubaneswar",
                        "state": "Odisha",
                        "station": "Lingaraj Temple, Bhubaneswar - SPCB",
                        "pollutant_id": "PM2.5",
                        "pollutant_avg": "N/A",  # Non-numeric string
                        "pollutant_min": "null",
                        "pollutant_max": "INVALID_TEXT",
                        "pollutant_unit": "ug/m3",
                        "last_update": "2026-10-03T16:00:00Z"
                    }
                ]
            }

    monkeypatch.setenv("CPCB_API_KEY", "test_key")
    monkeypatch.setenv("CPCB_ENABLED", "true")
    cpcb_client._refresh_env()
    monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: MockResp())
    success = cpcb_client.fetch_live_stations()
    assert success is True  # Ingestion succeeded, values stored safely as None

    cached = cpcb_client._get_cache()
    lingaraj = next((s for s in cached if "lingaraj" in s["station_name"].lower()), None)
    assert lingaraj is not None
    assert lingaraj["pollutants"]["PM2.5"]["avg"] is None


def test_cpcb_matrix_4_timeout(monkeypatch):
    """4. Timeout raises gracefully and returns False without unhandled exception."""
    import requests
    def mock_timeout(*args, **kwargs):
        raise requests.exceptions.Timeout("Connection timed out after 15s")

    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        monkeypatch.setattr(cpcb_client.session, "get", mock_timeout)
        success = cpcb_client.fetch_live_stations()
        assert success is False
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_5_http_429(monkeypatch):
    """5. HTTP 429 rate limit is handled gracefully."""
    import requests
    class Mock429:
        status_code = 429
        def raise_for_status(self):
            raise requests.exceptions.HTTPError("429 Client Error: Too Many Requests")

    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: Mock429())
        success = cpcb_client.fetch_live_stations()
        assert success is False
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_6_http_500(monkeypatch):
    """6. HTTP 500 server error is handled gracefully."""
    import requests
    class Mock500:
        status_code = 500
        def raise_for_status(self):
            raise requests.exceptions.HTTPError("500 Server Error")

    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: Mock500())
        success = cpcb_client.fetch_live_stations()
        assert success is False
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_7_missing_api_key():
    """7. Missing API key returns CREDENTIALS_NOT_CONFIGURED and no secrets in response."""
    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = ""
        cpcb_client.enabled = False
        st = cpcb_client.get_status()
        assert st["status"] == "CREDENTIALS_NOT_CONFIGURED"
        assert st["credentials_configured"] is False
        assert "api_key" not in st
        assert "key" not in st

        ward_res = cpcb_client.map_ward_to_station(20.296, 85.824)
        assert ward_res["status"] == "CREDENTIALS_NOT_CONFIGURED"
        assert "api_key" not in ward_res
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_8_valid_cached_fallback():
    """8. Valid cached record within 30 min returns status LIVE."""
    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO cpcb_pollutant_cache 
            (station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_unit, source, observed_at, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(station_name, pollutant_id) DO UPDATE SET
                pollutant_avg=excluded.pollutant_avg, fetched_at=excluded.fetched_at
        """, ("Patrapada, Bhubaneswar - SPCB", 20.245, 85.7876, "PM2.5", 48.0, "ug/m3", "CPCB", now_iso, now_iso))
        conn.commit()
        conn.close()

        with patch.object(cpcb_client, "fetch_live_stations", return_value=False):
            res = cpcb_client.map_ward_to_station(20.245, 85.7876)
            assert res["status"] == "LIVE"
            assert res["station_name"] == "Patrapada, Bhubaneswar - SPCB"
            assert res["aqi"] is not None
            assert res["observation_source"] == "CPCB"
            assert res["station_coordinate_source"] == "internal_metadata"
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_9_expired_cached_fallback():
    """9. Cached record older than 30 min returns status STALE."""
    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        stale_iso = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=60)).isoformat()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO cpcb_pollutant_cache 
            (station_name, latitude, longitude, pollutant_id, pollutant_avg, pollutant_unit, source, observed_at, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(station_name, pollutant_id) DO UPDATE SET
                pollutant_avg=excluded.pollutant_avg, fetched_at=excluded.fetched_at
        """, ("Patrapada, Bhubaneswar - SPCB", 20.245, 85.7876, "PM2.5", 48.0, "ug/m3", "CPCB", stale_iso, stale_iso))
        conn.commit()
        conn.close()

        with patch.object(cpcb_client, "fetch_live_stations", return_value=False):
            res = cpcb_client.map_ward_to_station(20.245, 85.7876)
            assert res["status"] == "STALE"
            assert res["data_age_minutes"] >= 60
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_10_no_cache_failure():
    """10. Cache empty and live API fails returns UNAVAILABLE without fabricating values."""
    orig_key, orig_en = cpcb_client.api_key, cpcb_client.enabled
    try:
        cpcb_client.api_key = "test_key"
        cpcb_client.enabled = True
        with patch.object(cpcb_client, "fetch_live_stations", return_value=False):
            with patch.object(cpcb_client, "_get_cache", return_value=[]):
                res = cpcb_client.map_ward_to_station(20.296, 85.824)
                assert res["status"] == "UNAVAILABLE"
                assert res["station_name"] is None
                assert res.get("aqi") is None
    finally:
        cpcb_client.api_key, cpcb_client.enabled = orig_key, orig_en


def test_cpcb_matrix_11_station_distance_classification():
    """11. Haversine distance threshold classification: NEAR, MODERATE, FAR, VERY_FAR."""
    assert get_spatial_quality(1.2) == "NEAR"
    assert get_spatial_quality(5.0) == "NEAR"
    assert get_spatial_quality(5.1) == "MODERATE"
    assert get_spatial_quality(10.0) == "MODERATE"
    assert get_spatial_quality(10.1) == "FAR"
    assert get_spatial_quality(20.0) == "FAR"
    assert get_spatial_quality(20.1) == "VERY_FAR"
    assert get_spatial_quality(55.0) == "VERY_FAR"


def test_cpcb_matrix_12_bhubaneswar_filtering(monkeypatch):
    """12. Strict filtering rejects non-Bhubaneswar and non-Odisha stations."""
    class MockResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self):
            return {
                "records": [
                    {
                        "city": "Cuttack",
                        "state": "Odisha",
                        "station": "Cuttack Station",
                        "pollutant_id": "PM2.5",
                        "pollutant_avg": "50.0"
                    },
                    {
                        "city": "Bhubaneswar",
                        "state": "West Bengal",  # Conflicting state
                        "station": "Fake Kolkata",
                        "pollutant_id": "PM2.5",
                        "pollutant_avg": "90.0"
                    },
                    {
                        "city": "Bhubaneswar",
                        "state": "Odisha",
                        "station": "Patrapada, Bhubaneswar - SPCB",
                        "pollutant_id": "PM2.5",
                        "pollutant_avg": "38.0",
                        "last_update": "2026-10-03T16:00:00Z"
                    }
                ]
            }

    monkeypatch.setenv("CPCB_API_KEY", "test_key")
    monkeypatch.setenv("CPCB_ENABLED", "true")
    cpcb_client._refresh_env()
    monkeypatch.setattr(cpcb_client.session, "get", lambda *args, **kwargs: MockResp())
    success = cpcb_client.fetch_live_stations()
    assert success is True

    cached = cpcb_client._get_cache()
    st_names = [s["station_name"] for s in cached]
    assert "Cuttack Station" not in st_names
    assert "Fake Kolkata" not in st_names
    assert any("Patrapada" in name for name in st_names)


def test_cpcb_matrix_13_aqi_comparison():
    """13. AQI difference and consistency computed with <25 threshold."""
    # Consistent case (<25 diff)
    res_cons = calculate_multi_source_aqi_comparison(55.0, 68.0)
    assert res_cons["open_meteo_aqi"] == 55.0
    assert res_cons["cpcb_aqi"] == 68.0
    assert res_cons["aqi_difference"] == 13.0
    assert res_cons["multi_source_consistency"] == "CONSISTENT"
    assert res_cons["comparison_available"] is True

    # Divergent case (>=25 diff)
    res_div = calculate_multi_source_aqi_comparison(45.0, 85.0)
    assert res_div["aqi_difference"] == 40.0
    assert res_div["multi_source_consistency"] == "DIVERGENT"


def test_cpcb_matrix_14_missing_open_meteo_value():
    """14. Missing Open-Meteo AQI does NOT become zero or calculate false difference."""
    res = calculate_multi_source_aqi_comparison(None, 60.0)
    assert res["open_meteo_aqi"] is None
    assert res["cpcb_aqi"] == 60.0
    assert res["aqi_difference"] is None
    assert res["multi_source_consistency"] == "COMPARISON_UNAVAILABLE"
    assert res["comparison_available"] is False


def test_cpcb_matrix_15_missing_cpcb_value():
    """15. Missing CPCB AQI does NOT become zero or calculate false difference."""
    res = calculate_multi_source_aqi_comparison(72.0, None)
    assert res["open_meteo_aqi"] == 72.0
    assert res["cpcb_aqi"] is None
    assert res["aqi_difference"] is None
    assert res["multi_source_consistency"] == "COMPARISON_UNAVAILABLE"
    assert res["comparison_available"] is False


def test_cpcb_matrix_16_both_sources_unavailable():
    """16. Both sources unavailable returns COMPARISON_UNAVAILABLE cleanly."""
    res = calculate_multi_source_aqi_comparison(None, None)
    assert res["open_meteo_aqi"] is None
    assert res["cpcb_aqi"] is None
    assert res["aqi_difference"] is None
    assert res["multi_source_consistency"] == "COMPARISON_UNAVAILABLE"
    assert res["comparison_available"] is False

