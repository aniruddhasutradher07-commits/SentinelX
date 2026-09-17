"""
services/alerts.py — Emergency Early Warning Dispatcher
=========================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Automated multi-channel alert system that triggers when:
  • ML Risk Level ≥ 1  (High Warning or Critical Emergency)
  • HTSI Score > 60     (Warning or Critical thermal stress)

Supports mock/webhook integrations for:
  • WhatsApp Business Cloud API
  • SMS Gateway (NIC / Twilio)
  • Email (SMTP or webhook)
  • Emergency 108 Ambulance Pre-Alert

Each dispatch is audit-logged with delivery receipts.
"""

from __future__ import annotations

import time
import random
import datetime
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

try:
    from twilio.rest import Client
except ImportError:
    Client = None

load_dotenv()
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict, field


# ═══════════════════════════════════════════════════════════════════════════
# Alert thresholds
# ═══════════════════════════════════════════════════════════════════════════

HTSI_ALERT_THRESHOLD = 60.0        # HTSI score above which alerts fire
ML_RISK_ALERT_THRESHOLD = 1        # ML class ≥ 1 triggers alert

SEVERITY_MAP = {
    0: {"level": "INFO",      "color": "green",  "emoji": "ℹ️"},
    1: {"level": "WARNING",   "color": "orange", "emoji": "⚠️"},
    2: {"level": "CRITICAL",  "color": "red",    "emoji": "🚨"},
    3: {"level": "EMERGENCY", "color": "darkred", "emoji": "🆘"},
}


# ═══════════════════════════════════════════════════════════════════════════
# Alert templates (multilingual)
# ═══════════════════════════════════════════════════════════════════════════

