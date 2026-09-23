"""
config/thresholds.py — Centralized Threshold Configuration
=============================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

All thresholds used by SentinelX for risk evaluation are explicitly documented here.
"""

from typing import Dict, Any

THRESHOLDS: Dict[str, Dict[str, Any]] = {
    "environmental_hazard_bands": {
        "description": "Prototype engineering thresholds for SentinelX Environmental Hazard Score.",
        "source": "SentinelX Internal Prototype",
        "status": "prototype",
        "unit": "0-100 index",
        "bands": {
            "LOW": (0, 30),
            "ELEVATED": (30, 50),
            "HIGH": (50, 70),
            "EXTREME": (70, 100),
        }
    },
    "nighttime_recovery": {
        "description": "Threshold for poor nighttime recovery based on Heat Index.",
        "source": "SentinelX Internal Prototype (derived from WBGT screening guidelines)",
        "status": "prototype",
        "value": 26.0,
        "unit": "°C Heat Index"
    },
    "imd_coastal_heatwave": {
        "description": "IMD criteria for heat-wave declaration in coastal stations.",
        "source": "India Meteorological Department (IMD)",
        "status": "official",
        "conditions": {
            "max_temp_threshold_c": 37.0,
            "min_departure_from_normal_c": 4.5,
            "persistence_days": 2
        }
    }
}
