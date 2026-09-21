"""
SentinelX Resource Allocation & Emergency Routing Router
=========================================================
1. Cooling-Center Spatial Gap Optimization
2. Emergency Medical Hospital Advisory Routing
"""

import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Body

router = APIRouter(prefix="/api/v1/resource-allocation", tags=["Resource Allocation & Emergency Routing"])

# ---------------------------------------------------------------------------
# Infrastructure Catalogs (Tagged [SYNTHETIC] per rules.md)
# ---------------------------------------------------------------------------
COOLING_CENTERS = [
    {"name": "BMC Cooling Shelter — Unit 4", "lat": 20.2751, "lon": 85.8402, "capacity": 200, "type": "Municipal Shelter"},
    {"name": "Community Hall — Saheed Nagar", "lat": 20.2863, "lon": 85.8466, "capacity": 150, "type": "Community Hall"},
    {"name": "Ram Mandir Shelter — Old Town", "lat": 20.2521, "lon": 85.8538, "capacity": 100, "type": "Relief Point"},
    {"name": "Jaydev Bhawan — Unit 9", "lat": 20.2930, "lon": 85.8378, "capacity": 300, "type": "AC Transit Center"},
    {"name": "Indoor Stadium — Baramunda", "lat": 20.2800, "lon": 85.8090, "capacity": 500, "type": "Mega Cooling Hub"},
    {"name": "Patia Multi-Purpose Shelter", "lat": 20.3550, "lon": 85.8180, "capacity": 250, "type": "Suburban Shelter"},
    {"name": "Khandagiri Relief Pavilion", "lat": 20.2610, "lon": 85.7850, "capacity": 180, "type": "Relief Pavilion"},
]

HOSPITALS = [
    {"name": "AIIMS Bhubaneswar", "lat": 20.2469, "lon": 85.8018, "beds": 960, "trauma_level": "Level 1 Tertiary", "contact": "0674-2476789"},
    {"name": "Capital Hospital, Bhubaneswar", "lat": 20.2699, "lon": 85.8411, "beds": 600, "trauma_level": "District Referral", "contact": "0674-2391983"},
    {"name": "KIMS Hospital", "lat": 20.3005, "lon": 85.8260, "beds": 750, "trauma_level": "Super Specialty", "contact": "0674-2725182"},
    {"name": "SUM Hospital", "lat": 20.3208, "lon": 85.8153, "beds": 1100, "trauma_level": "Tertiary Referral", "contact": "0674-2386281"},
    {"name": "Hi-Tech Medical College", "lat": 20.3300, "lon": 85.8085, "beds": 500, "trauma_level": "Secondary Trauma", "contact": "0674-2371234"},
    {"name": "Kalinga Hospital", "lat": 20.2955, "lon": 85.8450, "beds": 300, "trauma_level": "Multispecialty", "contact": "0674-2300570"},
    {"name": "SCB Medical College, Cuttack", "lat": 20.4736, "lon": 85.8873, "beds": 1500, "trauma_level": "Apex State Trauma", "contact": "0671-2414080"}
]

