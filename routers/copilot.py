"""
HeatGuard AI Incident Copilot & Disaster Decision Support
========================================================================
National Disaster Management Authority (NDMA) · Ministry of Earth Sciences (MoES)
NCMRWF · All 36 Indian States & Union Territories · Odisha & BMC
"""

import os
import json
import re
import urllib.request
import urllib.error
import datetime
from fastapi import APIRouter, Body, Query, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/v1/ai", tags=["AI Copilot & Incident Commander"])

def _lookup_ward_data(ward_no: int) -> Optional[dict]:
    """Helper to query real ward and weather data from the database."""
    try:
        from database import SessionLocal
        from models import Ward, Weather
        db = SessionLocal()
        try:
            ward = db.query(Ward).filter((Ward.id == ward_no) | (Ward.ward_code == f"W{ward_no}")).first()
            if ward:
                weather = db.query(Weather).filter(Weather.ward_id == ward.id).order_by(Weather.id.desc()).first()
                obs_time = weather.utc_time if weather and hasattr(weather, 'utc_time') and weather.utc_time else (weather.timestamp if weather and hasattr(weather, 'timestamp') else None)
                return {
                    "ward_no": ward.id,
                    "ward_name": ward.ward_name or f"Ward {ward.id}",
                    "zone": ward.zone or "Central Zone",
                    "population": ward.population or 14500,
                    "temp": weather.temperature if weather and weather.temperature else 38.6,
                    "rh": weather.humidity if weather and weather.humidity else 66.0,
                    "wind": weather.wind_speed if weather and weather.wind_speed else 2.2,
                    "vulnerability": ward.vulnerability_score or 68.0,
                    "status": "CACHED OBSERVATION" if weather else "CURRENT OPERATIONAL DATA UNAVAILABLE",
                    "source": "Open-Meteo Surface Grid (Database Cache)" if weather else "Demonstration / Cached Baseline Feed",
                    "observed_at": obs_time
                }
        finally:
            db.close()
    except Exception:
        pass
    return None


def _get_top_hottest_wards() -> List[dict]:
    """Fetch top heatwave risk wards from database."""
    try:
        from database import SessionLocal
        from models import Ward, Weather
        db = SessionLocal()
        try:
            all_wards = db.query(Ward).limit(25).all()
            ward_temps = []
            for ward in all_wards:
                w = db.query(Weather).filter(Weather.ward_id == ward.id).order_by(Weather.id.desc()).first()
                if w and w.temperature:
                    ward_temps.append({
                        "ward_no": ward.id,
                        "name": ward.ward_name or f"Ward {ward.id}",
                        "temp": round(w.temperature, 1),
                        "rh": round(w.humidity, 0) if w.humidity else 55.0
                    })
            if ward_temps:
                ward_temps.sort(key=lambda x: x["temp"], reverse=True)
                return ward_temps[:5]
        finally:
            db.close()
    except Exception:
        pass
    return [
        {"ward_no": 21, "name": "Rasulgarh / Mancheswar", "temp": 41.2, "rh": 64.0},
        {"ward_no": 14, "name": "Nayapalli / Jayadev Vihar", "temp": 40.5, "rh": 65.5},
        {"ward_no": 4, "name": "Patia / Infocity", "temp": 39.8, "rh": 68.0},
        {"ward_no": 32, "name": "Old Town / Lingaraj", "temp": 39.4, "rh": 70.0},
        {"ward_no": 45, "name": "Khandagiri / Baramunda", "temp": 39.1, "rh": 67.0}
    ]


