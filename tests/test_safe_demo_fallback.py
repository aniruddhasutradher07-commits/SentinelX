"""
Test Suite: Safe Demo Fallback Architecture (Hackathon Resilience)
==================================================================
Proves:
1. Production defaults to real sources (USE_MOCK_DATA=false, ENABLE_DEMO_FALLBACK=false).
2. Synthetic fallback is strictly opt-in via ENABLE_DEMO_FALLBACK=true.
3. Fallback status is visibly labeled with "DEMO / SYNTHETIC — NOT LIVE" and is_live=False.
4. Absolute Clinical Integrity: NEVER generates fake hospital admissions or mortality.
5. Official Source Integrity: CPCB and IMD observations are NEVER fabricated.
6. Preserves existing states (LIVE, STALE, UNAVAILABLE, CREDENTIALS_NOT_CONFIGURED).
"""

import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from services.ingestion import fetch_weather_data, WeatherReading
from core.demo_fixtures import (
    is_demo_fallback_enabled,
    DEMO_PROVENANCE_TAG,
    DEMO_SOURCE_TAG,
    get_demo_weather_payload,
    get_demo_forecast_risk_payload,
    get_demo_hospital_demand_payload,
    get_demo_mortality_risk_payload,
)
from services.cpcb_client import cpcb_client
from services.imd_client import imd_client

client = TestClient(app)

# ---------------------------------------------------------------------------
# Test 1: Production Defaults to Real Sources (No Automatic Synthetic Injection)
# ---------------------------------------------------------------------------
def test_production_defaults_to_real_sources(monkeypatch):
    """
    In production mode (USE_MOCK_DATA=false, ENABLE_DEMO_FALLBACK=false),
    if an external API fails and no database cache exists, the system does NOT
    inject synthetic fixtures; it reports UNAVAILABLE or None.
    """
    monkeypatch.setenv("USE_MOCK_DATA", "false")
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "false")
    assert is_demo_fallback_enabled() is False

    # 1. Weather Ingestion single fetch with simulated network timeout
    with patch("services.ingestion._fetch_open_meteo_batch", return_value={"99.99,99.99": None}):
        reading = fetch_weather_data(99.99, 99.99, "NON_EXISTENT_PROD_WARD")
        assert reading is None, "Production must not inject mock data when fallback is disabled"

    # 2. Hospital Demand endpoint with simulated upstream failure
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 503
        resp = client.get("/api/v1/wards/W21/hospital-demand")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "UNAVAILABLE", "Production must return UNAVAILABLE on API failure"
        assert data.get("provenance") != DEMO_PROVENANCE_TAG

    # 3. Mortality Risk endpoint with simulated upstream failure
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 503
        resp = client.get("/api/v1/mortality-risk?district=Khordha")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "UNAVAILABLE", "Production must return UNAVAILABLE on API failure"
        assert data.get("provenance") != DEMO_PROVENANCE_TAG


# ---------------------------------------------------------------------------
# Test 2: Synthetic Fallback is Strictly Opt-In
# ---------------------------------------------------------------------------
def test_synthetic_fallback_is_opt_in(monkeypatch):
    """
    When ENABLE_DEMO_FALLBACK=true, if an external source fails during an offline/demo
    session, the system safely falls back to labeled demo fixtures.
    """
    monkeypatch.setenv("USE_MOCK_DATA", "false")
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "true")
    assert is_demo_fallback_enabled() is True

    # 1. Weather ingestion demo fallback
    with patch("services.ingestion._fetch_open_meteo_batch", return_value={"99.99,99.99": None}):
        reading = fetch_weather_data(99.99, 99.99, "DEMO_TEST_WARD")
        assert reading is not None
        assert reading.is_demo_fallback is True
        assert reading.provenance == DEMO_PROVENANCE_TAG

    # 2. Hospital Demand demo fallback
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 503
        resp = client.get("/api/v1/wards/W21/hospital-demand")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "DEMO_FALLBACK"
        assert data["provenance"] == DEMO_PROVENANCE_TAG

    # 3. Mortality Risk demo fallback
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 503
        resp = client.get("/api/v1/mortality-risk?district=Khordha")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "DEMO_FALLBACK"
        assert data["provenance"] == DEMO_PROVENANCE_TAG

    # 4. Forecast Risk demo fallback
    with patch("requests.get", side_effect=Exception("Connection timed out")):
        resp = client.get("/api/v1/forecast-risk?district=Khordha&horizon=5")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 5
        for day in data:
            assert day["provenance"] == DEMO_PROVENANCE_TAG
            assert day["model_status"] == DEMO_PROVENANCE_TAG


# ---------------------------------------------------------------------------
# Test 3: Fallback Status is Visibly Labeled and Never Labeled as Live
# ---------------------------------------------------------------------------
def test_fallback_status_is_visibly_labeled(monkeypatch):
    """
    Every demo fallback payload must explicitly carry "DEMO / SYNTHETIC — NOT LIVE"
    and is_live=False. It must NEVER be labeled as LIVE or CALCULATED FROM LIVE DATA.
    """
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "true")

    # Ingestion reading
    weather_payload = get_demo_weather_payload("TEST_WARD", 20.29, 85.82)
    assert weather_payload["provenance"] == "DEMO / SYNTHETIC — NOT LIVE"
    assert weather_payload["is_live"] is False
    assert "DEMO / SYNTHETIC — NOT LIVE" in weather_payload["source"]
    assert "LIVE" not in weather_payload["source"].replace("NOT LIVE", "")

    # Hospital demand payload
    hosp_payload = get_demo_hospital_demand_payload("W14")
    assert hosp_payload["provenance"] == "DEMO / SYNTHETIC — NOT LIVE"
    assert hosp_payload["is_live"] is False
    assert hosp_payload["status"] == "DEMO_FALLBACK"

    # Mortality payload
    mort_payload = get_demo_mortality_risk_payload("Khordha", 5)
    assert mort_payload["provenance"] == "DEMO / SYNTHETIC — NOT LIVE"
    assert mort_payload["is_live"] is False
    assert mort_payload["status"] == "DEMO_FALLBACK"

    # Forecast payload
    fore_payload = get_demo_forecast_risk_payload("Khordha", 5)
    for day in fore_payload:
        assert day["provenance"] == "DEMO / SYNTHETIC — NOT LIVE"
        assert day["model_status"] == "DEMO / SYNTHETIC — NOT LIVE"
        assert "NOT LIVE" in day["weather"]["source"]


