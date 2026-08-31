"""
SentinelX — Dashboard Builder & UI Integrator
==============================================
Compiles:
  1. ward_risk_index.csv (Hourly thermal indices & composite score)
  2. ward_impact_forecast.csv (2-stage DLNM + XGBoost hospital admission predictions)
  3. wards_bhubaneswar.geojson (Ward boundaries, demographics, officers)

Outputs a self-contained, high-performance, interactive command center:
  SentinelX_Dashboard.html
"""

import json
import pandas as pd
import numpy as np

RISK_CSV = "ward_risk_index.csv"
IMPACT_CSV = "ward_impact_forecast.csv"
GEOJSON_PATH = "wards_bhubaneswar.geojson"
OUTPUT_HTML = "SentinelX_Dashboard.html"

def build_data():
    print("Loading GeoJSON...")
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    # Index GeoJSON properties by wardno
    ward_meta = {}
    for feat in geo["features"]:
        p = feat["properties"]
        wn = p.get("wardno")
        ward_meta[wn] = {
            "geometry": feat["geometry"],
            "zone": p.get("municipalzone") or "Bhubaneswar",
            "population": int(p.get("totalwardpopulation") or 0),
            "households": int(p.get("numberofhouseholds") or 0),
            "area_he": float(p.get("area_in_he") or 1.0),
            "corporator": p.get("nameofthecorporator") or "—",
            "corporator_phone": p.get("mobilenoofcorporator") or "—",
            "officer": p.get("WardLevelOfficer") or "—",
            "officer_phone": p.get("WardLevelOfficialContactNo") or "—",
        }

    print("Loading Impact Forecast...")
    impact_df = pd.read_csv(IMPACT_CSV)
    impact_by_ward = {}
    for wn, g in impact_df.groupby("ward_no"):
        g = g.sort_values("date")
        impact_by_ward[wn] = g.to_dict(orient="records")

    print("Loading Thermal Risk Index...")
    risk_df = pd.read_csv(RISK_CSV)
    
    # Extract unique timestamps in order
    timestamps = list(dict.fromkeys(risk_df["timestamp"].tolist()))
    dates = list(dict.fromkeys(impact_df["date"].tolist()))

    # Build per-ward series and centroids
    wards_payload = {}
    for wn, g in risk_df.groupby("ward_no"):
        meta = ward_meta.get(wn, {
            "geometry": None, "zone": "Zone", "population": 0, "households": 0,
            "area_he": 1.0, "corporator": "—", "corporator_phone": "—", "officer": "—", "officer_phone": "—"
        })
        
        centroid_lat = float(g["centroid_lat"].iloc[0]) if "centroid_lat" in g.columns else None
        centroid_lon = float(g["centroid_lon"].iloc[0]) if "centroid_lon" in g.columns else None

        # Hourly series
        series = []
        for _, r in g.iterrows():
            series.append({
                "t": r["timestamp"],
                "temp": round(float(r["adjusted_temp_c"]), 1),
                "rh": round(float(r["relative_humidity_pct"]), 0),
                "hi": round(float(r["HI_celsius"]), 1) if pd.notna(r["HI_celsius"]) else None,
                "wbgt": round(float(r["WBGT_celsius"]), 1) if pd.notna(r["WBGT_celsius"]) else None,
                "utci": round(float(r["UTCI_celsius"]), 1) if pd.notna(r["UTCI_celsius"]) and str(r["UTCI_celsius"]).strip() != "" else None,
                "score": round(float(r["WardRiskScore"]), 3) if pd.notna(r["WardRiskScore"]) and str(r["WardRiskScore"]).strip() != "" else None,
                "tier": r["RiskTier"] if pd.notna(r["RiskTier"]) else "Unknown"
            })
        
        # Daily impact series
        daily_impact = impact_by_ward.get(wn, [])
        
        wards_payload[wn] = {
            "geometry": meta["geometry"],
            "centroid": [centroid_lat, centroid_lon] if (centroid_lat and centroid_lon) else None,
            "zone": meta["zone"],
            "population": meta["population"],
            "households": meta["households"],
            "area_he": meta["area_he"],
            "corporator": meta["corporator"],
            "corporator_phone": meta["corporator_phone"],
            "officer": meta["officer"],
            "officer_phone": meta["officer_phone"],
            "series": series,
            "impact_forecast": daily_impact
        }

    # Summary by date
    city_impact_summary = {}
    for d, g in impact_df.groupby("date"):
        city_impact_summary[d] = {
            "total_admissions": round(float(g["predicted_admissions"].sum()), 1),
            "max_admissions_ward": g.sort_values("predicted_admissions", ascending=False).iloc[0]["ward_no"],
            "max_admissions_val": round(float(g.sort_values("predicted_admissions", ascending=False).iloc[0]["predicted_admissions"]), 1),
            "tier_counts": g["ImpactTier"].value_counts().to_dict(),
            "avg_wbgt_max": round(float(g["wbgt_max"].mean()), 1)
        }

    payload = {
        "timestamps": timestamps,
        "dates": dates,
        "city_impact_summary": city_impact_summary,
        "wards": wards_payload
    }
    
    return payload

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SentinelX — Heat Risk & Hospital Surge Command Center</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<style>
  :root {
    --void: #06090e;
    --panel: #0d1218;
    --panel-raised: #131a23;
    --panel-inset: #090d12;
    --panel-glass: rgba(13, 18, 24, 0.92);
    --line: #1e2836;
    --line-soft: #161e29;
    --line-accent: rgba(255, 149, 82, 0.35);
    --text-hi: #f4f7fb;
    --text-mid: #8b99a8;
    --text-low: #4d5b6c;

    --brand: #ff9552;
    --brand-dim: rgba(255, 149, 82, 0.16);
    --brand-bright: #ffaa6e;
    --brand-glow: 0 0 18px rgba(255, 149, 82, 0.4);

    --accent-blue: #38bdf8;
    --accent-blue-dim: rgba(56, 189, 248, 0.16);

    --tier-green: #2ecc71;
    --tier-green-dim: rgba(46, 204, 113, 0.22);
    --tier-yellow: #f1c40f;
    --tier-yellow-dim: rgba(241, 196, 15, 0.22);
    --tier-orange: #e67e22;
    --tier-orange-dim: rgba(230, 126, 34, 0.25);
    --tier-red: #e74c3c;
    --tier-red-dim: rgba(231, 76, 60, 0.28);
    --tier-unknown: #4a5568;

    --display: 'Space Grotesk', 'Inter', sans-serif;
    --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;

    --radius-lg: 14px;
    --radius-md: 10px;
    --radius-sm: 6px;
    --radius-pill: 20px;
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%; background: var(--void);
    color: var(--text-hi); overflow: hidden; font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
  }

  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  #app {
    position: relative; z-index: 1; display: grid;
    grid-template-columns: 390px 1fr; grid-template-rows: 76px 1fr;
    width: 100vw; height: 100vh;
  }

  /* ============ HEADER ============ */
  header {
    grid-column: 1 / 3; grid-row: 1;
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    padding: 0 24px; border-bottom: 1px solid var(--line); background: var(--panel);
  }

  .header-left { display: flex; align-items: center; gap: 20px; }
  .brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .brand-mark {
    width: 40px; height: 40px; border-radius: 10px; position: relative; flex-shrink: 0;
    background: linear-gradient(145deg, #1c2430, #0c1016);
    border: 1px solid var(--line-accent);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 15px rgba(255, 149, 82, 0.18);
  }
  .brand-mark svg { width: 22px; height: 22px; }
  .brand-text .name { font-family: var(--display); font-weight: 700; font-size: 17px; letter-spacing: 0.02em; line-height: 1.1; }
  .brand-text .sub { font-size: 10px; color: var(--brand); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 3px; font-weight: 700; }

  .header-divider { width: 1px; height: 34px; background: var(--line); flex-shrink: 0; }

  /* Mode Switcher Tabs */
  .mode-switch {
    display: flex; background: var(--panel-inset); border: 1px solid var(--line);
    border-radius: var(--radius-pill); padding: 3px; gap: 3px;
  }
  .mode-btn {
    background: transparent; border: none; color: var(--text-mid);
    padding: 6px 14px; border-radius: var(--radius-pill); font-family: var(--sans);
    font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
    display: flex; align-items: center; gap: 7px;
  }
  .mode-btn svg { width: 14px; height: 14px; }
  .mode-btn:hover { color: var(--text-hi); }
  .mode-btn.active {
    background: var(--panel-raised); color: var(--text-hi);
    border: 1px solid var(--line-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .mode-btn.active.mode-impact { border-color: rgba(56, 189, 248, 0.4); color: var(--accent-blue); }

  /* KPI strip */
  #kpi-strip { display: flex; gap: 10px; overflow: hidden; align-items: center; }
  .kpi {
    background: var(--panel-raised); border: 1px solid var(--line-soft); border-radius: var(--radius-sm);
    padding: 6px 14px; min-width: 112px;
    display: flex; flex-direction: column; justify-content: center; gap: 1px;
    transition: border-color 0.2s;
  }
  .kpi .kpi-val { font-family: var(--mono); font-size: 17px; font-weight: 700; line-height: 1.15; display: flex; align-items: baseline; gap: 4px; }
  .kpi .kpi-val small { font-size: 10.5px; color: var(--text-low); font-weight: 500; }
  .kpi .kpi-lbl { font-size: 9px; color: var(--text-low); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .kpi.alert .kpi-val { color: var(--tier-orange); }
  .kpi.surge-highlight { border-color: rgba(56, 189, 248, 0.4); }
  .kpi.surge-highlight .kpi-val { color: var(--accent-blue); }

  .header-actions { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
  .api-sync-box { display: flex; align-items: center; gap: 8px; background: var(--panel-raised); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 4px 10px; font-family: var(--mono); font-size: 11px; }
  .sync-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tier-green); box-shadow: 0 0 8px var(--tier-green); animation: pulse 1.6s infinite; }
  .api-sync-box.offline .sync-status-dot { background: var(--tier-yellow); box-shadow: 0 0 8px var(--tier-yellow); animation: none; }
  .btn-sync-now { background: transparent; border: 1px solid var(--line); color: var(--brand); border-radius: 4px; font-family: var(--mono); font-size: 10px; padding: 3px 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; }
  .btn-sync-now:hover { background: var(--brand-dim); border-color: var(--brand); }
  .btn-sync-now.spinning svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .header-clock { font-family: var(--mono); text-align: right; flex-shrink: 0; }
  .header-clock .day { color: var(--text-hi); font-weight: 600; font-size: 12px; }
  .header-clock .time { color: var(--text-mid); font-size: 11px; margin-top: 2px; }

  /* ============ SIDEBAR ============ */
  aside {
    grid-column: 1; grid-row: 2;
    background: var(--panel); border-right: 1px solid var(--line);
    overflow-y: auto; padding: 18px 18px 24px; display: flex; flex-direction: column; gap: 16px;
  }
  aside::-webkit-scrollbar { width: 6px; }
  aside::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

  .section-label {
    font-family: var(--sans); font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.09em; color: var(--text-low); font-weight: 700;
    display: flex; align-items: center; gap: 8px; margin: 4px 0 0;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }

  #empty-state {
    background: var(--panel-raised); border: 1px dashed var(--line); border-radius: var(--radius-md);
    padding: 24px 16px; text-align: center; color: var(--text-mid); font-size: 12px; line-height: 1.6;
  }
  #empty-state svg { opacity: 0.3; margin-bottom: 8px; color: var(--brand); }

  .ward-card {
    background: var(--panel-raised); border: 1px solid var(--line);
    border-radius: var(--radius-lg); padding: 16px; position: relative;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .ward-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
  .ward-card-head h2 { margin: 0; font-family: var(--display); font-size: 20px; font-weight: 700; letter-spacing: 0.01em; }
  .tier-chip {
    font-family: var(--mono); font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.06em; padding: 3px 9px; border-radius: 20px; text-transform: uppercase;
    border: 1px solid; display: inline-flex; align-items: center; gap: 4px;
  }
  .ward-meta { font-size: 11.5px; color: var(--text-mid); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
  .ward-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-low); }

  /* Metric cards */
  .metric-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin-bottom: 14px; }
  .metric {
    background: var(--panel-inset); border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm); padding: 9px 6px; text-align: center;
  }
  .metric .val { font-family: var(--mono); font-size: 17px; font-weight: 700; }
  .metric .lbl { font-size: 8.5px; color: var(--text-low); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; font-weight: 600; }

  /* 🏥 Hospital Prediction Banner in Sidebar */
  .hospital-impact-box {
    background: linear-gradient(145deg, rgba(20, 28, 38, 0.95), rgba(12, 17, 23, 0.95));
    border: 1px solid rgba(56, 189, 248, 0.28); border-radius: var(--radius-md);
    padding: 12px 14px; margin-bottom: 14px; position: relative; overflow: hidden;
  }
  .hospital-impact-box::before {
    content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%;
    background: var(--accent-blue);
  }
  .impact-box-head {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
  }
  .impact-box-title {
    font-family: var(--sans); font-size: 10.5px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--accent-blue); display: flex; align-items: center; gap: 6px;
  }
  .impact-badge {
    font-family: var(--mono); font-size: 9px; font-weight: 700; padding: 2px 7px;
    border-radius: 10px; background: var(--accent-blue-dim); color: var(--accent-blue);
    border: 1px solid rgba(56,189,248,0.3);
  }
  .impact-val-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
  .impact-big-val {
    font-family: var(--mono); font-size: 22px; font-weight: 700; color: var(--text-hi);
  }
  .impact-big-val small { font-size: 11px; color: var(--text-mid); font-weight: 500; margin-left: 4px; }
  .impact-surge-tag { font-size: 10.5px; color: var(--tier-yellow); font-family: var(--mono); }

  /* 5-Day Sparkbar Chart */
  .sparkbar-wrap { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line-soft); }
  .sparkbar-title { font-size: 9.5px; color: var(--text-low); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: flex; justify-content: space-between; }
  .sparkbars { display: flex; gap: 6px; align-items: flex-end; height: 38px; }
  .sparkbar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end; }
  .sparkbar-bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.3s ease; }
  .sparkbar-date { font-family: var(--mono); font-size: 8.5px; color: var(--text-low); }
  .sparkbar-val { font-family: var(--mono); font-size: 9px; color: var(--text-mid); font-weight: 600; }

  /* Info rows */
  .pop-row { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-mid); padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
  .pop-row:last-child { border-bottom: none; }
  .pop-row b { color: var(--text-hi); font-family: var(--mono); font-weight: 600; font-size: 11.5px; }

  /* Action Buttons */
  .action-btn-row { display: flex; gap: 8px; margin-top: 14px; }
  .btn-dispatch {
    flex: 1; background: linear-gradient(145deg, #241a14, #18120d);
    border: 1px solid var(--brand); color: var(--brand); border-radius: var(--radius-sm);
    padding: 8px 12px; font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: var(--sans); display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: all 0.2s;
  }
  .btn-dispatch:hover { background: var(--brand); color: #000; box-shadow: var(--brand-glow); }

  .advisory {
    font-size: 11.5px; line-height: 1.6; color: var(--text-mid);
    background: var(--panel-inset); border: 1px solid var(--line-soft);
    border-left: 2px solid var(--brand); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    padding: 10px 12px; margin-top: 12px;
  }
  .advisory strong {
    color: var(--text-hi); font-family: var(--sans); display: block;
    margin-bottom: 5px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .advisory ul { margin: 0; padding-left: 14px; }
  .advisory li { margin-bottom: 4px; }
  .advisory li::marker { color: var(--brand); }

  /* Legend Box */
  #dist-bar-wrap { background: var(--panel-raised); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px; }
  #dist-bar-track { height: 8px; border-radius: 5px; overflow: hidden; display: flex; border: 1px solid var(--line-soft); }
  #dist-bar-track div { height: 100%; transition: width 0.25s ease; }
  .legend-rows { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .legend-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--text-mid); }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .legend-row .count { margin-left: auto; font-family: var(--mono); color: var(--text-hi); font-weight: 600; font-size: 11.5px; }

  /* Top 5 list */
  .top-list-card { background: var(--panel-raised); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 12px 14px; }
  .top-list-head { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-low); font-weight: 700; margin-bottom: 8px; }
  .top-list-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 0; border-bottom: 1px solid var(--line-soft); font-size: 11.5px; cursor: pointer;
    transition: background 0.15s;
  }
  .top-list-item:hover { background: rgba(255,255,255,0.02); }
  .top-list-item:last-child { border-bottom: none; }
  .top-list-item .ward-label { display: flex; align-items: center; gap: 7px; font-family: var(--mono); font-weight: 600; color: var(--text-hi); }
  .top-list-item .ward-chip { width: 7px; height: 7px; border-radius: 2px; }
  .top-list-item .ward-val { font-family: var(--mono); font-size: 11px; color: var(--text-mid); }

  .credit-line { margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--line-soft); font-size: 10px; color: var(--text-low); line-height: 1.5; }
  .credit-line b { color: var(--text-mid); }

  /* ============ MAP CONTAINER ============ */
  #map-wrap {
    grid-column: 2; grid-row: 2; position: relative;
    width: 100%; height: 100%; overflow: hidden; background: #080c11;
  }
  #map {
    position: absolute; inset: 0; width: 100% !important; height: 100% !important;
    background: #080c11;
  }
  .leaflet-container { background: #080c11 !important; font-family: var(--sans); }

  /* Map overlay cards */
  .map-title-card {
    position: absolute; top: 16px; left: 16px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: blur(12px);
    border: 1px solid var(--line); border-radius: var(--radius-md); padding: 12px 16px;
    font-size: 11px; color: var(--text-mid); line-height: 1.5; max-width: 280px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  .map-title-card .t1 { font-family: var(--display); font-size: 13.5px; color: var(--text-hi); font-weight: 700; margin-bottom: 3px; }
  .map-title-card .t2 { font-size: 10.5px; color: var(--brand); font-weight: 600; font-family: var(--mono); }

  /* Top Right Controls Group */
  .map-top-controls {
    position: absolute; top: 16px; right: 16px; z-index: 500;
    display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
  }

  /* Map layer mode pill */
  .map-view-toggle {
    background: var(--panel-glass); backdrop-filter: blur(12px);
    border: 1px solid var(--line); border-radius: var(--radius-pill); padding: 4px;
    display: flex; gap: 4px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  .layer-pill {
    background: transparent; border: none; color: var(--text-mid); font-family: var(--sans);
    font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: var(--radius-pill);
    cursor: pointer; transition: all 0.2s;
  }
  .layer-pill.active {
    background: var(--panel-raised); color: var(--text-hi);
    border: 1px solid var(--line-accent);
  }
  .layer-pill.active.impact { border-color: rgba(56, 189, 248, 0.4); color: var(--accent-blue); }

  /* Base Map Selector Pill */
  .basemap-picker {
    background: var(--panel-glass); backdrop-filter: blur(12px);
    border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 4px 6px;
    display: flex; gap: 4px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  .basemap-btn {
    background: transparent; border: none; color: var(--text-mid); font-family: var(--mono);
    font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px;
    cursor: pointer; transition: all 0.15s;
  }
  .basemap-btn:hover { color: var(--text-hi); }
  .basemap-btn.active {
    background: var(--panel-raised); color: var(--brand); border: 1px solid var(--line-accent);
  }

  /* Timeline Control */
  #timeline {
    position: absolute; left: 20px; right: 20px; bottom: 20px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: blur(14px);
    border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 14px 20px 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  }
  #timeline-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  #timeline-left { display: flex; align-items: center; gap: 12px; }
  #timeline-label { font-family: var(--mono); font-size: 12.5px; color: var(--text-hi); font-weight: 600; }
  #timeline-label .rel {
    color: var(--brand); font-weight: 600; margin-left: 8px;
    background: var(--brand-dim); padding: 2px 8px; border-radius: 10px; font-size: 10px;
  }
  #play-btn {
    width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--line);
    background: var(--panel-raised); color: var(--text-hi); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;
    transition: border-color 0.15s, color 0.15s;
  }
  #play-btn:hover { border-color: var(--brand); color: var(--brand); }
  #time-slider {
    width: 100%; -webkit-appearance: none; height: 5px; border-radius: 3px;
    background: var(--line); outline: none; cursor: pointer;
  }
  #time-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
    background: var(--brand); cursor: pointer; box-shadow: 0 0 0 4px var(--brand-dim);
    border: 2px solid var(--panel);
  }
  #day-ticks {
    display: flex; justify-content: space-between; margin-top: 6px;
    font-family: var(--mono); font-size: 9.5px; color: var(--text-low);
  }

  /* Daily Selector for Impact Mode */
  #day-selector-wrap { display: none; margin-top: 4px; }
  .day-btn-group { display: flex; gap: 8px; }
  .day-sel-btn {
    flex: 1; background: var(--panel-inset); border: 1px solid var(--line-soft);
    border-radius: var(--radius-sm); padding: 8px 6px; text-align: center;
    color: var(--text-mid); cursor: pointer; font-family: var(--mono); font-size: 11px;
    transition: all 0.2s;
  }
  .day-sel-btn:hover { border-color: var(--accent-blue); color: var(--text-hi); }
  .day-sel-btn.active {
    background: rgba(56, 189, 248, 0.14); border-color: var(--accent-blue);
    color: var(--accent-blue); font-weight: 700;
  }
  .day-sel-btn .subtext { font-size: 9px; color: var(--text-low); display: block; margin-top: 2px; }

  /* Modal for SMS / Action Dispatch */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
    z-index: 1000; display: none; align-items: center; justify-content: center;
  }
  .modal-backdrop.show { display: flex; }
  .modal-box {
    background: var(--panel); border: 1px solid var(--line-accent); border-radius: var(--radius-lg);
    width: 90%; max-width: 520px; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  }
  .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .modal-head h3 { margin: 0; font-family: var(--display); font-size: 18px; color: var(--text-hi); }
  .modal-close { background: none; border: none; color: var(--text-mid); font-size: 18px; cursor: pointer; }
  .sms-preview {
    background: var(--panel-inset); border: 1px solid var(--line); border-radius: var(--radius-md);
    padding: 14px; font-family: var(--mono); font-size: 11.5px; line-height: 1.7; color: var(--text-hi);
    margin-bottom: 16px; white-space: pre-wrap;
  }
  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
  .btn-secondary { background: var(--panel-raised); border: 1px solid var(--line); color: var(--text-mid); padding: 8px 14px; border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; }
  .btn-primary { background: var(--brand); border: none; color: #000; font-weight: 700; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; }

  /* Tooltip & Popups */
  .ward-tooltip {
    background: var(--panel-raised) !important; border: 1px solid var(--line) !important;
    color: var(--text-hi) !important; font-family: var(--mono) !important; font-size: 11px !important;
    font-weight: 600; border-radius: 5px !important; padding: 4px 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  }
</style>
</head>
<body>

<div id="app">
  <header>
    <div class="header-left">
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ff9552" stroke-width="1.8">
            <path d="M12 2C8 2 5 5.5 5 9.5c0 5.5 7 12.5 7 12.5s7-7 7-12.5C19 5.5 16 2 12 2z"/>
            <circle cx="12" cy="9.5" r="2.4" fill="#ff9552" stroke="none"/>
          </svg>
        </div>
        <div class="brand-text">
          <div class="name">SentinelX</div>
          <div class="sub">Heatwave &amp; Health Surge Command Center</div>
        </div>
      </div>

      <div class="header-divider"></div>

      <!-- Mode Switcher -->
      <div class="mode-switch">
        <button class="mode-btn active" id="btn-mode-thermal" onclick="setMode('thermal')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Thermal Stress (Hourly)
        </button>
        <button class="mode-btn mode-impact" id="btn-mode-impact" onclick="setMode('impact')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Hospital Demand (2-Stage ML)
        </button>
      </div>
    </div>

    <!-- Live KPI Strip -->
    <div id="kpi-strip"></div>

    <div class="header-actions">
      <div class="api-sync-box" id="api-sync-box">
        <span class="sync-status-dot" id="sync-dot"></span>
        <span id="api-sync-text">LIVE API (15s)</span>
        <button class="btn-sync-now" id="btn-sync-now" title="Trigger instant API telemetry refresh">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/></svg>
          Sync
        </button>
      </div>
      <div class="header-clock">
        <div class="day" id="clock-day">—</div>
        <div class="time" id="clock-time">—</div>
      </div>
    </div>
  </header>

  <!-- SIDEBAR -->
  <aside>
    <div class="section-label">Ward Profile</div>
    <div id="ward-panel">
      <div id="empty-state">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8 2 5 5.5 5 9.5c0 5.5 7 12.5 7 12.5s7-7 7-12.5C19 5.5 16 2 12 2z"/><circle cx="12" cy="9.5" r="2.3"/></svg>
        <div>Click any ward polygon on the map to inspect its real-time thermal and hospital surge profile.</div>
      </div>
    </div>

    <!-- Ranked Top Wards (Dynamic based on mode) -->
    <div class="top-list-card">
      <div class="top-list-head" id="top-list-title">Highest Risk Wards</div>
      <div id="top-list-rows"></div>
    </div>

    <!-- Risk / Impact Distribution -->
    <div class="section-label">City Distribution</div>
    <div id="dist-bar-wrap">
      <div id="dist-bar-track"></div>
      <div class="legend-rows" id="tier-legend"></div>
    </div>

    <div class="credit-line">
      <b>SIH 2026 · Problem Statement 26083</b><br>
      MoES / NCMRWF · 2-Stage DLNM Lagged Baseline + XGBoost Residual Model
    </div>
  </aside>

  <!-- MAP WRAPPER -->
  <div id="map-wrap">
    <div id="map"></div>

    <div class="map-title-card">
      <div class="t1">Bhubaneswar Municipal Corporation</div>
      <div class="t2" id="map-subhead">67 Wards · Live Thermal Stress (WBGT + UTCI + HI)</div>
    </div>

    <!-- Map Top Controls Group -->
    <div class="map-top-controls">
      <!-- Map View Layer Buttons -->
      <div class="map-view-toggle">
        <button class="layer-pill active" id="layer-thermal-btn" onclick="setMode('thermal')">🔥 Thermal Index</button>
        <button class="layer-pill impact" id="layer-impact-btn" onclick="setMode('impact')">🏥 Hospital Impact</button>
      </div>

      <!-- 100% Free Zero-Key Base Map Selector -->
      <div class="basemap-picker">
        <button class="basemap-btn active" id="bm-osm" onclick="setBaseMap('osm')">🗺️ Streets (OSM)</button>
        <button class="basemap-btn" id="bm-esri-street" onclick="setBaseMap('esri-street')">🏙️ City Map</button>
        <button class="basemap-btn" id="bm-sat" onclick="setBaseMap('sat')">🛰️ Satellite</button>
        <button class="basemap-btn" id="bm-dark" onclick="setBaseMap('dark')">🌙 Dark Canvas</button>
      </div>
    </div>

    <!-- Interactive Timeline (Hourly Mode) -->
    <div id="timeline">
      <div id="timeline-hourly-wrap">
        <div id="timeline-top">
          <div id="timeline-left">
            <button id="play-btn">▶</button>
            <div id="timeline-label">— <span class="rel"></span></div>
          </div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-low);letter-spacing:0.04em;">5-DAY HOURLY TIMELINE</div>
        </div>
        <input type="range" id="time-slider" min="0" max="119" value="11" step="1">
        <div id="day-ticks"></div>
      </div>

      <!-- 5-Day Selector (Daily Impact Mode) -->
      <div id="day-selector-wrap">
        <div style="font-family:var(--mono);font-size:10.5px;color:var(--accent-blue);font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;">
          <span>5-DAY HOSPITAL SURGE FORECAST (2-STAGE ML)</span>
          <span id="selected-day-impact-stat">—</span>
        </div>
        <div class="day-btn-group" id="day-btn-group"></div>
      </div>
    </div>
  </div>
