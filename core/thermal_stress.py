"""
core/thermal_stress.py — Thermal Stress & Index Calculator
===========================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Implements:
  1. Steadman / NOAA Heat Index (Rothfusz regression, Celsius adaptation)
  2. Human Thermal Stress Index (HTSI): composite 0-100 score incorporating
     Heat Index (60%), UV Index (25%), and AQI (15%).
  3. Risk-tier classification based on HTSI bands.

References:
  - Rothfusz, L.P. (1990), "The Heat Index Equation", NWS Technical Attachment SR 90-23
  - Steadman, R.G. (1979), "The Assessment of Sultriness", J. Appl. Meteorol.
  - NOAA NWS Heat Index Chart adjustments for low-humidity and high-humidity regimes
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ── Risk-tier thresholds (HTSI bands) ──────────────────────────────────────
HTSI_BANDS = {
    "Normal":   (0,  30),
    "Elevated": (30, 50),
    "Warning":  (50, 70),
    "Critical": (70, 100),
}


@dataclass
class ThermalStressResult:
    """Immutable result container for a single-point thermal stress evaluation."""
    temperature_c: float
    humidity_pct: float
    uv_index: float
    aqi: float
    wind_speed_ms: float

    heat_index_c: float = 0.0
    htsi_score: float = 0.0           # 0-100
    risk_tier: str = "Normal"

    # Sub-component normalised scores (0-1)
    hi_normalised: float = 0.0
    uv_normalised: float = 0.0
    aqi_normalised: float = 0.0

    # Optional enrichment
    feels_like_c: Optional[float] = None


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
    """
    Compute the NOAA / NWS Heat Index from air temperature (°C) and relative
    humidity (%).  Uses the Rothfusz regression with the standard NWS
    adjustments for low-humidity (<13 %) and high-humidity (>85 %) regimes.

    The regression is defined in Fahrenheit; we convert in/out.

    If conditions are below the HI applicability threshold (T_f < 80 °F),
    we fall back to the simpler Steadman formula.
    """
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
# 2.  Sub-component normalisers (0-1)
# ═══════════════════════════════════════════════════════════════════════════

def _normalise_heat_index(hi_c: float) -> float:
    """
    Map Heat Index from its practical range [20 °C … 60 °C] onto [0, 1].
    Values below 20 °C → 0;  values above 60 °C → 1.
    Thresholds informed by NWS Heat Index danger bands:
      27 °C Caution  |  32 °C Extreme Caution  |  39 °C Danger  |  51 °C Extreme Danger
    """
    hi_c = _sanitize_float(hi_c, -50.0, 100.0, 25.0)
    return max(0.0, min(1.0, (hi_c - 20.0) / (60.0 - 20.0)))


def _normalise_uv_index(uv: float) -> float:
    """
    Map UV Index from [0 … 15] onto [0, 1].
    WHO UV-risk bands:  0-2 Low | 3-5 Moderate | 6-7 High | 8-10 Very High | 11+ Extreme
    """
    uv = _sanitize_float(uv, 0.0, 25.0, 0.0)
    return max(0.0, min(1.0, uv / 15.0))


def _normalise_aqi(aqi: float) -> float:
    """
    Map Air Quality Index (US EPA scale 0-500) onto [0, 1].
    0-50 Good | 51-100 Moderate | 101-150 Sensitive | 151-200 Unhealthy
    201-300 Very Unhealthy | 301-500 Hazardous
    """
    aqi = _sanitize_float(aqi, 0.0, 1000.0, 50.0)
    return max(0.0, min(1.0, aqi / 500.0))


# ═══════════════════════════════════════════════════════════════════════════
# 3.  Human Thermal Stress Index (HTSI)  — composite 0-100 score
# ═══════════════════════════════════════════════════════════════════════════

def compute_htsi(
    temperature_c: float,
    humidity_pct: float,
    uv_index: float = 0.0,
    aqi: float = 50.0,
    wind_speed_ms: float = 2.0,
) -> ThermalStressResult:
    """
    Compute the Human Thermal Stress Index (HTSI).

    Formula:
        HTSI = 100 × [ 0.60 × N(HI)  +  0.25 × N(UV)  +  0.15 × N(AQI) ]

    where N(·) is the respective normaliser mapping the raw value onto [0, 1].

    Returns a ``ThermalStressResult`` with all sub-scores and risk tier.
    """
    temperature_c = _sanitize_float(temperature_c, -50.0, 70.0, 25.0)
    humidity_pct = _sanitize_float(humidity_pct, 0.0, 100.0, 50.0)
    uv_index = _sanitize_float(uv_index, 0.0, 25.0, 0.0)
    aqi = _sanitize_float(aqi, 0.0, 1000.0, 50.0)
    wind_speed_ms = _sanitize_float(wind_speed_ms, 0.0, 100.0, 2.0)

    hi_c = heat_index_celsius(temperature_c, humidity_pct)

    hi_n = _normalise_heat_index(hi_c)
    uv_n = _normalise_uv_index(uv_index)
    aqi_n = _normalise_aqi(aqi)

    htsi = 100.0 * (0.60 * hi_n + 0.25 * uv_n + 0.15 * aqi_n)
    htsi = round(max(0.0, min(100.0, htsi)), 2)

    # Determine risk tier
    tier = "Normal"
    for band_name, (lo, hi_band) in HTSI_BANDS.items():
        if lo <= htsi < hi_band:
            tier = band_name
            break
    if htsi >= 100.0:
        tier = "Critical"

    # Wind-chill adjusted "feels like" (simplified — only subtracts when
    # wind provides evaporative cooling benefit at high temps)
    feels_like = hi_c - max(0.0, (wind_speed_ms - 1.5) * 0.4) if wind_speed_ms > 1.5 else hi_c

    return ThermalStressResult(
        temperature_c=round(temperature_c, 2),
        humidity_pct=round(humidity_pct, 2),
        uv_index=round(uv_index, 2),
        aqi=round(aqi, 2),
        wind_speed_ms=round(wind_speed_ms, 2),
        heat_index_c=round(hi_c, 2),
        htsi_score=htsi,
        risk_tier=tier,
        hi_normalised=round(hi_n, 4),
        uv_normalised=round(uv_n, 4),
        aqi_normalised=round(aqi_n, 4),
        feels_like_c=round(feels_like, 2),
    )


def classify_risk_tier(htsi_score: float) -> str:
    """Return the risk-tier label for a given HTSI score."""
    htsi_score = _sanitize_float(htsi_score, 0.0, 100.0, 0.0)
    for band_name, (lo, hi) in HTSI_BANDS.items():
        if lo <= htsi_score < hi:
            return band_name
    return "Critical"


# ═══════════════════════════════════════════════════════════════════════════
# 4. Nighttime Recovery Failure Index & 24h Cumulative Thermal Burden
# ═══════════════════════════════════════════════════════════════════════════

def compute_night_recovery(
    night_min_temp_c: float,
    night_humidity_pct: float,
    threshold_c: float = 26.0
) -> dict:
    """
    Computes Nighttime Recovery Failure Index based on nighttime minimum temperature & humidity.
    Epidemiological basis: Body requires nocturnal cooling (<26°C WBGT/HI) for cardiovascular recovery.
    Returns calculated recovery metrics with explicit provenance label.
    """
    night_min_temp_c = _sanitize_float(night_min_temp_c, -50.0, 70.0, 25.0)
    night_humidity_pct = _sanitize_float(night_humidity_pct, 0.0, 100.0, 80.0)

    night_hi = heat_index_celsius(night_min_temp_c, night_humidity_pct)
    
    # 0-100 failure score: 22°C = 0% failure (full recovery), 36°C = 100% failure (complete recovery failure)
    failure_score = round(max(0.0, min(100.0, (night_hi - 22.0) / (36.0 - 22.0) * 100.0)), 2)
    recovery_score = round(100.0 - failure_score, 2)
    
    tier = classify_risk_tier(failure_score)
    is_poor_recovery = night_min_temp_c >= threshold_c or failure_score >= 50.0

    return {
        "night_min_temp_c": round(night_min_temp_c, 2),
        "night_humidity_pct": round(night_humidity_pct, 2),
        "night_heat_index_c": round(night_hi, 2),
        "recovery_score": recovery_score,            # 100 = full cooling, 0 = no cooling
        "failure_score": failure_score,              # 0 = normal, 100 = severe failure
        "risk_tier": tier,
        "is_poor_recovery": is_poor_recovery,
        "provenance": "Calculated"
    }


def compute_24h_thermal_burden(
    daytime_htsi: float,
    night_failure_score: float,
    consecutive_poor_nights: int = 1
) -> dict:
    """
    Combines daytime HTSI and night recovery failure score into a composite 24h Thermal Burden score.
    Applies a 15% compounding penalty per consecutive night without core cooling (capped at 2.5x).
    Returns calculated 24h burden with explicit provenance label.
    """
    daytime_htsi = _sanitize_float(daytime_htsi, 0.0, 100.0, 50.0)
    night_failure_score = _sanitize_float(night_failure_score, 0.0, 100.0, 50.0)
    consecutive_poor_nights = max(1, min(10, int(_sanitize_float(consecutive_poor_nights, 1, 10, 1))))

    base_burden = 0.55 * daytime_htsi + 0.45 * night_failure_score
    
    # Compounding penalty multiplier for multi-day consecutive night heat load (capped at 2.5x max)
    compounding_multiplier = round(min(2.5, 1.0 + max(0, consecutive_poor_nights - 1) * 0.15), 2)
    
    thermal_burden_score = round(max(0.0, min(100.0, base_burden * compounding_multiplier)), 2)
    tier = classify_risk_tier(thermal_burden_score)

    return {
        "daytime_htsi": round(daytime_htsi, 2),
        "night_failure_score": round(night_failure_score, 2),
        "consecutive_poor_nights": consecutive_poor_nights,
        "compounding_multiplier": compounding_multiplier,
        "thermal_burden_score": thermal_burden_score,
        "risk_tier": tier,
        "provenance": "Calculated"
    }


# ── Convenience: quick-call that returns only the numeric score ───────────

def htsi_score(
    temperature_c: float,
    humidity_pct: float,
    uv_index: float = 0.0,
    aqi: float = 50.0,
    wind_speed_ms: float = 2.0,
) -> float:
    """Shorthand that returns just the HTSI float (0-100)."""
    return compute_htsi(temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms).htsi_score

