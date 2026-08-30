from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import SessionLocal
from models import Ward
from services.thermal_processor import process_thermal_reading


router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# Thermal Stress API
# ============================================================
# UTCI/WBGT are now OPTIONAL (previously required). If omitted, they are
# computed automatically from temperature/humidity/wind/solar_radiation
# using the same validated formulas as the SentinelX ward-level pipeline
# (services/thermal_engine.py) — the same code path the live-weather
# background refresh uses. Passing them explicitly still works exactly
# as before, for callers who already have their own UTCI/WBGT source.
@router.post("/thermal-stress")
def add_thermal_stress(
    ward_id: int = Query(..., gt=0),
    temperature: float = Query(..., ge=-50, le=70),
    humidity: float = Query(..., ge=0, le=100),
    wind_speed: float = Query(..., ge=0, le=100),
    solar_radiation: float = Query(..., ge=0, le=2000),
    utci: Optional[float] = Query(None, ge=-50, le=80),
    wbgt: Optional[float] = Query(None, ge=-50, le=60),
    db: Session = Depends(get_db)
):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if ward is None:
        raise HTTPException(status_code=404, detail="Ward not found")

    weather, prediction, alert = process_thermal_reading(
        db, ward, temperature, humidity, wind_speed, solar_radiation,
        utci=utci, wbgt=wbgt,
    )

    return {
        "message": "Thermal stress data saved successfully",
        "ward": {"id": ward.id, "name": ward.ward_name},
        "weather": {
            "temperature": temperature, "humidity": humidity,
            "wind_speed": wind_speed, "solar_radiation": solar_radiation,
        },
        "thermal_indices": {
            "hi": prediction.hi, "utci": prediction.utci, "wbgt": prediction.wbgt,
        },
        "risk": {
            "risk_score": prediction.risk_score, "risk_level": prediction.risk_level,
        },
        "prediction": {
            "prediction_id": prediction.id, "prediction_time": prediction.prediction_time,
        },
        "alert": {
            "created": alert is not None, "alert_id": alert.id if alert else None,
        },
    }
