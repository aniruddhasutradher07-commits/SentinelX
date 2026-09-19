import datetime
import math
import random
import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException
import numpy as np
import joblib
from supabase import create_client, Client

router = APIRouter(prefix="/api/v1", tags=["Mock Data Ported from server.ts"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "YOUR_SUPABASE_URL":
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("⚡ [mock_api] Supabase Client Initialized")
    except Exception as e:
        print(f"⚠️ [mock_api] Supabase initialization failed: {e}")

# Load ML Models
stage1_model = None
stage2_model = None
try:
    stage1_model = joblib.load("data/stage1_dlnm.joblib")
    stage2_model = joblib.load("data/stage2_xgboost.joblib")
    print("🧠 [mock_api] DLNM + XGBoost Hospital Surge Models Loaded")
except Exception as e:
    print(f"⚠️ [mock_api] Could not load ML models: {e}")

def predict_hospital_surge(population, vuln_multiplier, vuln_score, risk_score_0_to_100):
    if stage1_model is None or stage2_model is None:
        return round((population * 0.00018 * vuln_multiplier), 1)
    
    try:
        norm_risk = risk_score_0_to_100 / 100.0
        lags = [norm_risk] * 6
        day_of_week = datetime.datetime.now().weekday()
        vuln = vuln_score / 100.0
        
        X1 = np.array([lags])
        stage1_pred = stage1_model.predict(X1)
        
        X2 = np.array([lags + [population, vuln, day_of_week]])
        resid_pred = stage2_model.predict(X2)
        
        final_pred_log = stage1_pred + resid_pred
        admissions = np.expm1(final_pred_log)[0]
        return round(float(admissions), 1)
    except Exception as e:
        print(f"ML prediction failed: {e}")
        return round((population * 0.00018 * vuln_multiplier), 1)

# Load Real Census 2011 Data for Khordha District
CENSUS_FILE = "data/odisha_census_khordha_2011.csv"
census_df = None
if os.path.exists(CENSUS_FILE):
    try:
        census_df = pd.read_csv(CENSUS_FILE, sep="\t")
    except Exception as e:
        print("Warning: Could not load Census CSV:", e)

ODISHA_30_DISTRICTS = [
  { "district": 'Khordha', "pop": 1870115, "lat": 20.18, "lon": 85.62, "t": 39.5, "rh": 68, "wbgt": 32.4 },
  { "district": 'Cuttack', "pop": 2624470, "lat": 20.46, "lon": 85.88, "t": 40.1, "rh": 66, "wbgt": 32.8 },
  { "district": 'Puri', "pop": 1698730, "lat": 19.81, "lon": 85.83, "t": 36.8, "rh": 82, "wbgt": 32.1 },
  { "district": 'Ganjam', "pop": 3529031, "lat": 19.38, "lon": 85.06, "t": 38.4, "rh": 74, "wbgt": 32.0 },
  { "district": 'Balasore', "pop": 2320529, "lat": 21.49, "lon": 86.93, "t": 38.2, "rh": 72, "wbgt": 31.6 },
  { "district": 'Bhadrak', "pop": 1506522, "lat": 21.06, "lon": 86.50, "t": 38.0, "rh": 75, "wbgt": 31.8 },
  { "district": 'Mayurbhanj', "pop": 2519738, "lat": 21.93, "lon": 86.74, "t": 41.2, "rh": 55, "wbgt": 31.2 },
  { "district": 'Kendujhar', "pop": 1801733, "lat": 21.63, "lon": 85.58, "t": 40.5, "rh": 58, "wbgt": 30.8 },
  { "district": 'Sundargarh', "pop": 2093437, "lat": 22.12, "lon": 84.04, "t": 42.1, "rh": 48, "wbgt": 30.5 },
  { "district": 'Sambalpur', "pop": 1041099, "lat": 21.47, "lon": 83.97, "t": 42.8, "rh": 46, "wbgt": 31.1 },
  { "district": 'Bargarh', "pop": 1481255, "lat": 21.33, "lon": 83.62, "t": 42.4, "rh": 47, "wbgt": 30.9 },
  { "district": 'Balangir', "pop": 1648997, "lat": 20.71, "lon": 83.48, "t": 43.1, "rh": 44, "wbgt": 31.4 },
  { "district": 'Nuapada', "pop": 610382, "lat": 20.83, "lon": 82.53, "t": 42.5, "rh": 43, "wbgt": 30.6 },
  { "district": 'Kalahandi', "pop": 1576869, "lat": 19.91, "lon": 83.12, "t": 41.8, "rh": 52, "wbgt": 30.9 },
  { "district": 'Rayagada', "pop": 965959, "lat": 19.17, "lon": 83.42, "t": 40.2, "rh": 59, "wbgt": 30.2 },
  { "district": 'Koraput', "pop": 1379647, "lat": 18.81, "lon": 82.71, "t": 37.5, "rh": 62, "wbgt": 28.6 },
  { "district": 'Malkangiri', "pop": 613192, "lat": 18.34, "lon": 81.90, "t": 39.8, "rh": 61, "wbgt": 29.8 },
  { "district": 'Nabarangpur', "pop": 1220946, "lat": 19.23, "lon": 82.55, "t": 38.6, "rh": 60, "wbgt": 29.2 },
  { "district": 'Kandhamal', "pop": 733110, "lat": 20.44, "lon": 84.23, "t": 38.2, "rh": 58, "wbgt": 28.9 },
  { "district": 'Boudh', "pop": 441162, "lat": 20.84, "lon": 84.32, "t": 42.0, "rh": 50, "wbgt": 31.0 },
  { "district": 'Subarnapur', "pop": 610183, "lat": 20.84, "lon": 83.72, "t": 42.6, "rh": 47, "wbgt": 31.2 },
  { "district": 'Angul', "pop": 1273821, "lat": 20.84, "lon": 85.10, "t": 42.3, "rh": 54, "wbgt": 31.9 },
  { "district": 'Dhenkanal', "pop": 1192811, "lat": 20.66, "lon": 85.59, "t": 41.1, "rh": 60, "wbgt": 31.7 },
  { "district": 'Jajpur', "pop": 1827192, "lat": 20.85, "lon": 86.33, "t": 39.6, "rh": 67, "wbgt": 32.2 },
  { "district": 'Kendrapara', "pop": 1440218, "lat": 20.50, "lon": 86.42, "t": 38.4, "rh": 76, "wbgt": 32.3 },
  { "district": 'Jagatsinghpur', "pop": 1136971, "lat": 20.27, "lon": 86.17, "t": 37.9, "rh": 78, "wbgt": 32.2 },
  { "district": 'Nayagarh', "pop": 962789, "lat": 20.13, "lon": 85.10, "t": 40.8, "rh": 63, "wbgt": 31.8 },
  { "district": 'Gajapati', "pop": 577817, "lat": 18.81, "lon": 84.16, "t": 38.9, "rh": 68, "wbgt": 30.6 },
  { "district": 'Jharsuguda', "pop": 579505, "lat": 21.86, "lon": 82.01, "t": 42.5, "rh": 48, "wbgt": 31.0 },
  { "district": 'Deogarh', "pop": 312520, "lat": 21.53, "lon": 84.73, "t": 41.6, "rh": 51, "wbgt": 30.7 },
]

def compute_vulnerability_metrics(social_pct, worker_pct, tree_cover_pct, roof_pct, is_illit=False):
    if is_illit:
        # Scale illiteracy (typically 5% to 30%)
        v_soc = max(0, min(1, (social_pct - 5.0) / 25.0))
        label_name = 'Illiteracy (Census)'
        v_worker = max(0, min(1, (worker_pct - 1.0) / 10.0)) # AL/CL is lower in urban areas
    else:
        v_soc = max(0, min(1, (social_pct - 4.0) / 16.0))
        label_name = 'Elderly'
        v_worker = max(0, min(1, (worker_pct - 10.0) / 40.0))
        
    v_roof = max(0, min(1, (roof_pct - 5.0) / 50.0))
    v_tree = max(0, min(1, (35.0 - tree_cover_pct) / 30.0))
    
    score = (v_soc * 0.3) + (v_worker * 0.3) + (v_tree * 0.2) + (v_roof * 0.2)
    score_scaled = round(score * 100)
    
    mult = round(0.70 + 0.80 * score, 2)
    
    factors = [
        { "name": label_name, "val": v_soc * 0.3 },
        { "name": 'Outdoor Workers', "val": v_worker * 0.3 },
        { "name": 'Lack of Tree Cover', "val": v_tree * 0.2 },
        { "name": 'Heat Trapping Roofs', "val": v_roof * 0.2 }
    ]
    dominant = max(factors, key=lambda x: x["val"])["name"]
    
    tier = "SEVERE" if score_scaled >= 75 else ("HIGH" if score_scaled >= 50 else ("MODERATE" if score_scaled >= 30 else "LOW"))
    
    return {
        "social_vuln_pct": round(social_pct, 1),
        "social_vuln_label": label_name,
        "outdoor_worker_pct": round(worker_pct, 1),
        "tree_cover_pct": tree_cover_pct,
        "high_heat_roof_pct": roof_pct,
        "vulnerability_score": score_scaled,
        "vulnerability_multiplier": mult,
        "vulnerability_tier": tier,
        "dominant_factor": dominant
    }

def get_district_vulnerability(district_name):
    name = str(district_name or 'Khordha')
    coastal = name in ['Puri', 'Ganjam', 'Jagatsinghpur', 'Kendrapara', 'Bhadrak', 'Balasore']
    tribal_hilly = name in ['Kandhamal', 'Koraput', 'Rayagada', 'Malkangiri', 'Mayurbhanj', 'Sundargarh']
    tree_cover = 36.5 if tribal_hilly else (18.2 if coastal else 14.5)
    workers = 38.0 if tribal_hilly else (31.5 if coastal else 26.0)
    elderly = 12.4 if coastal else 9.8
    roofs = 42.0 if tribal_hilly else (34.0 if coastal else 25.5)
    return compute_vulnerability_metrics(elderly, workers, tree_cover, roofs)

def get_ward_vulnerability_and_pop(ward_no, uhi_offset=0.2):
    code = str(ward_no or 'W1').upper()
    num_str = "".join(filter(str.isdigit, code))
    num = int(num_str) if num_str else 1
    norm = (num % 67) / 67.0
    
    tree_cover = round(max(4, min(44, 38 - norm * 28 + ((num * 3) % 8))), 1)
    roof = round(max(6, min(62, 10 + norm * 35 + ((num * 5) % 12))), 1)
    
    tot_p = 13500 # Fallback
    
    if census_df is not None:
        ward_name_pattern = f"WARD NO.-{num:04d}"
        ward_row = census_df[(census_df["Level"] == "WARD") & (census_df["Name"].str.contains("Bhubaneswar", na=False)) & (census_df["Name"].str.contains(ward_name_pattern, na=False))]
        if not ward_row.empty:
            row = ward_row.iloc[0]
            tot_p = float(row["TOT_P"]) if row["TOT_P"] > 0 else 1.0
            illit_pct = (float(row["P_ILL"]) / tot_p) * 100.0
            al_cl = float(row["MAIN_AL_P"]) + float(row["MAIN_CL_P"]) + float(row["MARG_AL_P"]) + float(row["MARG_CL_P"])
            worker_pct = (al_cl / tot_p) * 100.0
            
            # Use ESTIMATED Elderly % for future reference, but compute vulnerability using Illiteracy
            estimated_elderly = 8.5 # ESTIMATED - state avg ratio, not ward-level Census data
            
            res = compute_vulnerability_metrics(illit_pct, worker_pct, tree_cover, roof, is_illit=True)
            res["elderly_pct_est"] = estimated_elderly
            return res, int(tot_p)

    # Fallback to procedural
    elderly = round(7.0 + (num % 10) * 1.1 + (uhi_offset * 1.5), 1)
    workers = round(14.0 + norm * 26.0 + ((num * 7) % 10), 1)
    res = compute_vulnerability_metrics(elderly, workers, tree_cover, roof)
    return res, tot_p

# Generate Data
now_ts = datetime.datetime.now().strftime("%Y-%m-%dT%H:00:00")
today = datetime.datetime.now().strftime("%Y-%m-%d")

districtRiskData = []
districtImpactData = []

for d in ODISHA_30_DISTRICTS:
    vuln = get_district_vulnerability(d["district"])
    thermalHazard = round((d["wbgt"] / 34.0) * 80.0)
    riskScore = min(100.0, round(thermalHazard * vuln["vulnerability_multiplier"], 1))
    tier = 'Red' if riskScore >= 85 else ('Orange' if riskScore >= 70 else ('Yellow' if riskScore >= 45 else 'Green'))
    
    districtRiskData.append({
        "district": d["district"],
        "population_2011_est": d["pop"],
        "centroid_lat": d["lat"],
        "centroid_lon": d["lon"],
        "timestamp": now_ts,
        "temperature_c": d["t"],
        "relative_humidity_pct": d["rh"],
        "wind_speed_ms": 2.2,
        "solar_radiation_wm2": 780,
        "apparent_temp_c": d["t"] + 4.2,
        "HI_celsius": d["t"] + 5.1,
        "WBGT_celsius": d["wbgt"],
        "UTCI_celsius": d["t"] + 3.8,
        "thermal_hazard_score": thermalHazard,
        "DistrictRiskScore": riskScore,
        "RiskTier": tier,
        **vuln
    })
    
    baseSurge = (d["wbgt"] - 27.0) * 7.5 * vuln["vulnerability_multiplier"]
    admissions = round(d["pop"] * 0.00005 * (1 + baseSurge / 100.0), 1)
    districtImpactData.append({
        "district": d["district"],
        "date": today,
        "population": d["pop"],
        "wbgt_max": d["wbgt"],
        "predicted_admissions": admissions,
        "ImpactTier": 'Red' if d["wbgt"] >= 32 else ('Orange' if d["wbgt"] >= 30 else 'Yellow')
    })

wardRiskData = []
wardImpactData = []

for idx in range(67):
    wNo = f"W{idx + 1}"
    uhi = round(((idx % 10) * 0.22 + 0.1), 2)
    vuln, pop = get_ward_vulnerability_and_pop(wNo, uhi)
    temp = round((38.0 + uhi), 1)
    wbgt = round((30.8 + uhi * 0.6), 1)
    thermalHazard = round((wbgt / 33.0) * 75.0)
    riskScore = min(100.0, round(thermalHazard * vuln["vulnerability_multiplier"], 1))
    
    # MRI grade consistency with WBGT thresholds
    if wbgt >= 32.0:
        tier = 'Red'
        riskScore = max(riskScore, 85.0)
    elif wbgt >= 30.5:
        tier = 'Red' if riskScore >= 85 else 'Orange'
        riskScore = max(riskScore, 70.0)
    elif wbgt >= 29.0:
        tier = 'Red' if riskScore >= 85 else ('Orange' if riskScore >= 70 else 'Yellow')
        riskScore = max(riskScore, 45.0)
    else:
        tier = 'Red' if riskScore >= 85 else ('Orange' if riskScore >= 70 else ('Yellow' if riskScore >= 45 else 'Green'))
    
    lstDay = round((temp + 6.4 + uhi * 1.5), 1)
    lstNight = round((28.0 + uhi * 0.8), 1)
    uhiAnomaly = round((lstDay - 41.2), 1)
    ndvi = round((0.14 + (vuln["tree_cover_pct"] / 100.0) * 0.68), 3)
    uhiTier = 'EXTREME_HOTSPOT' if uhiAnomaly >= 4.0 else ('MODERATE_UHI' if uhiAnomaly >= 2.0 else ('NEUTRAL' if uhiAnomaly >= 0.0 else 'COOL_ISLAND'))
    
    ward_obj = {
        "ward_no": wNo,
        "zone": 'North Zone',
        "population": pop,
        "centroid_lat": 20.29 + (idx * 0.001),
        "centroid_lon": 85.82 + (idx * 0.001),
        "timestamp": now_ts,
        "temperature_c": temp,
        "relative_humidity_pct": 69.0,
        "wind_speed_ms": 2.1,
        "solar_radiation_wm2": 907.5,
        "apparent_temp_c": temp + 3.8,
        "uhi_offset_c": uhi,
        "adjusted_temp_c": temp,
        "HI_celsius": temp + 4.8,
        "WBGT_celsius": wbgt,
        "UTCI_celsius": temp + 3.2,
        "thermal_hazard_score": thermalHazard,
        "WardRiskScore": riskScore,
        "RiskTier": tier,
        "modis_lst_c": lstDay,
        "modis_lst_day_c": lstDay,
        "modis_lst_night_c": lstNight,
        "sentinel2_ndvi": ndvi,
        "uhi_anomaly_c": uhiAnomaly,
        "uhi_classification": uhiTier,
        "nasa_solar_radiation_wm2": 907.5,
        "nasa_solar_wm2": 907.5,
        "nasa_source": 'NASA_POWER_CERES_SATELLITE',
        **vuln
    }
    wardRiskData.append(ward_obj)
    
    wardImpactData.append({
        "ward_no": wNo,
        "date": today,
        "population": pop,
        "wbgt_max": wbgt,
        "predicted_admissions": predict_hospital_surge(pop, vuln["vulnerability_multiplier"], vuln["vulnerability_score"], riskScore),
        "ImpactTier": tier
    })

# ========== SUPABASE SYNC LOGIC ==========
def sync_wards_to_supabase(data_list):
    if not supabase_client:
        return
    
    upsert_payload = []
    for w in data_list:
        drivers = [w.get("dominant_factor", "High temperature")]
        
        record = {
            "ward_no": w["ward_no"],
            "zone": w.get("zone", "North Zone"),
            "population": w.get("population", 12000),
            "centroid_lat": w["centroid_lat"],
            "centroid_lon": w["centroid_lon"],
            "timestamp": w["timestamp"],
            "temperature_c": w["temperature_c"],
            "relative_humidity_pct": w["relative_humidity_pct"],
            "wind_speed_ms": w["wind_speed_ms"],
            "solar_radiation_wm2": w["solar_radiation_wm2"],
            "apparent_temp_c": w["apparent_temp_c"],
            "uhi_offset_c": w["uhi_offset_c"],
            "adjusted_temp_c": w["adjusted_temp_c"],
            "hi_celsius": w["HI_celsius"],
            "wbgt_celsius": w["WBGT_celsius"],
            "utci_celsius": w.get("UTCI_celsius", 0),
            "thermal_hazard_score": w["thermal_hazard_score"],
            "elderly_pct": w.get("elderly_pct", w.get("elderly_pct_est", 9.5)),
            "outdoor_worker_pct": w.get("outdoor_worker_pct", 24.0),
            "tree_cover_pct": w.get("tree_cover_pct", 18.0),
            "high_heat_roof_pct": w.get("high_heat_roof_pct", 32.0),
            "vulnerability_score": w.get("vulnerability_score", 48.0),
            "vulnerability_multiplier": w.get("vulnerability_multiplier", 1.08),
            "ward_risk_score": w["WardRiskScore"],
            "risk_tier": w["RiskTier"],
            "top_drivers": drivers,
            "hospitalisation_flag": w["WardRiskScore"] >= 85.0
        }
        upsert_payload.append(record)
    
    try:
        supabase_client.table("ward_risk_index").insert(upsert_payload).execute()
        print(f"⚡ [mock_api] Synced {len(upsert_payload)} wards to Supabase")
    except Exception as e:
        print(f"⚠️ [mock_api] Supabase sync failed: {e}")

# Perform initial sync
import threading
threading.Thread(target=sync_wards_to_supabase, args=(wardRiskData,), daemon=True).start()

# ========== ENDPOINTS ==========

@router.get("/summary")
def summary():
    state_dist_count = len(districtImpactData)
    state_pop = sum(d["population"] for d in districtImpactData)
    state_admissions = round(sum(d["predicted_admissions"] for d in districtImpactData), 1)
    state_orange_red = sum(1 for d in districtImpactData if d["ImpactTier"] in ["Orange", "Red"])
    topD = max(districtRiskData, key=lambda x: x["WBGT_celsius"])
    state_peak_wbgt = topD["WBGT_celsius"]
    state_peak_dist = topD["district"]
    
    bmc_ward_count = len(wardImpactData)
    bmc_total_pop = sum(w["population"] for w in wardImpactData)
    bmc_admissions = round(sum(w["predicted_admissions"] for w in wardImpactData), 1)
    bmc_orange_red = sum(1 for w in wardImpactData if w["ImpactTier"] in ["Orange", "Red"])
    topW = max(wardImpactData, key=lambda x: x["predicted_admissions"])
    bmc_top_ward = topW["ward_no"]
    bmc_top_val = topW["predicted_admissions"]
    
    return {
        "timestamp_ist": datetime.datetime.now().isoformat(),
        "odisha_statewide": {
            "monitored_districts": state_dist_count,
            "total_population": state_pop,
            "today_expected_hospital_admissions": state_admissions,
            "peak_wbgt_district": state_peak_dist,
            "peak_wbgt_celsius": state_peak_wbgt,
            "elevated_risk_districts_count": state_orange_red,
        },
        "bhubaneswar_urban_core": {
            "monitored_wards": bmc_ward_count,
            "total_population": bmc_total_pop,
            "today_expected_hospital_admissions": bmc_admissions,
            "peak_surge_ward": bmc_top_ward,
            "peak_ward_expected_admissions": bmc_top_val,
            "elevated_risk_wards_count": bmc_orange_red,
        },
        "model_engine": '2-Stage DLNM Lagged Baseline + XGBoost Residual ML',
        "confidence_score_r2": 0.566,
    }

@router.get("/districts")
def districts():
    return {
        "count": len(districtRiskData),
        "timestamp": now_ts,
        "districts": districtRiskData
    }

@router.get("/districts/{name}")
def district_detail(name: str):
    match = [d for d in districtRiskData if d["district"].lower() == name.lower()]
    if not match:
        raise HTTPException(status_code=404, detail="District not found")
    
    first = match[0]
    vuln = get_district_vulnerability(first["district"])
    impacts = [d for d in districtImpactData if d["district"].lower() == name.lower()]
    
    hourly_series = []
    for h in range(48):
        hourly_series.append({
            "timestamp": (datetime.datetime.now() + datetime.timedelta(hours=h)).isoformat(),
            "temperature_c": first["temperature_c"],
            "relative_humidity_pct": first["relative_humidity_pct"],
            "WBGT_celsius": first["WBGT_celsius"],
            "HI_celsius": first["HI_celsius"],
            "DistrictRiskScore": first["DistrictRiskScore"],
            "RiskTier": first["RiskTier"],
        })
        
    return {
        "district": first["district"],
        "population": first["population_2011_est"],
        "centroid": [first["centroid_lat"], first["centroid_lon"]],
        "current_conditions": {
            "temperature_c": first["temperature_c"],
            "relative_humidity_pct": first["relative_humidity_pct"],
            "wbgt_celsius": first["WBGT_celsius"],
            "hi_celsius": first["HI_celsius"],
            "thermal_hazard_score": first["thermal_hazard_score"],
            "risk_score": first["DistrictRiskScore"],
            "risk_tier": first["RiskTier"],
        },
        "vulnerability_profile": {
            **vuln,
            "multiplier_explanation": f"Thermal Hazard scaled by ×{vuln['vulnerability_multiplier']} (Census/OSM composite)."
        },
        "hospital_impact_forecast": impacts,
        "hourly_series": hourly_series
    }

@router.get("/wards")
def wards():
    return {
        "count": len(wardRiskData),
        "timestamp": now_ts,
        "wards": wardRiskData
    }

@router.get("/wards/{ward_no}")
def ward_detail(ward_no: str):
    match = [w for w in wardRiskData if w["ward_no"].lower() == ward_no.lower()]
    if not match:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    first = match[0]
    vuln, pop = get_ward_vulnerability_and_pop(first["ward_no"], first["uhi_offset_c"])
    
    # 1. Dynamic 24h Diurnal Curve
    next_24h_weather = []
    base_temp = first["temperature_c"]
    base_wbgt = first["WBGT_celsius"]
    for h in range(24):
        # Sine wave modeling diurnal cycle (trough at hour 4, peak at hour 14)
        cycle = math.sin((h - 8) * math.pi / 12)
        next_24h_weather.append({
            "timestamp": (datetime.datetime.now() + datetime.timedelta(hours=h)).isoformat(),
            "temperature_c": round(base_temp - 3 + cycle * 4, 1),
            "relative_humidity_pct": first["relative_humidity_pct"],
            "wind_speed_ms": first["wind_speed_ms"],
            "solar_radiation_wm2": max(0, round(first["solar_radiation_wm2"] * math.sin((h - 6) * math.pi / 12), 1)) if 6 <= h <= 18 else 0,
            "apparent_temp_c": round(first["apparent_temp_c"] - 3 + cycle * 4, 1),
            "HI_celsius": round(first["HI_celsius"] - 3 + cycle * 4, 1),
            "WBGT_celsius": round(base_wbgt - 2.5 + cycle * 3.5, 1),
            "WardRiskScore": first["WardRiskScore"],
            "RiskTier": first["RiskTier"],
        })
        
    # 2. 5-Day Forecast Horizon
    forecast5d = []
    for i in range(5):
        d = (datetime.datetime.now() + datetime.timedelta(days=i))
        trend = math.sin(i * 0.8) * 0.5 + 1
        adm = round(pop * 0.00015 * trend * vuln["vulnerability_multiplier"], 1)
        tier = 'Red' if adm > pop * 0.00025 else ('Orange' if adm > pop * 0.00020 else ('Yellow' if adm > pop * 0.00010 else 'Green'))
        forecast5d.append({
            "ward_no": first["ward_no"],
            "date": d.strftime("%Y-%m-%d"),
            "population": pop,
            "wbgt_max": round(first["WBGT_celsius"] + (trend - 1) * 2, 1),
            "predicted_admissions": adm,
            "ImpactTier": tier
        })
        
    return {
        "ward_metadata": {
            "ward_no": first["ward_no"],
            "zone": first["zone"],
            "population": first["population"],
            "centroid_lat": first["centroid_lat"],
            "centroid_lon": first["centroid_lon"],
            "uhi_offset_c": first["uhi_offset_c"],
            "temperature_c": first["temperature_c"],
            "relative_humidity_pct": first["relative_humidity_pct"],
            "wind_speed_ms": first["wind_speed_ms"],
            "solar_radiation_wm2": first["solar_radiation_wm2"],
            "WardRiskScore": first["WardRiskScore"],
            "RiskTier": first["RiskTier"],
            **vuln
        },
        "hospital_demand_forecast": forecast5d,
        "next_24h_weather": next_24h_weather
    }

@router.get("/realtime/simulate-update")
def simulate_update(ward_no: str):
    import random
    match = next((w for w in wardRiskData if w["ward_no"].lower() == ward_no.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    match["temperature_c"] += random.uniform(0.5, 1.5)
    match["temperature_c"] = round(match["temperature_c"], 1)
    match["WBGT_celsius"] += random.uniform(0.3, 0.8)
    match["WBGT_celsius"] = round(match["WBGT_celsius"], 1)
    
    thermalHazard = round((match["WBGT_celsius"] / 33.0) * 75.0)
    match["thermal_hazard_score"] = thermalHazard
    riskScore = min(100.0, round(thermalHazard * match["vulnerability_multiplier"], 1))
    
    if match["WBGT_celsius"] >= 32.0:
        match["RiskTier"] = 'Red'
        riskScore = max(riskScore, 85.0)
    elif match["WBGT_celsius"] >= 30.5:
        match["RiskTier"] = 'Red' if riskScore >= 85 else 'Orange'
        riskScore = max(riskScore, 70.0)
    elif match["WBGT_celsius"] >= 29.0:
        match["RiskTier"] = 'Red' if riskScore >= 85 else ('Orange' if riskScore >= 70 else 'Yellow')
        riskScore = max(riskScore, 45.0)
    else:
        match["RiskTier"] = 'Red' if riskScore >= 85 else ('Orange' if riskScore >= 70 else ('Yellow' if riskScore >= 45 else 'Green'))
    
    match["WardRiskScore"] = riskScore
    match["timestamp"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:00:00")
    
    # Also recalculate surge predictions using ML model and update wardImpactData
    surge = predict_hospital_surge(match["population"], match["vulnerability_multiplier"], match["vulnerability_score"], riskScore)
    impact_match = next((i for i in wardImpactData if i["ward_no"].lower() == ward_no.lower()), None)
    if impact_match:
        impact_match["predicted_admissions"] = surge
        impact_match["ImpactTier"] = match["RiskTier"]
        impact_match["wbgt_max"] = match["WBGT_celsius"]
    
    sync_wards_to_supabase([match])
    return {"status": "ok", "ward": match}

@router.get("/live-feed")
def live_feed():
    now = datetime.datetime.now()
    topD = max(districtRiskData, key=lambda x: x["WBGT_celsius"]) if districtRiskData else None
    peak_wbgt = topD["WBGT_celsius"] if topD else 32.4
    peak_district = topD["district"] if topD else 'Khordha'
    
    return {
        "sync_timestamp": now.isoformat(),
        "sync_time_display": now.strftime("%I:%M:%S %p IST"),
        "connection": 'ACTIVE_TELEMETRY_SYNC',
        "refresh_interval_sec": 15,
        "telemetry": {
            "monitored_districts": 30,
            "monitored_wards": 67,
            "peak_wbgt_statewide": round(peak_wbgt + (random.random() * 0.2 - 0.1), 1),
            "peak_district": peak_district,
            "active_alert_level": 'ORANGE' if peak_wbgt > 32 else 'YELLOW',
            "grid_status": 'NORMAL',
            "hospitals_reporting": 48,
        }
    }

@router.get("/odisha-geojson")
@router.get("/districts-geojson")
def odisha_geojson():
    if os.path.exists("odisha_districts.geojson"):
        with open("odisha_districts.geojson", "r") as f:
            return json.load(f)
    return {"error": "File not found"}

@router.get("/wards-geojson")
def wards_geojson():
    if os.path.exists("wards_bhubaneswar.geojson"):
        with open("wards_bhubaneswar.geojson", "r") as f:
            return json.load(f)
    return {"error": "File not found"}
