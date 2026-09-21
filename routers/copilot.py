"""
SentinelX AI Incident Copilot & Disaster Decision Support (Google Gemini)
========================================================================
National Disaster Management Authority (NDMA) · Ministry of Earth Sciences (MoES)
NCMRWF · All 36 Indian States & Union Territories
"""

import os
import json
import urllib.request
import urllib.error
import datetime
from fastapi import APIRouter, Body, Query, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/v1/ai", tags=["AI Copilot & Incident Commander"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


def _build_fallback_response(telemetry_context: Optional[dict] = None) -> tuple[str, str, bool]:
    """Generates structured NDMA emergency fallback advisory tuple (text, engine, is_fallback)."""
    fallback_engine = "SentinelX Emergency Fallback Engine"
    loc = (telemetry_context or {}).get("location_name", "Target District")
    wbgt = (telemetry_context or {}).get("wbgt", "31.5")
    tier = (telemetry_context or {}).get("tier", "RED")
    surge = (telemetry_context or {}).get("hospital_surge_pct", "+35.0")

    fallback_text = (
        f"**[NDMA / MoES SentinelX Rapid Action Advisory — High Priority]**\n\n"
        f"**Jurisdiction**: {loc} | **Alert Level**: {tier} ALERT (WBGT: {wbgt}°C)\n\n"
        f"1. **Statutory Labor Restriction (Sec 144 / DMA 2005)**: Mandatory cessation of all outdoor physical labor between 11:00 AM and 03:30 PM. Stagger factory and construction shifts to 06:00–10:30 AM and 04:30–07:30 PM.\n"
        f"2. **Healthcare Surge Pre-Positioning (ER Surge: {surge}%)**: District Collector must mobilize 108 ALS Ambulances to vulnerable labor colonies and markets. Dedicate 20 air-conditioned cold beds in District Headquarters Hospital with IV Normal Saline and ice-pack immersion units.\n"
        f"3. **Municipal Jal Sanjeevani Grid**: Deploy municipal water tankers to slums and transit hubs; establish ORS kiosks at bus terminals and railway stations.\n"
        f"4. **Power Discom Protocol**: Prohibit scheduled load shedding in hospital feeders and residential cooling zones during peak thermal hours.\n"
        f"*(Generated via SentinelX Emergency Fallback Engine)*"
    )
    return (fallback_text, fallback_engine, True)


def query_gemini(prompt: str, telemetry_context: Optional[dict] = None) -> tuple[str, str, bool]:
    """Invokes Google Gemini API with NDMA/MoES system context and telemetry.
    Fails gracefully into offline mock advisory mode if GEMINI_API_KEY is not set or response is invalid.
    Returns tuple of (response_text, engine_name, is_fallback).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    primary_engine = "Google Gemini 1.5 Flash (MoES / NDMA Incident Decision Matrix)"

    if not api_key:
        return _build_fallback_response(telemetry_context)

    ctx_str = ""
    if telemetry_context:
        ctx_str = f"""
CURRENT LIVE SPATIAL TELEMETRY:
- Target Location: {telemetry_context.get('location_name', 'India (National)')}
- Coordinates: Lat {telemetry_context.get('lat', 'N/A')}, Lon {telemetry_context.get('lon', 'N/A')}
- Ambient Temperature: {telemetry_context.get('temp', 'N/A')} °C
- Relative Humidity: {telemetry_context.get('rh', 'N/A')} %
- Wet-Bulb Globe Temp (WBGT): {telemetry_context.get('wbgt', 'N/A')} °C (ISO 7243)
- Universal Thermal Climate Index (UTCI): {telemetry_context.get('utci', 'N/A')} °C
- Heat Risk Tier: {telemetry_context.get('tier', 'N/A')}
- Predicted Hospital Surge: {telemetry_context.get('hospital_surge_pct', 'N/A')} %
"""

    system_instruction = f"""
You are the SentinelX AI Incident Commander — an elite disaster response biometeorologist and incident commanding AI operating for the National Disaster Management Authority (NDMA), India Meteorological Department (IMD), Ministry of Earth Sciences (MoES), and State Disaster Management Authorities (SDMAs) across all 36 States and Union Territories of India.

