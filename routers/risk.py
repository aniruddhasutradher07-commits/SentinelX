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

    # Get all wards

    wards = (
        db.query(Ward)
        .order_by(Ward.id)
        .all()
    )


    results = []


    # Check every ward

    for ward in wards:

        # Get latest prediction for this ward

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


        # If no prediction exists

        if prediction is None:

            results.append({

                "ward_id": ward.id,

                "ward_name": ward.ward_name,

                "risk_score": None,

                "risk_level": "NO DATA"

            })

            continue


        # Add latest risk

        results.append({

            "ward_id": ward.id,

            "ward_name": ward.ward_name,

            "risk_score": prediction.risk_score,

            "risk_level": prediction.risk_level

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

    # Find ward

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


    # Find latest prediction

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


    # No prediction available

    if prediction is None:

        return {

            "ward_id": ward.id,

            "ward_name": ward.ward_name,

            "risk": "NO DATA"

        }


    # Return detailed risk

    return {

        "ward_id": ward.id,

        "ward_name": ward.ward_name,

        "vulnerability_score": ward.vulnerability_score,

        "temperature": prediction.temperature,

        "humidity": prediction.humidity,

        "utci": prediction.utci,

        "wbgt": prediction.wbgt,

        "risk_score": prediction.risk_score,

        "risk_level": prediction.risk_level,

        "prediction_id": prediction.id,

        "prediction_time": prediction.prediction_time

    }