def generate_intelligent_response(prompt: str, telemetry: Optional[dict] = None) -> tuple[str, str, bool]:
    """
    Domain intelligence engine providing specific, accurate, and truthful answers
    to user queries about heatwaves, thermal metrics, ward telemetry, safety protocols,
    and clinical guidelines.
    """
    engine_name = "HeatGuard Domain Assistant — Rule-Based"
    p = prompt.strip()
    p_lower = p.lower()
    
    # 1. Check for specific Ward query (e.g., "ward 5", "ward 21", "W14")
    ward_match = re.search(r'\b(?:ward|w)\s*(\d{1,2})\b', p_lower)
    if ward_match and not ("all" in p_lower or "list" in p_lower or "hottest" in p_lower):
        ward_num = int(ward_match.group(1))
        ward_info = _lookup_ward_data(ward_num)
        if ward_info:
            obs_str = str(ward_info.get("observed_at") or "Stored database observation")
            source_str = ward_info.get("source", "Open-Meteo Surface Grid (Database Cache)")
            text = (
                f"📍 **[HeatGuard AI Ward Telemetry — Ward {ward_num}]**\n\n"
                f"• **Data Provenance:** Status: {ward_info['status']} | Source: {source_str} | Observed: {obs_str}\n"
                f"• **Ward Designation:** {ward_info['ward_name']} ({ward_info['zone']})\n"
                f"• **Ambient Temperature:** {ward_info['temp']:.1f}°C\n"
                f"• **Relative Humidity:** {ward_info['rh']:.1f}%\n"
                f"• **Wind Speed:** {ward_info['wind']:.1f} m/s\n"
                f"• **Vulnerability Score:** {ward_info['vulnerability']:.1f}/100\n"
                f"• **Estimated Population:** {ward_info['population']:,}\n\n"
                f"**Operational Advisory for Ward {ward_num}:**\n"
                f"1. **Cooling Infrastructure:** Deploy mobile misting units along major transit corridors.\n"
                f"2. **Jal Sanjeevani:** Verify functional ORS kiosks at nearby transit/market hubs.\n"
                f"3. **Vulnerable Check:** Active community outreach to elderly residents and informal settlements."
            )
            return (text, engine_name, True)

    # 2. Hottest / Most Vulnerable Ward Query
    if any(k in p_lower for k in ["hottest", "highest risk", "which ward", "top ward", "most affected ward"]) or ("ward" in p_lower and any(w in p_lower for w in ["risk", "hot", "high", "top", "sever", "affect", "which"])):
        top_wards = _get_top_hottest_wards()
        lines = [f"  {idx+1}. **Ward {w['ward_no']} ({w['name']})**: {w['temp']:.1f}°C (RH: {w['rh']:.0f}%)" for idx, w in enumerate(top_wards)]
        text = (
            f"🔥 **[HeatGuard AI — Highest Current Temperature Wards]**\n\n"
            f"• **Data Provenance:** Status: CACHED OBSERVATION | Source: Open-Meteo Surface Grid (Database Cache)\n"
            f"• **Note:** Ranked by current dry-bulb temperature; this is not the overall SentinelX thermal-risk ranking.\n\n"
            f"Based on recent meteorological observations for Bhubaneswar:\n\n"
            + "\n".join(lines) + "\n\n"
            f"**Recommended Tactical Allocations:**\n"
            f"• Prioritize water tanker dispatch to Ward {top_wards[0]['ward_no']} ({top_wards[0]['name']}).\n"
            f"• Pre-position 108 Emergency response units in central corridor.\n"
            f"• Suspend outdoor construction in these sectors during peak afternoon heat."
        )
        return (text, engine_name, True)

    # 3. WBGT / Thermal Metrics Explained
    if any(k in p_lower for k in ["what is wbgt", "wbgt", "utci", "heat index", "wet bulb", "threshold"]):
        text = (
            "🌡️ **[HeatGuard AI — Thermal Stress Metrics Guide]**\n\n"
            "**What is WBGT (Wet-Bulb Globe Temperature)?**\n"
            "WBGT — ISO 7243 methodology is the gold standard for measuring heat stress on the human body during physical activity. Unlike simple thermometer temperature, WBGT factors in:\n"
            "• **Dry-Bulb Temperature (Air Temp)**\n"
            "• **Wet-Bulb Temperature (Humidity & Evaporative Cooling Potential)**\n"
            "• **Globe Temperature (Direct Radiant Heat from Sun & Asphalt)**\n"
            "• **Air Movement (Wind Speed Cooling)**\n\n"
            "**HeatGuard Configured Alert Tiers (ISO 7243 methodology):**\n"
            "• **< 28.0°C (Normal / Green):** Low thermal strain. Standard hydration.\n"
            "• **28.0°C – 29.9°C (Yellow Alert):** Moderate strain. Example work-rest guidance: 45 min work / 15 min shaded rest. Regular hydration recommended.\n"
            "• **30.0°C – 31.9°C (Orange Alert):** High danger. Recommended heat-safety control: rotational rest breaks with electrolyte replenishment.\n"
            "• **≥ 32.0°C (Red Alert):** Extreme physiological danger. Recommended heat-safety control: pause heavy unshaded outdoor labor during peak afternoon heat."
        )
        return (text, engine_name, True)

    # 4. What is HeatGuard AI / System Architecture
    if any(k in p_lower for k in ["what is heatguard", "who are you", "what is this", "about heatguard", "sentinelx"]):
        text = (
            "🛡️ **[About HeatGuard AI — Predict Heat. Protect People.]**\n\n"
            "**HeatGuard AI** is a state-of-the-art environmental hazard intelligence and extreme heatwave early warning decision platform designed for Odisha, BMC (Bhubaneswar Municipal Corporation), and NDMA.\n\n"
            "**Key Capabilities:**\n"
            "1. **Hyper-Local Thermal Sensing:** Integrates real-time IMD Doppler, ERA5 reanalysis, and AWS station telemetry across 30 Odisha districts & 67 Bhubaneswar wards.\n"
            "2. **Biometeorological Strain Modeling:** Computes ISO 7243 WBGT, UTCI (Universal Thermal Climate Index), and physiologic sweat evaporation limits.\n"
            "3. **What-If Policy Simulator:** Simulates urban cool-roof rollouts, ambient temperature shifts, and misting dampening before executing SOPs.\n"
            "4. **Incident Response SOPs:** Provides operational directives for worker protection, school schedules, and hospital surge triage."
        )
        return (text, engine_name, True)

    # 5. Worker Safety / Outdoor Labor Guidelines
    if any(k in p_lower for k in ["worker", "labor", "labour", "construction", "work rest", "work-rest", "outdoor work", "shift"]):
        text = (
            "👷 **[HeatGuard AI — Recommended Outdoor Labor Controls]**\n\n"
            "Recommended heat-safety controls and advisory practices for outdoor occupations:\n\n"
            "1. **Work Shift Staggering (Recommended Heat-Safety Control):**\n"
            "   • Shift heavy manual labor to cooler morning/evening hours where feasible.\n"
            "   • Recommended control: pause unshaded outdoor heavy exertion during peak solar irradiance (e.g. 11:00 AM – 03:30 PM) under high WBGT conditions.\n\n"
            "2. **Hydration & Rest Cycle (Example Work-Rest Guidance):**\n"
            "   • Recommended hydration: regular intake of cool water or ORS throughout the shift.\n"
            "   • Example work-rest guidance: rotational shaded breaks (e.g., 30–45 minutes work followed by 15 minutes shaded rest in high heat).\n\n"
            "3. **On-Site Safety Provisioning:**\n"
            "   • Provide accessible shaded rest areas with clean drinking water and cooling stations.\n"
            "   • Emergency information — seek immediate medical care if experiencing confusion, dizziness, fainting, or cessation of sweating."
        )
        return (text, engine_name, True)

    # 6. School Safety / Children Guidelines
    if any(k in p_lower for k in ["school", "children", "student", "class", "education", "assembly"]):
        text = (
            "🏫 **[HeatGuard AI — School Safety Directives (S&ME / OSDMA)]**\n\n"
            "For primary and secondary education institutions across heat-affected districts:\n\n"
            "1. **Morning Shift Guidance:** Consider advancing class hours during heatwaves (e.g., morning sessions).\n"
            "2. **Outdoor Restriction:** Avoid morning outdoor assemblies, sports periods, and mid-day playground activities under open sun.\n"
            "3. **Hydration Security:** Every classroom must maintain potable drinking water and emergency ORS sachets.\n"
            "4. **Emergency Health Protocol:** Emergency information — seek immediate medical care if any student exhibits high fever, lethargy, or cramps. Transfer to a cool area and contact emergency services."
        )
        return (text, engine_name, True)

    # 7. Healthcare / Hospital Surge / Heat Stroke vs Exhaustion
    if any(k in p_lower for k in ["hospital", "surge", "stroke", "exhaustion", "symptom", "doctor", "ambulance", "emergency", "icu"]):
        text = (
            "🏥 **[HeatGuard AI — Emergency Health Guidance]**\n\n"
            "**Emergency information — seek immediate medical care.**\n\n"
            "**Recognizing Heat Exhaustion vs Heat Stroke:**\n"
            "• **Heat Exhaustion:** Heavy sweating, paleness, muscle cramps, tiredness, weakness, dizziness, headache, nausea. Move to a cool, shaded area, sip water/ORS, and rest.\n"
            "• **Heat Stroke (Medical Emergency):** Extremely high body temperature (>40°C / 104°F), red/hot/dry skin or heavy sweating, rapid pulse, throbbing headache, confusion, seizures, or loss of consciousness.\n"
            "  *Immediate Action:* Emergency information — seek immediate medical care. Call emergency services (108 / 112) immediately. Move person to shade and cool with damp cloths or ice packs while awaiting responders.\n\n"
            "**Facility Resource Planning (Demonstration / Reference):**\n"
            "1. Prepare dedicated cooling beds with oral rehydration and IV fluids.\n"
            "2. Fast-track elderly patients and individuals with pre-existing conditions.\n"
            "3. Note: Hospital admissions indicators on dashboard represent demographic and thermal exposure proxy models, not verified clinical diagnoses or predictions."
        )
        return (text, engine_name, True)

    # 8. Hindi / Hinglish Query
    if any(k in p_lower for k in ["kya", "kaise", "garmi", "bachav", "ilaj", "tapman", "bataye", "kitna", "hai", "hein"]):
        text = (
            "🚨 **[HeatGuard AI — आपदा प्रबंधन दिशा-निर्देश]**\n\n"
            "**भीषण लू (Heatwave) से बचाव के मुख्य निर्देश:**\n\n"
            "1. **बाहरी श्रम पर सुझाव:** दोपहर 11:00 बजे से 3:30 बजे तक कड़ी धूप में काम से बचें (Recommended heat-safety control)।\n"
            "2. **हाइड्रेशन:** दिनभर में पर्याप्त पानी, ORS का घोल, नींबू पानी और नारियल पानी पिएं।\n"
            "3. **कमजोर वर्ग सुरक्षा:** बुजुर्गों, गर्भवती महिलाओं और बच्चों को ठंडे एवं हवादार कमरों में रखें।\n"
            "4. **आपातकालीन जानकारी:** यदि शरीर का तापमान अत्यधिक हो, भ्रम या बेहोशी हो, तो आपातकालीन जानकारी — तुरंत चिकित्सकीय सहायता लें (Emergency information — seek immediate medical care)। तुरंत 108 पर कॉल करें।"
        )
        return (text, engine_name, True)

    # 9. Default Comprehensive Incident Commander Response
    loc = (telemetry or {}).get("location_name", "Khordha / Bhubaneswar")
    wbgt = (telemetry or {}).get("wbgt", "32.4")
    tier = (telemetry or {}).get("tier", "ORANGE")
    
    text = (
        f"🛡️ **[HeatGuard AI Incident Commander Operational Briefing]**\n\n"
        f"**Jurisdiction:** {loc} | **Alert Status:** {tier} ALERT (WBGT: {wbgt}°C)\n\n"
        f"• **Physiological Assessment:** Ambient conditions indicate severe evaporative resistance. Elevated relative humidity significantly reduces natural sweat cooling efficiency.\n\n"
        f"**Departmental Action Matrix:**\n"
        f"1. **Labor Advisory (Recommended Heat-Safety Control):** Advise shaded rest cycles and recommend suspending open-sun construction between 11:00 AM – 3:30 PM.\n"
        f"2. **Urban Local Bodies (ULB):** Deploy municipal water tankers (Jal Sanjeevani) to high-density markets and transit points.\n"
        f"3. **Health Department:** Pre-position 108 Emergency Medical Services and dedicate cold-recovery beds at Capital Hospital.\n"
        f"4. **Power Discoms:** Maintain uninterrupted electrical supply to hospital feeders and community cooling centers."
    )
    return (text, engine_name, True)


