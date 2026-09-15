from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Ward, RiskPrediction


router = APIRouter()


# ============================================================
# Database connection
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# Get latest risk for all wards
# ============================================================

@router.get("/risk")
def get_all_ward_risk(
    db: Session = Depends(get_db)
):
    wards = (
        db.query(Ward)
        .order_by(Ward.id)
        .all()
    )

    results = []

    for ward in wards:
        prediction = (
            db.query(RiskPrediction)
            .filter(
                RiskPrediction.ward_id == ward.id
            )
            .order_by(
                RiskPrediction.id.desc()
            )
            .first()
        )

        if prediction is None:
            results.append({
                "ward_id": ward.id,
                "ward_name": ward.ward_name,
                "ward_code": ward.ward_code,
                "zone": ward.zone,
                "population": ward.population,
                "vulnerability_score": ward.vulnerability_score,
                "vulnerability_multiplier": ward.vulnerability_multiplier,
                "elderly_pct": ward.elderly_pct,
                "outdoor_worker_pct": ward.outdoor_worker_pct,
                "tree_cover_pct": ward.tree_cover_pct,
                "high_heat_roof_pct": ward.high_heat_roof_pct,
                "risk_score": None,
                "risk_level": "NO DATA",
                "thermal_hazard_score": None,
            })
            continue

        results.append({
            "ward_id": ward.id,
            "ward_name": ward.ward_name,
            "ward_code": ward.ward_code,
            "zone": ward.zone,
            "population": ward.population,
            "vulnerability_score": ward.vulnerability_score,
            "vulnerability_multiplier": ward.vulnerability_multiplier,
            "elderly_pct": ward.elderly_pct,
            "outdoor_worker_pct": ward.outdoor_worker_pct,
            "tree_cover_pct": ward.tree_cover_pct,
            "high_heat_roof_pct": ward.high_heat_roof_pct,
            "risk_score": prediction.risk_score,
            "risk_level": prediction.risk_level,
            "thermal_hazard_score": prediction.thermal_hazard_score,
        })

    return {
        "total_wards": len(results),
        "wards": results
    }


# ============================================================
# Get detailed risk for one ward
# ============================================================

@router.get("/wards/{ward_id}/risk")
def get_ward_risk(
    ward_id: int,
    db: Session = Depends(get_db)
):
    ward = (
        db.query(Ward)
        .filter(Ward.id == ward_id)
        .first()
    )

    if ward is None:
        raise HTTPException(
            status_code=404,
            detail="Ward not found"
        )

    prediction = (
        db.query(RiskPrediction)
        .filter(
            RiskPrediction.ward_id == ward_id
        )
        .order_by(
            RiskPrediction.id.desc()
        )
        .first()
    )

    if prediction is None:
        return {
            "ward_id": ward.id,
            "ward_name": ward.ward_name,
            "ward_code": ward.ward_code,
            "zone": ward.zone,
            "population": ward.population,
            "vulnerability_score": ward.vulnerability_score,
            "vulnerability_multiplier": ward.vulnerability_multiplier,
            "elderly_pct": ward.elderly_pct,
            "outdoor_worker_pct": ward.outdoor_worker_pct,
            "tree_cover_pct": ward.tree_cover_pct,
            "high_heat_roof_pct": ward.high_heat_roof_pct,
            "risk": "NO DATA"
        }

    return {
        "ward_id": ward.id,
        "ward_name": ward.ward_name,
        "ward_code": ward.ward_code,
        "zone": ward.zone,
        "population": ward.population,
        "vulnerability_score": ward.vulnerability_score,
        "vulnerability_multiplier": ward.vulnerability_multiplier,
        "elderly_pct": ward.elderly_pct,
        "outdoor_worker_pct": ward.outdoor_worker_pct,
        "tree_cover_pct": ward.tree_cover_pct,
        "high_heat_roof_pct": ward.high_heat_roof_pct,
        "temperature": prediction.temperature,
        "humidity": prediction.humidity,
        "utci": prediction.utci,
        "wbgt": prediction.wbgt,
        "thermal_hazard_score": prediction.thermal_hazard_score,
        "risk_score": prediction.risk_score,
        "risk_level": prediction.risk_level,
        "prediction_id": prediction.id,
        "prediction_time": prediction.prediction_time
    }


# ============================================================
# Satellite Earth Observation & Urban Heat Island (UHI) APIs
# ============================================================

from services.satellite_engine import (
    generate_bhubaneswar_satellite_dataset,
    fetch_nasa_power_solar_radiation,
    compute_modis_lst_and_uhi
)

@router.get("/satellite/ward-telemetry")
@router.get("/api/v1/satellite/ward-telemetry")
def get_satellite_ward_telemetry():
    dataset = generate_bhubaneswar_satellite_dataset()
    return {
        "status": "success",
        "sensor_suite": [
            "NASA_POWER_CERES_SOLAR",
            "MODIS_TERRA_AQUA_LST_1KM",
            "COPERNICUS_SENTINEL_2_10M_NDVI"
        ],
        "total_wards": len(dataset),
        "wards": dataset
    }

@router.get("/satellite/uhi-hotspots")
@router.get("/api/v1/satellite/uhi-hotspots")
def get_uhi_hotspots():
    dataset = generate_bhubaneswar_satellite_dataset()
    hotspots = sorted(dataset, key=lambda x: x.get("uhi_anomaly_c", 0.0), reverse=True)
    extreme_hotspots = [w for w in hotspots if w.get("uhi_anomaly_c", 0.0) >= 4.0]
    moderate_uhi = [w for w in hotspots if 2.0 <= w.get("uhi_anomaly_c", 0.0) < 4.0]
    cooling_buffers = [w for w in hotspots if w.get("uhi_anomaly_c", 0.0) < 1.0]

    return {
        "status": "success",
        "rural_baseline_lst_c": 41.2,
        "summary": {
            "extreme_hotspot_count": len(extreme_hotspots),
            "moderate_uhi_count": len(moderate_uhi),
            "cooling_buffer_count": len(cooling_buffers),
            "peak_lst_c": hotspots[0]["modis_lst_day_c"] if hotspots else 48.0,
            "peak_uhi_ward": hotspots[0]["ward_no"] if hotspots else "W56"
        },
        "top_hotspots": hotspots[:15],
        "cooling_buffers": cooling_buffers[:10]
    }

@router.get("/nasa-power/solar-radiation")
@router.get("/api/v1/nasa-power/solar-radiation")
def get_nasa_solar_radiation(lat: float = 20.296, lon: float = 85.824):
    return fetch_nasa_power_solar_radiation(lat=lat, lon=lon)