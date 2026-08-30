"""
SentinelX — API Launcher
========================
Launches the unified FastAPI Master Backend with Uvicorn.
"""

import sys
import uvicorn

if __name__ == "__main__":
    print("=" * 75)
    print(" 🛡️  Starting SentinelX Unified FastAPI Master Backend")
    print(" SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)")
    print("=" * 75)
    print("  • Swagger UI Interactive Docs : http://localhost:8000/docs")
    print("  • ReDoc Documentation        : http://localhost:8000/redoc")
    print("  • Odisha Statewide Dashboard  : http://localhost:8000/dashboard/odisha")
    print("  • Bhubaneswar Ward Dashboard  : http://localhost:8000/dashboard/bhubaneswar")
    print("  • Live Telemetry Stream       : http://localhost:8000/api/v1/live-feed")
    print("  • NewsAPI Weather Wire        : http://localhost:8000/api/v1/news/heatwave")
    print("=" * 75)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
