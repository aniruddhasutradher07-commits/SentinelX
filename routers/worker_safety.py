"""
SentinelX Construction Worker Heat Safety Engine
=================================================
Smart India Hackathon 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Computes time-sliced heat exposure scores across work shifts for construction,
infrastructure, and outdoor daily-wage workers. Formulates mandatory work-rest
cycles, hydration requirements (ORS/water liters per site), and shaded recovery
directives grounded in Odisha Factories Act & NDMA Heat Action Plan guidelines.

Per rules.md:
- Provenance label: "Calculated"
- Input validation bounds enforced on all parameters.
"""

import math
import datetime
from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/v1", tags=["Construction Worker Safety"])


def _sanitize_float(val: Optional[float], default: float, min_val: float, max_val: float) -> float:
    """Sanitize float input against None, NaN, Inf, and non-physical values."""
    if val is None or math.isnan(val) or math.isinf(val):
        return default
    return max(min_val, min(max_val, float(val)))


WORK_TYPE_METABOLIC_MODIFIERS = {
    "Roofing / Sheet Laying": {"intensity_offset": 5.5, "solar_penalty": 2.5, "risk_mult": 1.35},
    "Paving / Asphalting": {"intensity_offset": 6.0, "solar_penalty": 3.0, "risk_mult": 1.40},
    "Steel Rebar Tying": {"intensity_offset": 4.5, "solar_penalty": 1.5, "risk_mult": 1.25},
    "Heavy Masonry": {"intensity_offset": 4.0, "solar_penalty": 1.0, "risk_mult": 1.20},
    "Excavation / Trenching": {"intensity_offset": 5.0, "solar_penalty": 0.5, "risk_mult": 1.30},
    "Scaffolding": {"intensity_offset": 3.5, "solar_penalty": 1.0, "risk_mult": 1.15},
}

INTENSITY_OFFSETS = {
    "Light": 0.0,
    "Moderate": 2.0,
    "Heavy": 4.5,
    "Very Heavy": 7.0,
}


