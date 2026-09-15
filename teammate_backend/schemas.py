from pydantic import BaseModel
from typing import Optional, Dict, Any


class WeatherCreate(BaseModel):

    ward_id: int

    temperature: float

    humidity: float

    wind_speed: float

    solar_radiation: float

    utc_time: str


class WardCreate(BaseModel):

    ward_name: str

    population: int

    vulnerability_score: float

    elderly_pct: Optional[float] = 9.5

    outdoor_worker_pct: Optional[float] = 24.0

    tree_cover_pct: Optional[float] = 18.0

    high_heat_roof_pct: Optional[float] = 32.0

    vulnerability_multiplier: Optional[float] = 1.0


class VulnerabilityDetails(BaseModel):

    elderly_pct: float

    outdoor_worker_pct: float

    tree_cover_pct: float

    high_heat_roof_pct: float

    vulnerability_score: float

    vulnerability_multiplier: float

    vulnerability_tier: str

    dominant_factor: str

    component_breakdown: Optional[Dict[str, float]] = None


class RiskResponse(BaseModel):

    ward_id: int

    ward_name: str

    vulnerability_score: Optional[float] = None

    vulnerability_multiplier: Optional[float] = None

    elderly_pct: Optional[float] = None

    outdoor_worker_pct: Optional[float] = None

    tree_cover_pct: Optional[float] = None

    high_heat_roof_pct: Optional[float] = None

    temperature: Optional[float] = None

    humidity: Optional[float] = None

    thermal_score: Optional[float] = None

    utci: Optional[float] = None

    wbgt: Optional[float] = None

    risk_score: Optional[float] = None

    risk_level: str

    prediction_id: Optional[int] = None

    prediction_time: Optional[str] = None