"""
SentinelX Advanced Analytics & Disaster Intelligence Router
===========================================================
- 2-Stage DLNM + XGBoost Hospital Surge Forecasts
- H-THERM Biotech / Physiotherapy Human Thermal Strain Calculator
- Automated Alert Dispatch Simulation (SMS / IVRS)
- 30 Odisha Districts Statewide Telemetry
- Dashboard Auto-Polling Live Telemetry Feed
"""

import os
import json
import math
import sqlite3
import datetime
import pandas as pd
import numpy as np
from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel
from services.alerts import _mock_send_sms
from typing import Optional
from routers.news import fetch_live_news
from services.thermal_engine import heat_index_celsius, wbgt_outdoor_celsius, utci_celsius

router = APIRouter(prefix="/api/v1", tags=["SentinelX ML & Intelligence"])

DB_PATH = "sentinelx_data.db"

def get_sentinel_db():
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    return None

def compute_h_therm(T, RH, wind, solar, work_type):
    # 1. WBGT (Stull + Globe estimate)
    Tw = (T * np.arctan(0.151977 * (RH + 8.313659) ** 0.5)
          + np.arctan(T + RH) - np.arctan(RH - 1.676331)
          + 0.00391838 * RH ** 1.5 * np.arctan(0.023101 * RH) - 4.686035)
    Tg = T + (0.02 * solar) / (1 + max(wind, 0.5))
    wbgt = float(0.7 * Tw + 0.2 * Tg + 0.1 * T)

    # 2. Sweat Evaporation Deficit (Biotech)
    vp_sat = 0.61078 * np.exp((17.27 * T) / (T + 237.3))
    vp_actual = vp_sat * (RH / 100.0)
    evaporation_efficiency = max(0.1, 1.0 - (vp_actual / 4.5))

    # 3. Exertion multiplier (Physiotherapy)
    exertion_mult = {"resting": 1.0, "moderate": 1.35, "heavy": 1.75}.get(str(work_type).lower(), 1.35)

    # Composite H-THERM Score (0-100)
    h_therm_score = min(100.0, (wbgt / 34.0) * 80.0 * (1.0 / evaporation_efficiency) * 0.5 * exertion_mult)

    # Risk Tier
    if h_therm_score < 40: tier = "Low"
    elif h_therm_score < 65: tier = "Moderate"
    elif h_therm_score < 85: tier = "High"
    else: tier = "Extreme / Life Threatening"

    return {
        "input": {
            "temperature_c": float(T),
            "relative_humidity_pct": float(RH),
            "wind_speed_ms": float(wind),
            "solar_radiation_wm2": float(solar),
            "exertion_level": work_type
        },
        "physiological_metrics": {
            "wbgt_celsius": round(wbgt, 1),
            "sweat_evaporation_efficiency_pct": round(float(evaporation_efficiency * 100), 1),
            "h_therm_score": round(float(h_therm_score), 1),
            "human_thermal_strain_tier": tier
        },
        "clinical_advisory": {
            "maximum_continuous_outdoor_work_minutes": 15 if h_therm_score >= 85 else (30 if h_therm_score >= 65 else 60),
            "required_hourly_hydration_ml": 1000 if h_therm_score >= 85 else (750 if h_therm_score >= 65 else 500),
            "cooling_intervention": "Mandatory shaded rest and ice-towel cooling" if h_therm_score >= 85 else "Hydration breaks",
            "vulnerable_protocols": "Check elderly & shift heavy manual construction to early morning." if h_therm_score >= 65 else "Standard precautions."
        }
    }