# Sample Wards Centroids (Bhubaneswar Representative Wards)
SAMPLE_WARDS = [
    {"ward_no": "Ward 1", "ward_name": "Patia / KIIT Square", "lat": 20.3550, "lon": 85.8180, "temp": 41.2, "vuln_score": 0.78, "pop": 34200},
    {"ward_no": "Ward 5", "ward_name": "Chandrasekharpur", "lat": 20.3220, "lon": 85.8210, "temp": 39.8, "vuln_score": 0.62, "pop": 28900},
    {"ward_no": "Ward 12", "ward_name": "Nayapalli", "lat": 20.2980, "lon": 85.8150, "temp": 42.0, "vuln_score": 0.85, "pop": 41000},
    {"ward_no": "Ward 18", "ward_name": "Baramunda Bus Stand", "lat": 20.2810, "lon": 85.8080, "temp": 43.1, "vuln_score": 0.91, "pop": 48500},
    {"ward_no": "Ward 21", "ward_name": "Saheed Nagar", "lat": 20.2863, "lon": 85.8466, "temp": 40.5, "vuln_score": 0.70, "pop": 31200},
    {"ward_no": "Ward 27", "ward_name": "Master Canteen / Railway Stn", "lat": 20.2680, "lon": 85.8390, "temp": 42.8, "vuln_score": 0.89, "pop": 52000},
    {"ward_no": "Ward 34", "ward_name": "Old Town / Lingaraj", "lat": 20.2480, "lon": 85.8350, "temp": 41.5, "vuln_score": 0.76, "pop": 38000},
    {"ward_no": "Ward 42", "ward_name": "Khandagiri Slum Colony", "lat": 20.2580, "lon": 85.7820, "temp": 43.5, "vuln_score": 0.94, "pop": 44800},
    {"ward_no": "Ward 51", "ward_name": "Tamando Junction", "lat": 20.2210, "lon": 85.7480, "temp": 44.0, "vuln_score": 0.88, "pop": 29400},
    {"ward_no": "Ward 60", "ward_name": "Rasulgarh Industrial Area", "lat": 20.3050, "lon": 85.8620, "temp": 43.8, "vuln_score": 0.92, "pop": 46100},
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates straight-line Haversine distance in kilometers between two coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return float(R * c)


@router.api_route("/cooling-gaps", methods=["GET", "POST"], summary="Detect Ward Cooling Center Coverage Deficits")
def get_cooling_gaps():
    """
    Evaluates cooling center access gaps across Bhubaneswar wards using spatial proximity
    to cooling shelters and ward heat exposure / demographic vulnerability scores.
    """
    evaluations = []
    total_deficit_wards = 0

    for w in SAMPLE_WARDS:
        # Calculate distance to all cooling centers
        distances = []
        for c in COOLING_CENTERS:
            dist = haversine_km(w["lat"], w["lon"], c["lat"], c["lon"])
            distances.append({
                "center_name": c["name"],
                "center_type": c["type"],
                "capacity": c["capacity"],
                "distance_km": round(dist, 2)
            })

        distances.sort(key=lambda x: x["distance_km"])
        nearest = distances[0]

        # Determine Exposure Tier
        if w["temp"] >= 43.0 or w["vuln_score"] >= 0.90:
            exp_tier = "CRITICAL"
        elif w["temp"] >= 41.0 or w["vuln_score"] >= 0.75:
            exp_tier = "HIGH"
        elif w["temp"] >= 39.0:
            exp_tier = "MODERATE"
        else:
            exp_tier = "LOW"

        # Determine Cooling Access Tier
        if nearest["distance_km"] > 3.0 or (nearest["distance_km"] > 1.8 and exp_tier in ["CRITICAL", "HIGH"]):
            access_tier = "DEFICIT"
            recommendation = "Deploy Temporary Misting Canopy & ORS Point"
            total_deficit_wards += 1
        elif nearest["distance_km"] > 1.5:
            access_tier = "MARGINAL"
            recommendation = "Expand Shaded Relief Shelter Capacity"
        else:
            access_tier = "ADEQUATE"
            recommendation = "Adequate Fixed Cooling Coverage"

        evaluations.append({
            "ward_no": w["ward_no"],
            "ward_name": w["ward_name"],
            "temperature_c": w["temp"],
            "vulnerability_score": w["vuln_score"],
            "population": w["pop"],
            "exposure_tier": exp_tier,
            "cooling_access_tier": access_tier,
            "nearest_cooling_center": nearest["center_name"],
            "nearest_distance_km": nearest["distance_km"],
            "nearest_capacity": nearest["capacity"],
            "priority_recommendation": recommendation,
            "provenance": "Calculated"
        })

    # Sort evaluations so DEFICIT & CRITICAL wards appear at the top
    evaluations.sort(key=lambda x: (x["cooling_access_tier"] != "DEFICIT", x["cooling_access_tier"] != "MARGINAL", -x["temperature_c"]))

    return {
        "status": "success",
        "provenance": "Calculated",
        "catalogs_provenance": "Synthetic",
        "summary": {
            "total_wards_evaluated": len(SAMPLE_WARDS),
            "deficit_wards_count": total_deficit_wards,
            "adequate_wards_count": len(SAMPLE_WARDS) - total_deficit_wards,
            "active_cooling_centers_catalog": len(COOLING_CENTERS)
        },
        "wards": evaluations,
        "available_cooling_centers": COOLING_CENTERS
    }


@router.api_route("/emergency-routing", methods=["GET", "POST"], summary="Emergency Hospital Advisory Routing")
def emergency_routing(
    ward: Optional[str] = Query("Ward 18", description="Target ward identifier or name"),
    payload: Optional[dict] = Body(None)
):
    """
    Computes straight-line Haversine distance and estimated ambulance transit times to nearest
    tertiary healthcare facilities for high-risk wards.

    NOTE: Advisory dispatch recommendation only. Does not trigger live 108 emergency CAD API.
    """
    body = payload if isinstance(payload, dict) else {}
    target_ward_name = body.get("ward") or ward or "Ward 18"

    # Find or default target ward
    selected_ward = next((w for w in SAMPLE_WARDS if w["ward_no"].lower() == target_ward_name.lower() or w["ward_name"].lower() in target_ward_name.lower()), SAMPLE_WARDS[3])

    hospital_routes = []
    for h in HOSPITALS:
        dist_km = haversine_km(selected_ward["lat"], selected_ward["lon"], h["lat"], h["lon"])
        # Estimate urban ambulance transit time (assume ~22 km/h city average + 3 min dispatch lag)
        transit_min = round((dist_km / 22.0) * 60.0 + 3.0, 1)

        if dist_km <= 3.5:
            p_tier = "CRITICAL AMBULANCE DISPATCH"
        elif dist_km <= 7.0:
            p_tier = "HIGH PRIORITY ROUTE"
        else:
            p_tier = "SECONDARY BACKUP"

        hospital_routes.append({
            "hospital_name": h["name"],
            "trauma_level": h["trauma_level"],
            "bed_capacity": h["beds"],
            "emergency_contact": h["contact"],
            "straight_line_distance_km": round(dist_km, 2),
            "estimated_transit_minutes": transit_min,
            "response_priority_tier": p_tier,
            "provenance": "Calculated"
        })

    hospital_routes.sort(key=lambda x: x["straight_line_distance_km"])
    primary_hospital = hospital_routes[0]

    return {
        "status": "success",
        "provenance": "Calculated",
        "catalogs_provenance": "Synthetic",
        "advisory_disclaimer": "Advisory dispatch recommendation only. Does not trigger live 108 emergency CAD API.",
        "origin_ward": {
            "ward_no": selected_ward["ward_no"],
            "ward_name": selected_ward["ward_name"],
            "temperature_c": selected_ward["temp"],
            "vulnerability_score": selected_ward["vuln_score"]
        },
        "primary_recommended_hospital": primary_hospital,
        "all_nearby_hospitals": hospital_routes
    }