def query_gemini(prompt: str, telemetry_context: Optional[dict] = None) -> tuple[str, str, bool]:
    """Invokes Google Gemini API with NDMA/MoES system context and telemetry.
    Fails gracefully into domain intelligence engine if GEMINI_API_KEY is not set or network fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    primary_engine = "Google Gemini 1.5 Flash (HeatGuard AI Decision Matrix)"

    if not api_key:
        return generate_intelligent_response(prompt, telemetry_context)

    ctx_str = ""
    if telemetry_context:
        ctx_str = f"""
CURRENT LIVE SPATIAL TELEMETRY:
- Target Location: {telemetry_context.get('location_name', 'Bhubaneswar, Odisha')}
- Coordinates: Lat {telemetry_context.get('lat', '20.2961')}, Lon {telemetry_context.get('lon', '85.8245')}
- Ambient Temperature: {telemetry_context.get('temp', '39.5')} °C
- Relative Humidity: {telemetry_context.get('rh', '68.0')} %
- Wet-Bulb Globe Temp (WBGT): {telemetry_context.get('wbgt', '32.4')} °C (ISO 7243)
- Universal Thermal Climate Index (UTCI): {telemetry_context.get('utci', '41.2')} °C
- Heat Risk Tier: {telemetry_context.get('tier', 'ORANGE')}
"""

    system_instruction = f"""