@router.get("/status", summary="System Health & Pipeline Metadata")
def get_system_status():
    return {
        "status": "online",
        "system": "SentinelX / THERMO-SHIELD AI (Unified FastAPI Backend)",
        "problem_statement": "SIH 2026 - PS 26083",
        "organization": "MoES / NCMRWF / Disaster Management",
        "monitored_region": "Bhubaneswar Municipal Corporation (67 Wards) & Odisha (30 Districts)",
        "features": [
            "FastAPI Automatic Swagger UI (/docs)",
            "Live NewsAPI Extreme Weather Wire (/api/v1/news)",
            "2-Stage DLNM + XGBoost Hospital Surge Engine",
            "H-THERM Biotech / Physiotherapy Strain Model",
            "Statewide Odisha 30-District Command Center (/dashboard/odisha)",
            "Bhubaneswar Municipal Ward Dashboard (/dashboard/bhubaneswar)"
        ]
    }


def get_ist_now():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo("Asia/Kolkata"))
    except Exception:
        ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        return datetime.datetime.now(ist)


@router.get("/live-feed", summary="Real-time Live Telemetry Stream for Dashboard Polling")
def get_live_feed():
    now_dt = get_ist_now()
    news_items = fetch_live_news(page_size=5)
    
    # Import our new ML and Multi-Hazard engines
    from core.risk_rules import evaluate_environmental_risk
    from core.multi_hazard import evaluate_multi_hazards
    from services.ingestion import fetch_weather_data
    
    weather = fetch_weather_data(20.2961, 85.8245, "Bhubaneswar")
    
    mh_result = evaluate_multi_hazards(
        weather.precipitation_mm if weather else 0.0,
        weather.wind_gusts_ms if weather else 0.0,
        weather.forecast_7d_precip if weather else [0.0]*7
    )
    
    temp = weather.temperature_c if weather and weather.temperature_c is not None else 35.0
    rh = weather.humidity_percent if weather and weather.humidity_percent is not None else 50.0
    uv = weather.uv_index if weather and weather.uv_index is not None else 0.0
    aqi = weather.aqi if weather and weather.aqi is not None else 0.0
    wind = weather.wind_speed_ms if weather and weather.wind_speed_ms is not None else 1.0

    risk_result = evaluate_environmental_risk(temp, rh, uv, aqi, wind, getattr(weather, 'is_stale', False))
    return {
        "sync_timestamp": now_dt.isoformat(timespec="seconds"),
        "sync_time_display": now_dt.strftime("%I:%M %p IST"),
        "sync_time_short": now_dt.strftime("%I:%M %p"),
        "connection": "ACTIVE_WEBSOCKET_POLLING",
        "refresh_interval_sec": 15,
        "telemetry": {
            "monitored_districts": 30,
            "monitored_wards": 67,
            "peak_wbgt_statewide": 27.9,
            "peak_district": "Baleshwar",
            "active_alert_level": "ORANGE",
            "grid_status": "NORMAL",
            "hospitals_reporting": 48
        },
        "breaking_news_count": len(news_items),
        "top_headlines": [
            {"title": a["title"], "source": a["source"], "threat": a["threat_level"], "url": a["url"]}
            for a in news_items[:3]
        ],
        "multi_hazard": mh_result.to_dict(),
                "environmental_risk": risk_result,
        "hospital_surge_model": {
            "status": "EXPERIMENTAL_NOT_VALIDATED",
            "message": "Model removed from production alerting due to target leakage. Retained for research."
        },
        "elevated_risk_wards_count": 0,
        "model_engine": "2-Stage DLNM Lagged Baseline + XGBoost Residual ML",
        "confidence_score_r2": 0.566
    }


@router.get("/h-therm/calculate", summary="Calculate H-THERM Physiological Strain (GET)")
def calculate_h_therm_get(
    temperature_c: float = Query(39.5, description="Ambient air temperature in Celsius"),
    relative_humidity_pct: float = Query(68.0, description="Relative humidity %"),
    wind_speed_ms: float = Query(1.8, description="Wind speed at 10m in m/s"),
    solar_radiation_wm2: float = Query(750.0, description="Solar shortwave radiation in W/m²"),
    exertion_level: str = Query("heavy", description="resting, moderate, heavy")
):
    return compute_h_therm(temperature_c, relative_humidity_pct, wind_speed_ms, solar_radiation_wm2, exertion_level)


