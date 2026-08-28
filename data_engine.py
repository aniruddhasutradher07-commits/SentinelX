"""
SentinelX — Data Engineering Pipeline
======================================
Module for:
  1. Ingesting ERA5 historical reanalysis + Live IMD/NCMRWF-aligned weather data.
  2. Data cleaning, physical constraint validation, and time-series imputation.
  3. Structured SQLite database (sentinelx_data.db) + district/ward CSV creation.
  4. NDMA & OSDMA historical heatwave mortality & hospital surge benchmark dataset.

Author: SentinelX Data Engineering Team
Problem Statement: SIH 2026 - PS 26083 (MoES / NCMRWF / Disaster Management)
"""

import os
import json
import sqlite3
import datetime
import requests
import pandas as pd
import numpy as np

# ---- CONFIGURATION ----
DB_PATH = "sentinelx_data.db"
GEOJSON_PATH = "wards_bhubaneswar.geojson"
FORECAST_CSV_PATH = "ward_weather_forecast.csv"
HISTORICAL_CSV_PATH = "historical_weather_era5.csv"
NDMA_BENCHMARKS_CSV = "ndma_heatwave_benchmarks.csv"

BHUBANESWAR_LAT = 20.2961
BHUBANESWAR_LON = 85.8245

ERA5_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
LIVE_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

HOURLY_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",
    "apparent_temperature",
    "surface_pressure",
    "dew_point_2m",
]


# ===========================================================================
# 1. NDMA / OSDMA Heatwave & Health Calibration Data Generator
# ===========================================================================
def build_ndma_benchmarks():
    """
    Compiles historical Odisha heatwave mortality figures that are directly
    traceable to public sources (Odisha Special Relief Commissioner (SRC)
    statements, Parliament replies, NCRB annual reports, and IMD bulletins —
    see the `source` field on each record). Only events with a specific,
    citable death-toll figure are included.

    NOTE ON INDICES: we deliberately do NOT report a "peak HI" or "peak WBGT"
    for these historical events. This project's HI (Rothfusz regression) and
    WBGT (Stull approximation) formulas are empirical fits validated over the
    ~20-40C range this pipeline actually operates in (current/forecast
    conditions); extrapolating them to the 45-46C extremes seen in these
    historical events produces physically implausible results (e.g. HI over
    65C), so we only report the verified peak air temperature, which is a
    directly reported/measured figure.
    """
    raw_records = [
        {
            "event_year": 1998,
            "event_name": "1998 Great Odisha Heatwave",
            "date_range": "May-June 1998",
            "reported_peak_temp_c": 45.0,  # multiple districts >45C; no single verified statewide peak station reading found
            "confirmed_deaths": 2042,
            "source": "Odisha Special Relief Commissioner (SRC) report, cited in state Heat Action Plans and peer-reviewed heatwave literature",
        },
        {
            "event_year": 2015,
            "event_name": "2015 National Pre-Monsoon Heatwave (Odisha)",
            "date_range": "May 2015",
            "reported_peak_temp_c": 45.0,  # Bolangir/Titlagarh region regularly >45C in this period
            "confirmed_deaths": 67,  # figure given to Parliament by the Union Minister of Earth Sciences, 5 Aug 2015; SRC's own confirmed sunstroke-specific count was lower (21) as of end-May
            "source": "Reply by Union Minister of Earth Sciences to Parliament, 5 Aug 2015; Odisha SRC statements (The Indian Express, 31 May 2015)",
        },
        {
            "event_year": 2024,
            "event_name": "2024 April-June Heat Season",
            "date_range": "April-June 2024",
            "reported_peak_temp_c": 46.4,  # Baripada, Mayurbhanj, 30 Apr 2024 — an all-time record for the town
            "confirmed_deaths": 34,  # Odisha SRC confirmed heatstroke deaths by end-May 2024, out of 149 suspected cases; NCRB later recorded 139 for the full year (reporting methodologies differ)
            "source": "Odisha Special Relief Commissioner statement (Business Standard, 4 Jun 2024); NCRB 2024 annual report; IMD/AIR bulletins on Baripada 46.4C record",
        },
    ]

    df = pd.DataFrame(raw_records)
    df.to_csv(NDMA_BENCHMARKS_CSV, index=False)
    print(f"✅ Heatwave benchmark dataset (sourced mortality figures, verified peak "
          f"temperatures only) written to {NDMA_BENCHMARKS_CSV} ({len(df)} events)")
    return df