</div>

<!-- Modal for Dispatching Alerts -->
<div class="modal-backdrop" id="alert-modal">
  <div class="modal-box">
    <div class="modal-head">
      <h3>📢 Automated Heat-Health Advisory Dispatch</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="font-size:12px;color:var(--text-mid);margin-bottom:10px;">
      Simulated priority SMS &amp; IVRS emergency notification to BMC Health Office, Ward Corporator &amp; Field Medical Teams:
    </div>
    <div class="sms-preview" id="sms-preview-text"></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="confirmDispatch()">✓ Confirm &amp; Transmit Alert</button>
    </div>
  </div>
</div>

<script>
window.__SENTINELX_DATA__ = __JSON_DATA__;
</script>

<script>
const TIER_COLORS = {
  Green:   '#2ecc71',
  Yellow:  '#f1c40f',
  Orange:  '#e67e22',
  Red:     '#e74c3c',
  Unknown: '#4a5568'
};

const TIER_DIM = {
  Green:   'rgba(46, 204, 113, 0.22)',
  Yellow:  'rgba(241, 196, 15, 0.22)',
  Orange:  'rgba(230, 126, 34, 0.25)',
  Red:     'rgba(231, 76, 60, 0.28)',
  Unknown: 'rgba(74, 85, 104, 0.22)'
};