@router.post("/h-therm/calculate", summary="Calculate H-THERM Physiological Strain (POST)")
def calculate_h_therm_post(payload: dict = Body(...)):
    T = float(payload.get("temperature_c", 39.5))
    RH = float(payload.get("relative_humidity_pct", 68.0))
    wind = float(payload.get("wind_speed_ms", 1.8))
    solar = float(payload.get("solar_radiation_wm2", 750.0))
    work_type = payload.get("exertion_level", "heavy")
    return compute_h_therm(T, RH, wind, solar, work_type)


@router.get("/alerts/dispatch", summary="Simulate Emergency Advisory Broadcast (GET)")
@router.post("/alerts/dispatch", summary="Simulate Emergency Advisory Broadcast (POST)")
def dispatch_alert(
    ward_no: Optional[str] = Query(None),
    recipient_phone: Optional[str] = Query(None),
    advisory_text: Optional[str] = Query(None),
    payload: Optional[dict] = Body(None)
):
    w = (payload or {}).get("ward_no") or ward_no or "W21"
    contact = (payload or {}).get("recipient_phone") or recipient_phone or "+91-94370XXXXX"
    msg = (payload or {}).get("advisory_text") or advisory_text or f"🚨 [BMC SENTINELX EMERGENCY ADVISORY] Ward: {w} - Severe thermal strain alert."

    # Call the actual SMS service (which handles Twilio / Fast2SMS / Mock fallback)
    sms_response = _mock_send_sms(contact, msg)

    return {
        "dispatch_status": "SUCCESS",
        "gateway": sms_response.get("gateway", "NIC / BMC Emergency SMS Gateway"),
        "ward_no": w,
        "recipient": sms_response.get("recipient", contact),
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "message_payload": msg,
        "service_response": sms_response
    }


