"""
SentinelX — Impact Prediction Engine (STATEWIDE / 30-DISTRICT VERSION)
==========================================================================
Same two-stage model as prediction_engine.py (DLNM-style distributed-lag
baseline + XGBoost residual correction), scaled from 67 Bhubaneswar wards to
Odisha's 30 districts.

  Stage 1: distributed-lag regression — today's admissions respond to the
           district risk score over the past 0-5 days.
  Stage 2: XGBoost on the Stage 1 residuals, using population and a
           density-based vulnerability proxy.

DATA NOTE: exactly as in prediction_engine.py — no real hospital admission
dataset is available. Training data is SYNTHETIC, generated from Odisha's
known seasonal heat pattern (pre-monsoon Apr-Jun peak, humid monsoon plateau,
cool winter) with a calibrated dose-response curve. This is a stand-in for
the real pipeline, which needs a State Health Department data-sharing
agreement (see README).

HOW TO RUN:
1. Make sure `odisha_district_risk_index.csv` (from
   thermal_stress_engine_odisha.py) and `odisha_districts_with_population.geojson`
   are in the same folder.
2. Install dependencies:
       pip install pandas numpy scikit-learn xgboost
3. Run:
       python prediction_engine_odisha.py
4. Output: `odisha_district_impact_forecast.csv`
"""

import os
import json
import math
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

def _p(filename):
    if os.path.exists(filename):
        return filename
    if os.path.exists(os.path.join("District", filename)):
        return os.path.join("District", filename)
    return filename

RISK_INDEX_CSV = _p("odisha_district_risk_index.csv")
DISTRICTS_GEOJSON_PATH = _p("odisha_districts_with_population.geojson")
OUTPUT_CSV = _p("odisha_district_impact_forecast.csv")


RNG = np.random.default_rng(42)
N_HISTORICAL_YEARS = 3
LAG_DAYS = 5


def load_district_profile(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    profiles = {}
    for feat in data["features"]:
        p = feat["properties"]
        name = p.get("dtname")
        pop = p.get("population_2011_est") or 0
        area = p.get("Shape_Area") or 1
        density = pop / area
        profiles[name] = {"population": pop, "density": density}

    densities = np.array([v["density"] for v in profiles.values()])
    dmin, dmax = densities.min(), densities.max()
    for v in profiles.values():
        v["vulnerability"] = (v["density"] - dmin) / (dmax - dmin + 1e-9)
    return profiles


def seasonal_base_risk(day_of_year):
    premonsoon = 0.75 * math.exp(-((day_of_year - 140) ** 2) / (2 * 25 ** 2))
    monsoon = 0.45 * math.exp(-((day_of_year - 220) ** 2) / (2 * 45 ** 2))
    winter_floor = 0.08
    return min(winter_floor + premonsoon + monsoon, 1.0)


def generate_synthetic_history(district_profiles, n_years=N_HISTORICAL_YEARS):
    records = []
    n_days = 365 * n_years
    start_admissions_per_10k = 0.6

    for name, prof in district_profiles.items():
        vuln = prof["vulnerability"]
        pop = prof["population"]
        district_sensitivity = max(RNG.normal(loc=1.0 + 0.6 * vuln, scale=0.1), 0.5)

        risk_series = []
        for d in range(n_days):
            doy = d % 365
            base = seasonal_base_risk(doy)
            noisy = base + 0.15 * vuln + RNG.normal(0, 0.05)
            risk_series.append(max(0.0, min(noisy, 1.0)))

        n_events = RNG.integers(4, 8)
        for _ in range(n_events):
            center = RNG.integers(110, 170)
            length = RNG.integers(3, 8)
            for offset in range(length):
                idx = center + offset
                if 0 <= idx < 365:
                    for y in range(n_years):
                        day_idx = y * 365 + idx
                        if day_idx < n_days:
                            risk_series[day_idx] = min(risk_series[day_idx] + RNG.uniform(0.2, 0.4), 1.0)

        lag_weights = np.array([0.35, 0.25, 0.18, 0.12, 0.07, 0.03])
        for d in range(LAG_DAYS, n_days):
            lags = np.array([risk_series[d - k] for k in range(LAG_DAYS + 1)])
            exposure = float(np.dot(lags, lag_weights))

            baseline = start_admissions_per_10k * (pop / 10_000)
            excess_factor = max(0.0, exposure - 0.35) ** 1.8 * 14 * district_sensitivity
            expected_admissions = baseline + baseline * excess_factor
            actual = RNG.poisson(lam=max(expected_admissions, 0.1))

            records.append({
                "district": name, "day_idx": d, "day_of_week": d % 7,
                "risk_score": risk_series[d],
                **{f"risk_lag{k}": risk_series[d - k] for k in range(LAG_DAYS + 1)},
                "population": pop, "vulnerability": vuln, "admissions": actual,
            })

    return pd.DataFrame.from_records(records)


def train_model(df):
    lag_cols = [f"risk_lag{k}" for k in range(LAG_DAYS + 1)]
    X_stage1 = df[lag_cols].values
    y_log = np.log1p(df["admissions"].values)

    stage1 = LinearRegression()
    stage1.fit(X_stage1, y_log)
    stage1_pred = stage1.predict(X_stage1)
    residual = y_log - stage1_pred

    stage2_features = lag_cols + ["population", "vulnerability", "day_of_week"]
    X_stage2 = df[stage2_features].values
    stage2 = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.05,
                           subsample=0.8, colsample_bytree=0.8, random_state=42)
    stage2.fit(X_stage2, residual)

    return stage1, stage2, stage2_features