const TIER_ADVISORIES = {
  Green:  ["Conditions are within safe thermal thresholds.", "Routine public health operations continue as normal."],
  Yellow: ["Maintain active hydration points across transit hubs.", "Outdoor workers advised to take shaded breaks between 11 AM - 4 PM.", "Primary Health Centers stocked with oral rehydration salts (ORS)."],
  Orange: ["High risk of heat-exhaustion for vulnerable demographics.", "Restrict strenuous outdoor manual labor during peak sunlight hours (11 AM - 4 PM).", "Activate ward-level cooling shelters and mobile water tankers.", "Hospital emergency beds placed on standby."],
  Red:    ["CRITICAL HEAT EMERGENCY: High probability of heat stroke.", "Mandatory halt on outdoor construction & street vending between 11 AM - 4 PM.", "Deploy emergency cooling tents and mobile medical relief units.", "Dial 108 for immediate heat distress ambulance dispatch."]
};

let DATA = window.__SENTINELX_DATA__;
let map = null;
let geoLayer = null;
let baseLayers = {};
let currentBaseMap = 'osm';
let currentMode = 'thermal'; // 'thermal' or 'impact'
let currentIdx = 11; // hourly index (0-119)
let selectedDayIdx = 0; // daily index (0-4)
let playing = false;
let playTimer = null;
let selectedWard = 'W21'; // default selection to most active ward

