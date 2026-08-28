"""
SentinelX — Thermal Stress Engine
===================================
Reads ward_weather_forecast.csv (from fetch_weather_data.py) and computes,
for every ward and every forecast hour:

  - HI    : Heat Index (Rothfusz regression)          — needs T, RH
  - WBGT  : Wet-Bulb Globe Temperature (outdoor)       — needs T, RH, solar rad, wind
  - UTCI  : Universal Thermal Climate Index            — needs T, RH, solar rad, wind
  - WardRiskScore : normalized composite of all three
  - RiskTier : Green / Yellow / Orange / Red

HOW TO RUN:
1. Make sure `ward_weather_forecast.csv` is in the same folder as this script.
2. Install dependency:
       pip install pythermalcomfort
3. Run:
       python thermal_stress_engine.py
4. Output: `ward_risk_index.csv` — same rows as input, with 5 new columns:
       HI_celsius, WBGT_celsius, UTCI_celsius, WardRiskScore, RiskTier
"""

import csv
import json
import math
# pyrefly: ignore [missing-import]
from pythermalcomfort.models import utci

INPUT_CSV = "ward_weather_forecast.csv"
OUTPUT_CSV = "ward_risk_index.csv"
WARDS_GEOJSON_PATH = "wards_bhubaneswar.geojson"

# ---------------------------------------------------------------------------
# 0. Urban Heat Island (UHI) proxy — adds per-ward spatial variation
# ---------------------------------------------------------------------------
# The weather API gives one city-level reading; without per-ward satellite
# land-surface-temperature (production roadmap item), every ward would show
# identical values, which defeats the purpose of a ward-level dashboard.
# As an interim proxy, we derive a per-ward temperature offset from
# population density (people/hectare) computed from the ward GeoJSON:
# denser, more built-up wards run hotter than green/low-density wards —
# a well-documented urban heat island effect.
def load_ward_uhi_offsets(path, max_offset_c=2.8):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    density = {}
    for feat in data["features"]:
        props = feat["properties"]
        ward_no = props.get("wardno")
        pop = props.get("totalwardpopulation") or 0
        area_he = props.get("area_in_he")
        density[ward_no] = (pop / area_he) if area_he and area_he > 0 else 0.0

    vals = list(density.values())
    dmin, dmax = min(vals), max(vals)
    spread = (dmax - dmin) or 1.0

    offsets = {}
    for ward_no, d in density.items():
        norm = (d - dmin) / spread          # 0 (least dense) .. 1 (most dense)
        offsets[ward_no] = round(norm * max_offset_c, 2)
    return offsets


# ---------------------------------------------------------------------------
# 1. Heat Index (Rothfusz regression, NWS standard)
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# 2. WBGT (outdoor, estimated) — Stull natural wet-bulb + globe temp estimate
# ---------------------------------------------------------------------------
def natural_wet_bulb(T_c, RH):
    Tw = (T_c * math.atan(0.151977 * (RH + 8.313659) ** 0.5)
          + math.atan(T_c + RH) - math.atan(RH - 1.676331)
          + 0.00391838 * RH ** 1.5 * math.atan(0.023101 * RH)
          - 4.686035)
    return Tw


def estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms):
    wind_speed_ms = max(wind_speed_ms, 0.5)  # avoid divide-by-near-zero spikes
    return T_c + (0.02 * solar_radiation_wm2) / (1 + wind_speed_ms)


def wbgt_outdoor_celsius(T_c, RH, solar_radiation_wm2, wind_speed_ms):
    T_wb = natural_wet_bulb(T_c, RH)
    T_g = estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms)
    return 0.7 * T_wb + 0.2 * T_g + 0.1 * T_c


# ---------------------------------------------------------------------------
# 3. UTCI via pythermalcomfort (uses globe temp estimate as mean radiant temp)
# ---------------------------------------------------------------------------
def utci_celsius(T_c, RH, solar_radiation_wm2, wind_speed_ms):
    T_mrt = estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms)
    # UTCI model is only validated for wind speeds 0.5-17.0 m/s; clip into
    # range rather than letting the library silently return NaN.
    wind_clipped = min(max(wind_speed_ms, 0.5), 17.0)
    try:
        result = utci(tdb=T_c, tr=T_mrt, v=wind_clipped, rh=RH)
        val = result.utci if hasattr(result, "utci") else result["utci"]
        return None if (val is None or (isinstance(val, float) and math.isnan(val))) else val
    except Exception:
        return None


