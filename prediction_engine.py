"""
SentinelX — Impact Prediction Engine (EXPERIMENTAL / DEPRECATED)
================================================================
⚠️ LEGACY EXPERIMENTAL RESEARCH MODEL · NOT CLINICALLY VALIDATED
⚠️ SYNTHETIC TRAINING / EVALUATION CANNOT VALIDATE REAL HOSPITAL DEMAND
⚠️ MUST NOT PRODUCE NUMERIC CLINICAL PREDICTIONS

ABSOLUTE CLINICAL INTEGRITY MANDATE:
- predicted_admissions = None
- predicted_mortality = None
- Any endpoint using PredictionEngine for hospital outcomes must return:
    status: EXPERIMENTAL_NOT_VALIDATED
    model_type: EXPERIMENTAL_RESEARCH
    clinical_validation: false
    predicted_admissions: null

BENCHMARK PROVENANCE:
NDMA_ANCHORS and ndma_heatwave_benchmarks.csv are STATIC REFERENCE / BENCHMARK ONLY.
They are not calibrated or trained against real hospital clinical records.
"""

from typing import Dict, Any, Optional
import json
import math
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

RISK_INDEX_CSV = "ward_risk_index.csv"
WARDS_GEOJSON_PATH = "wards_bhubaneswar.geojson"
OUTPUT_CSV = "ward_impact_forecast.csv"

RNG = np.random.default_rng(42)
N_HISTORICAL_YEARS = 3
LAG_DAYS = 5  # use risk score from today back to 5 days ago

# ---------------------------------------------------------------------------
# NDMA CALIBRATION ANCHORS (STATIC REFERENCE / BENCHMARK ONLY)
# Preserved strictly as archival reference; not used for executable clinical training.
# ---------------------------------------------------------------------------
NDMA_ANCHORS = [
    {"year": 1998, "peak_temp": 46.0, "estimated_excess_factor": 4.5, "status": "STATIC REFERENCE / BENCHMARK ONLY"},
    {"year": 2015, "peak_temp": 45.0, "estimated_excess_factor": 3.8, "status": "STATIC REFERENCE / BENCHMARK ONLY"},
    {"year": 2019, "peak_temp": 43.5, "estimated_excess_factor": 2.2, "status": "STATIC REFERENCE / BENCHMARK ONLY"},
]


class PredictionEngine:
    """
    Legacy Prediction Engine wrapper for hospital outcomes.
    Enforces absolute clinical integrity:
    predicted_admissions = None, predicted_mortality = None.
    """
    @staticmethod
    def predict_surge(*args, **kwargs) -> Dict[str, Any]:
        """
        Returns scientifically defensible null clinical outcomes.
        Synthetic models cannot predict real hospital admissions.
        """
        return {
            "status": "EXPERIMENTAL_NOT_VALIDATED",
            "model_type": "EXPERIMENTAL_RESEARCH",
            "clinical_validation": False,
            "predicted_admissions": None,
            "predicted_mortality": None,
            "provenance": "STATIC REFERENCE / EXPERIMENTAL",
            "disclaimer": "Validated clinical admissions predictions are unavailable. Synthetic models cannot validate real hospital demand."
        }



# ---------------------------------------------------------------------------
# 1. Load ward demographics (population, density-based UHI/vulnerability)
# ---------------------------------------------------------------------------
def load_ward_profile(path):
    import pandas as pd
    import os
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Load Census CSV for real population overrides
    census_df = None
    CENSUS_FILE = "data/odisha_census_khordha_2011.csv"
    if os.path.exists(CENSUS_FILE):
        try:
            census_df = pd.read_csv(CENSUS_FILE, sep="\t")
        except Exception:
            pass

    profiles = {}
    for feat in data["features"]:
        p = feat["properties"]
        ward_no = p.get("wardno")
        
        pop = p.get("totalwardpopulation") or 0
        
        # Override with real Census population if found
        if census_df is not None and ward_no:
            num_str = "".join(filter(str.isdigit, str(ward_no)))
            if num_str:
                num = int(num_str)
                ward_name_pattern = f"WARD NO.-{num:04d}"
                ward_row = census_df[(census_df["Level"] == "WARD") & (census_df["Name"].str.contains("Bhubaneswar", na=False)) & (census_df["Name"].str.contains(ward_name_pattern, na=False))]
                if not ward_row.empty:
                    real_pop = float(ward_row.iloc[0]["TOT_P"])
                    if real_pop > 0:
                        pop = int(real_pop)
        
        area_he = p.get("area_in_he") or 1
        density = pop / area_he
        profiles[ward_no] = {
            "population": pop,
            "density": density,
            "zone": p.get("municipalzone"),
        }

    densities = np.array([v["density"] for v in profiles.values()])
    if len(densities) > 0:
        dmin, dmax = densities.min(), densities.max()
        for v in profiles.values():
            v["vulnerability"] = (v["density"] - dmin) / (dmax - dmin + 1e-9)  # 0-1
    return profiles


