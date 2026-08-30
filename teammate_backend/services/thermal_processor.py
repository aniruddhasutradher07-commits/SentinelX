"""
services/thermal_processor.py
================================
Shared save-pipeline for a thermal reading: save weather -> compute/accept
UTCI+WBGT -> run risk_engine -> save prediction -> create alert if needed.

Used by BOTH:
  - routers/thermal.py's POST /thermal-stress endpoint (manual entry,
    UTCI/WBGT optionally supplied by the caller)
  - services/live_weather.py's background refresh (UTCI/WBGT always
    computed automatically from live weather, no caller involved)

Keeping this logic in one place means the live-refreshed data and the
manually-posted data go through the exact same risk calculation, so the
dashboard/alerts/risk endpoints behave identically regardless of source.
"""

from datetime import datetime, timezone

from models import Ward, Weather, RiskPrediction, Alert
from services.risk_engine import calculate_risk
from services import thermal_engine


def create_alert_if_needed(ward, risk_level, risk_score, db):
    if risk_level not in ["HIGH", "EXTREME"]:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(Alert.ward_id == ward.id, Alert.status == "ACTIVE")
        .first()
    )
    if existing_alert:
        return existing_alert

    if risk_level == "EXTREME":
        message = ("EXTREME HEAT ALERT: Dangerous thermal stress detected. "
                    "Avoid prolonged outdoor exposure and stay hydrated.")
    else:
        message = ("HIGH HEAT ALERT: High thermal stress detected. "
                    "Reduce prolonged outdoor activity and stay hydrated.")

    alert = Alert(
        ward_id=ward.id, risk_level=risk_level, risk_score=risk_score,
        message=message, status="ACTIVE", alert_time=datetime.now(timezone.utc).isoformat(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def process_thermal_reading(db, ward, temperature, humidity, wind_speed,
                             solar_radiation, utci=None, wbgt=None):
    """
    Saves a Weather row, computes any missing thermal indices, saves a
    RiskPrediction, and creates an Alert if the risk is HIGH/EXTREME.
    Returns (weather, prediction, alert).
    """
    hi, computed_wbgt, computed_utci = thermal_engine.compute_all_indices(
        temperature, humidity, wind_speed, solar_radiation
    )
    if utci is None:
        utci = computed_utci
    if wbgt is None:
        wbgt = computed_wbgt

    weather = Weather(
        ward_id=ward.id, temperature=temperature, humidity=humidity,
        wind_speed=wind_speed, solar_radiation=solar_radiation,
        utc_time=datetime.now(timezone.utc).isoformat(),
    )
    db.add(weather)
    db.commit()
    db.refresh(weather)

    risk = calculate_risk(utci or 0, wbgt or 0, ward.vulnerability_score or 0)

    prediction = RiskPrediction(
        ward_id=ward.id, temperature=temperature, humidity=humidity,
        hi=round(hi, 1) if hi is not None else None,
        utci=round(utci, 1) if utci is not None else None,
        wbgt=round(wbgt, 1) if wbgt is not None else None,
        risk_score=risk["risk_score"], risk_level=risk["risk_level"],
        prediction_time=datetime.now(timezone.utc).isoformat(),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    alert = create_alert_if_needed(ward, risk["risk_level"], risk["risk_score"], db)

    return weather, prediction, alert
