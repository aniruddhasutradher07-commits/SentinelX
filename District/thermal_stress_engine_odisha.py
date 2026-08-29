"""
SentinelX — Thermal Stress Engine (STATEWIDE / 30-DISTRICT VERSION)
=======================================================================
Same HI / WBGT / UTCI / composite risk logic as thermal_stress_engine.py,
adapted to read district-level weather (odisha_district_weather_forecast.csv)
and district-level GeoJSON properties (dtname, population_2011_est,
Shape_Area) instead of ward-level ones.

Since each district already has its OWN fetched weather (unlike the
single-city ward case), we do NOT need a population-density UHI offset here
— the real per-district weather already gives spatial variation. Density is
still computed and kept as a column, since it's a useful vulnerability
indicator for the Impact Prediction Engine later.

HOW TO RUN:
1. Make sure `odisha_district_weather_forecast.csv` and
   `odisha_districts_with_population.geojson` are in the same folder.
2. Install dependency:
       pip install pythermalcomfort
3. Run:
       python thermal_stress_engine_odisha.py
4. Output: `odisha_district_risk_index.csv`
"""

import csv
import json
import math
from pythermalcomfort.models import utci

INPUT_CSV = "odisha_district_weather_forecast.csv"
OUTPUT_CSV = "odisha_district_risk_index.csv"
DISTRICTS_GEOJSON_PATH = "odisha_districts_with_population.geojson"


# ---------------------------------------------------------------------------
# 0. Population density per district (vulnerability indicator, not used as
#    a UHI temperature offset here since real per-district weather already
#    varies — unlike the single-city ward case).
# ---------------------------------------------------------------------------
def load_district_density(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    density = {}
    for feat in data["features"]:
        props = feat["properties"]
        name = props.get("dtname")
        pop = props.get("population_2011_est") or 0
        # Shape_Area is in the GeoJSON's native (geographic/degree-based)
        # units, not real km^2 — fine here since we only need RELATIVE
        # density ranking across districts, not an absolute figure.
        area = props.get("Shape_Area") or 1
        density[name] = pop / area
    return density


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
# 2. WBGT (outdoor, estimated)
# ---------------------------------------------------------------------------
def natural_wet_bulb(T_c, RH):
    return (T_c * math.atan(0.151977 * (RH + 8.313659) ** 0.5)
            + math.atan(T_c + RH) - math.atan(RH - 1.676331)
            + 0.00391838 * RH ** 1.5 * math.atan(0.023101 * RH)
            - 4.686035)


def estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms):
    wind_speed_ms = max(wind_speed_ms, 0.5)
    return T_c + (0.02 * solar_radiation_wm2) / (1 + wind_speed_ms)


def wbgt_outdoor_celsius(T_c, RH, solar_radiation_wm2, wind_speed_ms):
    T_wb = natural_wet_bulb(T_c, RH)
    T_g = estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms)
    return 0.7 * T_wb + 0.2 * T_g + 0.1 * T_c


# ---------------------------------------------------------------------------
# 3. UTCI
# ---------------------------------------------------------------------------
def utci_celsius(T_c, RH, solar_radiation_wm2, wind_speed_ms):
    T_mrt = estimate_globe_temp(T_c, solar_radiation_wm2, wind_speed_ms)
    wind_clipped = min(max(wind_speed_ms, 0.5), 17.0)
    try:
        result = utci(tdb=T_c, tr=T_mrt, v=wind_clipped, rh=RH)
        val = result.utci if hasattr(result, "utci") else result["utci"]
        return None if (val is None or (isinstance(val, float) and math.isnan(val))) else val
    except Exception:
        return None


# ---------------------------------------------------------------------------
# 4. Composite Risk Score + Tier (same thresholds as the ward-level engine)
# ---------------------------------------------------------------------------
def normalize_hi(hi):
    return min(max((hi - 20) / (54 - 20), 0), 1)


def normalize_wbgt(wbgt):
    return min(max((wbgt - 20) / (33 - 20), 0), 1)


def normalize_utci(u):
    return min(max((u - 20) / (46 - 20), 0), 1)


def composite_risk(hi, wbgt, u):
    scores, weights = [], []
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
    if score is None: return "Unknown"
    if score < 0.25: return "Green"
    elif score < 0.5: return "Yellow"
    elif score < 0.75: return "Orange"
    else: return "Red"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Reading {INPUT_CSV}...")
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows")

    print(f"Loading district density from {DISTRICTS_GEOJSON_PATH}...")
    density = load_district_density(DISTRICTS_GEOJSON_PATH)
    print(f"  {len(density)} districts loaded")

    print("Computing HI, WBGT, UTCI, and composite risk for each row...")
    out_rows = []
    for i, r in enumerate(rows):
        T = float(r["temperature_c"])
        RH = float(r["relative_humidity_pct"])
        wind = float(r["wind_speed_ms"])
        solar = float(r["solar_radiation_wm2"])

        hi = heat_index_celsius(T, RH)
        wbgt = wbgt_outdoor_celsius(T, RH, solar, wind)
        u = utci_celsius(T, RH, solar, wind)
        score = composite_risk(hi, wbgt, u)
        tier = risk_tier(score)

        r["population_density_relative"] = round(density.get(r["district"], 0), 2)
        r["HI_celsius"] = round(hi, 1)
        r["WBGT_celsius"] = round(wbgt, 1)
        r["UTCI_celsius"] = round(u, 1) if u is not None else ""
        r["DistrictRiskScore"] = round(score, 3) if score is not None else ""
        r["RiskTier"] = tier
        out_rows.append(r)

        if (i + 1) % 5000 == 0:
            print(f"  ...{i + 1}/{len(rows)} rows processed")

    print(f"Writing {OUTPUT_CSV}...")
    fieldnames = list(out_rows[0].keys())
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print("Done! Output:", OUTPUT_CSV)

    tier_counts = {}
    for r in out_rows:
        tier_counts[r["RiskTier"]] = tier_counts.get(r["RiskTier"], 0) + 1
    print("\nRisk tier distribution across all district-hours:")
    for tier in ["Green", "Yellow", "Orange", "Red", "Unknown"]:
        if tier in tier_counts:
            print(f"  {tier}: {tier_counts[tier]}")


if __name__ == "__main__":
    main()