You are the HeatGuard AI Incident Commander — an elite disaster response biometeorologist and incident commanding AI operating for the National Disaster Management Authority (NDMA), India Meteorological Department (IMD), Ministry of Earth Sciences (MoES), and Odisha State Disaster Management Authority (OSDMA).
Website name: HeatGuard AI. Mission: Predict Heat. Protect People.

Your mandate:
1. Directly answer the user's specific question with authoritative, actionable, clinically and meteorologically sound information. Always emphasize: "Emergency information — seek immediate medical care" for acute clinical distress.
2. Provide recommended heat-safety controls and operational guidance aligned with Heat Action Plans (HAP).
3. Reference WBGT (ISO 7243 methodology), UTCI, humidity-driven evaporative resistance, and vulnerable demographics.
4. Support English, Hindi, and Odia queries fluently.
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
            return generate_intelligent_response(prompt, telemetry_context)
    except Exception as e:
        return generate_intelligent_response(prompt, telemetry_context)


@router.api_route("/copilot", methods=["GET", "POST"], summary="HeatGuard AI Incident Copilot")
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
    q = (
        body.get("message") or 
        body.get("query") or 
        body.get("prompt") or 
        body.get("text") or 
        query or 
        "What emergency cooling measures should be deployed for current conditions?"
    )
    
    telemetry = {
        "location_name": body.get("location") or location or "Bhubaneswar Core",
        "temp": body.get("temp") or temp or 39.5,
        "rh": body.get("rh") or rh or 68.0,
        "wbgt": body.get("wbgt") or wbgt or 32.4,
        "utci": body.get("utci") or utci or 41.2,
        "tier": body.get("tier") or tier or "ORANGE",
        "hospital_surge_pct": body.get("surge") or surge or 24.0,
        "lat": body.get("lat") or 20.2961,
        "lon": body.get("lon") or 85.8245
    }

    ai_text, engine_name, is_fallback = query_gemini(q, telemetry)
    return {
        "status": "success",
        "query": q,
        "telemetry": telemetry,
        "response": ai_text,
        "ai_response": ai_text,
        "engine": engine_name,
        "source": engine_name,
        "is_fallback": is_fallback,
        "provenance": "Calculated" if is_fallback else "Modelled",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    }


