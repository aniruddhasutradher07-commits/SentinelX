"""
core/multi_hazard.py — Multi-Hazard Detection Engine
======================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Rule-based heuristic engine to detect Extreme Weather events beyond heatwaves:
1. Heavy Rainfall / Flood Risk
2. Cyclones / High Winds
3. Landslides (proxied via extreme sustained rainfall)

Thresholds are modeled after IMD (Indian Meteorological Department) guidelines.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class HazardStatus:
    hazard_type: str
    risk_level: str  # "No Threat", "Monitoring", "Warning", "Critical"
    score: float     # 0 to 100 severity index


@dataclass
class MultiHazardResult:
    heavy_rain: HazardStatus
    flood_risk: HazardStatus
    cyclone: HazardStatus
    landslide: HazardStatus
    
    def to_dict(self):
        return {
            "heavy_rain": self.heavy_rain.__dict__,
            "flood_risk": self.flood_risk.__dict__,
            "cyclone": self.cyclone.__dict__,
            "landslide": self.landslide.__dict__,
        }


def evaluate_multi_hazards(
    current_precip_mm: float,
    current_wind_gusts_ms: float,
    forecast_7d_precip: List[float]
) -> MultiHazardResult:
    """
    Evaluate multi-hazard risk levels based on IMD thresholds.
    """
    # 1. Heavy Rainfall (IMD: Heavy = 64.5mm - 115.5mm/day, Very Heavy = 115.6 - 204.4mm/day)
    rain_score = min(100.0, (current_precip_mm / 150.0) * 100.0)
    if current_precip_mm >= 115.6:
        rain_risk = "Critical"
    elif current_precip_mm >= 64.5:
        rain_risk = "Warning"
    elif current_precip_mm >= 15.0:
        rain_risk = "Monitoring"
    else:
        rain_risk = "No Threat"

    # 2. Flood Risk (Based on current + next 2 days cumulative rain)
    cumulative_3d_rain = current_precip_mm + sum(forecast_7d_precip[:2]) if forecast_7d_precip else current_precip_mm
    flood_score = min(100.0, (cumulative_3d_rain / 250.0) * 100.0)
    if cumulative_3d_rain > 200.0:
        flood_risk = "Critical"
    elif cumulative_3d_rain > 100.0:
        flood_risk = "Warning"
    elif cumulative_3d_rain > 40.0:
        flood_risk = "Monitoring"
    else:
        flood_risk = "No Threat"

    # 3. Cyclone / High Winds (IMD: Cyclonic Storm = 62-88 km/h or 17-24 m/s)
    wind_score = min(100.0, (current_wind_gusts_ms / 30.0) * 100.0)
    if current_wind_gusts_ms >= 24.5: # Severe Cyclonic Storm
        cyclone_risk = "Critical"
    elif current_wind_gusts_ms >= 17.0: # Cyclonic Storm
        cyclone_risk = "Warning"
    elif current_wind_gusts_ms >= 10.0:
        cyclone_risk = "Monitoring"
    else:
        cyclone_risk = "No Threat"

    # 4. Landslide Risk (Proxy: Extreme sustained rainfall)
    landslide_score = min(100.0, (cumulative_3d_rain / 300.0) * 100.0)
    if cumulative_3d_rain > 250.0:
        landslide_risk = "Critical"
    elif cumulative_3d_rain > 150.0:
        landslide_risk = "Warning"
    else:
        landslide_risk = "No Threat"

    return MultiHazardResult(
        heavy_rain=HazardStatus("Heavy Rain", rain_risk, round(rain_score, 1)),
        flood_risk=HazardStatus("Flood Risk", flood_risk, round(flood_score, 1)),
        cyclone=HazardStatus("Cyclone", cyclone_risk, round(wind_score, 1)),
        landslide=HazardStatus("Landslide", landslide_risk, round(landslide_score, 1))
    )