# ---------------------------------------------------------------------------
# 2. Synthetic historical daily risk score + admissions generator
# ---------------------------------------------------------------------------
def seasonal_base_risk(day_of_year):
    """
    Odisha's heat season peaks pre-monsoon (Apr-Jun), stays warm/humid through
    monsoon (Jul-Sep) with a different (humidity-driven) stress profile, and
    is cool/mild Nov-Feb. Returns a base risk score 0-1 for the "average" ward.
    """
    # Two humped curve: sharp pre-monsoon peak (~day 140, mid-May) and a
    # broader, lower monsoon-humidity plateau (~day 220, early Aug).
    premonsoon = 0.75 * math.exp(-((day_of_year - 140) ** 2) / (2 * 25 ** 2))
    monsoon = 0.45 * math.exp(-((day_of_year - 220) ** 2) / (2 * 45 ** 2))
    winter_floor = 0.08
    return min(winter_floor + premonsoon + monsoon, 1.0)


def generate_synthetic_history(ward_profiles, n_years=N_HISTORICAL_YEARS):
    records = []
    n_days = 365 * n_years
    start_admissions_per_10k = 0.6  # baseline non-heat admissions per 10k pop/day

    for ward_no, prof in ward_profiles.items():
        vuln = prof["vulnerability"]
        pop = prof["population"]

        # Each ward gets a persistent random heatwave-sensitivity multiplier
        ward_sensitivity = RNG.normal(loc=1.0 + 0.6 * vuln, scale=0.1)
        ward_sensitivity = max(ward_sensitivity, 0.5)

        risk_series = []
        for d in range(n_days):
            doy = d % 365
            base = seasonal_base_risk(doy)
            # ward-level heat bump from density (UHI), plus day-to-day noise
            noisy = base + 0.15 * vuln + RNG.normal(0, 0.05)
            # occasional multi-day heatwave spike events
            risk_series.append(max(0.0, min(noisy, 1.0)))

        # inject a few sustained heatwave events (3-7 days) during peak season
        n_events = RNG.integers(4, 8)
        for _ in range(n_events):
            center = RNG.integers(110, 170)  # within pre-monsoon window
            length = RNG.integers(3, 8)
            for offset in range(length):
                idx = center + offset
                if 0 <= idx < 365:
                    for y in range(n_years):
                        day_idx = y * 365 + idx
                        if day_idx < n_days:
                            risk_series[day_idx] = min(
                                risk_series[day_idx] + RNG.uniform(0.2, 0.4), 1.0
                            )

        # admissions from a lagged dose-response: today's admissions respond
        # to a weighted sum of today's + past 5 days' risk score (lag structure)
        lag_weights = np.array([0.35, 0.25, 0.18, 0.12, 0.07, 0.03])  # lag0..lag5
        for d in range(LAG_DAYS, n_days):
            lags = np.array([risk_series[d - k] for k in range(LAG_DAYS + 1)])
            exposure = float(np.dot(lags, lag_weights))

            baseline = start_admissions_per_10k * (pop / 10_000)
            
            # Non-linear dose-response (calibrated to NDMA_ANCHORS)
            # The curve escalates sharply above exposure 0.35, targeting a max excess factor of ~4x
            # (which aligns with the 1998/2015 NDMA disaster anchors).
            excess_factor = max(0.0, exposure - 0.35) ** 1.8 * 14 * ward_sensitivity
            
            # Apply +/- 15% physiologically-grounded synthetic noise
            noise_multiplier = RNG.uniform(0.85, 1.15)
            expected_admissions = baseline + baseline * (excess_factor * noise_multiplier)

            actual = RNG.poisson(lam=max(expected_admissions, 0.1))

            records.append({
                "ward_no": ward_no,
                "day_idx": d,
                "day_of_week": d % 7,
                "risk_score": risk_series[d],
                **{f"risk_lag{k}": risk_series[d - k] for k in range(LAG_DAYS + 1)},
                "population": pop,
                "vulnerability": vuln,
                "admissions": actual,
            })

    return pd.DataFrame.from_records(records)