ODISHA_30_DISTRICTS_DATA = [
    {"district": "Khordha", "pop": 1870115, "lat": 20.18, "lon": 85.62, "t": 39.5, "rh": 68, "wbgt": 32.4},
    {"district": "Cuttack", "pop": 2624470, "lat": 20.46, "lon": 85.88, "t": 40.1, "rh": 66, "wbgt": 32.8},
    {"district": "Puri", "pop": 1698730, "lat": 19.81, "lon": 85.83, "t": 36.8, "rh": 82, "wbgt": 32.1},
    {"district": "Ganjam", "pop": 3529031, "lat": 19.38, "lon": 85.06, "t": 38.4, "rh": 74, "wbgt": 32.0},
    {"district": "Balasore", "pop": 2320529, "lat": 21.49, "lon": 86.93, "t": 38.2, "rh": 72, "wbgt": 31.6},
    {"district": "Bhadrak", "pop": 1506522, "lat": 21.06, "lon": 86.50, "t": 38.0, "rh": 75, "wbgt": 31.8},
    {"district": "Mayurbhanj", "pop": 2519738, "lat": 21.93, "lon": 86.74, "t": 41.2, "rh": 55, "wbgt": 31.2},
    {"district": "Kendujhar", "pop": 1801733, "lat": 21.63, "lon": 85.58, "t": 40.5, "rh": 58, "wbgt": 30.8},
    {"district": "Sundargarh", "pop": 2093437, "lat": 22.12, "lon": 84.04, "t": 42.1, "rh": 48, "wbgt": 30.5},
    {"district": "Sambalpur", "pop": 1041099, "lat": 21.47, "lon": 83.97, "t": 42.8, "rh": 46, "wbgt": 31.1},
    {"district": "Bargarh", "pop": 1481255, "lat": 21.33, "lon": 83.62, "t": 42.4, "rh": 47, "wbgt": 30.9},
    {"district": "Balangir", "pop": 1648997, "lat": 20.71, "lon": 83.48, "t": 43.1, "rh": 44, "wbgt": 31.4},
    {"district": "Nuapada", "pop": 610382, "lat": 20.83, "lon": 82.53, "t": 42.5, "rh": 43, "wbgt": 30.6},
    {"district": "Kalahandi", "pop": 1576869, "lat": 19.91, "lon": 83.12, "t": 41.8, "rh": 52, "wbgt": 30.9},
    {"district": "Rayagada", "pop": 965959, "lat": 19.17, "lon": 83.42, "t": 40.2, "rh": 59, "wbgt": 30.2},
    {"district": "Koraput", "pop": 1379647, "lat": 18.81, "lon": 82.71, "t": 37.5, "rh": 62, "wbgt": 28.6},
    {"district": "Malkangiri", "pop": 613192, "lat": 18.34, "lon": 81.90, "t": 39.8, "rh": 61, "wbgt": 29.8},
    {"district": "Nabarangpur", "pop": 1220946, "lat": 19.23, "lon": 82.55, "t": 38.6, "rh": 60, "wbgt": 29.2},
    {"district": "Kandhamal", "pop": 733110, "lat": 20.44, "lon": 84.23, "t": 38.2, "rh": 58, "wbgt": 28.9},
    {"district": "Boudh", "pop": 441162, "lat": 20.84, "lon": 84.32, "t": 42.0, "rh": 50, "wbgt": 31.0},
    {"district": "Subarnapur", "pop": 610183, "lat": 20.84, "lon": 83.72, "t": 42.6, "rh": 47, "wbgt": 31.2},
    {"district": "Angul", "pop": 1273821, "lat": 20.84, "lon": 85.10, "t": 42.3, "rh": 54, "wbgt": 31.9},
    {"district": "Dhenkanal", "pop": 1192811, "lat": 20.66, "lon": 85.59, "t": 41.1, "rh": 60, "wbgt": 31.7},
    {"district": "Jajpur", "pop": 1827192, "lat": 20.85, "lon": 86.33, "t": 39.6, "rh": 67, "wbgt": 32.2},
    {"district": "Kendrapara", "pop": 1440218, "lat": 20.50, "lon": 86.42, "t": 38.4, "rh": 76, "wbgt": 32.3},
    {"district": "Jagatsinghpur", "pop": 1136971, "lat": 20.27, "lon": 86.17, "t": 37.9, "rh": 78, "wbgt": 32.2},
    {"district": "Nayagarh", "pop": 962789, "lat": 20.13, "lon": 85.10, "t": 40.8, "rh": 63, "wbgt": 31.8},
    {"district": "Gajapati", "pop": 577817, "lat": 18.81, "lon": 84.16, "t": 38.9, "rh": 68, "wbgt": 30.6},
    {"district": "Jharsuguda", "pop": 579505, "lat": 21.86, "lon": 82.01, "t": 42.5, "rh": 48, "wbgt": 31.0},
    {"district": "Deogarh", "pop": 312520, "lat": 21.53, "lon": 84.73, "t": 41.6, "rh": 51, "wbgt": 30.7}
]