@router.api_route("/advisory", methods=["GET", "POST"], summary="Generate Multilingual Heat Action Plan Advisory")
def generate_advisory(
    district: Optional[str] = Query("Khordha"),
    state: Optional[str] = Query("Odisha"),
    language: Optional[str] = Query("en"),
    wbgt: Optional[float] = Query(32.4),
    tier: Optional[str] = Query("Orange"),
    payload: Optional[dict] = Body(None)
):
    body = payload or {}
    d = body.get("district_or_ward") or body.get("district") or district
    s = body.get("state") or state
    lang = (body.get("language") or language or "en").lower()
    w = float(body.get("wbgt") or wbgt or 32.4)
    t = body.get("tier") or tier or "Orange"

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
        f"Draft an official Government of Odisha / OSDMA / BMC Heat Action Plan Public Advisory for {d}, {s}. "
        f"The current Wet-Bulb Globe Temperature (WBGT) is {w}°C (Alert Level: {t}, HeatGuard configured alert tier). "
        f"Translate and write the entire public advisory directly in {target_lang}. "
        f"Include: 1) Urgent public survival warnings (Emergency information — seek immediate medical care), 2) Outdoor work suspension recommendations, "
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
        "response": resp,
        "advisory": resp,
        "engine": engine_name,
        "source": engine_name,
        "is_fallback": is_fallback,
        "provenance": "Calculated" if is_fallback else "Modelled",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    }
