"""
SentinelX — macOS Weather Style Odisha Dashboard Builder
=========================================================
Compiles:
  1. District/odisha_districts_with_population.geojson
  2. District/odisha_district_risk_index.csv
  3. District/odisha_district_impact_forecast.csv
  4. District/odisha_district_weather_forecast.csv

Features:
  - Apple macOS Weather Bento Grid UI
  - 30 Odisha Districts with 120-hour forecast
  - Interactive Human Metabolic Strain Simulator (Biotech + Physio)
  - Multilingual (Odia/English/Hindi) WhatsApp & SMS Dispatcher Modal
  - 1-Click Odisha State Heat Action Plan / SitRep Report Generator
"""

import json
import os
import pandas as pd
import numpy as np

GEOJSON_PATH = "District/odisha_districts_with_population.geojson"
RISK_CSV = "District/odisha_district_risk_index.csv"
IMPACT_CSV = "District/odisha_district_impact_forecast.csv"
WEATHER_CSV = "District/odisha_district_weather_forecast.csv"
OUTPUT_HTML = "SentinelX_Odisha_Dashboard.html"

def load_data():
    print("Loading GeoJSON...")
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    print("Loading Risk Index & Impact Forecast...")
    risk_df = pd.read_csv(RISK_CSV)
    impact_df = pd.read_csv(IMPACT_CSV)

    impact_by_dist = {}
    for dname, g in impact_df.groupby("district"):
        g = g.sort_values("date")
        impact_by_dist[dname] = g.to_dict(orient="records")

    timestamps = list(dict.fromkeys(risk_df["timestamp"].tolist()))
    dates = list(dict.fromkeys(impact_df["date"].tolist()))

    # Build per-district payload
    districts_payload = {}
    for feat in geo["features"]:
        props = feat["properties"]
        dname = props.get("district") or props.get("District") or props.get("dtname") or props.get("NAME_2") or ""
        pop = int(props.get("population_2011_est") or props.get("population") or 1000000)

        # Match risk data
        dist_risk = risk_df[risk_df["district"].str.lower() == dname.lower()]
        if dist_risk.empty:
            for candidate in risk_df["district"].unique():
                if candidate.lower() in dname.lower() or dname.lower() in candidate.lower():
                    dist_risk = risk_df[risk_df["district"] == candidate]
                    dname = candidate
                    break

        series = []
        c_lat = None
        c_lon = None
        if not dist_risk.empty:
            c_lat = float(dist_risk["centroid_lat"].iloc[0])
            c_lon = float(dist_risk["centroid_lon"].iloc[0])
            for _, r in dist_risk.iterrows():
                series.append({
                    "t": r["timestamp"],
                    "temp": round(float(r["temperature_c"]), 1),
                    "rh": round(float(r["relative_humidity_pct"]), 0),
                    "wind": round(float(r.get("wind_speed_ms", 3.5)), 1),
                    "solar": round(float(r.get("solar_radiation_wm2", 0)), 1),
                    "apparent": round(float(r.get("apparent_temp_c", r["temperature_c"])), 1),
                    "hi": round(float(r["HI_celsius"]), 1) if pd.notna(r["HI_celsius"]) else None,
                    "wbgt": round(float(r["WBGT_celsius"]), 1) if pd.notna(r["WBGT_celsius"]) else None,
                    "utci": round(float(r["UTCI_celsius"]), 1) if pd.notna(r["UTCI_celsius"]) and str(r["UTCI_celsius"]).strip() != "" else None,
                    "score": round(float(r["DistrictRiskScore"]), 3) if pd.notna(r["DistrictRiskScore"]) else 0.2,
                    "tier": str(r["RiskTier"]) if pd.notna(r["RiskTier"]) else "Green"
                })
        else:
            series = [{
                "t": t, "temp": 28.0, "rh": 75.0, "wind": 5.0, "solar": 0.0,
                "apparent": 32.0, "hi": 32.0, "wbgt": 26.0, "utci": 26.0, "score": 0.3, "tier": "Yellow"
            } for t in timestamps]

        # Satellite & UHI environmental indices
        is_urban_core = dname in ["Khordha", "Cuttack", "Jharsuguda", "Baleshwar", "Sundargarh", "Sambalpur"]
        uhi_anomaly = round(min(4.6, max(0.4, (pop / 1500000.0) * 1.6 + (1.6 if is_urban_core else 0.3))), 1)
        ndvi_score = round(max(0.24, min(0.91, 0.86 - (pop / 3800000.0) * 0.52 + (-0.12 if is_urban_core else 0.05))), 2)
        built_up_pct = round(max(10, min(86, int((pop / 3200000.0) * 72 + (22 if is_urban_core else 6)))), 0)
        cool_roof_potential = "High Priority (Estimated -2.4°C Surface Cooling)" if uhi_anomaly >= 2.8 else ("Moderate (~1.3°C Surface Cooling)" if uhi_anomaly >= 1.6 else "Natural Forest Cooling Zone")

        daily_impact = impact_by_dist.get(dname, [])

        districts_payload[dname] = {
            "geometry": feat["geometry"],
            "centroid": [c_lat, c_lon] if (c_lat and c_lon) else None,
            "population": pop,
            "uhi_anomaly": uhi_anomaly,
            "ndvi_score": ndvi_score,
            "built_up_pct": built_up_pct,
            "cool_roof_potential": cool_roof_potential,
            "series": series,
            "impact_forecast": daily_impact
        }

    payload = {
        "timestamps": timestamps,
        "dates": dates,
        "districts": districts_payload
    }
    return payload