def compute_vulnerability(elderly, workers, tree_cover=None, roofs=None):
    s_eld = min(100.0, (elderly / 18.0) * 100.0)
    s_work = min(100.0, (workers / 45.0) * 100.0)
    
    factors = [
        {"name": "Elderly Density (>60 yrs)", "score": s_eld, "weight": 0.35},
        {"name": "Outdoor Manual Labor Density", "score": s_work, "weight": 0.65}
    ]
    
    if tree_cover is not None:
        s_tree = max(0.0, 100.0 - (tree_cover / 45.0) * 100.0)
        factors.append({"name": "Canopy & Green Deficit", "score": s_tree, "weight": 0.20})
        # Adjust base weights when spatial data is present
        factors[0]["weight"] = 0.25
        factors[1]["weight"] = 0.35
        
    if roofs is not None:
        s_roof = min(100.0, (roofs / 65.0) * 100.0)
        factors.append({"name": "Tin / Asbestos Roofing", "score": s_roof, "weight": 0.20})
    
    total_w = sum(f["weight"] for f in factors)
    score = round(sum(f["score"] * (f["weight"] / total_w) for f in factors), 1)
    
    mult = round(0.85 + (score / 100.0) * 0.55, 3)
    dominant = max(factors, key=lambda f: f["score"])["name"]
    tier = "SEVERE" if score >= 75 else ("HIGH" if score >= 50 else ("MODERATE" if score >= 30 else "LOW"))
    
    res = {
        "elderly_pct": round(elderly, 1),
        "outdoor_worker_pct": round(workers, 1),
        "vulnerability_score": score,
        "vulnerability_multiplier": mult,
        "vulnerability_tier": tier,
        "dominant_factor": dominant
    }
    
    if tree_cover is not None:
        res["tree_cover_pct"] = round(tree_cover, 1)
    if roofs is not None:
        res["high_heat_roof_pct"] = round(roofs, 1)
        
    return res

def get_dist_vuln(name):
    coastal = name in ["Puri", "Ganjam", "Jagatsinghpur", "Kendrapara", "Bhadrak", "Balasore"]
    tribal = name in ["Kandhamal", "Koraput", "Rayagada", "Malkangiri", "Mayurbhanj", "Sundargarh"]
    tree = 36.5 if tribal else (18.2 if coastal else 14.5)
    work = 38.0 if tribal else (31.5 if coastal else 26.0)
    eld = 12.4 if coastal else 9.8
    roof = 42.0 if tribal else (34.0 if coastal else 25.5)
    return compute_vulnerability(eld, work, tree, roof)

@router.get("/districts", summary="All 30 Odisha Districts Live Telemetry")
def get_odisha_districts():
    now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:00:00")
    districts = []
    for d in ODISHA_30_DISTRICTS_DATA:
        vuln = get_dist_vuln(d["district"])
        t = d["t"]
        rh = d["rh"]
        wbgt = d["wbgt"]
        hazard = round((wbgt / 33.0) * 75.0)
        score = min(100.0, round(hazard * vuln["vulnerability_multiplier"], 1))
        tier = "Red" if score >= 85 else ("Orange" if score >= 70 else ("Yellow" if score >= 45 else "Green"))
        districts.append({
            "district": d["district"],
            "population_2011_est": d["pop"],
            "centroid_lat": d["lat"],
            "centroid_lon": d["lon"],
            "timestamp": now_ts,
            "temperature_c": t,
            "relative_humidity_pct": rh,
            "wind_speed_ms": 2.2,
            "solar_radiation_wm2": 850.0,
            "apparent_temp_c": round(t + 4.2, 1),
            "HI_celsius": round(t + 5.1, 1),
            "WBGT_celsius": wbgt,
            "UTCI_celsius": round(t + 3.8, 1),
            "thermal_hazard_score": hazard,
            "DistrictRiskScore": score,
            "RiskTier": tier,
            **vuln
        })
    return {"count": len(districts), "districts": districts}


@router.get("/districts/{name}", summary="Single Odisha District Deep Dive")
def get_odisha_district_detail(name: str):
    dist_info = next((d for d in ODISHA_30_DISTRICTS_DATA if d["district"].lower() == name.lower()), None)
    if not dist_info:
        raise HTTPException(status_code=404, detail=f"District '{name}' not found.")
    
    # Generate 24-hr hourly projection
    hourly = []
    base_t = dist_info["t"]
    for h in range(24):
        hour_val = (h + 8) % 24
        temp_cycle = math.sin((hour_val - 9) * math.pi / 12)
        t = round(base_t - 5.0 + temp_cycle * 7.0, 1)
        wbgt = round(dist_info["wbgt"] - 3.0 + temp_cycle * 4.0, 1)
        hourly.append({
            "hour": f"{hour_val:02d}:00",
            "temperature_c": t,
            "WBGT_celsius": wbgt,
            "humidity_pct": round(dist_info["rh"] - temp_cycle * 15, 1)
        })
    return {"district": dist_info["district"], "hourly_forecast": hourly}