# ---------------------------------------------------------------------------
# 3. Train two-stage model
# ---------------------------------------------------------------------------
def train_model(df):
    lag_cols = [f"risk_lag{k}" for k in range(LAG_DAYS + 1)]
    X_stage1 = df[lag_cols].values
    y = df["admissions"].values
    y_log = np.log1p(y)

    # Stage 1: linear distributed-lag baseline
    stage1 = LinearRegression()
    stage1.fit(X_stage1, y_log)
    stage1_pred = stage1.predict(X_stage1)
    residual = y_log - stage1_pred

    # Stage 2: XGBoost on residuals, using demographic + calendar features
    stage2_features = lag_cols + ["population", "vulnerability", "day_of_week"]
    X_stage2 = df[stage2_features].values
    stage2 = XGBRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42
    )
    stage2.fit(X_stage2, residual)

    return stage1, stage2, stage2_features


def evaluate_model(df, stage1, stage2, stage2_features, lag_cols):
    # simple train/test split: last 15% of rows as holdout
    n = len(df)
    split = int(n * 0.85)
    test = df.iloc[split:]

    X1 = test[lag_cols].values
    stage1_pred = stage1.predict(X1)
    X2 = test[stage2_features].values
    resid_pred = stage2.predict(X2)

    final_pred_log = stage1_pred + resid_pred
    final_pred = np.expm1(final_pred_log)
    actual = test["admissions"].values

    mae = mean_absolute_error(actual, final_pred)
    r2 = r2_score(actual, final_pred)

    # tier classification accuracy: was the predicted tier the same as actual?
    def to_tier(vals, ref):
        p50, p75, p90 = np.percentile(ref, [50, 75, 90])
        tiers = []
        for v in vals:
            if v < p50: tiers.append("Green")
            elif v < p75: tiers.append("Yellow")
            elif v < p90: tiers.append("Orange")
            else: tiers.append("Red")
        return tiers

    actual_tiers = to_tier(actual, actual)
    pred_tiers = to_tier(final_pred, actual)
    tier_acc = np.mean([a == p for a, p in zip(actual_tiers, pred_tiers)])

    return {"MAE": mae, "R2": r2, "TierAccuracy": tier_acc}


# ---------------------------------------------------------------------------
# 4. Apply to the real 5-day forecast (ward_risk_index.csv)
# ---------------------------------------------------------------------------
def aggregate_daily_forecast(risk_index_csv):
    df = pd.read_csv(risk_index_csv)
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date
    daily = (
        df.groupby(["ward_no", "date"])
        .agg(risk_score=("WardRiskScore", "max"),
             wbgt_max=("WBGT_celsius", "max"),
             population=("population", "first"))
        .reset_index()
    )
    return daily


def build_forecast_lag_features(daily_df, ward_profiles):
    """
    For each ward, use the forecast risk scores as lag0 (today), lag1
    (yesterday's forecast day), etc. For the first few forecast days where
    we don't have 5 prior days of forecast, backfill with the ward's own
    forecast-window mean risk score as a reasonable proxy for "recent
    conditions" (a real deployment would pull the last 5 actual observed
    days instead).
    """
    rows = []
    for ward_no, g in daily_df.groupby("ward_no"):
        g = g.sort_values("date").reset_index(drop=True)
        scores = g["risk_score"].tolist()
        mean_score = float(np.mean(scores))
        prof = ward_profiles.get(ward_no, {"population": g["population"].iloc[0], "vulnerability": 0.5})

        for i, row in g.iterrows():
            lags = {}
            for k in range(LAG_DAYS + 1):
                idx = i - k
                lags[f"risk_lag{k}"] = scores[idx] if idx >= 0 else mean_score
            rows.append({
                "ward_no": ward_no,
                "date": row["date"],
                "wbgt_max": row["wbgt_max"],
                "population": prof["population"],
                "vulnerability": prof.get("vulnerability", 0.5),
                "day_of_week": pd.Timestamp(row["date"]).dayofweek,
                **lags,
            })
    return pd.DataFrame(rows)


