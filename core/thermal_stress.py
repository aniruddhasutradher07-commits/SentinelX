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
        HI -= ((13.0 - RH) / 4.0) * math.sqrt((17.0 - abs(T_f - 95.0)) / 17.0)

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
    return max(0.0, min(1.0, (hi_c - 20.0) / (60.0 - 20.0)))


def _normalise_uv_index(uv: float) -> float:
    """
    Map UV Index from [0 … 15] onto [0, 1].
    WHO UV-risk bands:  0-2 Low | 3-5 Moderate | 6-7 High | 8-10 Very High | 11+ Extreme
    """
    return max(0.0, min(1.0, uv / 15.0))


def _normalise_aqi(aqi: float) -> float:
    """
    Map Air Quality Index (US EPA scale 0-500) onto [0, 1].
    0-50 Good | 51-100 Moderate | 101-150 Sensitive | 151-200 Unhealthy
    201-300 Very Unhealthy | 301-500 Hazardous
    """
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
    for band_name, (lo, hi) in HTSI_BANDS.items():
        if lo <= htsi_score < hi:
            return band_name
    return "Critical"


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
