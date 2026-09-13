"""
SentinelX — Master 3-Tier Multi-Scale Pipeline Runner
=====================================================
Runs the end-to-end SentinelX early warning & thermal stress pipelines:
  Tier 1: Pan-India National Early Warning Room (36 States/UTs, 167 District Hubs)
  Tier 2: Statewide Odisha 30-District Command Center (Landsat UHI, DLNM+XGBoost Surge)
  Tier 3: Hyper-Local Bhubaneswar Municipal Corporation (67 BMC Wards)

Usage:
  python run_pipeline.py              # Runs all 3 tiers sequentially
  python run_pipeline.py --tier 1     # National Pan-India Early Warning Room
  python run_pipeline.py --tier 2     # Statewide Odisha 30-District Pipeline
  python run_pipeline.py --tier 3     # Hyperlocal Bhubaneswar 67-Ward Pipeline
  python run_pipeline.py --all        # Explicitly run all tiers
"""

import sys
import subprocess
import time
import argparse

def run_step(step_num, title, script_name):
    print("\n" + "=" * 78)
    print(f" 🚀 STEP {step_num}: {title} ({script_name})")
    print("=" * 78)
    t0 = time.time()
    
    result = subprocess.run([sys.executable, script_name], capture_output=False)
    
    elapsed = time.time() - t0
    if result.returncode == 0:
        print(f"\n✅ Step {step_num} completed successfully in {elapsed:.2f}s!")
    else:
        print(f"\n❌ Step {step_num} failed with return code {result.returncode}!")
        sys.exit(result.returncode)

def run_tier_1():
    print("\n" + "█" * 78)
    print("  🌐 TIER 1: PAN-INDIA NATIONAL SITUATION ROOM PIPELINE (36 STATES / UTS)")
    print("█" * 78)
    run_step("1.1", "High-Throughput Pan-India District Stream Ingestion", "scripts/national_district_pipeline.py")
    run_step("1.2", "National Situation Room Dashboard Compilation", "build_national_dashboard.py")

def run_tier_2():
    print("\n" + "█" * 78)
    print("  🗺️ TIER 2: STATEWIDE ODISHA 30-DISTRICT COMMAND CENTER PIPELINE")
    print("█" * 78)
    run_step("2.1", "30-District Parallel Forecast Fetch (120-Hour Mesh)", "District/fetch_all_30.py")
    run_step("2.2", "Statewide Multi-Index Thermal Stress Engine (WBGT/UTCI/HI)", "District/thermal_stress_engine_odisha.py")
    run_step("2.3", "2-Stage DLNM + XGBoost Statewide Hospital Surge Forecaster", "District/prediction_engine_odisha.py")
    run_step("2.4", "Statewide Bento Grid Command Center Rebuild", "build_odisha_dashboard.py")

def run_tier_3():
    print("\n" + "█" * 78)
    print("  🏙️ TIER 3: HYPER-LOCAL BHUBANESWAR 67-WARD COMMAND CENTER PIPELINE")
    print("█" * 78)
    run_step("3.1", "Hyper-Local Ward Data Engineering & Database Ingestion", "data_engine.py")
    run_step("3.2", "Hyper-Local Thermal Stress & Micro-UHI Computation", "thermal_stress_engine.py")
    run_step("3.3", "2-Stage ML Hospital Surge Prediction & Ward Command Center Rebuild", "prediction_engine.py")

def main():
    parser = argparse.ArgumentParser(description="SentinelX Master 3-Tier Multi-Scale Pipeline Runner")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], help="Execute specific tier pipeline: 1 (National), 2 (Statewide Odisha), 3 (Bhubaneswar Wards)")
    parser.add_argument("--all", action="store_true", help="Execute all 3 tiers sequentially")
    args = parser.parse_args()

    start_total = time.time()
    print("=" * 78)
    print("  🛡️  SENTINELX: EXTREME HEATWAVE EARLY WARNING & THERMAL STRESS FORECAST")
    print("  SIH 2026 · Problem Statement 26083 (MoES / NCMRWF / Disaster Management)")
    print("=" * 78)

    if args.tier == 1:
        run_tier_1()
    elif args.tier == 2:
        run_tier_2()
    elif args.tier == 3:
        run_tier_3()
    else:
        # Default: Run all tiers
        run_tier_1()
        run_tier_2()
        run_tier_3()

    total_time = time.time() - start_total
    print("\n" + "=" * 78)
    print(f" 🎉 PIPELINE EXECUTION FINISHED SUCCESSFULLY IN {total_time:.2f}s!")
    print("=" * 78)
    print("📂 Active Multi-Tier HTML Dashboards:")
    print("  • Tier 1 (National):    SentinelX_National_Dashboard.html  -> http://127.0.0.1:8000/dashboard/national")
    print("  • Tier 2 (Statewide):   SentinelX_Odisha_Dashboard.html    -> http://127.0.0.1:8000/dashboard/odisha")
    print("  • Tier 3 (Hyperlocal):  SentinelX_Dashboard.html           -> http://127.0.0.1:8000/dashboard/bhubaneswar")
    print("=" * 78)

if __name__ == "__main__":
    main()
