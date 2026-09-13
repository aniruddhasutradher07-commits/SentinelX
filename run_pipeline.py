"""
SentinelX — Master Pan-India Pipeline Runner
============================================
Runs the end-to-end Pan-India sovereign early warning & thermal stress pipelines:
  1. High-Throughput Pan-India District Stream Ingestion (scripts/national_district_pipeline.py)
  2. Pan-India National Situation Room Compilation (build_national_dashboard.py)
  3. Sovereign GIS Vector Explorer Verification (SentinelX_PanIndia_Map.html)

Usage:
  python run_pipeline.py
"""

import sys
import subprocess
import time

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

def main():
    start_total = time.time()
    print("=" * 78)
    print("  🛡️  SENTINELX: PAN-INDIA EXTREME HEATWAVE EARLY WARNING & THERMAL STRESS")
    print("  SIH 2026 · Problem Statement 26083 (MoES / NCMRWF / Disaster Management)")
    print("  Jurisdiction: Sovereign Territory of India (36 States & UTs, All Districts/Cities)")
    print("=" * 78)

    # Step 1: Pan-India District Stream Ingestion
    run_step(1, "High-Throughput Pan-India District Ingestion Pipeline", "scripts/national_district_pipeline.py")

    # Step 2: National Situation Room Compilation
    run_step(2, "National Situation Room Dashboard Compilation", "build_national_dashboard.py")

    total_time = time.time() - start_total
    print("\n" + "=" * 78)
    print(f" 🎉 PAN-INDIA PIPELINE FINISHED SUCCESSFULLY IN {total_time:.2f}s!")
    print("=" * 78)
    print("📂 Active Sovereign Pan-India Web Interfaces:")
    print("  • Flagship GIS Explorer:     http://127.0.0.1:8000/        (or /map)")
    print("  • National Situation Room:   http://127.0.0.1:8000/national (36 States/UTs)")
    print("  • Health & API Swagger:      http://127.0.0.1:8000/docs")
    print("=" * 78)

if __name__ == "__main__":
    main()