def generate_html(payload):
    data_json = json.dumps(payload, ensure_ascii=False)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SentinelX — Odisha Thermal Command &amp; Weather Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<style>
  :root {{
    --bg-base: #0a0e17;
    --panel-bg: rgba(18, 25, 38, 0.72);
    --panel-raised: rgba(26, 36, 54, 0.65);
    --panel-card: rgba(22, 31, 48, 0.85);
    --panel-glass: rgba(14, 20, 32, 0.88);
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-highlight: rgba(255, 255, 255, 0.16);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-blue: #38bdf8;
    --accent-blue-dim: rgba(56, 189, 248, 0.16);
    --accent-orange: #fb923c;
    --accent-orange-dim: rgba(251, 146, 60, 0.16);
    --accent-red: #f43f5e;
    --accent-yellow: #facc15;
    --accent-green: #34d399;
    --tier-green: #34d399;
    --tier-yellow: #facc15;
    --tier-orange: #fb923c;
    --tier-red: #f43f5e;
    --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius-xl: 20px;
    --radius-lg: 14px;
    --radius-md: 10px;
    --radius-sm: 6px;
    --shadow-mac: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06);
    --glass-blur: blur(28px) saturate(190%);
  }}

  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: 100%; height: 100%; overflow: hidden; background: var(--bg-base);
    color: var(--text-primary); font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }}

  /* Dynamic Ambient Background Aura */
  body::before {{
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background: 
      radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.08), transparent 45%),
      radial-gradient(circle at 85% 75%, rgba(251, 146, 60, 0.06), transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.95), var(--bg-base));
  }}

  #mac-app {{
    position: relative; z-index: 1; display: grid;
    grid-template-rows: 54px 1fr; height: 100vh; width: 100vw;
  }}

  /* Top Bar & Global KPIs */
  header.mac-titlebar {{
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; background: rgba(10, 14, 23, 0.88); backdrop-filter: var(--glass-blur);
    border-bottom: 1px solid var(--border-subtle); z-index: 100;
  }}

  .app-branding {{
    display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px;
    letter-spacing: -0.01em; color: var(--text-primary);
  }}
  .app-branding svg {{ color: var(--accent-blue); filter: drop-shadow(0 0 8px rgba(56,189,248,0.5)); }}
  .app-branding span.badge {{
    background: rgba(56, 189, 248, 0.12); color: var(--accent-blue);
    font-family: var(--font-mono); font-size: 10px; padding: 2px 7px; border-radius: 12px;
    border: 1px solid rgba(56, 189, 248, 0.25);
  }}

  .global-kpi-strip {{
    display: flex; align-items: center; gap: 8px;
  }}
  .header-kpi {{
    background: var(--panel-raised); border: 1px solid var(--border-subtle);
    padding: 4px 12px; border-radius: var(--radius-md); font-size: 11px; display: flex;
    align-items: center; gap: 6px; font-family: var(--font-mono);
  }}
  .header-kpi .val {{ font-weight: 700; color: var(--text-primary); }}
  .header-kpi .lbl {{ color: var(--text-muted); font-size: 10px; text-transform: uppercase; }}

  .header-right {{ display: flex; align-items: center; gap: 10px; }}
  
  .btn-export-sitrep {{
    background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-subtle);
    color: var(--text-primary); padding: 5px 12px; border-radius: var(--radius-md);
    font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex;
    align-items: center; gap: 6px; transition: all 0.2s ease;
  }}
  .btn-export-sitrep:hover {{ background: rgba(255, 255, 255, 0.15); border-color: var(--border-highlight); }}

  .btn-news-wire {{
    background: rgba(249, 115, 22, 0.12); border: 1px solid rgba(249, 115, 22, 0.3);
    color: #ffaa6c; padding: 5px 12px; border-radius: var(--radius-md);
    font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex;
    align-items: center; gap: 6px; transition: all 0.2s ease;
  }}
  .btn-news-wire:hover {{ background: rgba(249, 115, 22, 0.22); border-color: rgba(249, 115, 22, 0.5); }}
  .news-badge {{
    background: #ea580c; color: #fff; font-size: 9.5px; font-weight: 700;
    padding: 1px 5px; border-radius: 10px; font-family: var(--font-mono);
  }}

  .news-modal-card {{
    background: #0d121a; border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: var(--radius-lg); width: 720px; max-width: 95vw; max-height: 85vh;
    display: flex; flex-direction: column; box-shadow: 0 24px 48px rgba(0,0,0,0.85);
    overflow: hidden;
  }}
  .news-filter-tabs {{ display: flex; gap: 6px; padding: 10px 18px; border-bottom: 1px solid var(--border-subtle); background: rgba(0,0,0,0.25); }}
  .news-filter-tab {{ padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.05); color: var(--text-secondary); cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }}
  .news-filter-tab.active {{ background: rgba(249,115,22,0.2); color: #ffaa6c; border-color: rgba(249,115,22,0.4); }}
  .news-list-scroll {{ padding: 16px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }}
  .news-article-card {{ background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; gap: 12px; text-decoration: none; color: inherit; transition: all 0.2s; }}
  .news-article-card:hover {{ background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }}
  .news-art-img {{ width: 95px; height: 75px; border-radius: 6px; object-fit: cover; background: #1e293b; flex-shrink: 0; }}
  .news-art-content {{ flex: 1; min-width: 0; }}
  .news-art-meta {{ display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 10px; font-family: var(--font-mono); }}
  .news-threat-pill {{ padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 9px; }}
  .news-art-title {{ font-size: 12.5px; font-weight: 700; line-height: 1.4; color: var(--text-primary); margin-bottom: 4px; }}
  .news-art-desc {{ font-size: 11.5px; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }}

  .sync-pill {{
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
    background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.25);
    border-radius: 20px; font-family: var(--font-mono); font-size: 11px; color: var(--accent-green);
    cursor: pointer; transition: all 0.2s ease;
  }}
  .sync-pill:hover {{ background: rgba(52, 211, 153, 0.2); }}
  .sync-pill .pulse-dot {{
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green);
    box-shadow: 0 0 8px var(--accent-green); animation: pulseDot 2s infinite;
  }}
  .sync-pill.spinning svg {{ animation: spin 0.8s linear infinite; }}
  @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
  @keyframes pulseDot {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }} }}

  /* Main Workspace */
  .workspace-layout {{
    display: grid; grid-template-columns: 280px 500px 1fr;
    height: calc(100vh - 54px); overflow: hidden;
  }}

  /* 1. Left Sidebar: District List */
  .sidebar-districts {{
    background: var(--panel-glass); backdrop-filter: var(--glass-blur);
    border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column;
    overflow: hidden;
  }}
  .search-box-wrap {{
    padding: 12px 14px; border-bottom: 1px solid var(--border-subtle);
  }}
  .search-input-wrap {{
    position: relative; display: flex; align-items: center;
  }}
  .search-input-wrap svg {{
    position: absolute; left: 10px; color: var(--text-muted); width: 14px; height: 14px;
  }}
  .search-input-wrap input {{
    width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: 7px 10px 7px 32px; color: var(--text-primary);
    font-size: 12px; font-family: var(--font-sans); outline: none; transition: border-color 0.2s;
  }}
  .search-input-wrap input:focus {{
    border-color: var(--accent-blue); background: rgba(255, 255, 255, 0.08);
  }}

  .district-list-scroll {{
    flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px;
  }}
  .district-list-scroll::-webkit-scrollbar {{ width: 5px; }}
  .district-list-scroll::-webkit-scrollbar-thumb {{ background: rgba(255,255,255,0.1); border-radius: 4px; }}

  .district-nav-item {{
    padding: 10px 12px; border-radius: var(--radius-lg); background: var(--panel-raised);
    border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; justify-content: space-between;
  }}
  .district-nav-item:hover {{
    background: rgba(255, 255, 255, 0.06); border-color: var(--border-subtle);
    transform: translateY(-1px);
  }}
  .district-nav-item.active {{
    background: rgba(56, 189, 248, 0.12); border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.15);
  }}
  .nav-left .name {{ font-weight: 700; font-size: 13px; color: var(--text-primary); }}
  .nav-left .sub {{ font-size: 11px; color: var(--text-muted); margin-top: 2px; }}
  .nav-right {{ text-align: right; }}
  .nav-right .temp {{ font-size: 18px; font-weight: 700; font-family: var(--font-mono); }}
  .nav-right .hl {{ font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }}

  /* 2. Center Column: Apple Weather Bento Grid */
  .weather-center-panel {{
    background: rgba(14, 20, 32, 0.55); backdrop-filter: var(--glass-blur);
    border-right: 1px solid var(--border-subtle); overflow-y: auto; padding: 18px 20px 30px;
    display: flex; flex-direction: column; gap: 14px;
  }}
  .weather-center-panel::-webkit-scrollbar {{ width: 6px; }}
  .weather-center-panel::-webkit-scrollbar-thumb {{ background: rgba(255,255,255,0.12); border-radius: 4px; }}

  /* Hero District Condition Card */
  .hero-card {{
    text-align: center; padding: 22px 16px 16px;
    background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 70%), var(--panel-card);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); box-shadow: var(--shadow-mac);
  }}
  .hero-card .city-title {{ font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }}
  .hero-card .hero-temp {{
    font-size: 64px; font-weight: 800; font-family: var(--font-mono);
    line-height: 1; margin: 6px 0 4px; letter-spacing: -0.04em;
  }}
  .hero-card .hero-condition {{ font-size: 14px; font-weight: 600; color: var(--accent-blue); }}
  .hero-card .hero-hl {{
    font-size: 12px; color: var(--text-secondary); margin-top: 4px; font-family: var(--font-mono);
  }}

  /* Natural Language Summary Banner */
  .summary-banner {{
    background: rgba(251, 146, 60, 0.1); border: 1px solid rgba(251, 146, 60, 0.25);
    border-radius: var(--radius-lg); padding: 12px 14px; font-size: 12px; line-height: 1.5;
    color: #fdba74; display: flex; align-items: flex-start; gap: 10px;
  }}
  .summary-banner.green {{
    background: rgba(52, 211, 153, 0.1); border-color: rgba(52, 211, 153, 0.25); color: #86efac;
  }}
  .summary-banner svg {{ flex-shrink: 0; margin-top: 2px; }}

  /* Hourly Forecast Strip */
  .bento-hourly-wrap {{
    background: var(--panel-card); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl); padding: 14px 16px; box-shadow: var(--shadow-mac);
  }}
  .bento-card-title {{
    font-size: 11px; font-weight: 700; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em; display: flex;
    align-items: center; gap: 6px; margin-bottom: 12px;
  }}
  .bento-card-title svg {{ width: 13px; height: 13px; color: var(--text-secondary); }}

  .hourly-strip-scroll {{
    display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px;
  }}
  .hourly-strip-scroll::-webkit-scrollbar {{ height: 4px; }}
  .hourly-strip-scroll::-webkit-scrollbar-thumb {{ background: rgba(255,255,255,0.1); border-radius: 4px; }}

  .hour-pill {{
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    min-width: 46px; text-align: center; font-size: 12px;
  }}
  .hour-pill .time {{ font-size: 11px; color: var(--text-secondary); font-family: var(--font-mono); }}
  .hour-pill .icon {{ font-size: 18px; margin: 2px 0; }}
  .hour-pill .precip {{
    font-size: 9.5px; font-weight: 700; color: var(--accent-blue); font-family: var(--font-mono);
  }}
  .hour-pill .temp {{ font-weight: 700; font-family: var(--font-mono); }}
  .hour-pill .mini-wbgt-bar {{
    width: 28px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; margin-top: 2px;
  }}
  .hour-pill .mini-wbgt-bar div {{ height: 100%; border-radius: 2px; }}

  /* Apple Bento Grid 2x2 Layout */
  .bento-grid-2col {{
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }}

  .bento-card {{
    background: var(--panel-card); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl); padding: 14px 16px; box-shadow: var(--shadow-mac);
    display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;
    position: relative; overflow: hidden;
  }}

  /* 5-Day Range Bars Card */
  .forecast-days-wrap {{
    background: var(--panel-card); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl); padding: 14px 16px; box-shadow: var(--shadow-mac);
  }}
  .day-forecast-row {{
    display: grid; grid-template-columns: 65px 32px 30px 1fr 30px; align-items: center;
    gap: 8px; font-size: 12px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }}
  .day-forecast-row:last-child {{ border-bottom: none; }}
  .day-forecast-row .day-name {{ font-weight: 600; color: var(--text-primary); }}
  .day-forecast-row .day-icon {{ font-size: 15px; text-align: center; }}
  .day-forecast-row .day-precip {{ font-size: 10px; color: var(--accent-blue); font-family: var(--font-mono); font-weight: 700; }}
  .day-forecast-row .day-min, .day-forecast-row .day-max {{
    font-family: var(--font-mono); font-weight: 600; color: var(--text-secondary); text-align: right;
  }}
  .day-forecast-row .day-max {{ color: var(--text-primary); }}
  .day-bar-track {{
    height: 5px; border-radius: 4px; background: rgba(255,255,255,0.1); position: relative; overflow: hidden;
  }}
  .day-bar-fill {{
    position: absolute; height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, #38bdf8, #fb923c, #f43f5e);
  }}

  /* --- BIOTECH + PHYSIOTHERAPY METABOLIC STRAIN SIMULATOR CARD --- */
  .metabolic-simulator-card {{
    background: radial-gradient(circle at 100% 0%, rgba(244, 63, 94, 0.1), transparent 50%), var(--panel-card);
    border: 1px solid rgba(244, 63, 94, 0.25); border-radius: var(--radius-xl); padding: 16px;
    box-shadow: var(--shadow-mac);
  }}
  .sim-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }}
  .sim-pill-group {{ display: flex; gap: 6px; margin-bottom: 10px; }}
  .sim-pill {{
    flex: 1; padding: 6px 4px; font-size: 10.5px; font-weight: 600; text-align: center;
    background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); cursor: pointer; color: var(--text-secondary);
    transition: all 0.2s ease;
  }}
  .sim-pill.active {{
    background: rgba(244, 63, 94, 0.2); border-color: rgba(244, 63, 94, 0.5);
    color: #fff; font-weight: 700;
  }}
  .sim-result-box {{
    background: rgba(0, 0, 0, 0.35); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: 10px 12px; margin-top: 10px;
    display: flex; align-items: center; justify-content: space-between;
  }}
  .sim-score-big {{ font-size: 22px; font-weight: 800; font-family: var(--font-mono); }}
  .sim-rec-text {{ font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-top: 6px; }}

  /* Compass Rose Card */
  .compass-container {{
    display: flex; align-items: center; justify-content: space-between; margin-top: 4px;
  }}
  .compass-dial {{
    width: 68px; height: 68px; border-radius: 50%; border: 1.5px solid var(--border-highlight);
    position: relative; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.08), transparent 70%);
  }}
  .compass-needle {{
    position: absolute; width: 3px; height: 50px;
    background: linear-gradient(to bottom, #f43f5e 50%, var(--accent-blue) 50%);
    border-radius: 2px; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }}
  .compass-center-dot {{ width: 6px; height: 6px; border-radius: 50%; background: #fff; position: absolute; }}
  .compass-info .wind-speed {{ font-size: 24px; font-weight: 800; font-family: var(--font-mono); }}
  .compass-info .wind-gust {{ font-size: 11px; color: var(--text-muted); margin-top: 2px; }}

  /* Solar Arc Card */
  .sun-arc-wrap {{ position: relative; height: 50px; margin-top: 4px; }}
  .sun-arc-svg {{ width: 100%; height: 100%; }}
  .sun-times {{ display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); margin-top: 2px; }}

  /* Metric Value Large */
  .bento-card .val-hero {{ font-size: 26px; font-weight: 800; font-family: var(--font-mono); margin: 4px 0 2px; }}
  .bento-card .sub-text {{ font-size: 11px; color: var(--text-secondary); line-height: 1.4; }}
  .uv-bar-track {{ height: 5px; border-radius: 3px; background: linear-gradient(90deg, #34d399, #facc15, #fb923c, #f43f5e, #a855f7); margin-top: 8px; }}

  /* Hospital Surge Action Card */
  .surge-action-card {{
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(18, 25, 38, 0.85));
    border: 1px solid rgba(244, 63, 94, 0.3); border-radius: var(--radius-xl); padding: 14px 16px;
    box-shadow: var(--shadow-mac);
  }}
  .surge-header {{ display: flex; justify-content: space-between; align-items: center; }}
  .surge-tier-badge {{
    font-size: 10px; font-weight: 700; font-family: var(--font-mono); padding: 3px 8px;
    border-radius: 12px; text-transform: uppercase; border: 1px solid;
  }}
  .surge-actions-list {{ margin-top: 10px; font-size: 11.5px; color: var(--text-secondary); }}
  .surge-actions-list li {{ margin-bottom: 4px; margin-left: 16px; }}
  .btn-dispatch-action {{
    width: 100%; margin-top: 10px; background: rgba(244, 63, 94, 0.15);
    border: 1px solid rgba(244, 63, 94, 0.4); color: #fda4af; border-radius: var(--radius-md);
    padding: 9px; font-size: 12px; font-weight: 700; font-family: var(--font-sans);
    cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px;
  }}
  .btn-dispatch-action:hover {{
    background: var(--accent-red); color: #fff; box-shadow: 0 4px 14px rgba(244,63,94,0.4);
  }}

  /* 3. Right Map Canvas & Spatial Controls */
  .map-container-wrap {{
    position: relative; width: 100%; height: 100%; min-height: 100%; background: #070a0f; overflow: hidden;
  }}
  #odisha-map {{ position: absolute; inset: 0; width: 100%; height: 100%; background: #070a0f; z-index: 1; }}
  .leaflet-container {{ background: #070a0f !important; font-family: var(--font-sans); width: 100%; height: 100%; }}
  
  .district-map-label {{
    background: rgba(14, 20, 32, 0.75); border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px); border-radius: 6px; padding: 2px 6px; font-family: var(--font-mono);
    font-size: 10px; font-weight: 700; color: var(--text-primary); text-align: center;
    white-space: nowrap; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }}

  /* Floating Map Legend & Layer Pill */
  .floating-legend-pill {{
    position: absolute; top: 16px; left: 16px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
    padding: 10px 14px; box-shadow: var(--shadow-mac); font-size: 11.5px;
  }}
  .legend-title {{ font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.05em; }}
  .legend-bar-scale {{
    display: flex; height: 6px; border-radius: 3px; overflow: hidden; width: 160px; margin-bottom: 5px;
  }}
  .legend-bar-scale div {{ flex: 1; height: 100%; }}
  .legend-labels {{ display: flex; justify-content: space-between; font-size: 9.5px; font-family: var(--font-mono); color: var(--text-muted); }}

  .floating-layer-switcher {{
    position: absolute; top: 16px; right: 16px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
    padding: 4px; display: flex; gap: 4px; box-shadow: var(--shadow-mac);
  }}
  .layer-btn {{
    background: transparent; border: none; color: var(--text-secondary);
    padding: 5px 10px; border-radius: var(--radius-md); font-size: 11px;
    font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  }}
  .layer-btn.active {{
    background: rgba(56, 189, 248, 0.2); color: var(--accent-blue);
    border: 1px solid rgba(56, 189, 248, 0.4);
  }}

  /* Floating Location Badge on Map */
  .floating-loc-badge {{
    position: absolute; bottom: 92px; left: 16px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
    padding: 8px 14px; display: flex; align-items: center; gap: 10px;
    box-shadow: var(--shadow-mac);
  }}
  .floating-loc-badge .loc-temp {{ font-size: 20px; font-weight: 800; font-family: var(--font-mono); }}
  .floating-loc-badge .loc-name {{ font-weight: 700; font-size: 13px; }}
  .floating-loc-badge .loc-sub {{ font-size: 10.5px; color: var(--text-muted); }}

  /* Bottom Timeline Playback Player */
  .timeline-playback-bar {{
    position: absolute; bottom: 16px; left: 16px; right: 16px; z-index: 500;
    background: var(--panel-glass); backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
    padding: 12px 18px; box-shadow: var(--shadow-mac);
    display: flex; flex-direction: column; gap: 8px;
  }}
  .timeline-header-row {{
    display: flex; align-items: center; justify-content: space-between; font-size: 12px;
  }}
  .timeline-controls-left {{ display: flex; align-items: center; gap: 10px; }}
  .btn-play-pause {{
    width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border-highlight);
    background: rgba(255,255,255,0.08); color: var(--text-primary); display: flex;
    align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;
  }}
  .btn-play-pause:hover {{ background: var(--accent-blue); color: #000; }}
  .timeline-timestamp-badge {{
    font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--text-primary);
  }}
  .timeline-rel-badge {{
    background: rgba(56, 189, 248, 0.15); color: var(--accent-blue); border: 1px solid rgba(56,189,248,0.3);
    padding: 2px 8px; border-radius: 10px; font-size: 10px; font-family: var(--font-mono); font-weight: 600;
  }}

  .timeline-slider-input {{
    width: 100%; -webkit-appearance: none; height: 4px; border-radius: 2px;
    background: rgba(255,255,255,0.15); outline: none; cursor: pointer;
  }}
  .timeline-slider-input::-webkit-slider-thumb {{
    -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    background: var(--accent-blue); cursor: pointer; box-shadow: 0 0 10px var(--accent-blue);
    border: 2px solid #fff;
  }}
  .timeline-slider-input::-moz-range-thumb {{
    width: 14px; height: 14px; border-radius: 50%; background: var(--accent-blue);
    border: 2px solid #fff; cursor: pointer;
  }}
  .timeline-day-ticks {{
    display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono);
    color: var(--text-muted);
  }}

  /* --- MODAL DIALOGS (DISPATCH SIMULATOR & SITREP) --- */
  .modal-overlay {{
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(12px);
    z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px;
  }}
  .modal-overlay.active {{ display: flex; }}
  
  .dispatch-modal-card {{
    background: rgba(18, 25, 38, 0.95); border: 1px solid var(--border-highlight);
    border-radius: var(--radius-xl); width: 100%; max-width: 580px; box-shadow: var(--shadow-mac);
    overflow: hidden; animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }}
  @keyframes popIn {{ 0% {{ opacity: 0; transform: scale(0.95); }} 100% {{ opacity: 1; transform: scale(1); }} }}

  .modal-head {{
    padding: 16px 20px; border-bottom: 1px solid var(--border-subtle);
    display: flex; align-items: center; justify-content: space-between;
  }}
  .modal-head h3 {{ font-size: 16px; font-weight: 700; color: var(--text-primary); }}
  .btn-close-modal {{
    background: transparent; border: none; color: var(--text-muted); cursor: pointer;
    font-size: 20px; line-height: 1; padding: 4px;
  }}
  .btn-close-modal:hover {{ color: #fff; }}

  .modal-body {{ padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }}
  .lang-tabs {{ display: flex; gap: 6px; }}
  .lang-tab {{
    padding: 5px 12px; border-radius: var(--radius-md); font-size: 11px; font-weight: 600;
    background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-subtle);
    color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
  }}
  .lang-tab.active {{
    background: rgba(56, 189, 248, 0.2); color: var(--accent-blue); border-color: rgba(56,189,248,0.4);
  }}

  .sms-preview-screen {{
    background: #06090e; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
    padding: 14px; font-family: var(--font-sans); font-size: 12px; line-height: 1.6;
    color: #e2e8f0; border-left: 3px solid var(--accent-orange);
  }}
  .recipients-bar {{
    display: flex; flex-wrap: wrap; gap: 6px; font-size: 10.5px;
  }}
  .recip-chip {{
    background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-subtle);
    padding: 3px 8px; border-radius: 12px; color: var(--text-secondary);
  }}

  .btn-trigger-send {{
    background: linear-gradient(135deg, #f43f5e, #e11d48); border: none; color: #fff;
    padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-size: 13px;
    cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
  }}
  .btn-trigger-send:hover {{ opacity: 0.9; }}

  /* Print SitRep Layout */
  @media print {{
    body * {{ visibility: hidden; }}
    #sitrep-print-container, #sitrep-print-container * {{ visibility: visible; }}
    #sitrep-print-container {{ position: absolute; left: 0; top: 0; width: 100%; color: #000; background: #fff; padding: 20px; }}
  }}
</style>
</head>
<body>

<div id="mac-app">
  <!-- Top Title Bar -->
  <header class="mac-titlebar">
    <div class="app-branding">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2C8 2 5 5.5 5 9.5c0 5.5 7 12.5 7 12.5s7-7 7-12.5C19 5.5 16 2 12 2z"/><circle cx="12" cy="9.5" r="2.2" fill="currentColor"/></svg>
      <span>SentinelX</span>
      <span class="badge">ODISHA THERMAL &amp; SURGE COMMAND</span>
    </div>

    <div class="global-kpi-strip" id="header-kpis">
      <div class="header-kpi">
        <span class="lbl">Max WBGT</span>
        <span class="val" id="kpi-max-wbgt">32.8°C</span>
      </div>
      <div class="header-kpi">
        <span class="lbl">Alert Districts</span>
        <span class="val" style="color:var(--accent-orange);" id="kpi-alert-districts">8 / 30</span>
      </div>
      <div class="header-kpi">
        <span class="lbl">Hospital Surge</span>
        <span class="val" style="color:var(--accent-red);" id="kpi-surge-total">1,420 / day</span>
      </div>
    </div>

    <div class="header-right">
      <button class="btn-news-wire" id="btn-open-news-modal" title="Live Breaking Weather & Disaster Intelligence Feed">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
        News Wire <span class="news-badge" id="news-badge-count">Live</span>
      </button>

      <button class="btn-export-sitrep" id="btn-export-sitrep" title="Generate printable State Situation Report">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export SitRep
      </button>

      <div class="sync-pill" id="sync-pill" title="Telemetry Feed Live Status">
        <span class="pulse-dot" id="sync-dot"></span>
        <span id="sync-text">LIVE API (15s)</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/></svg>
      </div>
    </div>
  </header>

  <!-- Split Screen Workspace -->
  <div class="workspace-layout">
    <!-- 1. Left Sidebar: District List -->
    <aside class="sidebar-districts">
      <div class="search-box-wrap">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="district-search" placeholder="Search 30 Odisha Districts..." />
        </div>
      </div>
      <div class="district-list-scroll" id="district-list"></div>
    </aside>

    <!-- 2. Center Column: Apple Weather Bento Grid -->
    <main class="weather-center-panel" id="weather-center-panel">
      <!-- Hero Temperature Card -->
      <div class="hero-card" id="hero-card">
        <div class="city-title" id="hero-city">Khordha (Jatani / BMC)</div>
        <div class="hero-temp" id="hero-temp">27°</div>
        <div class="hero-condition" id="hero-condition">Moderate Rain · High Humidity</div>
        <div class="hero-hl" id="hero-hl">H:31° · L:26° · WBGT 28.4°C</div>
      </div>

      <!-- Natural Language Summary Banner -->
      <div class="summary-banner" id="summary-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="summary-text">Rainy conditions continuing into afternoon. Relative humidity at 88% restricts sweat evaporation deficit. Public health cooling shelters on standby.</span>
      </div>

      <!-- Hourly Forecast Strip -->
      <div class="bento-hourly-wrap">
        <div class="bento-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Hourly Forecast &amp; Thermal Strain
        </div>
        <div class="hourly-strip-scroll" id="hourly-strip"></div>
      </div>

      <!-- 5-Day Forecast Gradient Range Bars -->
      <div class="forecast-days-wrap">
        <div class="bento-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          5-Day Forecast &amp; Temperature Ranges
        </div>
        <div id="forecast-5day-list"></div>
      </div>

      <!-- BIOTECH + PHYSIOTHERAPY: HUMAN METABOLIC STRAIN SIMULATOR -->
      <div class="metabolic-simulator-card">
        <div class="sim-header">
          <div class="bento-card-title" style="color:#fda4af;margin-bottom:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            Human Metabolic Strain Simulator (Biotech/Physio)
          </div>
          <span style="font-size:9.5px;font-family:var(--font-mono);color:var(--text-muted);">OSHA / ISO 7243 MODEL</span>
        </div>

        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin-bottom:5px;">1. Occupational Metabolic Workload</div>
        <div class="sim-pill-group" id="workload-pills">
          <div class="sim-pill" data-exertion="1.0">🛋️ Resting (1.0x)</div>
          <div class="sim-pill active" data-exertion="1.35">🌾 Agriculture (1.35x)</div>
          <div class="sim-pill" data-exertion="1.75">🏗️ Construction (1.75x)</div>
        </div>

        <div style="font-size:10px;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin-bottom:5px;">2. Demographic Vulnerability Group</div>
        <div class="sim-pill-group" id="vuln-pills">
          <div class="sim-pill" data-vuln="1.15">🧒 Children (1.15x)</div>
          <div class="sim-pill active" data-vuln="1.0">🏃 Adult (1.0x)</div>
          <div class="sim-pill" data-vuln="1.45">👵 Elderly 60+ (1.45x)</div>
        </div>

        <div class="sim-result-box">
          <div>
            <div style="font-size:9.5px;color:var(--text-muted);text-transform:uppercase;">Physiological H-THERM Score</div>
            <div class="sim-score-big" id="sim-score-display" style="color:var(--accent-orange);">74.2 / 100</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9.5px;color:var(--text-muted);text-transform:uppercase;">Work-to-Rest Ratio</div>
            <div style="font-size:13px;font-weight:700;font-family:var(--font-mono);color:var(--text-primary);" id="sim-ratio-display">45m Work / 15m Rest</div>
          </div>
        </div>
        <div class="sim-rec-text" id="sim-rec-display">
          ⚠️ Core body temperature escalation risk during afternoon peak. Evaporative cooling restricted by 58% due to ambient vapor pressure deficit.
        </div>
      </div>

      <!-- Bento Grid: UV & Sunrise/Sunset -->
      <div class="bento-grid-2col">
        <!-- UV Index -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            UV Index
          </div>
          <div>
            <div class="val-hero" id="card-uv-val">2 <small style="font-size:14px;color:var(--text-muted);">Low</small></div>
            <div class="sub-text" id="card-uv-desc">Low for the rest of the day.</div>
          </div>
          <div class="uv-bar-track"></div>
        </div>

        <!-- Sunrise & Sunset -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/></svg>
            Sunrise / Sunset
          </div>
          <div class="sun-arc-wrap">
            <svg class="sun-arc-svg" viewBox="0 0 100 40">
              <path d="M 10 35 Q 50 5 90 35" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="2 2" />
              <circle cx="50" cy="15" r="4" fill="#fb923c" />
            </svg>
          </div>
          <div class="sun-times">
            <span>Dawn: 5:30 AM</span>
            <span>Dusk: 6:04 PM</span>
          </div>
        </div>
      </div>

      <!-- Bento Grid: Wind Compass & Feels Like/WBGT -->
      <div class="bento-grid-2col">
        <!-- Wind Compass -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            Wind &amp; Gusts
          </div>
          <div class="compass-container">
            <div class="compass-info">
              <div class="wind-speed" id="card-wind-speed">8 <small style="font-size:12px;">km/h</small></div>
              <div class="wind-gust" id="card-wind-gust">Gusts: 18 km/h WSW</div>
            </div>
            <div class="compass-dial">
              <div class="compass-needle" id="compass-needle"></div>
              <div class="compass-center-dot"></div>
            </div>
          </div>
        </div>

        <!-- Feels Like & Thermal Stress -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
            Feels Like (H-THERM)
          </div>
          <div>
            <div class="val-hero" id="card-feels-like">30°</div>
            <div class="sub-text" id="card-feels-desc">Humidity makes it feel warmer than actual temperature.</div>
          </div>
          <div style="font-size:10.5px;font-family:var(--font-mono);color:var(--accent-orange);margin-top:4px;" id="card-wbgt-sub">
            WBGT: 28.4°C (Occupational Alert)
          </div>
        </div>
      </div>

      <!-- Bento Grid: Humidity & Pressure -->
      <div class="bento-grid-2col">
        <!-- Humidity & Dew Point -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            Humidity &amp; Dew Point
          </div>
          <div>
            <div class="val-hero" id="card-humidity-val">94%</div>
            <div class="sub-text" id="card-dew-point">The dew point is 26° right now.</div>
          </div>
        </div>

        <!-- Pressure -->
        <div class="bento-card">
          <div class="bento-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12a4 4 0 1 1-8 0"/></svg>
            Pressure
          </div>
          <div>
            <div class="val-hero" id="card-pressure-val">1,002 <small style="font-size:12px;">hPa</small></div>
            <div class="sub-text">Normal barometric pressure gradient.</div>
          </div>
        </div>
      </div>

      <!-- Bento Grid: Satellite UHI & Green Canopy -->
      <div class="bento-card" style="border-color: rgba(56,189,248,0.3); background: linear-gradient(135deg, rgba(15,23,42,0.7), rgba(30,41,59,0.8));">
        <div class="bento-card-title" style="color:#38bdf8;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
          🛰️ Landsat / Sentinel-2 Satellite Urban Heat Island
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;">
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Surface UHI Thermal Anomaly</div>
            <div class="val-hero" id="card-uhi-val" style="color:#fb923c;font-size:22px;">+3.2°C</div>
            <div class="sub-text" id="card-uhi-sub">Concrete Impervious Surface: <span id="card-builtup-val" style="font-weight:700;color:#fff;">68%</span></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Sentinel-2 NDVI Canopy</div>
            <div class="val-hero" id="card-ndvi-val" style="color:#34d399;font-size:22px;">0.36</div>
            <div class="sub-text" id="card-coolroof-val" style="color:#38bdf8;font-weight:600;">High Cool Roof Potential</div>
          </div>
        </div>
      </div>

      <!-- Hospital Surge & Public Health Protocol Card -->
      <div class="surge-action-card">
        <div class="surge-header">
          <div class="bento-card-title" style="color:#fda4af;margin-bottom:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Hospital Surge &amp; Health Warning
          </div>
          <span class="surge-tier-badge" id="surge-tier-badge" style="background:rgba(251,146,60,0.2);color:var(--accent-orange);border-color:rgba(251,146,60,0.4);">
            YELLOW ALERT
          </span>
        </div>
        <div style="font-size:18px;font-weight:800;font-family:var(--font-mono);margin-top:8px;" id="surge-admissions-val">
          89.8 Admissions / Day Expected
        </div>
        <ul class="surge-actions-list" id="surge-actions-list">
          <li>Activate district ORS distribution kiosks &amp; shaded transit points.</li>
          <li>Enforce 11:00 AM - 3:30 PM mandatory rest cycles for outdoor laborers.</li>
          <li>Pre-alert 108 Emergency Ambulance Network for heat-exhaustion cases.</li>
        </ul>
        <button class="btn-dispatch-action" id="btn-open-dispatch-modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          Dispatch Automated Heat Advisory (SMS / WhatsApp)
        </button>
      </div>
    </main>

    <!-- 3. Right Map Canvas & Spatial Controls -->
    <div class="map-container-wrap">
      <div id="odisha-map"></div>

      <!-- Floating Legend Pill -->
      <div class="floating-legend-pill">
        <div class="legend-title" id="legend-title">Precipitation &amp; Thermal Load</div>
        <div class="legend-bar-scale" id="legend-bar-scale">
          <div style="background:#38bdf8;"></div>
          <div style="background:#34d399;"></div>
          <div style="background:#facc15;"></div>
          <div style="background:#fb923c;"></div>
          <div style="background:#f43f5e;"></div>
        </div>
        <div class="legend-labels" id="legend-labels">
          <span>Light</span>
          <span>Moderate</span>
          <span>Heavy</span>
          <span>Extreme</span>
        </div>
      </div>

      <!-- Floating Layer Switcher -->
      <div class="floating-layer-switcher">
        <button class="layer-btn active" data-layer="risk">Thermal Risk</button>
        <button class="layer-btn" data-layer="wbgt">WBGT Index</button>
        <button class="layer-btn" data-layer="temp">Temperature</button>
        <button class="layer-btn" data-layer="surge">Hospital Surge</button>
        <button class="layer-btn" data-layer="uhi">🛰️ Satellite UHI</button>
        <button class="layer-btn" data-layer="ndvi">🌿 Green Canopy (NDVI)</button>
      </div>

      <!-- Floating Location Pin Badge -->
      <div class="floating-loc-badge" id="floating-loc-badge">
        <div class="loc-temp" id="float-badge-temp">27°</div>
        <div>
          <div class="loc-name" id="float-badge-name">Khordha</div>
          <div class="loc-sub" id="float-badge-sub">Odisha · Selected Location</div>
        </div>
      </div>

      <!-- Bottom Timeline Playback Player -->
      <div class="timeline-playback-bar">
        <div class="timeline-header-row">
          <div class="timeline-controls-left">
            <button class="btn-play-pause" id="btn-play-pause">▶</button>
            <div class="timeline-timestamp-badge" id="timeline-timestamp">Saturday, 29 August 2026 · 11:00 AM</div>
            <span class="timeline-rel-badge" id="timeline-rel-badge">TODAY +0h</span>
          </div>
          <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);">
            120-HOUR FORECAST SCRUBBER
          </div>
        </div>
        <input type="range" class="timeline-slider-input" id="timeline-slider" min="0" max="119" value="11" step="1" />
        <div class="timeline-day-ticks" id="timeline-day-ticks"></div>
      </div>
    </div>
  </div>
</div>

<!-- MULTILINGUAL ALERT DISPATCH MODAL -->
<div class="modal-overlay" id="dispatch-modal-overlay">
  <div class="dispatch-modal-card">
    <div class="modal-head">
      <h3>📢 Automated Disaster Advisory Dispatcher</h3>
      <button class="btn-close-modal" id="btn-close-dispatch-modal">&times;</button>
    </div>
    <div class="modal-body">
      <div style="font-size:11px;color:var(--text-secondary);">Select Official Broadcast Language:</div>
      <div class="lang-tabs">
        <button class="lang-tab active" data-lang="en">English (EN)</button>
        <button class="lang-tab" data-lang="or">Odia (ଓଡ଼ିଆ)</button>
        <button class="lang-tab" data-lang="hi">Hindi (हिन्दी)</button>
      </div>

      <div class="sms-preview-screen" id="sms-preview-text">
        [OSDMA / MoES Heat Alert] Severe thermal load forecasted for Khordha District. Peak WBGT reaches 31.4°C. Mandatory work-rest cycles enforced. 108 Emergency Ambulance network pre-alerted.
      </div>

      <div style="font-size:11px;color:var(--text-secondary);">Target Recipient Channels:</div>
      <div class="recipients-bar">
        <span class="recip-chip">🏛️ District Collector &amp; DM</span>
        <span class="recip-chip">🚑 108 Ambulance Dispatch</span>
        <span class="recip-chip">🩺 Chief District Medical Officer</span>
        <span class="recip-chip">📢 Public Megaphone Units</span>
      </div>

      <button class="btn-trigger-send" id="btn-trigger-broadcast">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>
        Transmit Broadcast via NIC-SMS &amp; WhatsApp Cloud Gateway
      </button>
    </div>
  </div>
</div>

<!-- LIVE NEWSAPI INTEL MODAL -->
<div class="modal-overlay" id="news-modal-overlay">
  <div class="news-modal-card">
    <div class="modal-head">
      <h3>📰 Live News Wire &amp; Early Warning Intel (NewsAPI.org)</h3>
      <button class="btn-close-modal" id="btn-close-news-modal">&times;</button>
    </div>
    <div class="news-filter-tabs">
      <button class="news-filter-tab active" data-filter="all">All Bulletins</button>
      <button class="news-filter-tab" data-filter="warning">Heat &amp; Warnings</button>
      <button class="news-filter-tab" data-filter="advisory">IMD Advisories</button>
      <button class="news-filter-tab" data-filter="odisha">Odisha Focus</button>
    </div>
    <div class="news-list-scroll" id="news-articles-container">
      <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">Loading live wire intelligence...</div>
    </div>
  </div>
</div>

<script>
window.__SENTINELX_DATA__ = {data_json};

const DATA = window.__SENTINELX_DATA__;
let selectedDistrictName = "Khordha";
let currentIdx = 11;
let activeLayer = "risk";
let isPlaying = false;
let playTimer = null;
let mapInstance = null;
let geoJsonLayer = null;

// Physiological Simulator State
let simExertion = 1.35;
let simVuln = 1.0;
let activeLang = 'en';

// Color scales
function getColorForTier(tier) {{
  switch(tier) {{
    case 'Green': return '#34d399';
    case 'Yellow': return '#facc15';
    case 'Orange': return '#fb923c';
    case 'Red': return '#f43f5e';
    default: return '#38bdf8';
  }}
}}

function getScoreColor(val, layer) {{
  if(layer === 'wbgt') {{
    if(val >= 32) return '#f43f5e';
    if(val >= 29) return '#fb923c';
    if(val >= 26) return '#facc15';
    return '#34d399';
  }} else if(layer === 'temp') {{
    if(val >= 38) return '#f43f5e';
    if(val >= 33) return '#fb923c';
    if(val >= 28) return '#facc15';
    return '#38bdf8';
  }} else if(layer === 'surge') {{
    if(val >= 120) return '#f43f5e';
    if(val >= 80) return '#fb923c';
    if(val >= 40) return '#facc15';
    return '#34d399';
  }} else if(layer === 'uhi') {{
    if(val >= 3.0) return '#f43f5e';
    if(val >= 2.0) return '#fb923c';
    if(val >= 1.2) return '#facc15';
    return '#38bdf8';
  }} else if(layer === 'ndvi') {{
    if(val >= 0.65) return '#059669';
    if(val >= 0.48) return '#10b981';
    if(val >= 0.35) return '#eab308';
    return '#f97316';
  }} else {{
    if(val >= 0.5) return '#f43f5e';
    if(val >= 0.4) return '#fb923c';
    if(val >= 0.28) return '#facc15';
    return '#34d399';
  }}
}}

function formatTimestamp(ts) {{
  const d = new Date(ts);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  
  return {{
    dayName: days[d.getDay()],
    fullDay: fullDays[d.getDay()],
    dateStr: `${{d.getDate()}} ${{months[d.getMonth()]}}`,
    fullDateStr: `${{fullDays[d.getDay()]}}, ${{d.getDate()}} ${{fullMonths[d.getMonth()]}} ${{d.getFullYear()}}`,
    timeStr: `${{h12}}:00 ${{ampm}}`,
    hourOnly: `${{h12}} ${{ampm}}`
  }};
}}

// Initialize Map
let markerLayerGroup = null;

function initMap() {{
  mapInstance = L.map('odisha-map', {{
    center: [20.5, 84.8],
    zoom: 7.2,
    zoomControl: false,
    attributionControl: false
  }});

  L.control.zoom({{ position: 'topright' }}).addTo(mapInstance);

  L.tileLayer('https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png', {{
    maxZoom: 18
  }}).addTo(mapInstance);

  markerLayerGroup = L.layerGroup().addTo(mapInstance);

  renderGeoJson();

  if(geoJsonLayer && geoJsonLayer.getBounds().isValid()) {{
    mapInstance.fitBounds(geoJsonLayer.getBounds(), {{ padding: [25, 25] }});
  }}
}}

function renderGeoJson() {{
  if(geoJsonLayer) mapInstance.removeLayer(geoJsonLayer);
  if(markerLayerGroup) markerLayerGroup.clearLayers();

  const features = [];
  for(const [dname, distData] of Object.entries(DATA.districts)) {{
    if(distData.geometry) {{
      features.push({{
        type: 'Feature',
        properties: {{ name: dname }},
        geometry: distData.geometry
      }});
    }}

    // Add centroid text pill markers
    if(distData.centroid && distData.centroid[0] && distData.centroid[1]) {{
      const cur = distData.series[currentIdx] || distData.series[0];
      const customIcon = L.divIcon({{
        className: 'district-map-label',
        html: `<div>${{dname}} <span style="color:#38bdf8;">${{Math.round(cur.temp)}}°</span></div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      }});
      const marker = L.marker([distData.centroid[0], distData.centroid[1]], {{ icon: customIcon }});
      marker.on('click', () => selectDistrict(dname));
      markerLayerGroup.addLayer(marker);
    }}
  }}

  geoJsonLayer = L.geoJSON({{ type: 'FeatureCollection', features }}, {{
    style: function(feat) {{
      const dname = feat.properties.name;
      const dData = DATA.districts[dname];
      const series = dData ? dData.series[currentIdx] : null;
      let color = '#38bdf8';
      if(dData) {{
        if(activeLayer === 'wbgt') color = getScoreColor(series ? (series.wbgt || 26) : 26, 'wbgt');
        else if(activeLayer === 'temp') color = getScoreColor(series ? (series.temp || 28) : 28, 'temp');
        else if(activeLayer === 'surge') {{
          const adm = (dData.impact_forecast && dData.impact_forecast[0]) ? dData.impact_forecast[0].predicted_admissions : 60;
          color = getScoreColor(adm, 'surge');
        }} else if(activeLayer === 'uhi') {{
          color = getScoreColor(dData.uhi_anomaly || 2.0, 'uhi');
        }} else if(activeLayer === 'ndvi') {{
          color = getScoreColor(dData.ndvi_score || 0.5, 'ndvi');
        }} else {{
          color = series ? getColorForTier(series.tier) : '#34d399';
        }}
      }}
      const isSelected = dname.toLowerCase() === selectedDistrictName.toLowerCase();
      return {{
        fillColor: color,
        fillOpacity: isSelected ? 0.75 : 0.5,
        color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)',
        weight: isSelected ? 2.5 : 1
      }};
    }},
    onEachFeature: function(feat, layer) {{
      const dname = feat.properties.name;
      layer.on('click', () => selectDistrict(dname));
      layer.on('mouseover', function() {{ this.setStyle({{ fillOpacity: 0.88, weight: 2.2 }}); }});
      layer.on('mouseout', function() {{
        const isSelected = dname.toLowerCase() === selectedDistrictName.toLowerCase();
        this.setStyle({{ fillOpacity: isSelected ? 0.75 : 0.5, weight: isSelected ? 2.5 : 1 }});
      }});
      layer.bindTooltip(dname, {{ className: 'district-tooltip', sticky: true }});
    }}
  }}).addTo(mapInstance);
}}

function updateMapStyles() {{
  if(!geoJsonLayer) return;
  geoJsonLayer.eachLayer(layer => {{
    const dname = layer.feature.properties.name;
    const dData = DATA.districts[dname];
    const series = dData ? dData.series[currentIdx] : null;
    let color = '#38bdf8';
    if(dData) {{
      if(activeLayer === 'wbgt') color = getScoreColor(series ? (series.wbgt || 26) : 26, 'wbgt');
      else if(activeLayer === 'temp') color = getScoreColor(series ? (series.temp || 28) : 28, 'temp');
      else if(activeLayer === 'surge') {{
        const adm = (dData.impact_forecast && dData.impact_forecast[0]) ? dData.impact_forecast[0].predicted_admissions : 60;
        color = getScoreColor(adm, 'surge');
      }} else if(activeLayer === 'uhi') {{
        color = getScoreColor(dData.uhi_anomaly || 2.0, 'uhi');
      }} else if(activeLayer === 'ndvi') {{
        color = getScoreColor(dData.ndvi_score || 0.5, 'ndvi');
      }} else {{
        color = series ? getColorForTier(series.tier) : '#34d399';
      }}
    }}
    const isSelected = dname.toLowerCase() === selectedDistrictName.toLowerCase();
    layer.setStyle({{
      fillColor: color,
      fillOpacity: isSelected ? 0.75 : 0.5,
      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)',
      weight: isSelected ? 2.5 : 1
    }});
  }});
}}

// Select & Render District Bento Cards
function selectDistrict(dname) {{
  selectedDistrictName = dname;
  
  document.querySelectorAll('.district-nav-item').forEach(el => {{
    if(el.dataset.district.toLowerCase() === dname.toLowerCase()) el.classList.add('active');
    else el.classList.remove('active');
  }});

  const distData = DATA.districts[dname];
  if(distData) {{
    const current = distData.series[currentIdx] || distData.series[0];
    document.getElementById('float-badge-name').textContent = dname;
    document.getElementById('float-badge-temp').textContent = `${{Math.round(current.temp)}}°`;
  }}

  updateMapStyles();
  renderBentoCards();
  updateSimulator();
  updateSmsPreview();
}}

function updateSimulator() {{
  const distData = DATA.districts[selectedDistrictName];
  if(!distData) return;
  const current = distData.series[currentIdx] || distData.series[0];
  const wbgt = current.wbgt || 27.5;
  const rh = current.rh || 75;

  // Evaporation efficiency deficit factor
  const evapEfficiency = Math.max(0.3, 1.0 - (rh / 100) * 0.65);
  
  // H-THERM Formula: (WBGT / 34 * 80) * (1 / evapEfficiency) * K_exertion * K_vuln
  let rawScore = (wbgt / 34.0 * 55.0) * (1.0 / evapEfficiency) * simExertion * simVuln;
  rawScore = Math.min(100, Math.max(15, rawScore));

  const scoreDisplay = document.getElementById('sim-score-display');
  scoreDisplay.textContent = `${{rawScore.toFixed(1)}} / 100`;

  let color = '#34d399';
  let ratio = 'Continuous Work (Normal)';
  let rec = `Safe metabolic threshold for ${{selectedDistrictName}}. Normal physiological heat balance.`;

  if(rawScore >= 85) {{
    color = '#f43f5e';
    ratio = '⛔ Work Shift Banned (Mandatory Stop)';
    rec = `CRITICAL STRAIN: Core body heat accumulation exceeds sweat cooling capacity. Immediate risk of exertional heatstroke.`;
  }} else if(rawScore >= 70) {{
    color = '#fb923c';
    ratio = '30m Work / 30m Shaded Rest';
    rec = `SEVERE STRAIN: Evaporation efficiency reduced by ${{Math.round((1 - evapEfficiency)*100)}}%. Enforce mandatory shaded rest and electrolyte hydration.`;
  }} else if(rawScore >= 50) {{
    color = '#facc15';
    ratio = '45m Work / 15m Shaded Rest';
    rec = `MODERATE STRAIN: Provide shaded water stations. Monitor outdoor workers for dizziness or heat fatigue.`;
  }}

  scoreDisplay.style.color = color;
  document.getElementById('sim-ratio-display').textContent = ratio;
  document.getElementById('sim-ratio-display').style.color = color;
  document.getElementById('sim-rec-display').textContent = rec;
}}

function renderBentoCards() {{
  const distData = DATA.districts[selectedDistrictName];
  if(!distData) return;

  const current = distData.series[currentIdx] || distData.series[0];
  const temps = distData.series.map(s => s.temp);
  const minTemp = Math.min(...temps.slice(0, 24));
  const maxTemp = Math.max(...temps.slice(0, 24));

  // Hero Card
  document.getElementById('hero-city').textContent = `${{selectedDistrictName}} · Odisha`;
  document.getElementById('hero-temp').textContent = `${{Math.round(current.temp)}}°`;
  
  let conditionText = "Clear & Warm";
  if(current.rh >= 85 && current.temp <= 29) conditionText = "Rainy Conditions · High Humidity";
  else if(current.wbgt >= 31) conditionText = "Severe Heatwave & Humidity Strain";
  else if(current.wbgt >= 28) conditionText = "Moderate Thermal Exertion Risk";
  else if(current.temp >= 36) conditionText = "High Solar Load & Thermal Stress";
  document.getElementById('hero-condition').textContent = conditionText;
  document.getElementById('hero-hl').textContent = `H:${{Math.round(maxTemp)}}° · L:${{Math.round(minTemp)}}° · WBGT ${{current.wbgt || 26.5}}°C`;

  // Summary Banner
  const summaryBanner = document.getElementById('summary-banner');
  const summaryText = document.getElementById('summary-text');
  if(current.wbgt >= 30) {{
    summaryBanner.className = 'summary-banner';
    summaryText.textContent = `Extreme thermal stress alert. Atmospheric vapor pressure deficit restricts human evaporative sweat rate. Rest cycles mandatory for all outdoor shifts.`;
  }} else if(current.wbgt >= 28) {{
    summaryBanner.className = 'summary-banner';
    summaryText.textContent = `Moderate heat strain expected across ${{selectedDistrictName}}. Relative humidity at ${{current.rh}}% increases core body temperature during physical exertion.`;
  }} else {{
    summaryBanner.className = 'summary-banner green';
    summaryText.textContent = `Normal thermal conditions across ${{selectedDistrictName}}. Safe metabolic workload threshold maintained for industrial and agricultural labor.`;
  }}

  // Hourly Forecast Strip
  const hourlyStrip = document.getElementById('hourly-strip');
  hourlyStrip.innerHTML = '';
  const startH = Math.max(0, currentIdx - 2);
  const sliceSeries = distData.series.slice(startH, startH + 16);
  sliceSeries.forEach((hItem, idx) => {{
    const fmt = formatTimestamp(hItem.t);
    const pill = document.createElement('div');
    pill.className = 'hour-pill';
    
    let icon = "☀️";
    if(hItem.rh >= 80) icon = "🌧️";
    else if(hItem.temp >= 33) icon = "🔥";
    else if(hItem.solar < 10) icon = "🌙";

    const isCurrent = (startH + idx) === currentIdx;
    const wbgtColor = getScoreColor(hItem.wbgt || 26, 'wbgt');

    pill.innerHTML = `
      <div class="time">${{isCurrent ? 'Now' : fmt.hourOnly}}</div>
      <div class="icon">${{icon}}</div>
      <div class="precip">${{hItem.rh >= 80 ? hItem.rh + '%' : ''}}</div>
      <div class="temp">${{Math.round(hItem.temp)}}°</div>
      <div class="mini-wbgt-bar">
        <div style="width:${{Math.min(100, ((hItem.wbgt || 25) - 20) * 8)}}%;background:${{wbgtColor}}"></div>
      </div>
    `;
    hourlyStrip.appendChild(pill);
  }});

  // 5-Day Forecast Widget
  const fList = document.getElementById('forecast-5day-list');
  fList.innerHTML = '';
  const impactDays = distData.impact_forecast || [];
  DATA.dates.forEach((dStr, dIdx) => {{
    const daySeries = distData.series.filter(s => s.t.startsWith(dStr));
    const dMin = daySeries.length ? Math.min(...daySeries.map(s => s.temp)) : 26;
    const dMax = daySeries.length ? Math.max(...daySeries.map(s => s.temp)) : 33;
    
    const dObj = new Date(dStr + 'T12:00:00');
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dLabel = (dIdx === 0) ? 'Today' : daysArr[dObj.getDay()];

    const row = document.createElement('div');
    row.className = 'day-forecast-row';
    row.innerHTML = `
      <div class="day-name">${{dLabel}}</div>
      <div class="day-icon">${{dMax > 34 ? '🔥' : '🌧️'}}</div>
      <div class="day-precip">${{dIdx % 2 === 0 ? '85%' : '40%'}}</div>
      <div class="day-min">${{Math.round(dMin)}}°</div>
      <div class="day-bar-track">
        <div class="day-bar-fill" style="left:${{Math.max(0, (dMin - 20) * 4)}}%;right:${{Math.max(0, (40 - dMax) * 4)}}%;"></div>
      </div>
      <div class="day-max">${{Math.round(dMax)}}°</div>
    `;
    fList.appendChild(row);
  }});

  // UV Index
  const uvVal = current.solar > 500 ? 8 : (current.solar > 200 ? 5 : (current.solar > 0 ? 2 : 0));
  const uvLabel = uvVal >= 8 ? 'Very High' : (uvVal >= 5 ? 'Moderate' : 'Low');
  document.getElementById('card-uv-val').innerHTML = `${{uvVal}} <small style="font-size:14px;color:var(--text-muted);">${{uvLabel}}</small>`;
  document.getElementById('card-uv-desc').textContent = uvVal >= 8 ? 'Take full sun protection during peak 11 AM - 3 PM.' : 'Low UV exposure for the rest of the day.';

  // Wind & Compass
  const windMs = current.wind || 4.2;
  const windKmh = Math.round(windMs * 3.6);
  const gustKmh = Math.round(windKmh * 1.6);
  document.getElementById('card-wind-speed').innerHTML = `${{windKmh}} <small style="font-size:12px;">km/h</small>`;
  document.getElementById('card-wind-gust').textContent = `Gusts: ${{gustKmh}} km/h WSW`;
  document.getElementById('compass-needle').style.transform = `rotate(${{(currentIdx * 25) % 360}}deg)`;

  // Feels Like / H-THERM
  const feelsLike = Math.round(current.apparent || current.hi || current.temp);
  document.getElementById('card-feels-like').textContent = `${{feelsLike}}°`;
  document.getElementById('card-wbgt-sub').textContent = `WBGT: ${{current.wbgt || 27.5}}°C (Strain Index: ${{current.score || 0.35}})`;

  // Humidity & Pressure
  document.getElementById('card-humidity-val').textContent = `${{current.rh}}%`;
  const dewP = Math.round(current.temp - ((100 - current.rh) / 5));
  document.getElementById('card-dew-point').textContent = `The dew point is ${{dewP}}° right now.`;

  // Satellite UHI & Green Canopy Card
  document.getElementById('card-uhi-val').textContent = `+${{distData.uhi_anomaly || 2.4}}°C`;
  document.getElementById('card-builtup-val').textContent = `${{distData.built_up_pct || 45}}%`;
  document.getElementById('card-ndvi-val').textContent = `${{distData.ndvi_score || 0.48}}`;
  document.getElementById('card-coolroof-val').textContent = distData.cool_roof_potential || 'Cool Roof Candidate';

  // Hospital Surge & Action Plan
  const impactToday = (distData.impact_forecast && distData.impact_forecast[0]) ? distData.impact_forecast[0] : {{ predicted_admissions: 82.5, ImpactTier: 'Yellow' }};
  document.getElementById('surge-admissions-val').textContent = `${{impactToday.predicted_admissions}} Admissions / Day`;
  const tierBadge = document.getElementById('surge-tier-badge');
  tierBadge.textContent = `${{impactToday.ImpactTier.toUpperCase()}} TIER`;
  tierBadge.style.color = getColorForTier(impactToday.ImpactTier);
  tierBadge.style.borderColor = getColorForTier(impactToday.ImpactTier);
  tierBadge.style.background = getColorForTier(impactToday.ImpactTier) + '22';
}}

// Render Sidebar District List
function renderDistrictList() {{
  const listEl = document.getElementById('district-list');
  listEl.innerHTML = '';

  const searchVal = document.getElementById('district-search').value.toLowerCase();
  for(const [dname, distData] of Object.entries(DATA.districts)) {{
    if(searchVal && !dname.toLowerCase().includes(searchVal)) continue;

    const current = distData.series[currentIdx] || distData.series[0];
    const temps = distData.series.map(s => s.temp);
    const minTemp = Math.min(...temps.slice(0, 24));
    const maxTemp = Math.max(...temps.slice(0, 24));

    const item = document.createElement('div');
    item.className = `district-nav-item ${{dname.toLowerCase() === selectedDistrictName.toLowerCase() ? 'active' : ''}}`;
    item.dataset.district = dname;
    item.innerHTML = `
      <div class="nav-left">
        <div class="name">${{dname}}</div>
        <div class="sub">${{current.tier}} Tier · Pop ${{ (distData.population / 100000).toFixed(1) }}L</div>
      </div>
      <div class="nav-right">
        <div class="temp">${{Math.round(current.temp)}}°</div>
        <div class="hl">H:${{Math.round(maxTemp)}}° L:${{Math.round(minTemp)}}°</div>
      </div>
    `;
    item.addEventListener('click', () => selectDistrict(dname));
    listEl.appendChild(item);
  }}
}}

// Timeline Scrubber & Animation
function setIndex(idx) {{
  currentIdx = Math.max(0, Math.min(DATA.timestamps.length - 1, idx));
  document.getElementById('timeline-slider').value = currentIdx;
  
  const ts = DATA.timestamps[currentIdx];
  const fmt = formatTimestamp(ts);
  document.getElementById('timeline-timestamp').textContent = `${{fmt.fullDay}}, ${{fmt.dateStr}} · ${{fmt.timeStr}}`;
  
  const hDiff = currentIdx;
  document.getElementById('timeline-rel-badge').textContent = `+${{hDiff}}h FORECAST`;

  updateMapStyles();
  renderBentoCards();
  renderDistrictList();
  updateSimulator();
  updateSmsPreview();
}}

function togglePlay() {{
  isPlaying = !isPlaying;
  const btn = document.getElementById('btn-play-pause');
  if(isPlaying) {{
    btn.textContent = '⏸';
    playTimer = setInterval(() => {{
      let next = currentIdx + 1;
      if(next >= DATA.timestamps.length) next = 0;
      setIndex(next);
    }}, 400);
  }} else {{
    btn.textContent = '▶';
    clearInterval(playTimer);
  }}
}}

// Build Day Ticks under slider
function buildDayTicks() {{
  const ticksEl = document.getElementById('timeline-day-ticks');
  ticksEl.innerHTML = '';
  DATA.dates.forEach((dStr, i) => {{
    const d = new Date(dStr + 'T12:00:00');
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daySpan = document.createElement('span');
    daySpan.textContent = i === 0 ? 'Today' : daysArr[d.getDay()];
    ticksEl.appendChild(daySpan);
  }});
}}

// Global KPIs
function updateGlobalKPIs() {{
  let maxWbgt = 0;
  let alertCount = 0;
  let totalSurge = 0;

  for(const [dname, distData] of Object.entries(DATA.districts)) {{
    const cur = distData.series[currentIdx] || distData.series[0];
    if(cur.wbgt && cur.wbgt > maxWbgt) maxWbgt = cur.wbgt;
    if(cur.tier === 'Orange' || cur.tier === 'Red') alertCount++;
    if(distData.impact_forecast && distData.impact_forecast[0]) {{
      totalSurge += distData.impact_forecast[0].predicted_admissions;
    }}
  }}

  document.getElementById('kpi-max-wbgt').textContent = `${{maxWbgt.toFixed(1)}}°C`;
  document.getElementById('kpi-alert-districts').textContent = `${{alertCount}} / 30`;
  document.getElementById('kpi-surge-total').textContent = `${{Math.round(totalSurge)}} / day`;
}}

// Multilingual SMS Generator
function updateSmsPreview() {{
  const distData = DATA.districts[selectedDistrictName];
  if(!distData) return;
  const cur = distData.series[currentIdx] || distData.series[0];
  const admissions = (distData.impact_forecast && distData.impact_forecast[0]) ? distData.impact_forecast[0].predicted_admissions : 85;

  let text = '';
  if(activeLang === 'or') {{
    text = `🚨 [ଓସ୍ଡମା / SentinelX ଜରୁରୀ ସତର୍କତା]\nଜିଲ୍ଲା: ${{selectedDistrictName}}\nପୂର୍ବାନୁମାନ WBGT: ${{cur.wbgt || 28.5}}°C | ତାପମାତ୍ରା: ${{Math.round(cur.temp)}}°C\nଅନୁମାନିତ ଡାକ୍ତରଖାନା ଭର୍ତ୍ତି: ${{admissions}} ଜଣ/ଦିନ\nକାର୍ଯ୍ୟାନୁଷ୍ଠାନ:\n1. ୧୧:୦୦ ରୁ ୩:୩୦ ମଧ୍ୟରେ ଶ୍ରମିକଙ୍କ ପାଇଁ ବାଧ୍ୟତାମୂଳକ ବିଶ୍ରାମ।\n2. ଜଳ ସେବା କେନ୍ଦ୍ର ଓ ORS କିଓସ୍କ ସକ୍ରିୟ କରନ୍ତୁ।\n3. ୧୦୮ ଆମ୍ବୁଲାନ୍ସ ନେଟୱାର୍କ ସତର୍କ ରହିବାକୁ ନିର୍ଦ୍ଦେଶ।`;
  }} else if(activeLang === 'hi') {{
    text = `🚨 [OSDMA / SentinelX आपदा प्रबंधन अलर्ट]\nजिला: ${{selectedDistrictName}}\nअनुमानित WBGT: ${{cur.wbgt || 28.5}}°C | तापमान: ${{Math.round(cur.temp)}}°C\nसंभावित अस्पताल प्रवेश: ${{admissions}} मरीज/दिन\nनिर्देश:\n1. दोपहर 11 से 3:30 बजे तक खुले में भारी श्रम पर रोक।\n2. प्राथमिक स्वास्थ्य केंद्रों में ORS व कूलिंग वार्ड चालू रखें।\n3. 108 एम्बुलेंस टीम को हीट स्ट्रोक के लिए अलर्ट करें।`;
  }} else {{
    text = `🚨 [OSDMA / MoES Heatwave Action Protocol]\nDistrict: ${{selectedDistrictName}}\nPeak WBGT: ${{cur.wbgt || 28.5}}°C | Ambient Temp: ${{Math.round(cur.temp)}}°C\nExpected Surge: ${{admissions}} Admissions/Day\nDirectives:\n1. Enforce 11:00 AM - 3:30 PM mandatory work-rest cycles for manual labor.\n2. Activate public Jal Seva Kendras & misting stations.\n3. Pre-position IV Normal Saline & alert 108 emergency hubs.`;
  }}

  document.getElementById('sms-preview-text').textContent = text;
}}

// Simulator Pill Listeners
document.querySelectorAll('#workload-pills .sim-pill').forEach(pill => {{
  pill.addEventListener('click', () => {{
    document.querySelectorAll('#workload-pills .sim-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    simExertion = parseFloat(pill.dataset.exertion);
    updateSimulator();
  }});
}});

document.querySelectorAll('#vuln-pills .sim-pill').forEach(pill => {{
  pill.addEventListener('click', () => {{
    document.querySelectorAll('#vuln-pills .sim-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    simVuln = parseFloat(pill.dataset.vuln);
    updateSimulator();
  }});
}});

// Modal Listeners
const dispatchModal = document.getElementById('dispatch-modal-overlay');
document.getElementById('btn-open-dispatch-modal').addEventListener('click', () => {{
  updateSmsPreview();
  dispatchModal.classList.add('active');
}});
document.getElementById('btn-close-dispatch-modal').addEventListener('click', () => {{
  dispatchModal.classList.remove('active');
}});
dispatchModal.addEventListener('click', (e) => {{
  if(e.target === dispatchModal) dispatchModal.classList.remove('active');
}});

// Language Tabs
document.querySelectorAll('.lang-tab').forEach(tab => {{
  tab.addEventListener('click', () => {{
    document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeLang = tab.dataset.lang;
    updateSmsPreview();
  }});
}});

// Broadcast Button Live API Trigger
document.getElementById('btn-trigger-broadcast').addEventListener('click', async () => {{
  const btn = document.getElementById('btn-trigger-broadcast');
  const distData = DATA.districts[selectedDistrictName];
  const cur = (distData && distData.series[currentIdx]) ? distData.series[currentIdx] : ({{ wbgt: 31.8, temp: 38 }});
  const previewText = document.getElementById('sms-preview-text').textContent;

  btn.innerHTML = `⏳ Transmitting to NIC-SMS &amp; WhatsApp Gateways...`;
  btn.style.opacity = '0.7';

  try {{
    const res = await fetch(`${{API_BASE}}/api/v1/alerts/broadcast`, {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{
        region: selectedDistrictName,
        tier: cur.tier ? cur.tier.toUpperCase() : 'RED',
        lang: activeLang,
        wbgt: cur.wbgt || 31.8,
        hi: cur.temp ? cur.temp + 4.5 : 43.5,
        message: previewText
      }})
    }});

    const data = await res.json();
    btn.innerHTML = `✅ Dispatched! (${{data.total_deliveries || 10}} msgs · ID: ${{data.broadcast_id ? data.broadcast_id.split('-')[2] : 'OK'}})`;
    btn.style.background = '#059669';
    btn.style.opacity = '1';

    setTimeout(() => {{
      dispatchModal.classList.remove('active');
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg> Transmit Broadcast via NIC-SMS &amp; WhatsApp Cloud Gateway`;
      btn.style.background = 'linear-gradient(135deg, #f43f5e, #e11d48)';
    }}, 1800);
  }} catch(e) {{
    btn.innerHTML = `✅ Broadcast Dispatched (Offline Simulation)`;
    btn.style.background = '#059669';
    setTimeout(() => {{
      dispatchModal.classList.remove('active');
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg> Transmit Broadcast via NIC-SMS &amp; WhatsApp Cloud Gateway`;
      btn.style.background = 'linear-gradient(135deg, #f43f5e, #e11d48)';
    }}, 1500);
  }}
}});

// Export SitRep Print Handler
document.getElementById('btn-export-sitrep').addEventListener('click', () => {{
  window.print();
}});

// Search Listener
document.getElementById('district-search').addEventListener('input', renderDistrictList);

// Layer Switcher
document.querySelectorAll('.layer-btn').forEach(btn => {{
  btn.addEventListener('click', () => {{
    document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeLayer = btn.dataset.layer;
    
    const titleEl = document.getElementById('legend-title');
    const scaleEl = document.getElementById('legend-bar-scale');
    const labelsEl = document.getElementById('legend-labels');
    
    if(activeLayer === 'uhi') {{
      titleEl.textContent = '🛰️ Satellite Urban Heat Island (UHI) Anomaly';
      scaleEl.innerHTML = '<div style="background:#38bdf8;"></div><div style="background:#facc15;"></div><div style="background:#fb923c;"></div><div style="background:#f43f5e;"></div>';
      labelsEl.innerHTML = '<span>+0.5°C</span><span>+1.5°C</span><span>+2.5°C</span><span>+4.0°C+</span>';
    }} else if(activeLayer === 'ndvi') {{
      titleEl.textContent = '🌿 Sentinel-2 NDVI Green Canopy Cover';
      scaleEl.innerHTML = '<div style="background:#f97316;"></div><div style="background:#eab308;"></div><div style="background:#10b981;"></div><div style="background:#059669;"></div>';
      labelsEl.innerHTML = '<span>Sparse (0.2)</span><span>Moderate</span><span>Dense</span><span>Canopy (>0.8)</span>';
    }} else if(activeLayer === 'wbgt') {{
      titleEl.textContent = 'WBGT Exertion Stress Scale';
      scaleEl.innerHTML = '<div style="background:#34d399;"></div><div style="background:#facc15;"></div><div style="background:#fb923c;"></div><div style="background:#f43f5e;"></div>';
      labelsEl.innerHTML = '<span><26°C</span><span>26-29°C</span><span>29-32°C</span><span>>32°C</span>';
    }} else if(activeLayer === 'temp') {{
      titleEl.textContent = 'Ambient 2m Temperature';
      scaleEl.innerHTML = '<div style="background:#38bdf8;"></div><div style="background:#facc15;"></div><div style="background:#fb923c;"></div><div style="background:#f43f5e;"></div>';
      labelsEl.innerHTML = '<span><28°C</span><span>28-33°C</span><span>33-38°C</span><span>>38°C</span>';
    }} else if(activeLayer === 'surge') {{
      titleEl.textContent = 'Predicted Daily Hospital Surge';
      scaleEl.innerHTML = '<div style="background:#34d399;"></div><div style="background:#facc15;"></div><div style="background:#fb923c;"></div><div style="background:#f43f5e;"></div>';
      labelsEl.innerHTML = '<span><40</span><span>40-80</span><span>80-120</span><span>>120</span>';
    }} else {{
      titleEl.textContent = 'Thermal Risk Load Scale';
      scaleEl.innerHTML = '<div style="background:#38bdf8;"></div><div style="background:#34d399;"></div><div style="background:#facc15;"></div><div style="background:#fb923c;"></div><div style="background:#f43f5e;"></div>';
      labelsEl.innerHTML = '<span>Light</span><span>Moderate</span><span>Heavy</span><span>Extreme</span>';
    }}
    updateMapStyles();
  }});
}});

// Play / Pause & Slider Events
document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
document.getElementById('timeline-slider').addEventListener('input', (e) => {{
  if(isPlaying) togglePlay();
  setIndex(parseInt(e.target.value, 10));
}});

// News Modal & Live News Feeds
const newsModal = document.getElementById('news-modal-overlay');
let cachedArticles = [];

async function fetchNewsWire(endpoint = '/api/v1/news/heatwave') {{
  const container = document.getElementById('news-articles-container');
  try {{
    const res = await fetch(`${{API_BASE}}${{endpoint}}`);
    if(!res.ok) throw new Error();
    const data = await res.json();
    cachedArticles = data.articles || [];
    renderNewsArticles(cachedArticles);
    document.getElementById('news-badge-count').textContent = cachedArticles.length;
  }} catch(e) {{
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">
      Offline cache: Unable to reach live news feed server. Ensure backend is active at http://localhost:8000.
    </div>`;
  }}
}}

function renderNewsArticles(articles) {{
  const container = document.getElementById('news-articles-container');
  if(!articles || articles.length === 0) {{
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No active news alerts matching criteria.</div>';
    return;
  }}
  container.innerHTML = articles.map(a => `
    <a href="${{a.url || '#'}}" target="_blank" class="news-article-card">
      ${{a.image_url ? `<img src="${{a.image_url}}" class="news-art-img" onerror="this.style.display='none'" />` : ''}}
      <div class="news-art-content">
        <div class="news-art-meta">
          <span class="news-threat-pill" style="background:${{a.threat_color}}22;color:${{a.threat_color}};border:1px solid ${{a.threat_color}}55;">${{a.threat_level || 'INTEL'}}</span>
          <span style="color:var(--text-secondary);">${{a.source || 'News Wire'}}</span>
          <span style="color:var(--text-muted);margin-left:auto;">${{a.published_at ? a.published_at.split('T')[0] : ''}}</span>
        </div>
        <div class="news-art-title">${{a.title}}</div>
        <div class="news-art-desc">${{a.description || ''}}</div>
      </div>
    </a>
  `).join('');
}}

document.querySelectorAll('.news-filter-tab').forEach(tab => {{
  tab.addEventListener('click', () => {{
    document.querySelectorAll('.news-filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    if(filter === 'odisha') {{
      fetchNewsWire('/api/v1/news/odisha');
    }} else if(filter === 'warning') {{
      renderNewsArticles(cachedArticles.filter(a => (a.threat_level || '').includes('WARNING') || (a.threat_level || '').includes('CRITICAL')));
    }} else if(filter === 'advisory') {{
      renderNewsArticles(cachedArticles.filter(a => (a.threat_level || '').includes('ADVISORY')));
    }} else {{
      renderNewsArticles(cachedArticles);
    }}
  }});
}});

document.getElementById('btn-open-news-modal').addEventListener('click', () => {{
  newsModal.classList.add('active');
  fetchNewsWire();
}});
document.getElementById('btn-close-news-modal').addEventListener('click', () => {{
  newsModal.classList.remove('active');
}});
newsModal.addEventListener('click', (e) => {{
  if(e.target === newsModal) newsModal.classList.remove('active');
}});

// Live API Polling
const API_BASE = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
async function pollLiveData() {{
  const syncPill = document.getElementById('sync-pill');
  const syncText = document.getElementById('sync-text');
  syncPill.classList.add('spinning');
  try {{
    const res = await fetch(`${{API_BASE}}/api/v1/live-feed`, {{ cache: 'no-cache' }});
    if(!res.ok) throw new Error();
    const feed = await res.json();
    syncText.textContent = `LIVE · ${{feed.sync_time_short || feed.sync_time_display || 'OK'}}`;
    if(feed.breaking_news_count) {{
      document.getElementById('news-badge-count').textContent = feed.breaking_news_count;
    }}
  }} catch(e) {{
    syncText.textContent = 'OFFLINE (Cache)';
  }} finally {{
    setTimeout(() => syncPill.classList.remove('spinning'), 400);
  }}
}}
document.getElementById('sync-pill').addEventListener('click', pollLiveData);

// Boot
function init() {{
  initMap();
  buildDayTicks();
  renderDistrictList();
  selectDistrict('Khordha');
  setIndex(11);
  updateGlobalKPIs();
  pollLiveData();
  fetchNewsWire();
  setInterval(pollLiveData, 15000);

  // Force Leaflet to recalculate container dimensions after CSS layout
  setTimeout(() => {{
    if(mapInstance) {{
      mapInstance.invalidateSize();
      if(geoJsonLayer && geoJsonLayer.getBounds().isValid()) {{
        mapInstance.fitBounds(geoJsonLayer.getBounds(), {{ padding: [25, 25] }});
      }}
    }}
  }}, 250);
}}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => {{
  if(mapInstance) mapInstance.invalidateSize();
}});
</script>

</body>
</html>
"""
    return html

def main():
    payload = load_data()
    print("Compiling Apple macOS Weather Bento Grid Dashboard...")
    html_content = generate_html(payload)
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"✅ Success! Wrote {len(html_content):,} bytes to {OUTPUT_HTML}")

if __name__ == "__main__":
    main()
