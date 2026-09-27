"""
Health Impact Research & Official Data Source Router
===================================================
Endpoints:
  • /api/v1/mortality-risk — 5-Day Ward/District Environmental Mortality Research Module
  • /api/v1/cpcb/status — Official Central Pollution Control Board (CPCB) Status
  • /api/v1/cpcb/ward/{ward_no} — Ward CPCB Station Mapping & Distance
  • /api/v1/imd/status — Official India Meteorological Department (IMD) Context & Status
  • /api/v1/alerts/dispatch — Notification Service Alert Trigger (SMS / WhatsApp)
  • /api/v1/alerts/audit-log — Notification Audit Trail
"""

import os
import math
import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, Body, HTTPException
import requests

from services.cpcb_client import cpcb_client
from services.imd_client import imd_client
from services.notification_service import notification_service

router = APIRouter(prefix="/api/v1", tags=["Health Research & Official Data Integrations"])

# ---------------------------------------------------------------------------
# 1. Mortality Impact Research Architecture (Section 2)
# ---------------------------------------------------------------------------
@router.get("/mortality-risk", summary="Ward / District Heatwave Mortality Impact Research")
def get_mortality_risk(
    district: Optional[str] = Query("Khordha", description="Target District name"),
    ward: Optional[str] = Query(None, description="Optional Ward Code e.g. W14 or W21"),
    horizon: int = Query(5, ge=1, le=5, description="Forecast horizon in days (1-5)")
):
    """
    Experimental biometeorological research module for heat-related mortality risk.
    TRUTHFUL DATA RELEASE MANDATE:
    - Because verified health outcome mortality registers are not connected to this project,
      'predicted_mortality' is strictly set to null.
    - Never fabricates deaths, death counts, or mortality percentages.
    - Clearly distinguishes Environmental Hazard Exposure from clinical mortality prediction.
    """
    target_name = ward if ward else (district or "Khordha")
    
    # Coordinates for query
    lat = 20.2961
    lon = 85.8245
    
    if ward:
        try:
            from routers.sentinelx import get_bhubaneswar_wards
            all_wards = get_bhubaneswar_wards()["wards"]
            w_obj = next((x for x in all_wards if x["ward_no"].lower() == ward.lower()), None)
            if w_obj:
                lat = w_obj.get("centroid_lat", lat)
                lon = w_obj.get("centroid_lon", lon)
                target_name = f"{w_obj.get('ward_name', ward)} ({ward})"
        except Exception:
            pass

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto&forecast_days={horizon}"
        resp = requests.get(url, timeout=4)
        if resp.status_code != 200:
            return {
                "status": "UNAVAILABLE",
                "experimental": True,
                "provenance": "Experimental research model — not clinically validated",
                "message": "Meteorological reanalysis service unavailable"
            }
        
        data = resp.json()
        daily = data.get("daily", {})
        times = daily.get("time", [])[:horizon]
        t_maxes = daily.get("temperature_2m_max", [])[:horizon]
        rh_maxes = daily.get("relative_humidity_2m_max", [])[:horizon]
        winds = daily.get("wind_speed_10m_max", [2.2] * len(times))[:horizon]
        
        forecast = []
        scores = []
        for i in range(len(times)):
            t_max = float(t_maxes[i])
            rh_max = float(rh_maxes[i])
            w_val = float(winds[i]) if i < len(winds) and winds[i] is not None else 2.2
            
            # WBGT (Stull equation)
            tw = (t_max * math.atan(0.151977 * math.sqrt(rh_max + 8.313659)) +
                  math.atan(t_max + rh_max) - math.atan(rh_max - 1.676331) +
                  0.00391838 * (rh_max**1.5) * math.atan(0.023101 * rh_max) - 4.686035)
            wbgt = round(0.7 * tw + 0.2 * (t_max + 2.5) + 0.1 * t_max, 1)

            # Steadman Heat Index
            c1, c2, c3 = -8.78469475556, 1.61139411, 2.33854883889
            c4, c5, c6 = -0.14611605, -0.012308094, -0.0164248277778
            c7, c8, c9 = 0.002211732, 0.00072546, -0.000003582
            hi_val = (c1 + (c2 * t_max) + (c3 * rh_max) + (c4 * t_max * rh_max) +
                      (c5 * t_max**2) + (c6 * rh_max**2) + (c7 * (t_max**2) * rh_max) +
                      (c8 * t_max * (rh_max**2)) + (c9 * (t_max**2) * (rh_max**2)))
            hi = round(max(t_max, hi_val), 1)

            # UTCI estimate
            vp = (rh_max / 100.0) * 6.105 * math.exp((17.27 * t_max) / (237.7 + t_max))
            utci = round(t_max + 0.33 * vp - 0.70 * max(w_val, 0.5) - 4.0, 1)

            # Environmental exposure proxy score (0-100)
            hazard_score = min(100.0, round((wbgt / 34.0) * 80.0, 1))
            scores.append(hazard_score)

            tier = 'Red' if wbgt >= 32.0 else ('Orange' if wbgt >= 30.0 else ('Yellow' if wbgt >= 28.0 else 'Green'))

            forecast.append({
                "day": i + 1,
                "date": times[i],
                "wbgt_celsius": wbgt,
                "utci_celsius": utci,
                "heat_index_celsius": hi,
                "environmental_hazard_score": hazard_score,
                "environmental_exposure_tier": tier,
                # STRICT DATA TRUTH: No fake deaths or mortality predictions
                "predicted_mortality": None,
                "predicted_mortality_rate": None,
                "mortality_prediction_status": "NOT AVAILABLE"
            })

        avg_hazard = round(sum(scores) / len(scores), 1) if scores else 0.0
        overall_tier = 'Red' if avg_hazard >= 80.0 else ('Orange' if avg_hazard >= 65.0 else ('Yellow' if avg_hazard >= 45.0 else 'Green'))

        return {
            "status": "EXPERIMENTAL_NOT_VALIDATED",
            "experimental": True,
            "provenance": "Experimental research model — not clinically validated",
            "target_entity": target_name,
            "horizon_days": horizon,
            "data_availability": "METEOROLOGICAL_CONNECTED_HEALTH_OUTCOMES_DISCONNECTED",
            "target_status": "HEALTH OUTCOME DATASET NOT CONNECTED",
            "target_definition": "Daily Excess Mortality",
            "predicted_mortality": None,
            "environmental_hazard_risk": {
                "composite_hazard_score": avg_hazard,
                "risk_tier": overall_tier,
                "classification": "ENVIRONMENTAL EXPOSURE PROXY"
            },
            "model_metadata": {
                "model_type": "Biometeorological Exposure Index",
                "validation_status": "UNVALIDATED",
                "disclaimer": "Validated mortality prediction unavailable — health outcome dataset not connected. Environmental hazard scores reflect ambient thermal burden, not clinical mortality probabilities."
            },
            "forecast": forecast
        }

    except Exception as ex:
        return {
            "status": "UNAVAILABLE",
            "experimental": True,
            "provenance": "Experimental research model — not clinically validated",
            "message": str(ex)
        }