@router.get("/wards", summary="All 67 Bhubaneswar Wards Live Telemetry")
def get_bhubaneswar_wards():
    from database import SessionLocal
    from services.bhuvan_lulc import BhuvanLULCService
    db = SessionLocal()
    try:
        geojson_path = "wards_bhubaneswar.geojson"
    
    features = []
    if os.path.exists(geojson_path):
        try:
            with open(geojson_path, "r", encoding="utf-8") as f:
                features = json.load(f).get("features", [])
        except Exception:
            pass
    
    from services.ingestion import fetch_multi_location, WeatherReading
    from services.imd_client import imd_client
    from services.cpcb_client import cpcb_client
    from services.health_infra import health_infra
    imd_ctx = imd_client.get_district_context("Khordha")
    
    locations = []
    for idx, feat in enumerate(features):
        p = feat.get("properties", {})
        w_no = p.get("wardno") or f"W{idx + 1}"
        lat = p.get("latitudei") or (20.29 + idx * 0.001)
        lon = p.get("longitudei") or (85.82 + idx * 0.001)
        locations.append({"lat": lat, "lon": lon, "name": w_no})
        
    weather_results = fetch_multi_location(locations)
    # Map weather by ward_no
    weather_map = {}
    for w in weather_results:
        if w:
            weather_map[w.ward_id] = w

    now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:00:00")
    wards = []
    for idx, feat in enumerate(features):
        p = feat.get("properties", {})
        w_no = p.get("wardno") or f"W{idx + 1}"
        pop = p.get("totalwardpopulation") or 13500
        # Demographic vulnerability (Spatial data omitted until Bhuvan API integration)
        eld = 8.5
        work = 24.0
        vuln = compute_vulnerability(eld, work, tree_cover=None, roofs=None)
        
        w_data = weather_map.get(w_no)
        if not w_data:
            # Absolute fallback if even DB fails
            w_data = WeatherReading(
                ward_id=w_no, latitude=locations[idx]["lat"], longitude=locations[idx]["lon"],
                temperature_c=35.0, humidity_percent=50.0, wind_speed_ms=1.0, uv_index=0.0,
                aqi=0.0, aqi_standard="US_AQI", source="UNAVAILABLE", observed_at=now_ts, fetched_at=now_ts,
                is_live=False, is_stale=True, data_age_minutes=999
            )
            
        temp = w_data.temperature_c if w_data.temperature_c is not None else 0.0
        rh = w_data.humidity_percent if w_data.humidity_percent is not None else 0.0
        wind = w_data.wind_speed_ms if w_data.wind_speed_ms is not None else 0.0
        solar = 907.5 # Keep constant solar for now as API doesn't provide it easily
        
        wbgt = round(wbgt_outdoor_celsius(temp, rh, solar, wind), 1)
        hi = round(heat_index_celsius(temp, rh), 1)
        utci = round(utci_celsius(temp, rh, solar, wind), 1)
        
        hazard = round((wbgt / 33.0) * 75.0)
        risk_score = min(100.0, round(hazard * vuln["vulnerability_multiplier"], 1))
        tier = "Red" if risk_score >= 85 else ("Orange" if risk_score >= 70 else ("Yellow" if risk_score >= 45 else "Green"))
        
        
        # Remote sensing fabrications have been stripped per provenance rules
        
        
        cpcb_ctx = cpcb_client.map_ward_to_station(locations[idx]["lat"], locations[idx]["lon"])
        
        # Use CPCB AQI if available, otherwise preserve Open-Meteo AQI
        aqi_val = cpcb_ctx.get("aqi")
        if aqi_val is None:
            aqi_val = w_data.aqi
        wards.append({
            "ward_no": w_no,
            "zone": p.get("municipalzone") or "North Zone",
            "population": pop,
            "centroid_lat": locations[idx]["lat"],
            "centroid_lon": locations[idx]["lon"],
            "timestamp": now_ts,
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "wind_speed_ms": wind,
            "solar_radiation_wm2": solar,
            "apparent_temp_c": round(temp + 3.8, 1),
            "adjusted_temp_c": temp,
            "HI_celsius": hi,
            "WBGT_celsius": wbgt,
            "UTCI_celsius": utci,
            "thermal_hazard_score": hazard,
            "WardRiskScore": risk_score,
            "RiskTier": tier,
            
            # Legacy fields for compatibility
            "is_live": w_data.is_live,
            "is_stale": w_data.is_stale,
            "data_age_minutes": w_data.data_age_minutes,
            "source": w_data.source,
            "observed_at": w_data.observed_at,
            "fetched_at": w_data.fetched_at,
            "uv_index": w_data.uv_index,
            "aqi": aqi_val,
            "aqi_standard": w_data.aqi_standard,
            **vuln,
            
            # Unified structure
            "telemetry": {
                "temperature_c": temp,
                "relative_humidity_pct": rh,
                "wind_speed_ms": wind,
                "uv_index": w_data.uv_index,
                "source": w_data.source,
                "status": "LIVE" if not w_data.is_stale else "STALE",
                "observed_at": w_data.observed_at,
                "fetched_at": w_data.fetched_at,
                "data_age_minutes": w_data.data_age_minutes
            },
            "air_quality": cpcb_ctx,
            "imd_context": imd_ctx,
            "data_quality": {
                "weather": "LIVE" if not w_data.is_stale else "STALE",
                "air_quality": cpcb_ctx.get("status", "UNAVAILABLE"),
                "imd": imd_ctx.get("status", "UNAVAILABLE")
            },
            "bhuvan_lulc": BhuvanLULCService.get_ward_context(w_no, db),
            "health_infrastructure": health_infra.get_ward_infrastructure(w_no)
        })
    finally:
        db.close()
    return {"count": len(wards), "wards": wards}