def evaluate_model(df, stage1, stage2, stage2_features, lag_cols):
    n = len(df)
    split = int(n * 0.85)
    test = df.iloc[split:]

    stage1_pred = stage1.predict(test[lag_cols].values)
    resid_pred = stage2.predict(test[stage2_features].values)
    final_pred = np.expm1(stage1_pred + resid_pred)
    actual = test["admissions"].values

    mae = mean_absolute_error(actual, final_pred)
    r2 = r2_score(actual, final_pred)

    def to_tier(vals, ref):
        p50, p75, p90 = np.percentile(ref, [50, 75, 90])
        return ["Green" if v < p50 else "Yellow" if v < p75 else "Orange" if v < p90 else "Red" for v in vals]

    actual_tiers = to_tier(actual, actual)
    pred_tiers = to_tier(final_pred, actual)
    tier_acc = np.mean([a == p for a, p in zip(actual_tiers, pred_tiers)])
    return {"MAE": mae, "R2": r2, "TierAccuracy": tier_acc}


def aggregate_daily_forecast(risk_index_csv):
    df = pd.read_csv(risk_index_csv)
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date
    daily = (
        df.groupby(["district", "date"])
        .agg(risk_score=("DistrictRiskScore", "max"),
             wbgt_max=("WBGT_celsius", "max"),
             population=("population_2011_est", "first"))
        .reset_index()
    )
    return daily


def build_forecast_lag_features(daily_df, district_profiles):
    rows = []
    for name, g in daily_df.groupby("district"):
        g = g.sort_values("date").reset_index(drop=True)
        scores = g["risk_score"].tolist()
        mean_score = float(np.mean(scores))
        prof = district_profiles.get(name, {"population": g["population"].iloc[0], "vulnerability": 0.5})

        for i, row in g.iterrows():
            lags = {f"risk_lag{k}": (scores[i - k] if i - k >= 0 else mean_score) for k in range(LAG_DAYS + 1)}
            rows.append({
                "district": name, "date": row["date"], "wbgt_max": row["wbgt_max"],
                "population": prof["population"], "vulnerability": prof.get("vulnerability", 0.5),
                "day_of_week": pd.Timestamp(row["date"]).dayofweek, **lags,
            })
    return pd.DataFrame(rows)


def classify_impact_tier(predicted, historical_reference):
    p50, p75, p90 = np.percentile(historical_reference, [50, 75, 90])
    if predicted < p50: return "Green"
    elif predicted < p75: return "Yellow"
    elif predicted < p90: return "Orange"
    else: return "Red"


def main():
    print(f"Loading district demographics from {DISTRICTS_GEOJSON_PATH}...")
    district_profiles = load_district_profile(DISTRICTS_GEOJSON_PATH)
    print(f"  {len(district_profiles)} districts loaded")

    print(f"Generating {N_HISTORICAL_YEARS} years of synthetic historical data "
          f"(calibrated dose-response, NOT real hospital records)...")
    hist_df = generate_synthetic_history(district_profiles)
    print(f"  {len(hist_df)} district-days generated")

    print("Training Stage 1 (distributed-lag baseline) + Stage 2 (XGBoost residual)...")
    lag_cols = [f"risk_lag{k}" for k in range(LAG_DAYS + 1)]
    stage1, stage2, stage2_features = train_model(hist_df)

    print("Evaluating on holdout period...")
    metrics = evaluate_model(hist_df, stage1, stage2, stage2_features, lag_cols)
    print(f"  MAE: {metrics['MAE']:.2f} admissions/day")
    print(f"  R^2: {metrics['R2']:.3f}")
    print(f"  Risk-tier classification accuracy: {metrics['TierAccuracy']*100:.1f}%")

    print(f"\nLoading real 5-day forecast from {RISK_INDEX_CSV}...")
    daily_forecast = aggregate_daily_forecast(RISK_INDEX_CSV)
    print(f"  {daily_forecast['district'].nunique()} districts x "
          f"{daily_forecast['date'].nunique()} forecast days")

    forecast_features = build_forecast_lag_features(daily_forecast, district_profiles)

    stage1_pred = stage1.predict(forecast_features[lag_cols].values)
    resid_pred = stage2.predict(forecast_features[stage2_features].values)
    forecast_features["predicted_admissions"] = np.expm1(stage1_pred + resid_pred).clip(min=0)

    district_hist_ref = hist_df.groupby("district")["admissions"].apply(list).to_dict()
    forecast_features["ImpactTier"] = [
        classify_impact_tier(row["predicted_admissions"], district_hist_ref.get(row["district"], [1, 2, 3]))
        for _, row in forecast_features.iterrows()
    ]

    out_cols = ["district", "date", "population", "wbgt_max", "predicted_admissions", "ImpactTier"]
    forecast_features["predicted_admissions"] = forecast_features["predicted_admissions"].round(1)
    forecast_features[out_cols].to_csv(OUTPUT_CSV, index=False)

    print(f"\nWritten {OUTPUT_CSV}")
    print("\nSample — highest predicted-impact district-days:")
    top = forecast_features.sort_values("predicted_admissions", ascending=False).head(10)
    for _, r in top.iterrows():
        print(f"  {r['district']} {r['date']}: {r['predicted_admissions']:.1f} "
              f"predicted admissions | WBGT {r['wbgt_max']:.1f}C | Tier {r['ImpactTier']}")


if __name__ == "__main__":
    main()