# ---------------------------------------------------------------------------
# 2. CPCB Live Connector Endpoints (Section 3)
# ---------------------------------------------------------------------------
@router.get("/cpcb/status", summary="Central Pollution Control Board (CPCB) Ingestion Status")
def get_cpcb_status():
    """
    Exposes official CPCB ingestion status, credential configuration, and cached stations.
    Never exposes raw API keys.
    """
    has_key = bool(cpcb_client.api_key)
    is_enabled = cpcb_client.enabled
    
    if not is_enabled or not has_key:
        return {
            "status": "CREDENTIALS_NOT_CONFIGURED" if not has_key else "UNAVAILABLE",
            "source": "CPCB / National Air Quality Monitoring Programme (NAMP)",
            "portal": "https://data.gov.in / CPCB",
            "credentials_configured": has_key,
            "service_enabled": is_enabled,
            "message": "CPCB_API_KEY is not configured in .env. Air quality data is served via independent Open-Meteo European/Copernicus atmospheric models."
        }

    cache = cpcb_client._get_cache()
    if not cache:
        return {
            "status": "UNAVAILABLE",
            "source": "CPCB",
            "credentials_configured": True,
            "service_enabled": True,
            "message": "Cache is empty and live CPCB API is currently unreachable."
        }

    latest_fetch = max((s.get("fetched_at", "") for s in cache), default="")
    now = datetime.datetime.now(datetime.timezone.utc)
    data_age_min = None
    if latest_fetch:
        try:
            dt = datetime.datetime.fromisoformat(latest_fetch)
            data_age_min = int((now - dt).total_seconds() / 60.0)
        except Exception:
            pass

    return {
        "status": "LIVE" if (data_age_min is not None and data_age_min <= 30) else "STALE",
        "source": "CPCB",
        "credentials_configured": True,
        "service_enabled": True,
        "stations_count": len(cache),
        "latest_fetched_at": latest_fetch,
        "data_age_minutes": data_age_min,
        "stations": [
            {
                "station_name": s["station_name"],
                "observed_at": s.get("observed_at"),
                "pollutants_tracked": list(s.get("pollutants", {}).keys())
            } for s in cache
        ]
    }


