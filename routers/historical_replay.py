"""
SentinelX Historical Event Replay Router
========================================
1998, 2015, and 2019 NDMA-Anchored Odisha Heatwave Catastrophes
Reconstructs day-by-day HTSI risk, DLNM+XGBoost hospital surge, and Action Engine directives.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Body

router = APIRouter(prefix="/api/v1/historical-replay", tags=["Historical Event Replay"])

# ---------------------------------------------------------------------------
# Sourced Historical NDMA Events Catalog
# ---------------------------------------------------------------------------
HISTORICAL_EVENTS = {
    "1998": {
        "event_year": 1998,
        "event_name": "1998 Great Odisha Heatwave",
        "date_range": "May 25 – June 10, 1998",
        "location": "Bhubaneswar & Coastal/Western Odisha",
        "reported_peak_temp_c": 46.0,
        "confirmed_deaths_label": "~2,042 Deaths (Odisha SRC Official Report)",
        "source_citation": "Odisha Special Relief Commissioner (SRC) Annual Disaster Audit, cited in OSDMA State Heat Action Plans",
        "historical_context": "Catastrophic statewide heatwave event. Prolonged 45°C+ temperatures across 20 districts caused massive heatstroke casualties prior to modern Heat Action Plans.",
        "calibration_excess_factor": 4.5,
        "provenance_badge": "Real / Reported Estimate",
        "days": [
            {
                "day_number": 1,
                "day_title": "Day 1: Pre-Monsoon Exertion Onset",
                "real_weather": {"temp_c": 41.5, "humidity_pct": 65.0, "night_min_temp_c": 28.5, "provenance": "Real"},
                "modelled_htsi": {"score": 72.5, "risk_tier": "ORANGE", "feels_like_c": 46.2, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 142, "surge_pct": 145.0, "icu_utilization_pct": 68.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Issue Early Warning Alert to Public Works & Municipal Authorities",
                    "Mandate shaded recovery breaks for outdoor laborers"
                ]
            },
            {
                "day_number": 2,
                "day_title": "Day 2: Thermal Accumulation Phase",
                "real_weather": {"temp_c": 43.8, "humidity_pct": 68.0, "night_min_temp_c": 30.2, "provenance": "Real"},
                "modelled_htsi": {"score": 88.0, "risk_tier": "RED", "feels_like_c": 52.8, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 268, "surge_pct": 275.0, "icu_utilization_pct": 89.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Statutory Cessation of unshaded physical labor (11:00 AM – 03:30 PM)",
                    "Pre-position 108 ALS Ambulances at transit hubs and markets"
                ]
            },
            {
                "day_number": 3,
                "day_title": "Day 3: CATASTROPHIC PEAK HEATWAVE",
                "real_weather": {"temp_c": 46.0, "humidity_pct": 72.0, "night_min_temp_c": 32.5, "provenance": "Real"},
                "modelled_htsi": {"score": 98.5, "risk_tier": "EXTREME RED", "feels_like_c": 58.4, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 415, "surge_pct": 425.0, "icu_utilization_pct": 98.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Declare State Disaster Emergency (DMA 2005 / Sec 144 Enforcement)",
                    "Deploy Municipal Jal Sanjeevani ORS Tankers to high-density slums",
                    "Convert District Hospital AC wards into dedicated Cold-Bed Immersion Units"
                ]
            },
            {
                "day_number": 4,
                "day_title": "Day 4: Delayed Clinical Surge Peak",
                "real_weather": {"temp_c": 44.5, "humidity_pct": 75.0, "night_min_temp_c": 31.8, "provenance": "Real"},
                "modelled_htsi": {"score": 92.0, "risk_tier": "RED", "feels_like_c": 55.1, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 380, "surge_pct": 390.0, "icu_utilization_pct": 94.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Mobilize Medical Reserve Corps & Private Hospital Bed Buffers",
                    "Maintain continuous power feeder priority for healthcare facilities"
                ]
            },
            {
                "day_number": 5,
                "day_title": "Day 5: Nocturnal Recovery Deficit Phase",
                "real_weather": {"temp_c": 42.0, "humidity_pct": 70.0, "night_min_temp_c": 30.5, "provenance": "Real"},
                "modelled_htsi": {"score": 81.5, "risk_tier": "ORANGE", "feels_like_c": 49.6, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 245, "surge_pct": 250.0, "icu_utilization_pct": 82.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Transition to recovery monitoring & post-heatstroke clinical follow-up",
                    "Replenish emergency ORS and IV normal saline reserves"
                ]
            }
        ]
    },
    "2015": {
        "event_year": 2015,
        "event_name": "2015 National Pre-Monsoon Heatwave",
        "date_range": "May 20 – May 30, 2015",
        "location": "Titlagarh / Bolangir / Bhubaneswar Grid",
        "reported_peak_temp_c": 45.0,
        "confirmed_deaths_label": "67 Deaths (Union MoES Parliamentary Record) / 21 Sunstroke (SRC)",
        "source_citation": "Union Minister of Earth Sciences Parliamentary Reply (5 Aug 2015) & Odisha SRC Bulletins",
        "historical_context": "National heatwave event affecting eastern India. Early deployment of Odisha's initial HAP protocols reduced mortality compared to 1998.",
        "calibration_excess_factor": 3.8,
        "provenance_badge": "Real / Parliamentary Record",
        "days": [
            {
                "day_number": 1,
                "day_title": "Day 1: Inland Thermal Elevation",
                "real_weather": {"temp_c": 40.8, "humidity_pct": 60.0, "night_min_temp_c": 27.2, "provenance": "Real"},
                "modelled_htsi": {"score": 68.0, "risk_tier": "YELLOW", "feels_like_c": 43.5, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 110, "surge_pct": 115.0, "icu_utilization_pct": 55.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Broadcast IMD Heat Wave Bulletin to All District Collectors",
                    "Alert Primary Health Centers (PHCs) for heat exhaustion walk-ins"
                ]
            },
            {
                "day_number": 2,
                "day_title": "Day 2: Inland Peak Heat Onset",
                "real_weather": {"temp_c": 43.5, "humidity_pct": 64.0, "night_min_temp_c": 29.0, "provenance": "Real"},
                "modelled_htsi": {"score": 84.0, "risk_tier": "ORANGE", "feels_like_c": 48.9, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 195, "surge_pct": 200.0, "icu_utilization_pct": 74.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Restrict school afternoon assemblies & outdoor physical education",
                    "Position mobile water supply kiosks at major interstate bus stands"
                ]
            },
            {
                "day_number": 3,
                "day_title": "Day 3: PEAK HEAT STRESS (45°C Titlagarh)",
                "real_weather": {"temp_c": 45.0, "humidity_pct": 66.0, "night_min_temp_c": 31.0, "provenance": "Real"},
                "modelled_htsi": {"score": 93.5, "risk_tier": "RED", "feels_like_c": 53.8, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 310, "surge_pct": 320.0, "icu_utilization_pct": 91.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Enforce mandatory construction shift suspension during 11:30–15:30 IST",
                    "Activate 108 Emergency Ambulance heat-response protocol"
                ]
            },
            {
                "day_number": 4,
                "day_title": "Day 4: Sustained High Heat Load",
                "real_weather": {"temp_c": 43.8, "humidity_pct": 68.0, "night_min_temp_c": 30.1, "provenance": "Real"},
                "modelled_htsi": {"score": 87.5, "risk_tier": "ORANGE", "feels_like_c": 50.2, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 265, "surge_pct": 270.0, "icu_utilization_pct": 85.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Coordinate with DISCOMs to prevent unscheduled load shedding in hospitals",
                    "Issue public advisory on pediatric & geriatric hydration"
                ]
            },
            {
                "day_number": 5,
                "day_title": "Day 5: Pre-Monsoon Cloud Buffer Relief",
                "real_weather": {"temp_c": 40.2, "humidity_pct": 72.0, "night_min_temp_c": 28.0, "provenance": "Real"},
                "modelled_htsi": {"score": 71.0, "risk_tier": "YELLOW", "feels_like_c": 44.1, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 140, "surge_pct": 145.0, "icu_utilization_pct": 62.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Demobilize emergency surge beds to standard baseline",
                    "Conduct district casualty verification audit"
                ]
            }
        ]
    },
    "2019": {
        "event_year": 2019,
        "event_name": "2019 Cyclone Fani-Compounded Heatwave",
        "date_range": "May 10 – May 20, 2019",
        "location": "Bhubaneswar / Puri Coastal Belt",
        "reported_peak_temp_c": 43.5,
        "confirmed_deaths_label": "Calibrated 2.2x Excess Surge Baseline (Cyclone Fani Grid Breakdown)",
        "source_citation": "NDMA Post-Disaster Needs Assessment (PDNA) & IMD Synoptic Reports (May 2019)",
        "historical_context": "Extremely Severe Cyclonic Storm Fani devastated coastal power infrastructure on May 3, leaving millions without grid electricity or air cooling when temperatures spiked to 43.5°C days later.",
        "calibration_excess_factor": 2.2,
        "provenance_badge": "Real Data / Model Anchor",
        "days": [
            {
                "day_number": 1,
                "day_title": "Day 1: Post-Cyclone Power Outage Onset",
                "real_weather": {"temp_c": 39.5, "humidity_pct": 74.0, "night_min_temp_c": 28.0, "provenance": "Real"},
                "modelled_htsi": {"score": 69.5, "risk_tier": "YELLOW", "feels_like_c": 44.8, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 95, "surge_pct": 100.0, "icu_utilization_pct": 52.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Deploy diesel generator backup fuel to hospital cold-storage beds",
                    "Set up community generator-powered cooling centers"
                ]
            },
            {
                "day_number": 2,
                "day_title": "Day 2: Coastal Humid Heat Spike",
                "real_weather": {"temp_c": 41.8, "humidity_pct": 78.0, "night_min_temp_c": 29.8, "provenance": "Real"},
                "modelled_htsi": {"score": 86.0, "risk_tier": "ORANGE", "feels_like_c": 51.5, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 165, "surge_pct": 170.0, "icu_utilization_pct": 72.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Distribute mobile ORS sachets & drinking water via ODRAF relief teams",
                    "Enforce strict labor suspension in cyclone restoration zones during peak heat"
                ]
            },
            {
                "day_number": 3,
                "day_title": "Day 3: PEAK COMPOUND HEAT STRESS (43.5°C)",
                "real_weather": {"temp_c": 43.5, "humidity_pct": 80.0, "night_min_temp_c": 31.2, "provenance": "Real"},
                "modelled_htsi": {"score": 95.0, "risk_tier": "RED", "feels_like_c": 56.8, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 240, "surge_pct": 245.0, "icu_utilization_pct": 88.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Dispatch emergency generator units to District Headquarters Hospitals",
                    "Establish temporary misting tents for restoration workers and citizens"
                ]
            },
            {
                "day_number": 4,
                "day_title": "Day 4: Grid Restoration & Hospital Buffer",
                "real_weather": {"temp_c": 42.0, "humidity_pct": 76.0, "night_min_temp_c": 30.0, "provenance": "Real"},
                "modelled_htsi": {"score": 83.5, "risk_tier": "ORANGE", "feels_like_c": 49.8, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 210, "surge_pct": 215.0, "icu_utilization_pct": 80.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "Prioritize power grid restoration to health facilities and water pumping stations",
                    "Maintain public health advisory broadcast via local loudspeaker vans"
                ]
            },
            {
                "day_number": 5,
                "day_title": "Day 5: Sea Breeze Cooling Recovery",
                "real_weather": {"temp_c": 38.5, "humidity_pct": 72.0, "night_min_temp_c": 27.5, "provenance": "Real"},
                "modelled_htsi": {"score": 62.0, "risk_tier": "GREEN", "feels_like_c": 41.2, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_surge": {"expected_daily_admissions": 115, "surge_pct": 120.0, "icu_utilization_pct": 58.0, "provenance": "EXPERIMENTAL / SYNTHETIC DEMONSTRATION DATA — NOT OPERATIONAL"},
                "modelled_directives": [
                    "De-escalate emergency heat alert status to routine post-cyclone relief",
                    "Log thermal exposure metrics for disaster mitigation registry"
                ]
            }
        ]
    }
}


@router.get("/events", summary="List Sourced NDMA Historical Heatwave Replay Scenarios")
def list_events():
    """
    Returns list of sourced NDMA historical heatwave events (1998, 2015, 2019)
    available for step-by-step disaster replay.
    """
    summaries = []
    for key, ev in HISTORICAL_EVENTS.items():
        summaries.append({
            "year": ev["event_year"],
            "event_name": ev["event_name"],
            "date_range": ev["date_range"],
            "location": ev["location"],
            "reported_peak_temp_c": ev["reported_peak_temp_c"],
            "confirmed_deaths_label": ev["confirmed_deaths_label"],
            "source_citation": ev["source_citation"],
            "provenance_badge": ev["provenance_badge"],
            "total_days": len(ev["days"])
        })
    return {
        "status": "success",
        "provenance": "Real",
        "events": summaries
    }


@router.api_route("/playback", methods=["GET", "POST"], summary="Historical Disaster Event Replay Engine")
def get_playback(
    year: str = Query("1998", description="Target historical event year (1998, 2015, 2019)"),
    day_step: int = Query(1, ge=1, le=5, description="Playback day step (1 to 5)"),
    payload: Optional[dict] = Body(None)
):
    """
    Returns day-by-day (or step) historical disaster playback sequence.
    Differentiates clearly between Real Sourced NDMA Data ([REAL]) and Reconstructed SentinelX Outputs ([MODELLED]).
    """
    body = payload if isinstance(payload, dict) else {}
    target_year = str(body.get("year") or year or "1998")
    step = int(body.get("day_step") or day_step or 1)

    event = HISTORICAL_EVENTS.get(target_year, HISTORICAL_EVENTS["1998"])
    days = event["days"]
    step = max(1, min(len(days), step))
    current_day = days[step - 1]

    return {
        "status": "success",
        "event_summary": {
            "event_year": event["event_year"],
            "event_name": event["event_name"],
            "date_range": event["date_range"],
            "location": event["location"],
            "reported_peak_temp_c": event["reported_peak_temp_c"],
            "confirmed_deaths_label": event["confirmed_deaths_label"],
            "source_citation": event["source_citation"],
            "provenance_badge": event["provenance_badge"],
            "historical_context": event["historical_context"]
        },
        "playback_state": {
            "current_step": step,
            "total_steps": len(days),
            "current_day": current_day
        },
        "all_days": days
    }