Your mandate:
1. Provide legally grounded, operational directives under the Disaster Management Act 2005, Factories Act 1948, and National Heat Action Plan (HAP).
2. Quantify physiological risk (WBGT ISO 7243, UTCI thermal strain, evaporative sweat efficiency).
3. Coordinate inter-departmental deployments: District Magistrate / Collector, 108 Emergency Medical Services, Municipal Water Tankers (Jal Sanjeevani), Power Discoms, and Urban Local Bodies (ULBs).
4. Provide structured, executive, bulleted outputs with precise timestamps and statutory citations.
{ctx_str}
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nOfficer Prompt / Query:\n{prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 1000,
            "topP": 0.85
        }
    }

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    req = urllib.request.Request(
        gemini_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and parts[0].get("text"):
                    return (parts[0].get("text"), primary_engine, False)
            return _build_fallback_response(telemetry_context)
    except Exception as e:
        return _build_fallback_response(telemetry_context)


@router.api_route("/copilot", methods=["GET", "POST"], summary="SentinelX NDMA AI Incident Copilot")
def ask_copilot(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    temp: Optional[float] = Query(None),
    rh: Optional[float] = Query(None),
    wbgt: Optional[float] = Query(None),
    utci: Optional[float] = Query(None),
    tier: Optional[str] = Query(None),
    surge: Optional[float] = Query(None),
    payload: Optional[dict] = Body(None)
):
    body = payload or {}
    q = body.get("query") or query or "What emergency measures should be deployed for current conditions?"
    
    telemetry = {
        "location_name": body.get("location") or location or "Pan-India Command Area",
        "temp": body.get("temp") or temp or 34.5,
        "rh": body.get("rh") or rh or 68.0,
        "wbgt": body.get("wbgt") or wbgt or 31.2,
        "utci": body.get("utci") or utci or 38.5,
        "tier": body.get("tier") or tier or "ORANGE",
        "hospital_surge_pct": body.get("surge") or surge or 28.5,
        "lat": body.get("lat"),
        "lon": body.get("lon")
    }

    ai_text, engine_name, is_fallback = query_gemini(q, telemetry)
    return {
        "status": "success",
        "query": q,
        "telemetry": telemetry,
        "ai_response": ai_text,
        "engine": engine_name,
        "is_fallback": is_fallback,
        "provenance": "Calculated" if is_fallback else "Modelled",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    }


@router.api_route("/advisory", methods=["GET", "POST"], summary="Generate Multilingual Heat Action Plan Advisory")
def generate_advisory(
    district: Optional[str] = Query("New Delhi"),
    state: Optional[str] = Query("Delhi"),
    language: Optional[str] = Query("en"),
    wbgt: Optional[float] = Query(32.0),
    tier: Optional[str] = Query("Red"),
    payload: Optional[dict] = Body(None)
):
    body = payload or {}
    d = body.get("district") or district
    s = body.get("state") or state
    lang = (body.get("language") or language or "en").lower()
    w = float(body.get("wbgt") or wbgt or 32.0)
    t = body.get("tier") or tier or "Red"

    lang_map = {
        "hi": "Hindi (हिन्दी)",
        "en": "English",
        "bn": "Bengali (বাংলা)",
        "or": "Odia (ଓଡ଼ିଆ)",
        "mr": "Marathi (मराठी)",
        "ta": "Tamil (தமிழ்)",
        "te": "Telugu (తెలుగు)",
        "gu": "Gujarati (ગુજરાતી)",
        "pa": "Punjabi (ਪੰਜਾਬੀ)",
        "kn": "Kannada (ಕನ್ನಡ)",
        "ml": "Malayalam (മലയാളം)"
    }
    target_lang = lang_map.get(lang, "English")

    prompt = (
        f"Draft an official Government of India / NDMA Heat Action Plan Statutory Warning Order for {d}, {s}. "
        f"The current Wet-Bulb Globe Temperature (WBGT) is {w}°C (Alert Level: {t}). "
        f"Translate and write the entire public advisory directly in {target_lang}. "
        f"Include: 1) Urgent public survival warnings, 2) Outdoor work suspension times, "
        f"3) Vulnerable population shelter guidelines (children & elderly), 4) Emergency helpline 108 & 112 contact advice."
    )

    resp, engine_name, is_fallback = query_gemini(prompt, {"location_name": f"{d}, {s}", "wbgt": w, "tier": t})
    return {
        "status": "success",
        "district": d,
        "state": s,
        "language": target_lang,
        "wbgt": w,
        "tier": t,
        "advisory": resp,
        "engine": engine_name,
        "is_fallback": is_fallback,
        "provenance": "Calculated" if is_fallback else "Modelled",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    }
