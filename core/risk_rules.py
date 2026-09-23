"""
core/risk_rules.py — Production Rule Engine
=============================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Evaluates environmental hazard risks transparently using the custom SentinelX Score
and separates it from the official IMD Heat-Wave criteria.
"""

from typing import Dict, Any
from core.thermal_stress import compute_environmental_score
from config.thresholds import THRESHOLDS

def evaluate_environmental_risk(
    temperature_c: float,
    humidity_pct: float,
    uv_index: float,
    aqi: float,
    wind_speed_ms: float,
    is_stale: bool = False
) -> Dict[str, Any]:
    """
    Evaluates instantaneous environmental hazard using SentinelX prototypes 
    and checks IMD context criteria.
    """
    # 1. Calculate the environmental score
    score_result = compute_environmental_score(
        temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms
    )

    # 2. Determine Triggers
    triggers = []
    if score_result.heat_index_c >= 40:
        triggers.append("high heat index")
    if score_result.uv_index >= 8:
        triggers.append("very high uv")
    if score_result.aqi >= 150:
        triggers.append("unhealthy aqi")
    if not triggers:
        triggers.append("baseline conditions")

    # 3. IMD Context
    imd_criteria = THRESHOLDS["imd_coastal_heatwave"]["conditions"]
    imd_context = "NOT_CONFIRMED"
    if temperature_c >= imd_criteria["max_temp_threshold_c"]:
        # We lack departure from normal and 2-day persistence in instantaneous telemetry
        imd_context = "CONDITIONS_MET_PENDING_PERSISTENCE"

    # 4. Data State
    data_state = "STALE" if is_stale else "LIVE"

    return {
        "environmental_score": score_result.environmental_score,
        "environmental_tier": score_result.environmental_tier,
        "apparent_temperature_c": score_result.apparent_temperature_c,
        "trigger": triggers,
        "risk_basis": "SentinelX rule engine",
        "imd_heatwave_context": imd_context,
        "data_state": data_state
    }
