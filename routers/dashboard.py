from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Ward, Weather, RiskPrediction, Alert


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
# Dashboard API
# ============================================================

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Get all wards
    # --------------------------------------------------------

    wards = (
        db.query(Ward)
        .order_by(Ward.id)
        .all()
    )


    # --------------------------------------------------------
    # 2. Risk counters
    # --------------------------------------------------------

    extreme_count = 0
    high_count = 0
    moderate_count = 0
    low_count = 0
    no_data_count = 0


    ward_data = []


    # --------------------------------------------------------
    # 3. Process each ward
    # --------------------------------------------------------

    for ward in wards:

        # Get latest prediction

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


        # Get latest weather

        weather = (
            db.query(Weather)
            .filter(
                Weather.ward_id == ward.id
            )
            .order_by(
                Weather.id.desc()
            )
            .first()
        )


        # ----------------------------------------------------
        # Risk information
        # ----------------------------------------------------

        if prediction is None:

            risk_level = "NO DATA"
            risk_score = None

            no_data_count += 1

        else:

            risk_level = prediction.risk_level
            risk_score = prediction.risk_score


            if risk_level == "EXTREME":
                extreme_count += 1

            elif risk_level == "HIGH":
                high_count += 1

            elif risk_level == "MODERATE":
                moderate_count += 1

            elif risk_level == "LOW":
                low_count += 1


        # ----------------------------------------------------
        # Weather information
        # ----------------------------------------------------

        if weather:

            temperature = weather.temperature
            humidity = weather.humidity
            wind_speed = weather.wind_speed
            solar_radiation = weather.solar_radiation

        else:

            temperature = None
            humidity = None
            wind_speed = None
            solar_radiation = None


        # ----------------------------------------------------
        # Add ward data
        # ----------------------------------------------------

        ward_data.append({

            "ward_id": ward.id,

            "ward_name": ward.ward_name,

            "vulnerability_score": ward.vulnerability_score,

            "weather": {

                "temperature": temperature,

                "humidity": humidity,

                "wind_speed": wind_speed,

                "solar_radiation": solar_radiation

            },

            "risk": {

                "risk_score": risk_score,

                "risk_level": risk_level

            }

        })


    # ========================================================
    # 4. Get active alerts
    # ========================================================

    active_alerts = (
        db.query(Alert)
        .filter(
            Alert.status == "ACTIVE"
        )
        .order_by(
            Alert.id.desc()
        )
        .all()
    )


    alert_data = []


    for alert in active_alerts:

        ward = (
            db.query(Ward)
            .filter(
                Ward.id == alert.ward_id
            )
            .first()
        )


        alert_data.append({

            "alert_id": alert.id,

            "ward_id": alert.ward_id,

            "ward_name": (
                ward.ward_name
                if ward
                else "Unknown Ward"
            ),

            "risk_level": alert.risk_level,

            "risk_score": alert.risk_score,

            "message": alert.message,

            "status": alert.status,

            "alert_time": alert.alert_time

        })


    # ========================================================
    # 5. Return dashboard
    # ========================================================

    return {

        "total_wards": len(wards),

        "risk_summary": {

            "extreme": extreme_count,

            "high": high_count,

            "moderate": moderate_count,

            "low": low_count,

            "no_data": no_data_count

        },

        "wards": ward_data,

        "active_alerts": {

            "total": len(alert_data),

            "alerts": alert_data

        }

    }