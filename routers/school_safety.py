"""
SentinelX School Heat Safety & Child Vulnerability Engine
==========================================================
Smart India Hackathon 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Evaluates classroom & playground thermal stress for schools, factoring in child age
group physiology (primary/middle/secondary), classroom ventilation types (tin roof,
natural windows, ceiling fans, HVAC), and outdoor activity schedules.

Generates statutory school directives (assembly timing, sports cancellation, morning
shift transition, ORS hydration bells) using the SentinelX Disaster Action Engine pattern.

Per rules.md:
- Provenance label: "Calculated"
- Input validation bounds enforced on all parameters.
"""

import math
import datetime
from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/v1", tags=["School Heat Safety"])


def _sanitize_float(val: Optional[float], default: float, min_val: float, max_val: float) -> float:
    """Sanitize float input against None, NaN, Inf, and non-physical values."""
    if val is None or math.isnan(val) or math.isinf(val):
        return default
    return max(min_val, min(max_val, float(val)))


VENTILATION_MODIFIERS = {
    "Tin Roof / Poor Ventilation": {"temp_penalty": 4.5, "wbgt_offset": 3.8, "risk_mult": 1.40},
    "Natural Ventilation (Open Windows)": {"temp_penalty": 2.0, "wbgt_offset": 1.8, "risk_mult": 1.20},
    "Ceiling Fans Only": {"temp_penalty": 0.5, "wbgt_offset": 0.5, "risk_mult": 1.05},
    "Air Conditioned (HVAC)": {"temp_penalty": -4.0, "wbgt_offset": -3.5, "risk_mult": 0.70},
}

AGE_GROUP_VULNERABILITY = {
    "Primary (Ages 5-10)": {"offset": 3.0, "mult": 1.35, "hydration_ml_hr": 350},
    "Middle (Ages 11-14)": {"offset": 1.5, "mult": 1.15, "hydration_ml_hr": 450},
    "Secondary (Ages 15-18)": {"offset": 0.0, "mult": 1.00, "hydration_ml_hr": 500},
}