function fmtTime(ts){
  const d = new Date(ts);
  const day = d.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' });
  const time = d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  return { day, time };
}

function getHourlyRisk(ward, idx){
  return ward.series[idx] || null;
}

function getDailyImpact(ward, dayIdx){
  return ward.impact_forecast[dayIdx] || null;
}

function getStyleForFeature(wardno){
  const w = DATA.wards[wardno];
  if(!w) return { fillColor: TIER_COLORS.Unknown, weight:1.5, color:'#ffffff', fillOpacity:0.75 };

  let tier = 'Unknown';
  if(currentMode === 'thermal'){
    const r = getHourlyRisk(w, currentIdx);
    tier = r ? r.tier : 'Unknown';
  } else {
    const imp = getDailyImpact(w, selectedDayIdx);
    tier = imp ? imp.ImpactTier : 'Unknown';
  }

  const isSelected = wardno === selectedWard;
  const col = TIER_COLORS[tier] || TIER_COLORS.Unknown;

  return {
    fillColor: col,
    weight: isSelected ? 3.8 : 1.6,
    color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)',
    fillOpacity: isSelected ? 0.92 : 0.76
  };
}

function updateMapColors(){
  if(!geoLayer) return;
  geoLayer.eachLayer(layer => {
    const wardno = layer.feature.properties.wardno;
    layer.setStyle(getStyleForFeature(wardno));
  });
}

