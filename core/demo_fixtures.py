"""
SentinelX / HeatGuard AI — Safe Demo Fallback Architecture
===========================================================
Strict Ethical & Operational Guarantees:
1. Production mode defaults to real external data sources (USE_MOCK_DATA=false, ENABLE_DEMO_FALLBACK=false).
2. Demo fixtures are strictly opt-in via ENABLE_DEMO_FALLBACK=true for offline hackathon/booth resilience.
3. Every synthetic fixture payload and UI representation is visibly and immutably tagged:
   "DEMO / SYNTHETIC — NOT LIVE"
4. Under NO circumstances are synthetic values labeled as LIVE, CALCULATED FROM LIVE DATA, or official government data.
5. Absolute Clinical Integrity: NEVER generates fake hospital admissions, mortality counts, government warnings, dispatches, or official CPCB/IMD observations.
6. Preserves existing LIVE / STALE / UNAVAILABLE / CREDENTIALS_NOT_CONFIGURED states.
"""

import os
import datetime
from typing import Dict, Any, List, Optional

DEMO_PROVENANCE_TAG = "DEMO / SYNTHETIC — NOT LIVE"
DEMO_SOURCE_TAG = "DEMO / SYNTHETIC — NOT LIVE (Offline Demo Fixture)"
DEMO_DISCLAIMER = (
    "DEMO / SYNTHETIC — NOT LIVE: Generated offline for hackathon demonstration "
    "resilience only. Not real-time observation. No clinical predictions generated."
)

def is_demo_fallback_enabled() -> bool:
    """
    Returns True ONLY if explicitly opted in via environment variable.
    Default in production is strictly False.
    """
    return os.environ.get("ENABLE_DEMO_FALLBACK", "false").lower() in ("true", "1", "yes") or \
           os.environ.get("DEMO_FALLBACK", "false").lower() in ("true", "1", "yes")

