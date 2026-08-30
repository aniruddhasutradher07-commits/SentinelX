"""
Alerts & Emergency Dispatch Router
==================================
Serves:
  - Teammate's active ward alerts from SQLite
  - Automated WhatsApp, NIC-SMS & EMS Telemetry Dispatch Simulator
  - Red Alert Drill simulation with multi-channel confirmation
  - Multilingual templates & broadcast audit trail
"""

from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database import SessionLocal
from models import Alert, Ward
from services.alert_dispatcher import (
    dispatch_emergency_broadcast,
    format_alert_message,
    get_audit_logs,
    ALERT_TEMPLATES,
    DEFAULT_RECIPIENTS
)

router = APIRouter(prefix="", tags=["Alert Management & Emergency Dispatch"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# 1. Teammate's Active Alerts from SQLite Database
# ============================================================
@router.get("/alerts", summary="Get all database alerts")
def get_all_alerts(db: Session = Depends(get_db)):
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
            "ward_name": ward.ward_name if ward else "Unknown Ward",
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


# ============================================================
# 2. Automated Multi-Channel Emergency Dispatch Engine
# ============================================================
@router.post("/api/v1/alerts/broadcast", summary="Transmit Multi-Channel Emergency Broadcast (SMS / WhatsApp / EMS)")
@router.post("/alerts/broadcast", summary="Alias for broadcast")
def trigger_emergency_broadcast(
    region: str = Query("Khordha District", description="Target District or Ward"),
    tier: str = Query("RED", description="RED, ORANGE, YELLOW"),
    lang: str = Query("en", description="en (English), or (Odia), hi (Hindi)"),
    wbgt: float = Query(31.8, description="Wet-Bulb Globe Temperature"),
    hi: float = Query(43.5, description="Heat Index"),
    payload: Optional[dict] = Body(None)
):
    req = payload or {}
    reg = req.get("region", region)
    t = req.get("tier", req.get("risk_level", tier))
    l = req.get("lang", req.get("language", lang))
    w = float(req.get("wbgt", wbgt))
    h = float(req.get("hi", hi))
    custom_msg = req.get("custom_message") or req.get("message")
    channels = req.get("channels")
    roles = req.get("target_roles")

    dispatch_result = dispatch_emergency_broadcast(
        region=reg,
        tier=t,
        lang=l,
        wbgt=w,
        hi=h,
        custom_message=custom_msg,
        target_roles=roles,
        channels=channels
    )
    return dispatch_result


@router.post("/api/v1/alerts/simulate-red-alert", summary="One-Click RED ALERT Drill (Statewide Dissemination)")
def simulate_red_alert_drill(
    district: str = Query("Khordha", description="Epicenter district for simulation drill")
):
    """
    Triggers an immediate end-to-end multi-agency Red Alert simulation:
    Notifies District Collector, 108 Ambulance Network, CDMO & Ward Officers in Odia & English.
    """
    result_en = dispatch_emergency_broadcast(
        region=f"{district} (State Capital Zone)",
        tier="RED",
        lang="en",
        wbgt=32.4,
        hi=46.2
    )
    result_or = dispatch_emergency_broadcast(
        region=f"{district} ଜିଲ୍ଲା",
        tier="RED",
        lang="or",
        wbgt=32.4,
        hi=46.2
    )

    return {
        "drill_status": "RED_ALERT_EXERCISE_EXECUTED",
        "epicenter": district,
        "peak_wbgt": "32.4°C (Severe Exertion Strain)",
        "protocol": "NDMA / OSDMA Action Plan Tier-III",
        "multilingual_broadcasts": [result_en, result_or],
        "message": f"Simulated Red Alert dispatch dispatched to all 5 state stakeholder channels for {district}."
    }


@router.get("/api/v1/alerts/templates", summary="View Multilingual Alert Templates")
def get_alert_templates():
    return {
        "supported_languages": ["or (Odia)", "en (English)", "hi (Hindi)"],
        "templates": ALERT_TEMPLATES,
        "standard_recipients": DEFAULT_RECIPIENTS
    }


@router.get("/api/v1/alerts/logs", summary="Get Dispatch Audit Trail & Delivery Receipts")
def get_dispatch_logs(limit: int = Query(20, ge=1, le=100)):
    logs = get_audit_logs(limit=limit)
    return {
        "total_dispatches": len(logs),
        "audit_logs": logs
    }