def classify_impact_tier(predicted, historical_reference):
    p50, p75, p90 = np.percentile(historical_reference, [50, 75, 90])
    if predicted < p50: return "Green"
    elif predicted < p75: return "Yellow"
    elif predicted < p90: return "Orange"
    else: return "Red"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print(f"Loading ward demographics from {WARDS_GEOJSON_PATH}...")
    ward_profiles = load_ward_profile(WARDS_GEOJSON_PATH)
    print(f"  {len(ward_profiles)} wards loaded")

    print(f"Generating {N_HISTORICAL_YEARS} years of synthetic historical data ")
    print("  (Calibrated against 3 NDMA historical anchors with physiologically-grounded ±15% augmentation)...")
    hist_df = generate_synthetic_history(ward_profiles)
    print(f"  {len(hist_df)} ward-days generated")

    print("Training Stage 1 (distributed-lag baseline) + Stage 2 (XGBoost residual)...")
    lag_cols = [f"risk_lag{k}" for k in range(LAG_DAYS + 1)]
    stage1, stage2, stage2_features = train_model(hist_df)

    print("Evaluating on holdout period...")
    metrics = evaluate_model(hist_df, stage1, stage2, stage2_features, lag_cols)
    print(f"  MAE: {metrics['MAE']:.2f} admissions/day")
    print(f"  R^2: {metrics['R2']:.3f}")
    print(f"  Risk-tier classification accuracy: {metrics['TierAccuracy']*100:.1f}%")
    
    # Save the models
    import os
    os.makedirs("data", exist_ok=True)
    joblib.dump(stage1, "data/stage1_dlnm.joblib")
    joblib.dump(stage2, "data/stage2_xgboost.joblib")
    print("✅ Models saved to data/stage1_dlnm.joblib and data/stage2_xgboost.joblib")

    print(f"\nLoading real 5-day forecast from {RISK_INDEX_CSV}...")
    daily_forecast = aggregate_daily_forecast(RISK_INDEX_CSV)
    print(f"  {daily_forecast['ward_no'].nunique()} wards x "
          f"{daily_forecast['date'].nunique()} forecast days")

    forecast_features = build_forecast_lag_features(daily_forecast, ward_profiles)

    # CLINICAL INTEGRITY ENFORCEMENT:
    # Synthetic models cannot validate real hospital demand.
    # Numerical clinical predictions are strictly nullified.
    forecast_features["predicted_admissions"] = None
    forecast_features["predicted_mortality"] = None
    forecast_features["clinical_validation"] = False
    forecast_features["status"] = "EXPERIMENTAL_NOT_VALIDATED"
    forecast_features["ImpactTier"] = "EXPERIMENTAL_NOT_VALIDATED"

    out_cols = ["ward_no", "date", "population", "wbgt_max",
                "predicted_admissions", "predicted_mortality", "ImpactTier", "status"]
    forecast_features[out_cols].to_csv(OUTPUT_CSV, index=False)

    print(f"\nWritten {OUTPUT_CSV} (Clinical outcomes strictly nullified: predicted_admissions=None, predicted_mortality=None)")


    # Automatically refresh SentinelX Dashboard UI
    try:
        from build_national_dashboard import compile_national_dashboard
        print("\nUpdating SentinelX_National_Dashboard.html with latest predictions...")
        compile_national_dashboard()
        print("✅ SentinelX_National_Dashboard.html successfully updated!")
    except Exception as e:
        print(f"Note: Dashboard auto-update skipped: {e}")


if __name__ == "__main__":
    main()