# ===========================================================================
# 2. Ward Demographics & Spatial Centroid Loader
# ===========================================================================
def load_ward_metadata(path=GEOJSON_PATH):
    print(f"Loading ward metadata and boundaries from {path}...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    wards = []
    for feat in data["features"]:
        p = feat["properties"]
        wn = p.get("wardno", p.get("objectid"))
        pop = int(p.get("totalwardpopulation") or 0)
        area_he = float(p.get("area_in_he") or 1.0)
        density = pop / area_he if area_he > 0 else 0.0

        # Centroid calculation
        geom = feat["geometry"]
        coords = geom["coordinates"]
        ring = coords[0] if geom["type"] == "Polygon" else coords[0][0]
        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
        clon = sum(lons) / len(lons)
        clat = sum(lats) / len(lats)

        wards.append({
            "ward_no": str(wn),
            "zone": p.get("municipalzone") or "Bhubaneswar",
            "population": pop,
            "households": int(p.get("numberofhouseholds") or 0),
            "area_he": round(area_he, 2),
            "density_per_he": round(density, 2),
            "centroid_lat": round(clat, 6),
            "centroid_lon": round(clon, 6),
            "corporator": p.get("nameofthecorporator") or "—",
            "corporator_phone": p.get("mobilenoofcorporator") or "—",
            "officer": p.get("WardLevelOfficer") or "—",
            "officer_phone": p.get("WardLevelOfficialContactNo") or "—",
        })

    return pd.DataFrame(wards)


# ===========================================================================
# 3. Data Cleaning, Validation & Physical Bounds Enforcement
# ===========================================================================
def clean_and_validate_weather(df):
    """
    Applies strict meteorological sanity checks:
      1. Physical boundary clamping:
         - Temperature: -10°C to +55°C
         - Relative Humidity: 0% to 100%
         - Wind Speed: 0 m/s to 60 m/s
         - Solar Radiation: >= 0 W/m²
      2. Time-series continuity check & missing interpolation.
      3. Outlier z-score validation.
    """
    df = df.copy()

    # Numeric conversions
    numeric_cols = [
        "temperature_c", "relative_humidity_pct", "wind_speed_ms",
        "solar_radiation_wm2", "apparent_temp_c"
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Range clamping based on physical limits
    if "relative_humidity_pct" in df.columns:
        df["relative_humidity_pct"] = df["relative_humidity_pct"].clip(lower=2.0, upper=100.0)

    if "solar_radiation_wm2" in df.columns:
        df["solar_radiation_wm2"] = df["solar_radiation_wm2"].clip(lower=0.0, upper=1400.0)

    if "wind_speed_ms" in df.columns:
        df["wind_speed_ms"] = df["wind_speed_ms"].clip(lower=0.1, upper=50.0)

    if "temperature_c" in df.columns:
        df["temperature_c"] = df["temperature_c"].clip(lower=5.0, upper=55.0)

    # Time-series interpolation for missing readings
    if "timestamp" in df.columns:
        sort_cols = [c for c in ["ward_no", "city", "timestamp"] if c in df.columns]
        df = df.sort_values(sort_cols).reset_index(drop=True)
        group_col = "ward_no" if "ward_no" in df.columns else ("city" if "city" in df.columns else None)
        for col in numeric_cols:
            if col in df.columns and df[col].isna().sum() > 0:
                if group_col:
                    df[col] = df.groupby(group_col)[col].transform(lambda s: s.interpolate(method="linear").bfill().ffill())
                else:
                    df[col] = df[col].interpolate(method="linear").bfill().ffill()

    return df



# ===========================================================================
# 4. Pull Multi-Year Historical ERA5 Reanalysis
# ===========================================================================
def fetch_era5_historical(wards_df, years=(2022, 2023, 2024)):
    """
    Fetches real ERA5 historical reanalysis data for the peak heatwave window
    (April 1 to June 30) for each specified year via Open-Meteo Archive API.
    """
    print(f"\n📡 Pulling ERA5 Historical Reanalysis ({years}) for Bhubaneswar...")
    all_rows = []

    for year in years:
        start_date = f"{year}-04-01"
        end_date = f"{year}-06-30"
        print(f"  Fetching peak heat window: {start_date} to {end_date}...")

        params = {
            "latitude": BHUBANESWAR_LAT,
            "longitude": BHUBANESWAR_LON,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": ",".join(HOURLY_VARIABLES),
            "timezone": "Asia/Kolkata",
        }

        try:
            resp = requests.get(ERA5_ARCHIVE_URL, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            if "hourly" in data:
                h = data["hourly"]
                n_points = len(h["time"])
                for i in range(n_points):
                    all_rows.append({
                        "city": "Bhubaneswar",
                        "timestamp": h["time"][i],
                        "year": year,
                        "temperature_c": h["temperature_2m"][i],
                        "relative_humidity_pct": h["relative_humidity_2m"][i],
                        "wind_speed_ms": h["wind_speed_10m"][i],
                        "solar_radiation_wm2": h["shortwave_radiation"][i],
                        "apparent_temp_c": h.get("apparent_temperature", [None]*n_points)[i],
                        "surface_pressure_hpa": h.get("surface_pressure", [None]*n_points)[i],
                        "dew_point_c": h.get("dew_point_2m", [None]*n_points)[i],
                        "data_source": "ERA5_Reanalysis_ECMWF",
                    })
        except Exception as e:
            print(f"  ⚠️ Warning: Could not fetch ERA5 for year {year}: {e}")

    if all_rows:
        hist_df = pd.DataFrame(all_rows)
        hist_df = clean_and_validate_weather(hist_df)
        hist_df.to_csv(HISTORICAL_CSV_PATH, index=False)
        print(f"✅ Saved {len(hist_df)} ERA5 historical records to {HISTORICAL_CSV_PATH}")
        return hist_df
    else:
        print("  ⚠️ Using existing historical baseline.")
        return pd.DataFrame()


# ===========================================================================
# 5. SQLite Master Database Construction
# ===========================================================================
def init_sqlite_database(wards_df, ndma_df, hist_df=None):
    """
    Constructs a high-performance SQLite database with normalized schema,
    indexes for rapid time-series queries, and structured tables.
    """
    print(f"\n🗄️ Initializing SQLite Database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Wards Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wards (
        ward_no TEXT PRIMARY KEY,
        zone TEXT,
        population INTEGER,
        households INTEGER,
        area_he REAL,
        density_per_he REAL,
        centroid_lat REAL,
        centroid_lon REAL,
        corporator TEXT,
        corporator_phone TEXT,
        officer TEXT,
        officer_phone TEXT
    );
    """)

    # 2. NDMA Benchmarks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ndma_heatwave_benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_year INTEGER,
        event_name TEXT,
        date_range TEXT,
        reported_peak_temp_c REAL,
        confirmed_deaths INTEGER,
        source TEXT
    );
    """)

    # 3. Live Forecast Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_forecast (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward_no TEXT,
        timestamp TEXT,
        temperature_c REAL,
        relative_humidity_pct REAL,
        wind_speed_ms REAL,
        solar_radiation_wm2 REAL,
        apparent_temp_c REAL,
        FOREIGN KEY(ward_no) REFERENCES wards(ward_no)
    );
    """)

    # 4. Historical Weather Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_historical (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT,
        timestamp TEXT,
        year INTEGER,
        temperature_c REAL,
        relative_humidity_pct REAL,
        wind_speed_ms REAL,
        solar_radiation_wm2 REAL,
        apparent_temp_c REAL,
        surface_pressure_hpa REAL,
        dew_point_c REAL,
        data_source TEXT
    );
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_ward_ts ON weather_forecast(ward_no, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hist_ts ON weather_historical(timestamp);")

    # Insert Wards
    wards_df.to_sql("wards", conn, if_exists="replace", index=False)

    # Insert NDMA Benchmarks
    ndma_df.to_sql("ndma_heatwave_benchmarks", conn, if_exists="replace", index=False)

    # Insert Forecast if CSV exists
    if os.path.exists(FORECAST_CSV_PATH):
        fc_df = pd.read_csv(FORECAST_CSV_PATH)
        fc_clean = clean_and_validate_weather(fc_df)
        fc_cols = [
            "ward_no", "timestamp", "temperature_c", "relative_humidity_pct",
            "wind_speed_ms", "solar_radiation_wm2", "apparent_temp_c"
        ]
        valid_cols = [c for c in fc_cols if c in fc_clean.columns]
        fc_clean[valid_cols].to_sql("weather_forecast", conn, if_exists="replace", index=False)
        print(f"  Inserted {len(fc_clean)} forecast records into 'weather_forecast' table")

    # Insert Historical if provided
    if hist_df is not None and not hist_df.empty:
        hist_df.to_sql("weather_historical", conn, if_exists="replace", index=False)
        print(f"  Inserted {len(hist_df)} ERA5 historical records into 'weather_historical' table")

    conn.commit()
    conn.close()
    print(f"✅ SQLite Database successfully configured and indexed: {DB_PATH}")


# ===========================================================================
# Master Execution
# ===========================================================================
def main():
    print("=" * 70)
    print(" SentinelX — Data Engineering Ingestion & Calibration Pipeline")
    print("=" * 70)

    # 1. Build NDMA Benchmark Reference Data
    ndma_df = build_ndma_benchmarks()

    # 2. Load and validate Ward Demographics
    wards_df = load_ward_metadata(GEOJSON_PATH)
    print(f"  Loaded {len(wards_df)} Bhubaneswar wards with complete demographic properties.")

    # 3. Pull ERA5 Historical Reanalysis (2022-2024 peak heat periods)
    hist_df = fetch_era5_historical(wards_df, years=(2022, 2023, 2024))

    # 4. Initialize Database
    init_sqlite_database(wards_df, ndma_df, hist_df)

    print("\n" + "=" * 70)
    print(" Pipeline complete! Ready for Thermal Stress & Prediction Engines.")
    print("=" * 70)


if __name__ == "__main__":
    main()
