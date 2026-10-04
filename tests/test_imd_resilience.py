import os
import sqlite3
import datetime
import pytest
import requests
from unittest.mock import MagicMock, patch

from services.imd_client import IMDClient, IMD_CACHE_TTL_MINUTES
from core.risk_rules import evaluate_environmental_risk


def test_1_fresh_db_creates_cache_table(tmp_path, monkeypatch):
    """Verify that a brand new SQLite database initializes the IMD cache table safely without errors."""
    test_db = str(tmp_path / "fresh_test.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    
    client = IMDClient()
    client._init_db()
    
    conn = sqlite3.connect(test_db)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='imd_context_cache'")
    table = c.fetchone()
    conn.close()
    
    assert table is not None, "imd_context_cache table was not created in fresh database"


def test_2_credentials_missing(monkeypatch):
    """Verify that missing API key returns CREDENTIALS_NOT_CONFIGURED and never leaks secrets."""
    secret_token = "SUPER_SECRET_TOKEN_DO_NOT_LEAK"
    monkeypatch.setenv("IMD_API_KEY", "")
    monkeypatch.setenv("IMD_JWT_TOKEN", secret_token)
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    res = client.get_district_context("Khordha")
    
    assert res["status"] == "CREDENTIALS_NOT_CONFIGURED"
    assert res["reason"] == "IMD_API_KEY_NOT_CONFIGURED"
    assert "api_key" not in res
    assert secret_token not in str(res)


def test_3_valid_documented_imd_response(tmp_path, monkeypatch):
    """Verify official documented IMD response format parsing and caching."""
    test_db = str(tmp_path / "test_valid.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    mock_payload = [
        {
            "Obj_id": "573",
            "District": "Khordha",
            "Date": "2026-10-04",
            "UTC": "0300",
            "Day_1": "9",        # Code 9 = Heat Wave
            "Day1_Color": "1",   # Color 1 = RED
            "message": "Severe heat wave conditions likely over Khordha district."
        }
    ]
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload
    
    with patch.object(client.session, "get", return_value=mock_resp):
        success = client.fetch_live_district_context("Khordha")
        assert success is True
    
    ctx = client.get_district_context("Khordha")
    assert ctx["status"] == "LIVE"
    assert ctx["warning_level"] == "RED - Heat Wave"
    assert ctx["nowcast"] == "Severe heat wave conditions likely over Khordha district."
    assert ctx["spatial_resolution"] == "district"
    assert ctx["geographic_context"] == "Khordha"
    assert ctx["source"] == "India Meteorological Department (IMD)"


def test_4_malformed_response(tmp_path, monkeypatch):
    """Verify malformed upstream response is rejected safely without crashing or corrupting cache."""
    test_db = str(tmp_path / "test_malformed.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"unexpected_key": [1, 2, 3]}
    
    with patch.object(client.session, "get", return_value=mock_resp):
        success = client.fetch_live_district_context("Khordha")
        assert success is False
    
    ctx = client.get_district_context("Khordha")
    assert ctx["status"] == "UNAVAILABLE"


def test_5_empty_response(tmp_path, monkeypatch):
    """Verify empty response is handled gracefully without fabricating data."""
    test_db = str(tmp_path / "test_empty.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = []
    
    with patch.object(client.session, "get", return_value=mock_resp):
        success = client.fetch_live_district_context("Khordha")
        assert success is False
    
    ctx = client.get_district_context("Khordha")
    assert ctx["status"] == "UNAVAILABLE"


def test_6_timeout(tmp_path, monkeypatch):
    """Verify request timeout fails gracefully and returns False."""
    test_db = str(tmp_path / "test_timeout.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    
    with patch.object(client.session, "get", side_effect=requests.exceptions.Timeout("Connection timed out")):
        success = client.fetch_live_district_context("Khordha")
        assert success is False


def test_7_http_429(tmp_path, monkeypatch):
    """Verify HTTP 429 Rate Limit error returns False without unhandled exceptions."""
    test_db = str(tmp_path / "test_429.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 429
    
    with patch.object(client.session, "get", return_value=mock_resp):
        success = client.fetch_live_district_context("Khordha")
        assert success is False


def test_8_http_500(tmp_path, monkeypatch):
    """Verify HTTP 500 Server Error returns False without unhandled exceptions."""
    test_db = str(tmp_path / "test_500.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    
    with patch.object(client.session, "get", return_value=mock_resp):
        success = client.fetch_live_district_context("Khordha")
        assert success is False


def test_9_stale_cache_fallback(tmp_path, monkeypatch):
    """Verify that cached data older than TTL (30 min) is returned with STALE status upon upstream failure."""
    test_db = str(tmp_path / "test_stale.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    client._init_db()
    
    # Insert entry with timestamp 45 minutes ago
    stale_time = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=45)).isoformat(timespec="seconds")
    conn = sqlite3.connect(test_db)
    c = conn.cursor()
    c.execute("""
        INSERT INTO imd_context_cache (district, warning_level, nowcast, source, observed_at, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ("Khordha", "ORANGE - Heat Wave", "Advisory", "India Meteorological Department (IMD)", "2026-10-04 0300", stale_time))
    conn.commit()
    conn.close()
    
    ctx = client.get_district_context("Khordha")
    assert ctx["status"] == "STALE"
    assert ctx["data_age_minutes"] >= 45
    assert ctx["warning_level"] == "ORANGE - Heat Wave"


def test_10_no_cache_failure(tmp_path, monkeypatch):
    """Verify that cache miss combined with API unavailability returns UNAVAILABLE without synthetic values."""
    test_db = str(tmp_path / "test_nocache.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    client = IMDClient()
    client._init_db()
    
    ctx = client.get_district_context("Khordha")
    assert ctx["status"] == "UNAVAILABLE"
    assert ctx["reason"] == "CACHE_MISS_AND_API_UNAVAILABLE"


def test_11_khordha_geographic_metadata(tmp_path, monkeypatch):
    """Verify that returned context explicitly exposes Khordha and district spatial resolution."""
    test_db = str(tmp_path / "test_geo.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "")
    monkeypatch.setenv("IMD_ENABLED", "false")
    
    client = IMDClient()
    res = client.get_district_context("Khordha")
    
    assert res["district"] == "Khordha"
    assert res["spatial_resolution"] == "district"
    assert res["geographic_context"] == "Khordha"


def test_12_warning_nowcast_semantic_separation(tmp_path, monkeypatch):
    """Verify that synoptic warning code and nowcast bullet are preserved as separate semantic entities."""
    test_db = str(tmp_path / "test_sep.db")
    monkeypatch.setattr("services.imd_client.DB_PATH", test_db)
    monkeypatch.setenv("IMD_API_KEY", "official_demo_key")
    monkeypatch.setenv("IMD_ENABLED", "true")
    
    mock_payload = [
        {
            "District": "Khordha",
            "Date": "2026-10-04",
            "Day_1": "2",        # Code 2 = Heavy Rain
            "Day1_Color": "2",   # Color 2 = ORANGE
            "message": "Thunderstorm with gusty winds up to 45 kmph expected."
        }
    ]
    
    client = IMDClient()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload
    
    with patch.object(client.session, "get", return_value=mock_resp):
        client.fetch_live_district_context("Khordha")
        
    ctx = client.get_district_context("Khordha")
    assert "ORANGE - Heavy Rain" in ctx["warning_level"]
    assert "Thunderstorm with gusty winds" in ctx["nowcast"]
    assert ctx["warning_level"] != ctx["nowcast"]


def test_13_not_confirmed_semantics():
    """Verify that NOT_CONFIRMED reflects missing departure/persistence criteria and is not NO_HEATWAVE."""
    # Under coastal threshold (37°C): Instantaneous telemetry does not satisfy coastal heatwave criteria
    result_normal = evaluate_environmental_risk(
        temperature_c=34.0,
        humidity_pct=60.0,
        uv_index=5.0,
        aqi=50.0,
        wind_speed_ms=2.0
    )
    assert result_normal["imd_heatwave_context"] == "NOT_CONFIRMED"
    # Verify it does NOT claim "NO_HEATWAVE" or "NO_WARNING"
    assert result_normal["imd_heatwave_context"] != "NO_HEATWAVE"
    assert result_normal["imd_heatwave_context"] != "NO_WARNING"

    # Above coastal threshold (37°C): Telemetry meets threshold but awaits 2-day persistence confirmation
    result_hot = evaluate_environmental_risk(
        temperature_c=38.5,
        humidity_pct=65.0,
        uv_index=8.0,
        aqi=90.0,
        wind_speed_ms=1.5
    )
    assert result_hot["imd_heatwave_context"] == "CONDITIONS_MET_PENDING_PERSISTENCE"


def test_14_background_sync_failure_isolation():
    """Verify that an IMD sync failure in live_sync is isolated and cannot terminate execution."""
    from services.live_sync import _run_imd_loop
    
    # Verify that if fetch_live_district_context raises, it is caught cleanly
    with patch("services.imd_client.imd_client.fetch_live_district_context", side_effect=RuntimeError("IMD service timeout")):
        # We test that one iteration executes without raising an unhandled exception
        try:
            with patch("time.sleep", side_effect=InterruptedError("Loop stopped")):
                _run_imd_loop()
        except InterruptedError:
            # Expected from mocked sleep
            pass
        except Exception as e:
            pytest.fail(f"_run_imd_loop crashed with unhandled exception: {e}")