@router.get("/cpcb/ward/{ward_no}", summary="Get CPCB Air Quality Observation for Ward")
def get_cpcb_ward(ward_no: str):
    try:
        from routers.sentinelx import get_bhubaneswar_wards
        all_wards = get_bhubaneswar_wards()["wards"]
        w = next((x for x in all_wards if x["ward_no"].lower() == ward_no.lower()), None)
        if not w:
            raise HTTPException(status_code=404, detail=f"Ward '{ward_no}' not found.")
        
        lat = w.get("centroid_lat", 20.2961)
        lon = w.get("centroid_lon", 85.8245)
        return cpcb_client.map_ward_to_station(lat, lon)
    except Exception as ex:
        return {
            "status": "UNAVAILABLE",
            "reason": str(ex)
        }


# ---------------------------------------------------------------------------
# 3. IMD Live Connector Endpoints (Section 4)
# ---------------------------------------------------------------------------
@router.get("/imd/status", summary="India Meteorological Department (IMD) Ingestion Status")
def get_imd_status(district: str = Query("Khordha")):
    """
    Exposes official IMD warning status.
    Warning categories are returned strictly when supplied by IMD, never fabricated.
    """
    context = imd_client.get_district_context(district)
    return {
        "source": "India Meteorological Department (IMD)",
        "source_type": "official_government",
        "district": district,
        "status": context.get("status", "CREDENTIALS_NOT_CONFIGURED"),
        "warning_category": context.get("warning_level"),
        "nowcast": context.get("nowcast"),
        "observed_at": context.get("observed_at"),
        "fetched_at": context.get("fetched_at"),
        "reason": context.get("reason"),
        "provenance": "Official National Meteorological Agency" if context.get("status") in ("LIVE", "STALE") else "Unconfigured"
    }


# ---------------------------------------------------------------------------
# 4. SMS / WhatsApp Alert Dispatch (Section 6)
# ---------------------------------------------------------------------------
@router.get("/alerts/dispatch", summary="Dispatch Emergency Multi-Channel Alert (SMS / WhatsApp)")
@router.post("/alerts/dispatch", summary="Dispatch Emergency Multi-Channel Alert (SMS / WhatsApp)")
def dispatch_alert(
    payload: Optional[dict] = Body(None),
    ward: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    channel: str = Query("SMS"),
    alert_tier: str = Query("RED"),
    message: Optional[str] = Query(None),
    dry_run: bool = Query(True)
):
    """
    Truthful emergency notification dispatcher.
    - dry_run=True returns DEMO ACTION (never contacts carrier network)
    - If API keys are unconfigured, returns CREDENTIALS_NOT_CONFIGURED
    - Configured credentials invoke actual Twilio/SMS provider call
    - Never fabricates fake delivery receipts
    """
    body = payload or {}
    reg = body.get("ward") or body.get("ward_no") or body.get("region") or region or ward or "Khordha Command Area"
    ch = body.get("channel") or channel or "SMS"
    tier = body.get("alert_tier") or body.get("tier") or alert_tier or "RED"
    msg = body.get("message") or body.get("advisory_text") or message or ""
    dr = body.get("dry_run", dry_run)
    recipient = body.get("recipient_phone") or body.get("phone")

    result = notification_service.dispatch(
        region=reg,
        channel=ch,
        alert_tier=tier,
        message=msg,
        dry_run=dr,
        recipient=recipient
    )
    return result


@router.get("/alerts/audit-log", summary="Get Notification Service Dispatch Audit Trail")
def get_alert_audit_log(limit: int = Query(20, ge=1, le=100)):
    return {
        "status": "success",
        "total_logged": len(notification_service.get_audit_logs(limit=limit)),
        "audit_logs": notification_service.get_audit_logs(limit=limit)
    }