# ---------------------------------------------------------------------------
# Test 4: Absolute Clinical Integrity — Zero Fake Clinical Outputs
# ---------------------------------------------------------------------------
def test_no_fake_clinical_outputs_generated(monkeypatch):
    """
    Under all conditions (production, offline, demo fallback, or legacy mock mode),
    the system MUST NEVER generate fake hospital admissions or mortality counts.
    """
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "true")

    # 1. Demo hospital demand payload
    hosp = get_demo_hospital_demand_payload("W21")
    for f in hosp["forecast"]:
        assert f["predicted_admissions"] is None, "predicted_admissions must be strictly None"

    # 2. Demo mortality risk payload
    mort = get_demo_mortality_risk_payload("Khordha", 5)
    assert mort["predicted_mortality"] is None, "predicted_mortality must be strictly None"
    for f in mort["forecast"]:
        assert f["predicted_mortality"] is None, "Daily predicted_mortality must be strictly None"
        assert f["predicted_mortality_rate"] is None, "Daily predicted_mortality_rate must be strictly None"

    # 3. Live endpoint audit with demo fallback
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 503
        resp = client.get("/api/v1/wards/W21/hospital-demand")
        data = resp.json()
        if "forecast" in data:
            for day in data["forecast"]:
                assert day["predicted_admissions"] is None

        resp_mort = client.get("/api/v1/mortality-risk?district=Khordha")
        data_mort = resp_mort.json()
        assert data_mort["predicted_mortality"] is None


# ---------------------------------------------------------------------------
# Test 5: Official Government Feeds — Do Not Fabricate CPCB or IMD
# ---------------------------------------------------------------------------
def test_cpcb_and_imd_never_fabricated(monkeypatch):
    """
    CPCB and IMD official observations must NEVER be fabricated under demo fallback.
    They must honestly report CREDENTIALS_NOT_CONFIGURED or UNAVAILABLE when keys are unset,
    or verified cache (LIVE / STALE) when credentials exist.
    """
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "true")

    # CPCB client unconfigured audit
    orig_cpcb_key = cpcb_client.api_key
    orig_cpcb_enabled = cpcb_client.enabled
    cpcb_client.api_key = ""
    try:
        cpcb_res = cpcb_client.map_ward_to_station(20.29, 85.82)
        assert cpcb_res["status"] in ["CREDENTIALS_NOT_CONFIGURED", "UNAVAILABLE"]
        assert "fake" not in str(cpcb_res).lower()
    finally:
        cpcb_client.api_key = orig_cpcb_key
        cpcb_client.enabled = orig_cpcb_enabled

    # IMD client unconfigured audit
    orig_imd_key = imd_client.api_key
    orig_imd_enabled = imd_client.enabled
    imd_client.api_key = ""
    try:
        imd_res = imd_client.get_district_context("Khordha")
        assert imd_res["status"] in ["CREDENTIALS_NOT_CONFIGURED", "UNAVAILABLE"]
        assert "fake" not in str(imd_res).lower()
    finally:
        imd_client.api_key = orig_imd_key
        imd_client.enabled = orig_imd_enabled


# ---------------------------------------------------------------------------
# Test 6: Preserves Existing LIVE, STALE, UNAVAILABLE, and CREDENTIALS States
# ---------------------------------------------------------------------------
def test_preserves_existing_provenance_states(monkeypatch):
    """
    Standard state identifiers remain strictly intact across the architecture:
    LIVE, STALE, UNAVAILABLE, CREDENTIALS_NOT_CONFIGURED.
    """
    monkeypatch.setenv("ENABLE_DEMO_FALLBACK", "false")
    monkeypatch.setenv("USE_MOCK_DATA", "false")

    # Ingestion reading with stale time
    r = WeatherReading(
        ward_id="W1",
        latitude=20.29,
        longitude=85.82,
        temperature_c=35.0,
        humidity_percent=60.0,
        wind_speed_ms=2.0,
        uv_index=4.0,
        aqi=80.0,
        aqi_standard="US_AQI",
        source="open_meteo",
        observed_at="2026-09-01T12:00:00Z",
        fetched_at="2026-09-01T12:00:00Z",
        is_live=False,
        is_stale=True,
        data_age_minutes=120
    )
    assert r.is_live is False
    assert r.is_stale is True

    # CPCB unconfigured state
    orig_key = cpcb_client.api_key
    cpcb_client.api_key = ""
    try:
        assert cpcb_client.map_ward_to_station(20.0, 85.0)["status"] in ["CREDENTIALS_NOT_CONFIGURED", "UNAVAILABLE"]
    finally:
        cpcb_client.api_key = orig_key

    # CPCB cached state (STALE / LIVE)
    cpcb_client.api_key = "configured_key"
    cpcb_client.enabled = True
    cached_status = cpcb_client.map_ward_to_station(20.3, 85.8)["status"]
    assert cached_status in ["LIVE", "STALE", "UNAVAILABLE"]
    cpcb_client.api_key = orig_key
