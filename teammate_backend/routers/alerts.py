from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Alert, Ward


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
# Get all alerts
# ============================================================

@router.get("/alerts")
def get_all_alerts(
    db: Session = Depends(get_db)
):

    alerts = (
        db.query(Alert)
        .order_by(Alert.id.desc())
        .all()
    )

    results = []

    for alert in alerts:

        ward = (
            db.query(Ward)
            .filter(Ward.id == alert.ward_id)
            .first()
        )

        results.append({

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


    return {

        "total_alerts": len(results),

        "alerts": results

    }