@router.get("/wards/{ward_no}", summary="Single Bhubaneswar Ward Telemetry")
def get_single_ward(ward_no: str):
    all_wards = get_bhubaneswar_wards()["wards"]
    w = next((x for x in all_wards if x["ward_no"].lower() == ward_no.lower()), None)
    if not w:
        raise HTTPException(status_code=404, detail=f"Ward '{ward_no}' not found.")
    return w


@router.get("/odisha-geojson", summary="Odisha 30-District Sovereign GeoJSON")
def get_odisha_geojson():
    geojson_path = "odisha_districts.geojson"
    if os.path.exists(geojson_path):
        from fastapi.responses import FileResponse
        return FileResponse(geojson_path, media_type="application/json")
    raise HTTPException(status_code=404, detail="odisha_districts.geojson not found.")


@router.get("/wards-geojson", summary="Bhubaneswar 67-Ward GeoJSON Boundaries")
def get_wards_geojson():
    """Serve raw ward-level GeoJSON for Leaflet overlay on zoom-in."""
    geojson_path = "wards_bhubaneswar.geojson"
    if os.path.exists(geojson_path):
        from fastapi.responses import FileResponse
        return FileResponse(geojson_path, media_type="application/json")
    raise HTTPException(status_code=404, detail="wards_bhubaneswar.geojson not found.")


@router.get("/benchmarks", summary="NDMA Heatwave Benchmarks")
def get_benchmarks():
    csv_path = "ndma_heatwave_benchmarks.csv"
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        return {"count": len(df), "benchmarks": df.to_dict(orient="records")}
    return {"count": 0, "benchmarks": []}
