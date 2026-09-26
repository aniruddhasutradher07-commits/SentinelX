from core.thermal_stress import classify_risk_tier
import datetime
import requests
from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List
from zoneinfo import ZoneInfo
from pydantic import BaseModel

from services.thermal_engine import heat_index_celsius, wbgt_outdoor_celsius, utci_celsius
from services.risk_engine import calculate_risk

router = APIRouter(tags=["Forecast & Prediction"])

# Simple bounding box geocoding fallback
DISTRICT_COORDS = {
    "khordha": (20.18, 85.62),
    "bhubaneswar": (20.29, 85.82),
    "cuttack": (20.46, 85.88)
}

_forecast_cache = {}

class ForecastDayResponse(BaseModel):
    date: str
    provenance: str
    model_status: str
    weather: Dict[str, Any]
    thermal: Dict[str, Any]
    risk: Dict[str, Any]

@router.get("/api/v1/forecast-risk", response_model=List[ForecastDayResponse], summary="Unified 5-Day Heat Risk Forecast")
def get_forecast_risk(district: str = Query(..., description="District or city name"), horizon: int = 5):
    """
    Fetches the 5-day weather forecast, calculates thermal stress indices (HI, WBGT, UTCI),
    and predicts an unvalidated model risk horizon.
    """
    lat, lon = DISTRICT_COORDS.get(district.lower(), (20.18, 85.62)) # default to Khordha

    # Fetch hourly forecast from Open-Meteo to properly calculate peak stress, rather than using daily disjointed maximums.
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation&timezone=auto&forecast_days={horizon}"
    
    cache_key = f"{lat}_{lon}_{horizon}"
    current_time = datetime.datetime.now().timestamp()
    
    # 3-hour TTL cache (10800 seconds) for the 5-day forecast to prevent 429s
    if cache_key in _forecast_cache:
        cached_data, timestamp = _forecast_cache[cache_key]
        if current_time - timestamp < 10800:
            return cached_data
            
    try:
        max_retries = 3
        for attempt in range(max_retries):
            resp = requests.get(url, timeout=10)
            if resp.status_code == 429:
                import time
                time.sleep(2 ** attempt)
                continue
            resp.raise_for_status()
            data = resp.json()
            break
        else:
            # If we exhausted retries (all 429s)
            if cache_key in _forecast_cache:
                cached_data, _ = _forecast_cache[cache_key]
                # Mark provenance as STALE / CACHED
                for day in cached_data:
                    day["provenance"] = "[STALE CACHE]"
                return cached_data
            raise HTTPException(status_code=429, detail="Open-Meteo rate limit exceeded and no cache available")
    except Exception as e:
        if cache_key in _forecast_cache:
            cached_data, _ = _forecast_cache[cache_key]
            for day in cached_data:
                day["provenance"] = "[STALE CACHE]"
            return cached_data
        raise HTTPException(status_code=502, detail=f"Weather upstream fetch failed: {str(e)}")
    
    if "hourly" not in data or "time" not in data["hourly"]:
        raise HTTPException(status_code=500, detail="Missing hourly forecast variables from Open-Meteo")

    hourly = data["hourly"]
    times = hourly["time"]
    temps = hourly["temperature_2m"]
    rhums = hourly["relative_humidity_2m"]
    winds = hourly["wind_speed_10m"]
    rads = hourly.get("shortwave_radiation", [0]*len(times))

    # Group by date to find daily maximums
    daily_stats = {}
    
    for i in range(len(times)):
        dt_str = times[i]
        date_obj = datetime.datetime.fromisoformat(dt_str)
        date_str = date_obj.strftime("%Y-%m-%d")
        
        t = temps[i]
        rh = rhums[i]
        w = winds[i]
        rad = rads[i] if rads[i] is not None else 0
        
        if t is None or rh is None or w is None:
            continue
            
        w_ms = w / 3.6 # convert km/h to m/s
        
        hi = heat_index_celsius(t, rh)
        wbgt = wbgt_outdoor_celsius(t, rh, rad, w_ms)
        utci = utci_celsius(t, rh, rad, w_ms)
        
        # We track the maximum WBGT of the day and its associated metrics
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "max_temp": t,
                "max_rh": rh,
                "max_wind": w,
                "max_rad": rad,
                "max_hi": hi,
                "max_wbgt": wbgt,
                "max_utci": utci
            }
        else:
            if wbgt > daily_stats[date_str]["max_wbgt"]:
                daily_stats[date_str] = {
                    "max_temp": t,
                    "max_rh": rh,
                    "max_wind": w,
                    "max_rad": rad,
                    "max_hi": hi,
                    "max_wbgt": wbgt,
                    "max_utci": utci
                }
                
    response_list = []
    
    # Sort and take 'horizon' days
    for date_str in sorted(daily_stats.keys())[:horizon]:
        stats = daily_stats[date_str]
        
        # Calculate risk using simple default vulnerability since it's a district average
        risk_result = calculate_risk(
            utci=stats["max_utci"],
            wbgt=stats["max_wbgt"],
            vulnerability=0.5 # default moderate vulnerability
        )
        
        # The prompt strictly asks NOT to fake mortality or hospital numbers
        response_list.append({
            "date": date_str,
            "provenance": "[FORECAST]",
            "model_status": "[EXPERIMENTAL MODEL RISK HORIZON]",
            "weather": {
                "temperature_c": stats["max_temp"],
                "relative_humidity_pct": stats["max_rh"],
                "wind_speed_kmh": stats["max_wind"],
                "solar_radiation_wm2": stats["max_rad"]
            },
            "thermal": {
                "hi_celsius": round(stats["max_hi"], 1),
                "wbgt_celsius": round(stats["max_wbgt"], 1),
                "utci_celsius": round(stats["max_utci"], 1)
            },
            "risk": {
                "risk_score": round(risk_result.get("risk_score", 0), 1),
                "risk_tier": classify_risk_tier(risk_result.get("risk_score", 0))
            }
        })

    _forecast_cache[cache_key] = (response_list, current_time)
    return response_list
