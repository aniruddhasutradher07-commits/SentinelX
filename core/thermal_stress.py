"""
core/thermal_stress.py — Thermal Stress & Index Calculator
===========================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Implements:
  1. Steadman / NOAA Heat Index (Rothfusz regression, Celsius adaptation)
  2. Australian Apparent Temperature (AAT) (incorporates wind speed)
  3. SentinelX Environmental Hazard Score: custom 0-100 composite
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

from config.thresholds import THRESHOLDS

HAZARD_BANDS = THRESHOLDS["environmental_hazard_bands"]["bands"]


@dataclass
class ThermalStressResult:
    """Immutable result container for a single-point thermal stress evaluation."""
    temperature_c: float
    humidity_pct: float
    uv_index: float
    aqi: float
    wind_speed_ms: float

    heat_index_c: float = 0.0
    apparent_temperature_c: float = 0.0
    environmental_score: float = 0.0           # 0-100
    environmental_tier: str = "LOW"

    # Sub-component normalised scores (0-1)
    hi_normalised: float = 0.0
    uv_normalised: float = 0.0
    aqi_normalised: float = 0.0


def _sanitize_float(val: any, min_val: float, max_val: float, default: float) -> float:
    """Validates and clamps numeric weather input to [min_val, max_val], replacing None, NaN, Inf, or invalid types with default."""
    if val is None:
        return default
    try:
        f_val = float(val)
        if math.isnan(f_val) or math.isinf(f_val):
            return default
        return max(min_val, min(max_val, f_val))
    except (ValueError, TypeError):
        return default


# ═══════════════════════════════════════════════════════════════════════════
# 1.  Steadman / NOAA Heat Index  (Celsius adaptation)
# ═══════════════════════════════════════════════════════════════════════════

def heat_index_celsius(T_c: float, RH: float) -> float:
    T_c = _sanitize_float(T_c, -50.0, 70.0, 25.0)
    RH = _sanitize_float(RH, 0.0, 100.0, 50.0)

    T_f = T_c * 9.0 / 5.0 + 32.0

    # ── Steadman simple formula (used when T_f < 80 °F) ──────────────
    simple_hi = 0.5 * (T_f + 61.0 + ((T_f - 68.0) * 1.2) + (RH * 0.094))
    if simple_hi < 80.0:
        return (simple_hi - 32.0) * 5.0 / 9.0

    # ── Full Rothfusz regression ─────────────────────────────────────
    HI = (
        -42.379
        + 2.04901523 * T_f
        + 10.14333127 * RH
        - 0.22475541 * T_f * RH
        - 0.00683783 * T_f ** 2
        - 0.05481717 * RH ** 2
        + 0.00122874 * T_f ** 2 * RH
        + 0.00085282 * T_f * RH ** 2
        - 0.00000199 * T_f ** 2 * RH ** 2
    )

    # ── NWS adjustment for low humidity ──────────────────────────────
    if RH < 13.0 and 80.0 <= T_f <= 112.0:
        arg = max(0.0, (17.0 - abs(T_f - 95.0)) / 17.0)
        HI -= ((13.0 - RH) / 4.0) * math.sqrt(arg)

    # ── NWS adjustment for high humidity ─────────────────────────────
    elif RH > 85.0 and 80.0 <= T_f <= 87.0:
        HI += ((RH - 85.0) / 10.0) * ((87.0 - T_f) / 5.0)

    return (HI - 32.0) * 5.0 / 9.0


# ═══════════════════════════════════════════════════════════════════════════
# 2.  Australian Apparent Temperature (incorporates Wind)
# ═══════════════════════════════════════════════════════════════════════════

def apparent_temperature(T_c: float, RH: float, wind_speed_ms: float) -> float:
    """
    Computes the Australian Bureau of Meteorology Apparent Temperature (AAT).
    Formula: AT = Ta + 0.33 * e - 0.70 * ws - 4.00
    Where:
      Ta = Dry bulb temperature (°C)
      e = Water vapour pressure (hPa)
      ws = Wind speed (m/s) at an elevation of 10 meters
    """
    T_c = _sanitize_float(T_c, -50.0, 70.0, 25.0)
    RH = _sanitize_float(RH, 0.0, 100.0, 50.0)
    wind_speed_ms = _sanitize_float(wind_speed_ms, 0.0, 100.0, 2.0)

    # Calculate water vapor pressure (e) in hPa
    e = (RH / 100.0) * 6.105 * math.exp((17.27 * T_c) / (237.7 + T_c))
    
    at = T_c + (0.33 * e) - (0.70 * wind_speed_ms) - 4.00
    return round(at, 2)


# ═══════════════════════════════════════════════════════════════════════════
# 3.  Sub-component normalisers (0-1)
# ═══════════════════════════════════════════════════════════════════════════

def _normalise_heat_index(hi_c: float) -> float:
    hi_c = _sanitize_float(hi_c, -50.0, 100.0, 25.0)
    return max(0.0, min(1.0, (hi_c - 20.0) / (60.0 - 20.0)))


def _normalise_uv_index(uv: float) -> float:
    uv = _sanitize_float(uv, 0.0, 25.0, 0.0)
    return max(0.0, min(1.0, uv / 15.0))


def _normalise_aqi(aqi: float) -> float:
    aqi = _sanitize_float(aqi, 0.0, 1000.0, 50.0)
    return max(0.0, min(1.0, aqi / 500.0))


# ═══════════════════════════════════════════════════════════════════════════
# 4.  SentinelX Environmental Hazard Score
# ═══════════════════════════════════════════════════════════════════════════

def compute_environmental_score(
    temperature_c: float,
    humidity_pct: float,
    uv_index: float = 0.0,
    aqi: float = 50.0,
    wind_speed_ms: float = 2.0,
) -> ThermalStressResult:
    """
    Compute the SentinelX Environmental Hazard Score.
    This is an explicitly custom, prototype engineering score (not a medical standard).

    Formula:
        Score = 100 × [ 0.60 × N(HI)  +  0.25 × N(UV)  +  0.15 × N(AQI) ]
    """
    temperature_c = _sanitize_float(temperature_c, -50.0, 70.0, 25.0)
    humidity_pct = _sanitize_float(humidity_pct, 0.0, 100.0, 50.0)
    uv_index = _sanitize_float(uv_index, 0.0, 25.0, 0.0)
    aqi = _sanitize_float(aqi, 0.0, 1000.0, 50.0)
    wind_speed_ms = _sanitize_float(wind_speed_ms, 0.0, 100.0, 2.0)

    hi_c = heat_index_celsius(temperature_c, humidity_pct)
    aat = apparent_temperature(temperature_c, humidity_pct, wind_speed_ms)

    hi_n = _normalise_heat_index(hi_c)
    uv_n = _normalise_uv_index(uv_index)
    aqi_n = _normalise_aqi(aqi)

    score = 100.0 * (0.60 * hi_n + 0.25 * uv_n + 0.15 * aqi_n)
    score = round(max(0.0, min(100.0, score)), 2)

    tier = "LOW"
    for band_name, (lo, hi_band) in HAZARD_BANDS.items():
        if lo <= score < hi_band:
            tier = band_name
            break
    if score >= 100.0:
        tier = "EXTREME"

    return ThermalStressResult(
        temperature_c=round(temperature_c, 2),
        humidity_pct=round(humidity_pct, 2),
        uv_index=round(uv_index, 2),
        aqi=round(aqi, 2),
        wind_speed_ms=round(wind_speed_ms, 2),
        heat_index_c=round(hi_c, 2),
        apparent_temperature_c=aat,
        environmental_score=score,
        environmental_tier=tier,
        hi_normalised=round(hi_n, 4),
        uv_normalised=round(uv_n, 4),
        aqi_normalised=round(aqi_n, 4),
    )


def classify_risk_tier(score: float) -> str:
    """Return the risk-tier label for a given score."""
    score = _sanitize_float(score, 0.0, 100.0, 0.0)
    for band_name, (lo, hi) in HAZARD_BANDS.items():
        if lo <= score < hi:
            return band_name
    return "EXTREME"