def get_demo_weather_payload(ward_id: str, lat: float = 20.2961, lon: float = 85.8245) -> Dict[str, Any]:
    """
    Deterministic biometeorological reference reading for Bhubaneswar / Odisha wards
    during an offline hackathon demo.
    Carries prominent DEMO / SYNTHETIC — NOT LIVE labeling and is_live = False.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "ward_id": ward_id,
        "latitude": lat,
        "longitude": lon,
        "temperature_c": 36.4,
        "humidity_percent": 64.0,
        "wind_speed_ms": 2.6,
        "uv_index": 5.5,
        "aqi": 98.0,
        "aqi_standard": "US_AQI",
        "source": DEMO_SOURCE_TAG,
        "observed_at": now_iso,
        "fetched_at": now_iso,
        "is_live": False,
        "is_stale": False,
        "is_demo_fallback": True,
        "provenance": DEMO_PROVENANCE_TAG,
        "disclaimer": DEMO_DISCLAIMER,
        "wind_gusts_ms": 3.8,
        "precipitation_mm": 0.0,
        "rain_mm": 0.0,
        "weather_code": 0,
        "pressure_hpa": 1008.5,
        "cloud_cover_pct": 15.0,
        "wind_direction": 180.0,
        "forecast_7d_precip": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    }

def get_demo_forecast_risk_payload(district: str, horizon: int = 5) -> List[Dict[str, Any]]:
    """
    Safe 5-day weather exposure forecast for demo resilience.
    Explicitly carries DEMO / SYNTHETIC — NOT LIVE provenance.
    Contains zero clinical admissions or mortality data.
    """
    now = datetime.datetime.now()
    forecast = []

    # Representative 5-day thermal sequence (Day 1-5)
    sample_temps = [36.2, 37.1, 38.0, 37.5, 36.8]
    sample_rhs = [65.0, 62.0, 60.0, 63.0, 66.0]
    sample_wbgts = [30.8, 31.5, 32.2, 31.9, 31.2]
    sample_his = [42.0, 44.5, 46.2, 45.1, 43.4]
    sample_utcis = [39.1, 40.2, 41.5, 40.8, 39.7]

    for i in range(min(horizon, 5)):
        dt_str = (now + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        wbgt = sample_wbgts[i]
        tier = "Red" if wbgt >= 32.0 else ("Orange" if wbgt >= 30.0 else ("Yellow" if wbgt >= 28.0 else "Green"))
        score = min(100.0, round((wbgt / 35.0) * 100.0, 1))

        forecast.append({
            "date": dt_str,
            "provenance": DEMO_PROVENANCE_TAG,
            "model_status": DEMO_PROVENANCE_TAG,
            "weather": {
                "max_temperature_c": sample_temps[i],
                "avg_humidity_percent": sample_rhs[i],
                "max_wind_speed_ms": 2.8,
                "peak_solar_radiation_wm2": 650.0,
                "source": DEMO_SOURCE_TAG
            },
            "thermal": {
                "heat_index_c": sample_his[i],
                "wbgt_c": wbgt,
                "utci_c": sample_utcis[i],
                "recovery_deficit": False
            },
            "risk": {
                "thermal_score": score,
                "risk_tier": tier,
                "classification": "ENVIRONMENTAL EXPOSURE PROXY"
            }
        })
    return forecast

def get_demo_hospital_demand_payload(ward_no: str) -> Dict[str, Any]:
    """
    Demo fallback for /api/v1/wards/{ward_no}/hospital-demand.
    MUST NEVER generate fake admissions. predicted_admissions is strictly None.
    """
    now = datetime.datetime.now()
    forecast = []

    for i in range(5):
        dt_str = (now + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        forecast.append({
            "date": dt_str,
            "wbgt_max": 31.2 + (i * 0.3),
            "t_max": 37.0 + (i * 0.4),
            "t_min": 26.5 + (i * 0.2),
            "relative_humidity_max": 65.0,
            "wind_speed_max": 2.5,
            "heat_index_max": 43.5,
            "utci_max": 39.8,
            "recovery_good": True,
            "streak_count": 0,
            "predicted_admissions": None,
            "admissions_prediction_status": "NOT AVAILABLE (No validated clinical ER records connected)",
            "environmental_hazard_tier": "Orange",
            "ImpactTier": "Orange"
        })

    return {
        "status": "DEMO_FALLBACK",
        "provenance": DEMO_PROVENANCE_TAG,
        "is_live": False,
        "source": DEMO_SOURCE_TAG,
        "disclaimer": DEMO_DISCLAIMER,
        "ward_no": ward_no,
        "ward_name": f"Ward {ward_no}",
        "zone": "Bhubaneswar Urban Core",
        "population": 12500,
        "source_weather": DEMO_SOURCE_TAG,
        "forecast_horizon_days": 5,
        "model_metadata": {
            "model_type": "Biometeorological Exposure Index",
            "validation_status": "DEMO_FALLBACK_NOT_VALIDATED",
            "disclaimer": "Validated clinical admissions predictions are unavailable. No real hospital records connected."
        },
        "forecast": forecast
    }

def get_demo_mortality_risk_payload(target_name: str, horizon: int = 5) -> Dict[str, Any]:
    """
    Demo fallback for /api/v1/mortality-risk.
    MUST NEVER generate fake deaths. predicted_mortality is strictly None.
    """
    now = datetime.datetime.now()
    forecast = []

    for i in range(min(horizon, 5)):
        dt_str = (now + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        forecast.append({
            "day": i + 1,
            "date": dt_str,
            "wbgt_celsius": 31.5,
            "utci_celsius": 39.5,
            "heat_index_celsius": 43.0,
            "environmental_hazard_score": 74.0,
            "environmental_exposure_tier": "Orange",
            "predicted_mortality": None,
            "predicted_mortality_rate": None,
            "mortality_prediction_status": "NOT AVAILABLE"
        })

    return {
        "status": "DEMO_FALLBACK",
        "provenance": DEMO_PROVENANCE_TAG,
        "is_live": False,
        "source": DEMO_SOURCE_TAG,
        "disclaimer": DEMO_DISCLAIMER,
        "experimental": True,
        "target_entity": target_name,
        "horizon_days": horizon,
        "data_availability": "DEMO_FALLBACK_HEALTH_OUTCOMES_DISCONNECTED",
        "target_status": "HEALTH OUTCOME DATASET NOT CONNECTED",
        "target_definition": "Daily Excess Mortality",
        "predicted_mortality": None,
        "environmental_hazard_risk": {
            "composite_hazard_score": 74.0,
            "risk_tier": "Orange",
            "classification": "ENVIRONMENTAL EXPOSURE PROXY"
        },
        "model_metadata": {
            "model_type": "Biometeorological Exposure Index",
            "validation_status": "DEMO_FALLBACK_UNVALIDATED",
            "disclaimer": "Validated mortality prediction unavailable — health outcome dataset not connected. Reflects ambient thermal burden only, not clinical mortality probabilities."
        },
        "forecast": forecast
    }
