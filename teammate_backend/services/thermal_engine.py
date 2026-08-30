"""
services/thermal_engine.py
============================
Computes HI (Heat Index), WBGT (Wet-Bulb Globe Temperature), and UTCI
(Universal Thermal Climate Index) from raw weather variables — ported
from the SentinelX project's thermal_stress_engine.py, where these
formulas were validated against real Bhubaneswar forecast data.

This lets the backend compute thermal indices itself from raw weather
(temperature, humidity, wind, solar radiation) instead of requiring the
caller to already know UTCI/WBGT (as the original /thermal-stress
endpoint required) — needed for the live-weather background refresh,
which only has raw met variables from the weather API.
"""

import math

try:
    from pythermalcomfort.models import utci as _utci_model
except Exception:
    _utci_model = None


def heat_index_celsius(T_c, RH):
    T_f = T_c * 9 / 5 + 32
    HI = (-42.379 + 2.04901523 * T_f + 10.14333127 * RH
          - 0.22475541 * T_f * RH - 0.00683783 * T_f ** 2
          - 0.05481717 * RH ** 2 + 0.00122874 * T_f ** 2 * RH
          + 0.00085282 * T_f * RH ** 2 - 0.00000199 * T_f ** 2 * RH ** 2)
    if RH < 13 and 80 <= T_f <= 112:
        HI -= ((13 - RH) / 4) * (((17 - abs(T_f - 95)) / 17) ** 0.5)
    elif RH > 85 and 80 <= T_f <= 87:
        HI += ((RH - 85) / 10) * ((87 - T_f) / 5)
    return (HI - 32) * 5 / 9


def _natural_wet_bulb(T_c, RH):
    return (T_c * math.atan(0.151977 * (RH + 8.313659) ** 0.5) + math.atan(T_c + RH)
            - math.atan(RH - 1.676331) + 0.00391838 * RH ** 1.5 * math.atan(0.023101 * RH)
            - 4.686035)


def _globe_temp(T_c, solar, wind):
    wind = max(wind, 0.5)
    return T_c + (0.02 * solar) / (1 + wind)


def wbgt_outdoor_celsius(T_c, RH, solar, wind):
    Tw = _natural_wet_bulb(T_c, RH)
    Tg = _globe_temp(T_c, solar, wind)
    return 0.7 * Tw + 0.2 * Tg + 0.1 * T_c


def utci_celsius(T_c, RH, solar, wind):
    if _utci_model is None:
        return None
    Tmrt = _globe_temp(T_c, solar, wind)
    wind_c = min(max(wind, 0.5), 17.0)
    try:
        result = _utci_model(tdb=T_c, tr=Tmrt, v=wind_c, rh=RH)
        val = result.utci if hasattr(result, "utci") else result["utci"]
        return None if (val is None or (isinstance(val, float) and math.isnan(val))) else float(val)
    except Exception:
        return None


def compute_all_indices(T_c, RH, wind_ms, solar_wm2):
    """Returns (hi, wbgt, utci) for the given raw weather."""
    hi = heat_index_celsius(T_c, RH)
    wbgt = wbgt_outdoor_celsius(T_c, RH, solar_wm2, wind_ms)
    utci = utci_celsius(T_c, RH, solar_wm2, wind_ms)
    return hi, wbgt, utci


def load_ward_uhi_offsets(wards, max_offset_c=2.8):
    """
    Given a list of Ward ORM objects (with .population and .area_hectares),
    returns {ward.id: offset_celsius} — denser wards run hotter, same
    urban-heat-island proxy used in the ward-level SentinelX pipeline.
    """
    density = {}
    for w in wards:
        pop = w.population or 0
        area = w.area_hectares or None
        density[w.id] = (pop / area) if area and area > 0 else 0.0

    vals = list(density.values())
    if not vals:
        return {}
    dmin, dmax = min(vals), max(vals)
    spread = (dmax - dmin) or 1.0
    return {wid: round((d - dmin) / spread * max_offset_c, 2) for wid, d in density.items()}