function setBaseMap(bmKey){
  currentBaseMap = bmKey;
  Object.keys(baseLayers).forEach(k => {
    if(map.hasLayer(baseLayers[k])) map.removeLayer(baseLayers[k]);
  });
  if(baseLayers[bmKey]) baseLayers[bmKey].addTo(map);

  ['osm', 'esri-street', 'sat', 'dark'].forEach(k => {
    const el = document.getElementById('bm-' + k);
    if(el) el.classList.toggle('active', k === bmKey);
  });

  if(geoLayer) geoLayer.bringToFront();
}

function setMode(mode){
  currentMode = mode;
  document.getElementById('btn-mode-thermal').classList.toggle('active', mode === 'thermal');
  document.getElementById('btn-mode-impact').classList.toggle('active', mode === 'impact');
  document.getElementById('layer-thermal-btn').classList.toggle('active', mode === 'thermal');
  document.getElementById('layer-impact-btn').classList.toggle('active', mode === 'impact');

  const hourlyWrap = document.getElementById('timeline-hourly-wrap');
  const dailyWrap = document.getElementById('day-selector-wrap');
  const subhead = document.getElementById('map-subhead');

  if(mode === 'thermal'){
    hourlyWrap.style.display = 'block';
    dailyWrap.style.display = 'none';
    subhead.textContent = '67 Wards · Live Thermal Stress (WBGT + UTCI + HI)';
  } else {
    hourlyWrap.style.display = 'none';
    dailyWrap.style.display = 'block';
    subhead.textContent = '67 Wards · 2-Stage DLNM+XGBoost Hospital Admissions';
    if(playing) togglePlay();
  }

  updateMapColors();
  updateKPICards();
  updateTopList();
  updateLegend();
  if(selectedWard) selectWard(selectedWard);
}

