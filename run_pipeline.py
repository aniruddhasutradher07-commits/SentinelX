"""
SentinelX — Master Pipeline Runner
==================================
Runs the entire SentinelX end-to-end pipeline in one single command:
  Step 1: Data Engineering & Ingestion (data_engine.py)
  Step 2: Thermal Stress Computation (thermal_stress_engine.py)
  Step 3: 2-Stage DLNM + XGBoost Impact Prediction (prediction_engine.py)
  Step 4: Interactive Command Center Dashboard Rebuild (build_dashboard.py)

Usage:
  python run_pipeline.py
"""

import sys
import subprocess
import time

def run_step(step_num, title, script_name):
    print("\n" + "=" * 75)
    print(f" 🚀 STEP {step_num}: {title} ({script_name})")
    print("=" * 75)
    t0 = time.time()
    
    result = subprocess.run([sys.executable, script_name], capture_output=False)
    
    elapsed = time.time() - t0
    if result.returncode == 0:
        print(f"\n✅ Step {step_num} completed successfully in {elapsed:.2f}s!")
    else:
        print(f"\n❌ Step {step_num} failed with return code {result.returncode}!")
        sys.exit(result.returncode)

def main():
    start_total = time.time()
    print("=" * 75)
    print("  🛡️  SENTINELX: EXTREME HEATWAVE EARLY WARNING SYSTEM")
    print("  SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)")
    print("=" * 75)

    # 1. Data Engineering
    run_step(1, "Data Engineering & Database Ingestion", "data_engine.py")

    # 2. Thermal Stress Engine
    run_step(2, "Thermal Stress & Multi-Index Computation", "thermal_stress_engine.py")

    # 3. 2-Stage Prediction Engine (DLNM + XGBoost) — this also rebuilds
    #    SentinelX_Dashboard.html automatically at the end, so we don't need
    #    a separate dashboard-build step here (that used to run it twice).
    run_step(3, "2-Stage ML Hospital Surge Prediction + Dashboard Rebuild", "prediction_engine.py")

    total_time = time.time() - start_total
    print("\n" + "=" * 75)
    print(f" 🎉 ENTIRE PIPELINE COMPLETED SUCCESSFULLY IN {total_time:.2f}s!")
    print("=" * 75)
    print("📂 Artifacts generated:")
    print("  • sentinelx_data.db         (SQLite Master Database)")
    print("  • historical_weather_era5.csv (ERA5 3-Year Reanalysis)")
    print("  • ndma_heatwave_benchmarks.csv (NDMA Historical Benchmarks)")
    print("  • ward_weather_forecast.csv (5-Day Hourly Ward Forecast)")
    print("  • ward_risk_index.csv       (Thermal Indices: WBGT, UTCI, HI, Risk)")
    print("  • ward_impact_forecast.csv  (Predicted Hospital Admissions & Tiers)")
    print("  • SentinelX_Dashboard.html  (Interactive Command Center UI)")
    print("\n🖥️ To launch the dashboard:")
    print("  open SentinelX_Dashboard.html")
    print("=" * 75)

if __name__ == "__main__":
    main()