# ---------------------------------------------------------------------------
# 4. Composite Ward Risk Score + Tier
# ---------------------------------------------------------------------------
# Simple fixed-threshold normalization (0-1) per index, then weighted blend.
# Thresholds based on published heat-stress category tables.
def normalize_hi(hi):
    # HI danger bands (Celsius): <27 caution- , 27-32 caution, 32-39 extreme caution,
    # 39-51 danger, >51 extreme danger
    return min(max((hi - 20) / (54 - 20), 0), 1)


def normalize_wbgt(wbgt):
    # WBGT flag bands (Celsius, outdoor work): <27 white/green, 27-29 yellow,
    # 29-31 orange, 31-32 red, >32 black
    return min(max((wbgt - 20) / (33 - 20), 0), 1)


def normalize_utci(u):
    # UTCI stress bands (Celsius): <26 no stress, 26-32 moderate,
    # 32-38 strong, 38-46 very strong, >46 extreme
    return min(max((u - 20) / (46 - 20), 0), 1)


def composite_risk(hi, wbgt, u):
    scores = []
    weights = []
    if hi is not None:
        scores.append(normalize_hi(hi)); weights.append(0.3)
    if wbgt is not None:
        scores.append(normalize_wbgt(wbgt)); weights.append(0.35)
    if u is not None:
        scores.append(normalize_utci(u)); weights.append(0.35)
    if not scores:
        return None
    total_w = sum(weights)
    return sum(s * w for s, w in zip(scores, weights)) / total_w


def risk_tier(score):
    if score is None:
        return "Unknown"
    if score < 0.25:
        return "Green"
    elif score < 0.5:
        return "Yellow"
    elif score < 0.75:
        return "Orange"
    else:
        return "Red"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Reading {INPUT_CSV}...")
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f"Loaded {len(rows)} rows")

    print(f"Loading per-ward UHI offsets from {WARDS_GEOJSON_PATH}...")
    uhi_offsets = load_ward_uhi_offsets(WARDS_GEOJSON_PATH)
    print(f"  offset range: {min(uhi_offsets.values())}C to {max(uhi_offsets.values())}C "
          f"across {len(uhi_offsets)} wards")

    print("Computing HI, WBGT, UTCI, and composite risk for each row...")
    out_rows = []
    for i, r in enumerate(rows):
        T_base = float(r["temperature_c"])
        RH = float(r["relative_humidity_pct"])
        wind = float(r["wind_speed_ms"])
        solar = float(r["solar_radiation_wm2"])

        uhi = uhi_offsets.get(r["ward_no"], 0.0)
        T = T_base + uhi  # apply ward-specific urban heat island adjustment

        hi = heat_index_celsius(T, RH)
        wbgt = wbgt_outdoor_celsius(T, RH, solar, wind)
        u = utci_celsius(T, RH, solar, wind)
        score = composite_risk(hi, wbgt, u)
        tier = risk_tier(score)

        r["uhi_offset_c"] = uhi
        r["adjusted_temp_c"] = round(T, 1)
        r["HI_celsius"] = round(hi, 1)
        r["WBGT_celsius"] = round(wbgt, 1)
        r["UTCI_celsius"] = round(u, 1) if u is not None else ""
        r["WardRiskScore"] = round(score, 3) if score is not None else ""
        r["RiskTier"] = tier
        out_rows.append(r)

        if (i + 1) % 2000 == 0:
            print(f"  ...{i + 1}/{len(rows)} rows processed")

    print(f"Writing {OUTPUT_CSV}...")
    fieldnames = list(out_rows[0].keys())
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print("Done! Output:", OUTPUT_CSV)

    # Quick summary: worst ward-hour right now (first timestamp) by risk tier
    tier_counts = {}
    for r in out_rows:
        tier_counts[r["RiskTier"]] = tier_counts.get(r["RiskTier"], 0) + 1
    print("\nRisk tier distribution across all ward-hours:")
    for tier in ["Green", "Yellow", "Orange", "Red", "Unknown"]:
        if tier in tier_counts:
            print(f"  {tier}: {tier_counts[tier]}")


if __name__ == "__main__":
    main()