@router.api_route("/school-safety", methods=["GET", "POST"], summary="Calculate School Thermal Risk & Generate Action Engine Directives")
def calculate_school_safety(
    school_name: str = Query("Capital High School, Ward 21", description="School name / identifier"),
    ward_no: str = Query("Ward 21", description="Target ward location"),
    student_count: int = Query(450, ge=10, le=5000, description="Total enrolled students"),
    age_group: str = Query("Primary (Ages 5-10)", description="Student age category"),
    ventilation_type: str = Query("Ceiling Fans Only", description="Classroom ventilation category"),
    has_outdoor_activity: bool = Query(True, description="Whether sports/playground activities are scheduled"),
    outdoor_activity_slot: str = Query("11:00 - 12:30 PM", description="Scheduled outdoor activity window"),
    school_timing_shift: str = Query("07:30 AM - 01:30 PM (Normal Shift)", description="Current school operating shift"),
    ambient_temp: Optional[float] = Query(39.5, ge=-50.0, le=70.0, description="Daytime peak ambient temp °C"),
    humidity: Optional[float] = Query(68.0, ge=0.0, le=100.0, description="Daytime relative humidity %"),
    payload: Optional[dict] = Body(None)
):
    # Support JSON payload overrides for POST requests
    body = payload or {}
    s_name = body.get("school_name") or school_name
    w_no = body.get("ward_no") or ward_no
    s_count = int(body.get("student_count") or student_count)
    s_count = max(10, min(5000, s_count))
    a_group = body.get("age_group") or age_group
    v_type = body.get("ventilation_type") or ventilation_type
    outdoor_act = bool(body.get("has_outdoor_activity") if "has_outdoor_activity" in body else has_outdoor_activity)
    act_slot = body.get("outdoor_activity_slot") or outdoor_activity_slot
    timing_shift = body.get("school_timing_shift") or school_timing_shift

    peak_temp = _sanitize_float(body.get("ambient_temp") or ambient_temp, 39.5, -50.0, 70.0)
    rel_humidity = _sanitize_float(body.get("humidity") or humidity, 68.0, 0.0, 100.0)

    vent_mod = VENTILATION_MODIFIERS.get(v_type, VENTILATION_MODIFIERS["Ceiling Fans Only"])
    age_mod = AGE_GROUP_VULNERABILITY.get(a_group, AGE_GROUP_VULNERABILITY["Primary (Ages 5-10)"])

    # Determine school operating hours block
    is_morning_shift = "Morning" in timing_shift
    s_start = 6.5 if is_morning_shift else 7.5
    s_end = 11.0 if is_morning_shift else 13.5

    # Compute hourly time blocks across school day
    time_blocks = []
    curr_hour = s_start
    total_water_liters_per_student = 0.0

    while curr_hour < s_end:
        next_hour = min(s_end, curr_hour + 1.5)
        mid_hour = (curr_hour + next_hour) / 2.0

        # Diurnal curve calculation
        hour_factor = math.sin((mid_hour - 6) * math.pi / 12)
        hour_factor = max(0.05, min(1.0, hour_factor))

        ambient_b = round(25.0 + (peak_temp - 25.0) * hour_factor, 1)
        rh_b = round(max(30.0, rel_humidity - (hour_factor * 15.0)), 1)

        # Classroom indoor temp
        classroom_temp = round(ambient_b + vent_mod["temp_penalty"], 1)

        # Base WBGT
        base_wbgt = 0.567 * classroom_temp + (0.393 * (rh_b / 100.0) * 6.105 * math.exp((17.27 * classroom_temp) / (237.7 + classroom_temp))) + 3.88

        # Effective WBGT with child vulnerability & outdoor activity penalty
        is_outdoor_block = outdoor_act and ("11:00" in act_slot or "01:30" in act_slot) and mid_hour >= 11.0
        outdoor_penalty = 3.5 if is_outdoor_block else 0.0

        effective_wbgt = base_wbgt + vent_mod["wbgt_offset"] + age_mod["offset"] + outdoor_penalty
        effective_wbgt = round(max(18.0, min(46.0, effective_wbgt)), 1)

        exposure_score = round(max(10.0, min(100.0, (effective_wbgt / 36.0) * 85.0)), 1)

        # Risk Tier
        if effective_wbgt >= 32.5 or exposure_score >= 78:
            tier = "EXTREME"
            tier_color = "Red"
        elif effective_wbgt >= 30.0 or exposure_score >= 60:
            tier = "HIGH"
            tier_color = "Orange"
        elif effective_wbgt >= 27.5 or exposure_score >= 40:
            tier = "MODERATE"
            tier_color = "Yellow"
        else:
            tier = "LOW"
            tier_color = "Green"

        block_hrs = next_hour - curr_hour
        total_water_liters_per_student += (age_mod["hydration_ml_hr"] / 1000.0) * block_hrs

        h_start_int = int(curr_hour)
        m_start_int = int((curr_hour - h_start_int) * 60)
        h_end_int = int(next_hour)
        m_end_int = int((next_hour - h_end_int) * 60)

        label_str = f"{h_start_int:02d}:{m_start_int:02d} – {h_end_int:02d}:{m_end_int:02d}"

        time_blocks.append({
            "block_label": label_str,
            "ambient_temp_c": ambient_b,
            "classroom_temp_c": classroom_temp,
            "effective_wbgt_c": effective_wbgt,
            "exposure_score": exposure_score,
            "risk_tier": tier,
            "risk_color": tier_color,
            "is_outdoor_peak": is_outdoor_block,
            "provenance": "Calculated"
        })

        curr_hour = next_hour

    # Overall Peak & Directives (Action Engine Pattern)
    peak_block = max(time_blocks, key=lambda x: x["exposure_score"]) if time_blocks else None
    peak_score = peak_block["exposure_score"] if peak_block else 45.0
    peak_tier = peak_block["risk_tier"] if peak_block else "MODERATE"
    peak_wbgt = peak_block["effective_wbgt_c"] if peak_block else 29.5

    total_water_liters_school = round(s_count * total_water_liters_per_student, 1)
    ors_packets_school = int(math.ceil(s_count * 0.15)) # 15% student reserve

    # Action Engine Directive Package
    directives = []
    if peak_tier in ["HIGH", "EXTREME"]:
        directives.append({
            "title": "Morning Assembly Directive",
            "priority": "HIGH",
            "action": "Shorten morning assembly to < 8 minutes before 07:30 AM or conduct indoors inside covered auditorium/classrooms.",
            "statutory_citation": "Odisha School & Mass Education Dept Heatwave Advisory 2026"
        })
        directives.append({
            "title": "Sports & Outdoor Physical Activity Cancellation",
            "priority": "CRITICAL",
            "action": "CANCEL all outdoor sports periods, physical training (PT), and playground activities between 10:30 AM and 03:30 PM. Move PE to indoor games or theory.",
            "statutory_citation": "NDMA National Heatwave Directives for Educational Institutions"
        })
        directives.append({
            "title": "Classroom Relocation & Thermal Management",
            "priority": "HIGH",
            "action": "Relocate students from top-floor asbestos/tin roof rooms to ground floor shaded classrooms or air-conditioned computer/science labs.",
            "statutory_citation": "District Magistrate Emergency Heat Orders under DMA 2005"
        })
        directives.append({
            "title": "Hydration Bell & Infirmary ORS Reserve",
            "priority": "HIGH",
            "action": "Sound mandatory 10-minute hydration bell every 45 minutes. Pre-position ORS packets, electrolyte solution, and ice-water towels in school sick room.",
            "statutory_citation": "National Health Mission School Health Guidelines"
        })
    else:
        directives.append({
            "title": "Standard Hydration & Shaded Play Directive",
            "priority": "NORMAL",
            "action": "Ensure water dispensers are fully filled. Limit strenuous physical activity after 11:30 AM.",
            "statutory_citation": "Standard School Operational Protocol"
        })

    if peak_tier == "EXTREME" and not is_morning_shift:
        directives.append({
            "title": "Mandatory Morning School Shift Advisory",
            "priority": "URGENT",
            "action": "District Magistrate advisory: Transition school to Morning Shift (06:30 AM - 11:00 AM) or declare early heat wave closure.",
            "statutory_citation": "Section 30(2)(iii) Disaster Management Act 2005"
        })

    return {
        "status": "success",
        "provenance": "Calculated",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "request_params": {
            "school_name": s_name,
            "ward_no": w_no,
            "student_count": s_count,
            "age_group": a_group,
            "ventilation_type": v_type,
            "has_outdoor_activity": outdoor_act,
            "outdoor_activity_slot": act_slot,
            "school_timing_shift": timing_shift
        },
        "summary": {
            "overall_risk_score": peak_score,
            "peak_risk_tier": peak_tier,
            "peak_effective_wbgt_c": peak_wbgt,
            "total_water_liters_required_school": total_water_liters_school,
            "ors_reserve_packets_required": ors_packets_school,
            "recommended_shift": "Morning School (06:30 - 11:00 AM)" if peak_tier in ["HIGH", "EXTREME"] else "Normal Shift",
            "provenance": "Calculated"
        },
        "action_engine_directives": directives,
        "time_blocks": time_blocks
    }