function selectWard(wardno){
  selectedWard = wardno;
  updateMapColors();
  const w = DATA.wards[wardno];
  if(!w) return;

  const hr = getHourlyRisk(w, currentIdx);
  const imp = getDailyImpact(w, selectedDayIdx);
  const thermalTier = hr ? hr.tier : 'Unknown';
  const impactTier = imp ? imp.ImpactTier : 'Unknown';
  const activeTier = currentMode === 'thermal' ? thermalTier : impactTier;
  const color = TIER_COLORS[activeTier];
  const advisories = TIER_ADVISORIES[activeTier] || [];

  // 5-day Sparkbar generation
  const maxImp = Math.max(...w.impact_forecast.map(x => x.predicted_admissions), 1.0);
  const sparkbarsHtml = w.impact_forecast.map((item, idx) => {
    const barH = Math.max(8, Math.round((item.predicted_admissions / maxImp) * 30));
    const isCur = idx === selectedDayIdx;
    const barCol = TIER_COLORS[item.ImpactTier];
    const dateShort = item.date.slice(5);
    return `
      <div class="sparkbar-col" onclick="setDayIndex(${idx})" style="cursor:pointer;" title="${item.date}: ${item.predicted_admissions} admissions">
        <div class="sparkbar-val" style="color:${isCur ? 'var(--text-hi)' : 'var(--text-low)'}">${item.predicted_admissions}</div>
        <div class="sparkbar-bar" style="height:${barH}px;background:${barCol};box-shadow:${isCur ? '0 0 6px '+barCol : 'none'}"></div>
        <div class="sparkbar-date" style="color:${isCur ? 'var(--accent-blue)' : 'var(--text-low)'}">${dateShort}</div>
      </div>
    `;
  }).join('');

  document.getElementById('ward-panel').innerHTML = `
    <div class="ward-card">
      <div class="ward-card-head">
        <h2>${wardno}</h2>
        <span class="tier-chip" style="background:${TIER_DIM[activeTier]};color:${color};border-color:${color}55;">
          ${activeTier} Tier
        </span>
      </div>
      <div class="ward-meta">
        ${w.zone} <span class="dot"></span> ${Number(w.population).toLocaleString('en-IN')} residents
      </div>

      <!-- 🏥 Hospital Demand Box -->
      <div class="hospital-impact-box">
        <div class="impact-box-head">
          <div class="impact-box-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Hospital Demand Forecast
          </div>
          <span class="impact-badge">${imp ? imp.ImpactTier : '—'} Surge</span>
        </div>
        <div class="impact-val-row">
          <div class="impact-big-val">
            ${imp ? imp.predicted_admissions : '—'}
            <small>expected admissions / day</small>
          </div>
        </div>
        <div class="sparkbar-wrap">
          <div class="sparkbar-title">
            <span>5-Day Trajectory (Admissions)</span>
            <span>Peak: ${maxImp.toFixed(1)}</span>
          </div>
          <div class="sparkbars">${sparkbarsHtml}</div>
        </div>
      </div>

      <!-- Real-time Thermal Indices -->
      <div class="metric-grid">
        <div class="metric"><div class="val">${hr ? hr.hi.toFixed(1) : '—'}°</div><div class="lbl">Heat Index</div></div>
        <div class="metric"><div class="val">${hr ? hr.wbgt.toFixed(1) : '—'}°</div><div class="lbl">WBGT</div></div>
        <div class="metric"><div class="val">${hr && hr.utci ? hr.utci.toFixed(1)+'°' : '—'}</div><div class="lbl">UTCI</div></div>
      </div>

      <div class="pop-row"><span>Air Temp / Humidity</span><b>${hr ? hr.temp.toFixed(1) : '—'}°C / ${hr ? hr.rh.toFixed(0) : '—'}%</b></div>
      <div class="pop-row"><span>Density</span><b>${Math.round(w.population / w.area_he)} pop/hec</b></div>
      <div class="pop-row"><span>Ward Corporator</span><b style="font-family:var(--sans);">${w.corporator}</b></div>
      <div class="pop-row"><span>Contact</span><b>${w.corporator_phone || '—'}</b></div>

      <div class="action-btn-row">
        <button class="btn-dispatch" onclick="openAlertModal('${wardno}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          Dispatch Ward Advisory
        </button>
      </div>

      <div class="advisory">
        <strong>Automated Protocol · ${activeTier} Tier</strong>
        <ul>${advisories.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function updateKPICards(){
  const kpiEl = document.getElementById('kpi-strip');
  
  if(currentMode === 'thermal'){
    const counts = { Green:0, Yellow:0, Orange:0, Red:0, Unknown:0 };
    let popAtRisk = 0;
    let peakWbgt = 0;

    Object.values(DATA.wards).forEach(w => {
      const r = getHourlyRisk(w, currentIdx);
      if(r){
        counts[r.tier] = (counts[r.tier] || 0) + 1;
        if(r.tier === 'Orange' || r.tier === 'Red') popAtRisk += Number(w.population || 0);
        if(r.wbgt > peakWbgt) peakWbgt = r.wbgt;
      }
    });

    const elevated = counts.Orange + counts.Red;
    kpiEl.innerHTML = `
      <div class="kpi">
        <div class="kpi-val">67 <small>wards</small></div>
        <div class="kpi-lbl">Monitored Wards</div>
      </div>
      <div class="kpi ${elevated > 0 ? 'alert' : ''}">
        <div class="kpi-val">${elevated} <small>/ 67</small></div>
        <div class="kpi-lbl">Elevated (Orange/Red)</div>
      </div>
      <div class="kpi">
        <div class="kpi-val">${(popAtRisk/1000).toFixed(1)}<small>k</small></div>
        <div class="kpi-lbl">Pop. Under Heat Stress</div>
      </div>
      <div class="kpi">
        <div class="kpi-val">${peakWbgt.toFixed(1)}<small>°C</small></div>
        <div class="kpi-lbl">Peak WBGT City-Wide</div>
      </div>
    `;
  } else {
    const curDate = DATA.dates[selectedDayIdx];
    const summary = DATA.city_impact_summary[curDate] || {
      total_admissions: 0, max_admissions_ward: '—', max_admissions_val: 0, tier_counts: {}
    };

    kpiEl.innerHTML = `
      <div class="kpi surge-highlight">
        <div class="kpi-val">${summary.total_admissions} <small>admissions</small></div>
        <div class="kpi-lbl">City-Wide Expected Admissions</div>
      </div>
      <div class="kpi">
        <div class="kpi-val">${summary.max_admissions_ward} <small>(${summary.max_admissions_val}/day)</small></div>
        <div class="kpi-lbl">Highest Impact Ward</div>
      </div>
      <div class="kpi">
        <div class="kpi-val">${summary.avg_wbgt_max} <small>°C</small></div>
        <div class="kpi-lbl">Avg Peak WBGT</div>
      </div>
      <div class="kpi">
        <div class="kpi-val">2-Stage <small>DLNM+XGB</small></div>
        <div class="kpi-lbl">Model Confidence (R²=0.57)</div>
      </div>
    `;
  }
}

function updateTopList(){
  const titleEl = document.getElementById('top-list-title');

  if(currentMode === 'thermal'){
    titleEl.textContent = 'Highest Thermal Stress — This Hour';
    const list = [];
    Object.entries(DATA.wards).forEach(([wn, w]) => {
      const r = getHourlyRisk(w, currentIdx);
      if(r) list.push({ wn, score: r.score, val: r.wbgt.toFixed(1) + '° WBGT', tier: r.tier });
    });
    list.sort((a,b) => (b.score||0) - (a.score||0));
    renderTopRows(list.slice(0, 5));
  } else {
    titleEl.textContent = `Highest Predicted Admissions — ${DATA.dates[selectedDayIdx]}`;
    const list = [];
    Object.entries(DATA.wards).forEach(([wn, w]) => {
      const imp = getDailyImpact(w, selectedDayIdx);
      if(imp) list.push({
        wn, score: imp.predicted_admissions,
        val: imp.predicted_admissions + ' admissions/day', tier: imp.ImpactTier
      });
    });
    list.sort((a,b) => (b.score||0) - (a.score||0));
    renderTopRows(list.slice(0, 5));
  }
}

function renderTopRows(items){
  const el = document.getElementById('top-list-rows');
  el.innerHTML = items.map(item => `
    <div class="top-list-item" onclick="selectWard('${item.wn}')">
      <span class="ward-label">
        <span class="ward-chip" style="background:${TIER_COLORS[item.tier]}"></span>
        ${item.wn}
      </span>
      <span class="ward-val">${item.val}</span>
    </div>
  `).join('');
}

function updateLegend(){
  const counts = { Green:0, Yellow:0, Orange:0, Red:0, Unknown:0 };
  Object.values(DATA.wards).forEach(w => {
    if(currentMode === 'thermal'){
      const r = getHourlyRisk(w, currentIdx);
      const tier = r ? r.tier : 'Unknown';
      counts[tier] = (counts[tier] || 0) + 1;
    } else {
      const imp = getDailyImpact(w, selectedDayIdx);
      const tier = imp ? imp.ImpactTier : 'Unknown';
      counts[tier] = (counts[tier] || 0) + 1;
    }
  });

  const order = ['Red', 'Orange', 'Yellow', 'Green'];
  const total = Object.values(counts).reduce((a,b)=>a+b, 0) || 1;

  document.getElementById('dist-bar-track').innerHTML = order.map(tier => {
    const pct = (counts[tier]/total * 100).toFixed(1);
    return `<div style="width:${pct}%;background:${TIER_COLORS[tier]}"></div>`;
  }).join('');

  document.getElementById('tier-legend').innerHTML = order.map(tier => `
    <div class="legend-row">
      <div class="legend-dot" style="background:${TIER_COLORS[tier]}"></div>
      <span>${tier} ${currentMode === 'impact' ? 'Surge' : 'Risk'}</span>
      <span class="count">${counts[tier]} wards</span>
    </div>
  `).join('');
}

function updateClock(idx){
  const ts = DATA.timestamps[idx];
  const { day, time } = fmtTime(ts);
  document.getElementById('clock-day').textContent = day;
  document.getElementById('clock-time').textContent = time + ' IST';

  const startDate = new Date(DATA.timestamps[0]);
  const curDate = new Date(ts);
  const hoursFromStart = Math.round((curDate - startDate) / 36e5);
  const dayNum = Math.floor(hoursFromStart / 24);
  const relLabel = dayNum === 0 ? 'TODAY' : `+${dayNum}D FORECAST`;

  document.getElementById('timeline-label').innerHTML = `${day}, ${time} <span class="rel">${relLabel}</span>`;
}

function setIndex(idx){
  currentIdx = idx;
  document.getElementById('time-slider').value = idx;
  updateClock(idx);
  if(currentMode === 'thermal'){
    updateMapColors();
    updateKPICards();
    updateTopList();
    updateLegend();
    if(selectedWard) selectWard(selectedWard);
  }
}

function setDayIndex(dIdx){
  selectedDayIdx = dIdx;
  document.querySelectorAll('.day-sel-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === dIdx);
  });

  const curDate = DATA.dates[dIdx];
  const summary = DATA.city_impact_summary[curDate];
  if(summary){
    document.getElementById('selected-day-impact-stat').textContent =
      `City Total: ${summary.total_admissions} admissions/day | Peak: ${summary.max_admissions_ward} (${summary.max_admissions_val})`;
  }

  updateMapColors();
  updateKPICards();
  updateTopList();
  updateLegend();
  if(selectedWard) selectWard(selectedWard);
}

function buildDayButtons(){
  const group = document.getElementById('day-btn-group');
  const todayObj = new Date();
  const todayStr = todayObj.getFullYear() + '-' + String(todayObj.getMonth() + 1).padStart(2, '0') + '-' + String(todayObj.getDate()).padStart(2, '0');

  group.innerHTML = DATA.dates.map((dStr, i) => {
    const dt = new Date(dStr + 'T12:00:00');
    const isToday = (dStr === todayStr) || (i === 0 && dStr >= todayStr);
    const dayLabel = isToday ? 'TODAY' : dt.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit' });
    const summary = DATA.city_impact_summary[dStr];
    const total = summary ? summary.total_admissions : 0;
    return `
      <div class="day-sel-btn ${i === selectedDayIdx ? 'active' : ''}" onclick="setDayIndex(${i})">
        <b>${dayLabel}</b>
        <span class="subtext">${total} admissions</span>
      </div>
    `;
  }).join('');

  setDayIndex(0);
}


function buildDayTicks(){
  const el = document.getElementById('day-ticks');
  const ticks = [];
  for(let i=0; i<DATA.timestamps.length; i+=24){
    const { day } = fmtTime(DATA.timestamps[i]);
    ticks.push(day.split(',')[0]);
  }
  el.innerHTML = ticks.map(t => `<span>${t}</span>`).join('');
}

function togglePlay(){
  playing = !playing;
  document.getElementById('play-btn').textContent = playing ? '❚❚' : '▶';
  if(playing){
    playTimer = setInterval(() => {
      let next = currentIdx + 1;
      if(next > 119) next = 0;
      setIndex(next);
    }, 300);
  } else {
    clearInterval(playTimer);
  }
}

function openAlertModal(wardno){
  const w = DATA.wards[wardno];
  const imp = getDailyImpact(w, selectedDayIdx);
  const hr = getHourlyRisk(w, currentIdx);
  const curDate = DATA.dates[selectedDayIdx];

  const msg = `🚨 [BMC SENTINELX EMERGENCY ADVISORY]
Ward: ${wardno} (${w.zone})
Date: ${curDate}
Risk Tier: ${imp ? imp.ImpactTier : 'Yellow'}
Predicted Heat Admissions: ${imp ? imp.predicted_admissions : '1.5'} / day
Peak WBGT: ${hr ? hr.wbgt.toFixed(1) : '28.5'}°C

ACTION REQUIRED:
1. Ensure PHC oral rehydration salts & cooling stations are activated.
2. Direct all outdoor labor teams to halt between 11 AM - 4 PM.
3. Corporator Contact: ${w.corporator} (${w.corporator_phone})
Dispatched via Bhubaneswar Heat Resilience Command.`;

  document.getElementById('sms-preview-text').textContent = msg;
  document.getElementById('alert-modal').classList.add('show');
}

function closeModal(){
  document.getElementById('alert-modal').classList.remove('show');
}

function confirmDispatch(){
  alert('Advisory dispatched successfully to BMC Field Units & Corporator SMS gateway.');
  closeModal();
}

function init(){
  // Initialize Leaflet Map
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false,
    preferCanvas: true
  }).setView([20.296, 85.824], 12);

  // Define 100% Free Zero-API-Key Base Map Providers
  baseLayers = {
    'osm': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'], maxZoom: 19, attribution: '© OpenStreetMap'
    }),
    'esri-street': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Tiles © Esri'
    }),
    'sat': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, attribution: 'Tiles © Esri'
    }),
    'dark': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16, attribution: 'Tiles © Esri'
    })
  };

  // Add default Free OpenStreetMap Streets Layer
  baseLayers['osm'].addTo(map);

  // Build GeoJSON features
  const gj = {
    type: 'FeatureCollection',
    features: Object.entries(DATA.wards).map(([wardno, w]) => ({
      type: 'Feature',
      properties: { wardno },
      geometry: w.geometry
    }))
  };

  // Render Ward Polygons with glowing borders and high visibility fills
  geoLayer = L.geoJSON(gj, {
    style: (f) => getStyleForFeature(f.properties.wardno),
    onEachFeature: (feature, layer) => {
      const wn = feature.properties.wardno;
      layer.on('mouseover', () => {
        if(wn !== selectedWard) layer.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.95 });
      });
      layer.on('mouseout', () => layer.setStyle(getStyleForFeature(wn)));
      layer.on('click', () => selectWard(wn));
      layer.bindTooltip(`<b>${wn}</b>`, {
        sticky: true, direction: 'top', className: 'ward-tooltip', offset: [0, -6]
      });
    }
  }).addTo(map);

  // Auto-fit map to exact bounds of Bhubaneswar 67 wards
  if(geoLayer.getBounds().isValid()){
    map.fitBounds(geoLayer.getBounds(), { padding: [30, 30] });
  }

  // Force Leaflet container recalculation
  setTimeout(() => {
    map.invalidateSize();
    if(geoLayer.getBounds().isValid()){
      map.fitBounds(geoLayer.getBounds(), { padding: [30, 30] });
    }
  }, 150);

  window.addEventListener('resize', () => {
    map.invalidateSize();
  });

  buildDayTicks();
  buildDayButtons();
  setIndex(currentIdx);
  selectWard(selectedWard);

  document.getElementById('time-slider').addEventListener('input', (e) => {
    if(playing) togglePlay();
    setIndex(parseInt(e.target.value));
  });
  document.getElementById('play-btn').addEventListener('click', togglePlay);

  // Live Auto-Polling Engine
  const syncBtn = document.getElementById('btn-sync-now');
  if(syncBtn) {
    syncBtn.addEventListener('click', () => pollLiveData(true));
  }
  pollLiveData();
  setInterval(() => pollLiveData(false), 15000);
}

const API_BASE = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';

async function pollLiveData(manual = false){
  const syncBtn = document.getElementById('btn-sync-now');
  const syncBox = document.getElementById('api-sync-box');
  const syncText = document.getElementById('api-sync-text');

  if(syncBtn) syncBtn.classList.add('spinning');

  try {
    const res = await fetch(`${API_BASE}/api/v1/live-feed`, { cache: 'no-cache' });
    if (!res.ok) throw new Error('API offline');
    const feed = await res.json();
    
    if(syncBox) syncBox.classList.remove('offline');
    if(syncText) syncText.textContent = `LIVE · ${feed.sync_time_display.split(' ')[0]}`;
    
    // Fetch summary for dynamic stats
    const sumRes = await fetch(`${API_BASE}/api/v1/summary`, { cache: 'no-cache' });
    if (sumRes.ok) {
      const summary = await sumRes.json();
      if(summary.bhubaneswar_urban_core && summary.bhubaneswar_urban_core.peak_ward_expected_admissions) {
        updateLegend(currentIdx);
      }
    }
  } catch (err) {
    if(syncBox) syncBox.classList.add('offline');
    if(syncText) syncText.textContent = 'CACHE (Offline)';
  } finally {
    if(syncBtn) {
      setTimeout(() => syncBtn.classList.remove('spinning'), 400);
    }
  }
}

window.addEventListener('DOMContentLoaded', init);
</script>
</body>
</html>"""

def generate_html(payload):
    json_data = json.dumps(payload, separators=(',', ':'))
    content = HTML_TEMPLATE.replace("__JSON_DATA__", json_data)

    print(f"Writing {OUTPUT_HTML}...")
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done generating dashboard!")

if __name__ == "__main__":
    payload = build_data()
    generate_html(payload)