ALERT_TEMPLATES = {
    "en": {
        "WARNING": (
            "⚠️ [HEAT WARNING — {zone}] Thermal stress index at {htsi}/100. "
            "Temperature: {temp}°C, Humidity: {rh}%. "
            "Reduce outdoor activity between 12:00-16:00 IST. Stay hydrated."
        ),
        "CRITICAL": (
            "🚨 [CRITICAL HEAT ALERT — {zone}] Extreme thermal danger! "
            "HTSI: {htsi}/100, Temp: {temp}°C, UV: {uv}. "
            "Mandatory outdoor labor cessation 11:00-16:00. "
            "108 ambulance network activated. Report to nearest cooling shelter."
        ),
        "EMERGENCY": (
            "🆘 [EMERGENCY — {zone}] Life-threatening heatwave conditions. "
            "HTSI: {htsi}/100. All outdoor activities suspended. "
            "Hospital surge protocol activated. "
            "Evacuate vulnerable populations to cooling centers immediately."
        ),
    },
    "hi": {
        "WARNING": (
            "⚠️ [ताप चेतावनी — {zone}] थर्मल स्ट्रेस इंडेक्स: {htsi}/100। "
            "तापमान: {temp}°C। दोपहर 12 से 4 बजे तक बाहरी गतिविधि कम करें।"
        ),
        "CRITICAL": (
            "🚨 [गंभीर ताप अलर्ट — {zone}] अत्यधिक गर्मी का खतरा! "
            "HTSI: {htsi}/100, तापमान: {temp}°C। "
            "बाहरी श्रम प्रतिबंधित। 108 एम्बुलेंस सक्रिय।"
        ),
        "EMERGENCY": (
            "🆘 [आपातकाल — {zone}] जानलेवा लू की स्थिति। "
            "सभी बाहरी गतिविधियाँ स्थगित। कूलिंग सेंटर जाएँ।"
        ),
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# In-memory audit log
# ═══════════════════════════════════════════════════════════════════════════

_alert_history: List[Dict[str, Any]] = []
MAX_HISTORY = 100


# ═══════════════════════════════════════════════════════════════════════════
# Mock notification channels
# ═══════════════════════════════════════════════════════════════════════════

def _mock_send_sms(phone: str, message: str) -> Dict[str, Any]:
    """Simulate SMS delivery via NIC/Twilio gateway, or send Real SMS if Twilio credentials are set."""
    
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_FROM_PHONE")
    
    fast2sms_key = os.getenv("FAST2SMS_API_KEY")

    # 1. Try Fast2SMS (Preferred for India/SIH testing)
    if fast2sms_key:
        try:
            import requests
            url = "https://www.fast2sms.com/dev/bulkV2"
            
            # Send to single number for testing
            target_numbers = "7585048937"
            
            payload = {
                "message": message,
                "language": "unicode",
                "route": "q",
                "numbers": target_numbers
            }
            headers = {
                'authorization': fast2sms_key
            }
            response = requests.post(url, data=payload, headers=headers)
            res_data = response.json()
            if res_data.get("return") == True:
                return {
                    "channel": "SMS",
                    "recipient": target_numbers,
                    "message_id": res_data.get("request_id", f"F2S-{random.randint(1000,9999)}"),
                    "status": "DELIVERED",
                    "latency_ms": random.randint(40, 200),
                    "gateway": "Fast2SMS Real API",
                }
            else:
                print(f"[ALERTS] Fast2SMS Error: {res_data}")
        except Exception as e:
            print(f"[ALERTS] Real Fast2SMS Failed: {e}. Falling back...")

    # 2. Try Twilio
    if twilio_sid and twilio_auth and twilio_from and Client:
        try:
            client = Client(twilio_sid, twilio_auth)
            # Twilio requires E.164 format. Ensure phone starts with +
            if not phone.startswith('+'):
                phone = f"+91{phone.replace(' ', '').replace('-', '')[-10:]}"
                
            twilio_msg = client.messages.create(
                body="Alert: System downtime detected. Engineers notified. ETA to resolution: 2 hours. Reply STATUS for updates. Test message from Twilio.",
                from_=twilio_from,
                to=phone
            )
            return {
                "channel": "SMS",
                "recipient": phone,
                "message_id": twilio_msg.sid,
                "status": twilio_msg.status,
                "latency_ms": random.randint(40, 200),
                "gateway": "Twilio Real SMS",
            }
        except Exception as e:
            print(f"[ALERTS] Real Twilio SMS Failed: {e}. Falling back to Mock.")
    
    # 3. Fallback Mock logic
    return {
        "channel": "SMS",
        "recipient": phone[:6] + "XXXX" + phone[-2:],
        "message_id": f"SMS-{random.randint(100000, 999999)}",
        "status": "DELIVERED",
        "latency_ms": random.randint(40, 200),
        "gateway": "NIC Emergency SMS Gateway (MOCK)",
    }


def _mock_send_whatsapp(phone: str, message: str) -> Dict[str, Any]:
    """Simulate WhatsApp Business Cloud API delivery."""
    return {
        "channel": "WhatsApp",
        "recipient": phone[:6] + "XXXX" + phone[-2:],
        "message_id": f"WA-{random.randint(100000, 999999)}",
        "status": "DELIVERED",
        "latency_ms": random.randint(80, 350),
        "gateway": "WhatsApp Business Cloud API",
    }


def _mock_send_email(email: str, subject: str, body: str) -> Dict[str, Any]:
    """Simulate email delivery via SMTP webhook."""
    return {
        "channel": "Email",
        "recipient": email[:3] + "***@" + email.split("@")[-1] if "@" in email else email,
        "message_id": f"MAIL-{random.randint(100000, 999999)}",
        "status": "DELIVERED",
        "latency_ms": random.randint(100, 500),
        "gateway": "SMTP Webhook Relay",
    }


def _mock_108_pre_alert(zone: str, severity: str) -> Dict[str, Any]:
    """Simulate 108 Emergency Ambulance pre-alert push."""
    return {
        "channel": "108_Ambulance_PreAlert",
        "zone": zone,
        "message_id": f"EMS-{random.randint(100000, 999999)}",
        "status": "ACKNOWLEDGED",
        "latency_ms": random.randint(30, 120),
        "gateway": "OSDMA EMS Telemetry Bridge",
        "ambulances_on_standby": random.randint(2, 8),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Default emergency contacts
# ═══════════════════════════════════════════════════════════════════════════

DEFAULT_CONTACTS = [
    {"role": "District Collector", "phone": "+91-9437012345", "email": "collector@district.gov.in"},
    {"role": "Chief Medical Officer", "phone": "+91-9437023456", "email": "cmo@health.gov.in"},
    {"role": "108 State Dispatch", "phone": "+91-9437034567", "email": "dispatch@108ems.in"},
    {"role": "OSDMA Control Room", "phone": "+91-674-2395398", "email": "controlroom@osdma.gov.in"},
    {"role": "Ward Disaster Officer", "phone": "+91-9437045678", "email": "wdo@bmc.gov.in"},
]


# ═══════════════════════════════════════════════════════════════════════════
# Core dispatch functions
# ═══════════════════════════════════════════════════════════════════════════

def _determine_severity(risk_level: int, htsi_score: float) -> int:
    """
    Map ML risk level + HTSI score to a severity integer (0-3).
    0 = INFO, 1 = WARNING, 2 = CRITICAL, 3 = EMERGENCY
    """
    if risk_level >= 2 and htsi_score >= 80:
        return 3  # EMERGENCY
    elif risk_level >= 2 or htsi_score >= 75:
        return 2  # CRITICAL
    elif risk_level >= 1 or htsi_score > HTSI_ALERT_THRESHOLD:
        return 1  # WARNING
    return 0      # INFO (no alert)


def should_alert(risk_level: int, htsi_score: float) -> bool:
    """Check if conditions warrant an emergency alert dispatch."""
    return risk_level >= ML_RISK_ALERT_THRESHOLD or htsi_score > HTSI_ALERT_THRESHOLD


def dispatch_alert(
    zone: str,
    risk_level: int,
    htsi_score: float,
    weather_data: Optional[Dict[str, Any]] = None,
    lang: str = "en",
    channels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Execute multi-channel emergency alert dispatch.

    Parameters
    ----------
    zone : str
        Name of the affected zone / ward / district.
    risk_level : int
        ML-predicted risk class (0=Low, 1=Warning, 2=Critical).
    htsi_score : float
        Human Thermal Stress Index (0-100).
    weather_data : dict, optional
        Current weather readings (temp, humidity, uv, aqi, etc.).
    lang : str
        Language code ("en", "hi").
    channels : list of str, optional
        Notification channels. Default: all channels.

    Returns
    -------
    dict : Dispatch result with delivery receipts and audit metadata.
    """
    severity = _determine_severity(risk_level, htsi_score)
    sev_info = SEVERITY_MAP.get(severity, SEVERITY_MAP[0])

    if severity == 0:
        return {
            "dispatched": False,
            "reason": "Conditions below alert threshold",
            "risk_level": risk_level,
            "htsi_score": htsi_score,
        }

    # Format message
    weather = weather_data or {}
    sev_label = sev_info["level"]
    lang_key = lang if lang in ALERT_TEMPLATES else "en"
    template = ALERT_TEMPLATES[lang_key].get(sev_label, ALERT_TEMPLATES["en"].get(sev_label, "Alert for {zone}"))
    message = template.format(
        zone=zone,
        htsi=round(htsi_score, 1),
        temp=weather.get("temperature_c", "—"),
        rh=weather.get("humidity_pct", "—"),
        uv=weather.get("uv_index", "—"),
        aqi=weather.get("aqi", "—"),
    )

    active_channels = channels or ["SMS", "WhatsApp", "Email", "108_Ambulance"]
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    dispatch_id = f"ALERT-{int(time.time())}-{random.randint(1000, 9999)}"

    # Execute mock deliveries
    deliveries = []
    for contact in DEFAULT_CONTACTS:
        contact_deliveries = []

        if "SMS" in active_channels:
            contact_deliveries.append(_mock_send_sms(contact["phone"], message))
        if "WhatsApp" in active_channels:
            contact_deliveries.append(_mock_send_whatsapp(contact["phone"], message))
        if "Email" in active_channels:
            contact_deliveries.append(
                _mock_send_email(contact["email"], f"[{sev_label}] Heat Alert — {zone}", message)
            )
        if "108_Ambulance" in active_channels and severity >= 2:
            contact_deliveries.append(_mock_108_pre_alert(zone, sev_label))

        deliveries.append({
            "role": contact["role"],
            "channel_results": contact_deliveries,
        })

    total_msgs = sum(len(d["channel_results"]) for d in deliveries)

    result = {
        "dispatched": True,
        "dispatch_id": dispatch_id,
        "timestamp": timestamp,
        "zone": zone,
        "severity": sev_label,
        "severity_emoji": sev_info["emoji"],
        "risk_level": risk_level,
        "htsi_score": round(htsi_score, 1),
        "message": message,
        "channels_used": active_channels,
        "recipients_notified": len(deliveries),
        "total_messages_sent": total_msgs,
        "delivery_details": deliveries,
        "weather_snapshot": weather,
    }

    # Audit log
    _alert_history.insert(0, result)
    if len(_alert_history) > MAX_HISTORY:
        _alert_history.pop()

    return result


def get_alert_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Return the most recent alert dispatch records."""
    return _alert_history[:limit]


def get_alert_stats() -> Dict[str, Any]:
    """Return aggregate alert statistics."""
    if not _alert_history:
        return {"total_dispatches": 0, "severity_breakdown": {}}

    severity_counts: Dict[str, int] = {}
    for alert in _alert_history:
        sev = alert.get("severity", "UNKNOWN")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "total_dispatches": len(_alert_history),
        "severity_breakdown": severity_counts,
        "latest_dispatch": _alert_history[0].get("timestamp", "—"),
        "latest_zone": _alert_history[0].get("zone", "—"),
    }