@router.api_route("/worker-safety", methods=["GET", "POST"], summary="Calculate Construction Worker Shift Exposure & Work-Rest Directives")
def calculate_worker_safety(
    ward_no: str = Query("Ward 21", description="Target ward identifier"),
    worker_count: int = Query(45, ge=1, le=50000, description="Total outdoor workers on site"),
    work_type: str = Query("Heavy Masonry", description="Primary activity type"),
    work_intensity: str = Query("Heavy", description="Metabolic intensity level (Light, Moderate, Heavy, Very Heavy)"),
    shift_start_hour: int = Query(7, ge=0, le=23, description="Shift start hour (0-23)"),
    shift_end_hour: int = Query(16, ge=0, le=23, description="Shift end hour (0-23)"),
    has_shade: bool = Query(False, description="Whether shaded rest sheds are available on site"),
    has_water: bool = Query(True, description="Whether chilled drinking water/ORS is continuously provided"),
    ambient_temp: Optional[float] = Query(39.5, ge=-50.0, le=70.0, description="Daytime peak ambient temp °C"),
    humidity: Optional[float] = Query(68.0, ge=0.0, le=100.0, description="Daytime relative humidity %"),
    payload: Optional[dict] = Body(None)
):
    # Support JSON payload overrides for POST requests
    body = payload or {}
    w_no = body.get("ward_no") or ward_no
    w_count = int(body.get("worker_count") or worker_count)
    w_count = max(1, min(50000, w_count))
    w_type = body.get("work_type") or work_type
    w_intensity = body.get("work_intensity") or work_intensity
    s_start = int(body.get("shift_start_hour") or shift_start_hour)
    s_end = int(body.get("shift_end_hour") or shift_end_hour)
    
    # Normalize shift times
    if s_start >= s_end:
        s_end = min(23, s_start + 8)

    shade_avail = bool(body.get("has_shade") if "has_shade" in body else has_shade)
    water_avail = bool(body.get("has_water") if "has_water" in body else has_water)

    peak_temp = _sanitize_float(body.get("ambient_temp") or ambient_temp, 39.5, -50.0, 70.0)
    rel_humidity = _sanitize_float(body.get("humidity") or humidity, 68.0, 0.0, 100.0)

    type_mod = WORK_TYPE_METABOLIC_MODIFIERS.get(w_type, WORK_TYPE_METABOLIC_MODIFIERS["Heavy Masonry"])
    int_offset = INTENSITY_OFFSETS.get(w_intensity, 4.5)

    # Compute time-sliced 2-hour blocks across shift
    time_blocks = []
    block_start = s_start
    total_water_liters_per_worker = 0.0
    total_rest_minutes_per_worker = 0

    while block_start < s_end:
        block_end = min(s_end, block_start + 2)
        mid_hour = (block_start + block_end) / 2.0

        # Diurnal curve simulation centered on 14:00 solar peak
        hour_factor = math.sin((mid_hour - 6) * math.pi / 12)
        hour_factor = max(0.1, min(1.0, hour_factor))

        block_temp = round(26.0 + (peak_temp - 26.0) * hour_factor, 1)
        block_rh = round(max(30.0, rel_humidity - (hour_factor * 15.0)), 1)

        # Base WBGT estimate
        base_wbgt = 0.567 * block_temp + (0.393 * (block_rh / 100.0) * 6.105 * math.exp((17.27 * block_temp) / (237.7 + block_temp))) + 3.88

        # Effective WBGT with metabolic & work-type adjustments
        effective_wbgt = base_wbgt + (type_mod["intensity_offset"] * 0.4) + (int_offset * 0.4) + type_mod["solar_penalty"]
        
        if shade_avail:
            effective_wbgt -= 3.5
        if water_avail:
            effective_wbgt -= 1.2

        effective_wbgt = round(max(20.0, min(48.0, effective_wbgt)), 1)

        # HTSI Equivalent Score (0-100)
        exposure_score = round(max(15.0, min(100.0, (effective_wbgt / 38.0) * 85.0)), 1)

        # Determine Risk Tier
        if effective_wbgt >= 33.0 or exposure_score >= 80:
            tier = "EXTREME"
            tier_color = "Red"
            rest_mins_per_hr = 45
            water_ml_per_hr = 1000
            directive = "MANDATORY SHIFT HALT / Cessation of heavy labor during peak sun hours (Sec 144 / DMA 2005). 45 min rest/hr in shaded cooling shed + electrolyte ORS."
        elif effective_wbgt >= 31.0 or exposure_score >= 65:
            tier = "HIGH"
            tier_color = "Orange"
            rest_mins_per_hr = 30
            water_ml_per_hr = 750
            directive = "50% Work / 50% Rest Cycle (30 min rest per hour). Stagger heavy lifting to 06:00-10:00 AM. Continuous ORS & ice-water towels."
        elif effective_wbgt >= 28.0 or exposure_score >= 45:
            tier = "MODERATE"
            tier_color = "Yellow"
            rest_mins_per_hr = 15
            water_ml_per_hr = 500
            directive = "15 min shaded rest break every hour. Provide cool drinking water & ORS packets at site."
        else:
            tier = "LOW"
            tier_color = "Green"
            rest_mins_per_hr = 10
            water_ml_per_hr = 250
            directive = "Standard hydration breaks (10 min every 2 hours). Monitor worker heat cramps."

        block_duration_hrs = block_end - block_start
        total_water_liters_per_worker += (water_ml_per_hr / 1000.0) * block_duration_hrs
        total_rest_minutes_per_worker += rest_mins_per_hr * block_duration_hrs

        time_blocks.append({
            "block_label": f"{block_start:02d}:00 – {block_end:02d}:00",
            "start_hour": block_start,
            "end_hour": block_end,
            "ambient_temp_c": block_temp,
            "relative_humidity_pct": block_rh,
            "effective_wbgt_c": effective_wbgt,
            "exposure_score": exposure_score,
            "risk_tier": tier,
            "risk_color": tier_color,
            "rest_minutes_per_hour": rest_mins_per_hr,
            "water_ml_per_hour": water_ml_per_hr,
            "directive": directive,
            "provenance": "Calculated"
        })

        block_start = block_end

    # Overall Summary Metrics
    shift_hours = max(1, s_end - s_start)
    peak_block = max(time_blocks, key=lambda x: x["exposure_score"]) if time_blocks else None
    peak_score = peak_block["exposure_score"] if peak_block else 50.0
    peak_tier = peak_block["risk_tier"] if peak_block else "MODERATE"
    peak_wbgt = peak_block["effective_wbgt_c"] if peak_block else 30.0

    total_site_water_liters = round(w_count * total_water_liters_per_worker, 1)
    total_site_ors_sachets = int(math.ceil(total_site_water_liters / 2.0))

    return {
        "status": "success",
        "provenance": "Calculated",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "request_params": {
            "ward_no": w_no,
            "worker_count": w_count,
            "work_type": w_type,
            "work_intensity": w_intensity,
            "shift_hours": f"{s_start:02d}:00 – {s_end:02d}:00 ({shift_hours} hrs)",
            "has_shade": shade_avail,
            "has_water": water_avail
        },
        "summary": {
            "peak_exposure_score": peak_score,
            "peak_risk_tier": peak_tier,
            "peak_effective_wbgt_c": peak_wbgt,
            "total_water_liters_required_site": total_site_water_liters,
            "total_ors_sachets_required_site": total_site_ors_sachets,
            "avg_rest_minutes_per_hour": round(total_rest_minutes_per_worker / shift_hours, 1),
            "provenance": "Calculated"
        },
        "time_blocks": time_blocks
    }
