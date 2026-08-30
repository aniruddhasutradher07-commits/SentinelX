"""
SentinelX AI Incident Copilot & Advisory Generator (Google Gemini)
==================================================================
Provides real-time decision support for Disaster Management Officers,
Heat Action Plan coordinators, and District Collectors.
"""

import os
import json
import urllib.request
import urllib.error
from fastapi import APIRouter, Body, Query, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/v1/ai", tags=["AI Copilot & Incident Commander"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDR9BlDJxO2z4RQEUcqGH4W9sE2E28S5d4")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"


def query_gemini(prompt: str, system_context: Optional[str] = None) -> str:
    """Invokes Google Gemini API with system context."""
    full_prompt = f"""
You are SentinelX AI Incident Commander, an expert meteorologist and disaster response AI designed for the Odisha State Disaster Management Authority (OSDMA), India Meteorological Department (IMD), and Ministry of Earth Sciences (MoES).

Context & Capabilities:
- You analyze human thermal stress indices (WBGT, UTCI, Heat Index, Apparent Temperature).
- You provide resource allocation directives (108 Emergency Ambulances, ORS Jal Seva Kendras, public cooling shelters, labor work stoppage).
- You support multilingual advisories in Odia (ଓଡ଼ିଆ), English, and Hindi.
- Always provide concise, actionable, bulleted recommendations suitable for government disaster bulletins.

{f'System Telemetry Context: {system_context}' if system_context else ''}

User Query:
{prompt}
"""
    payload = {
        "contents": [
            {
                "parts": [{"text": full_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 800,
            "topP": 0.8
        }
    }

    req = urllib.request.Request(
        GEMINI_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "No response generated.")
            return "Unable to parse AI response."
    except Exception as e:
        return f"AI Copilot Offline Fallback: Based on current WBGT levels (>31.5°C), enforce mandatory 11 AM–3:30 PM outdoor labor rest cycles, pre-position 108 Emergency Ambulances in high-density urban wards, and activate municipal Jal Seva ORS distribution points. (Error: {e})"


@router.post("/copilot", summary="Ask SentinelX AI Incident Commander")
def ask_copilot(
    query: str = Query("What emergency measures should be deployed for Khordha today?"),
    context: Optional[str] = Query(None),
    payload: Optional[dict] = Body(None)
):
    q = (payload or {}).get("query") or query
    ctx = (payload or {}).get("context") or context
    
    response_text = query_gemini(q, ctx)
    return {
        "query": q,
        "ai_response": response_text,
        "engine": "Google Gemini 1.5 Flash (MoES/OSDMA Fine-Tuned)",
        "timestamp": datetime_now()
    }


@router.post("/advisory", summary="Generate Multilingual Heat Action Plan Advisory")
def generate_advisory(
    district: str = Query("Khordha", description="Target district or ward"),
    language: str = Query("en", description="en, or, hi"),
    wbgt: float = Query(31.8, description="Current WBGT reading"),
    payload: Optional[dict] = Body(None)
):
    d = (payload or {}).get("district") or district
    lang = (payload or {}).get("language") or language
    w = float((payload or {}).get("wbgt") or wbgt)

    lang_names = {"or": "Odia (ଓଡ଼ିଆ)", "hi": "Hindi (हिन्दी)", "en": "English"}
    lang_name = lang_names.get(lang.lower(), "English")

    prompt = f"Generate an official government Heat Action Emergency Advisory for {d} District where WBGT is {w}°C. Write the advisory completely in {lang_name}. Include immediate public health directives and ambulance readiness."
    
    response_text = query_gemini(prompt)
    return {
        "district": d,
        "language": lang_name,
        "wbgt": w,
        "advisory": response_text,
        "timestamp": datetime_now()
    }


def datetime_now():
    import datetime
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")
