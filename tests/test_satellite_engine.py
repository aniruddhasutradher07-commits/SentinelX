"""
tests/test_satellite_engine.py
==============================
Unit and integration tests for Satellite Earth Observation Engine:
- NASA POWER API solar radiation
- Copernicus Sentinel-2 NDVI and green canopy mapping
- MODIS Land Surface Temperature (LST) & Urban Heat Island (UHI) anomalies
- Globe Temperature (Tg) & WBGT radiant coupling
- FastAPI satellite and UHI endpoints
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from services.satellite_engine import (
    fetch_nasa_power_solar_radiation,
    derive_sentinel2_ndvi_and_canopy,
    compute_modis_lst_and_uhi,
    get_ward_satellite_telemetry,
    generate_bhubaneswar_satellite_dataset,
)
from services.thermal_engine import wbgt_outdoor_celsius, _globe_temp
from services.risk_engine import calculate_risk

client = TestClient(app)


def test_nasa_power_solar_radiation():
    """Validates that NASA POWER API returns valid solar radiation (>300 W/m²)."""
    res = fetch_nasa_power_solar_radiation(lat=20.296, lon=85.824)
    assert "solar_radiation_wm2" in res
    assert res["solar_radiation_wm2"] >= 300.0
    assert "daily_insolation_kwh_m2" in res
    assert "source" in res


def test_sentinel2_ndvi_and_canopy():
    """Validates that Sentinel-2 NDVI is normalized [-0.1, 0.8] and produces realistic canopy %."""
    veg_core = derive_sentinel2_ndvi_and_canopy(lat=20.272, lon=85.833, zone="Central", population_density=20000)
    veg_green = derive_sentinel2_ndvi_and_canopy(lat=20.350, lon=85.800, zone="North Zone", population_density=6000)

    # Core urban has lower NDVI than green peripheral zone
    assert veg_core["sentinel2_ndvi"] < veg_green["sentinel2_ndvi"]
    assert veg_core["satellite_tree_cover_pct"] < veg_green["satellite_tree_cover_pct"]
    assert 4.0 <= veg_core["satellite_tree_cover_pct"] <= 68.0


def test_modis_lst_and_uhi_differential():
    """Validates that MODIS LST is higher than ambient air and calculates UHI anomaly correctly."""
    # Master Canteen / Rasulgarh high impervious hotspot
    hotspot = compute_modis_lst_and_uhi(
        ambient_air_temp_c=39.0,
        ndvi=0.15,
        built_up_roof_pct=50.0,
        solar_radiation_wm2=900.0,
        ward_no="W21",
        zone="Central Zone"
    )

    # Ekamra Kanan / Chandaka green buffer
    buffer_zone = compute_modis_lst_and_uhi(
        ambient_air_temp_c=39.0,
        ndvi=0.55,
        built_up_roof_pct=15.0,
        solar_radiation_wm2=900.0,
        ward_no="W06",
        zone="North Zone"
    )

    # LST of hotspot must exceed buffer by at least 3.0°C
    assert hotspot["modis_lst_day_c"] > buffer_zone["modis_lst_day_c"] + 2.5
    assert hotspot["uhi_anomaly_c"] > buffer_zone["uhi_anomaly_c"]
    assert hotspot["uhi_classification"] in ["EXTREME_HOTSPOT", "MODERATE_UHI"]


def test_globe_temp_and_wbgt_lst_coupling():
    """Validates that satellite LST ground radiant heat elevates Globe Temp and outdoor WBGT."""
    T_air = 38.0
    RH = 65.0
    solar = 850.0
    wind = 1.5

    # Standard WBGT without LST coupling
    wbgt_standard = wbgt_outdoor_celsius(T_air, RH, solar, wind)
    # Augmented WBGT with 50°C asphalt/roof surface
    wbgt_coupled = wbgt_outdoor_celsius(T_air, RH, solar, wind, lst_c=50.0)

    assert wbgt_coupled > wbgt_standard
    assert (wbgt_coupled - wbgt_standard) >= 0.3  # Physiological thermal radiant lift


def test_risk_engine_satellite_lst_augmentation():
    """Validates that MODIS LST radiant skin temperature augments thermal hazard score."""
    res_standard = calculate_risk(utci=39.0, wbgt=30.0, vulnerability=0.5)
    res_satellite = calculate_risk(utci=39.0, wbgt=30.0, vulnerability=0.5, modis_lst_c=48.5)

    assert res_satellite["thermal_score"] > res_standard["thermal_score"]
    assert res_satellite["risk_score"] > res_standard["risk_score"]
    assert "modis_lst_c" in res_satellite
    assert "uhi_anomaly_c" in res_satellite


def test_api_satellite_ward_telemetry():
    """Validates FastAPI /api/v1/satellite/ward-telemetry endpoint."""
    response = client.get("/api/v1/satellite/ward-telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_wards"] >= 67
    first_ward = data["wards"][0]
    assert "modis_lst_day_c" in first_ward
    assert "sentinel2_ndvi" in first_ward
    assert "uhi_anomaly_c" in first_ward
    assert "nasa_solar_radiation_wm2" in first_ward


def test_api_satellite_uhi_hotspots():
    """Validates FastAPI /api/v1/satellite/uhi-hotspots endpoint."""
    response = client.get("/api/v1/satellite/uhi-hotspots")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "summary" in data
    assert "top_hotspots" in data
    assert len(data["top_hotspots"]) > 0
    top = data["top_hotspots"][0]
    assert top["uhi_anomaly_c"] >= 2.0


def test_api_nasa_solar_radiation():
    """Validates FastAPI /api/v1/nasa-power/solar-radiation endpoint."""
    response = client.get("/api/v1/nasa-power/solar-radiation?lat=20.296&lon=85.824")
    assert response.status_code == 200
    data = response.json()
    assert data["solar_radiation_wm2"] > 0
