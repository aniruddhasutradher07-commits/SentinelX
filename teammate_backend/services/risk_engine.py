"""
services/risk_engine.py
=======================
Multi-Factor Thermal Risk Engine with Census & OpenStreetMap (OSM) Vulnerability Layer.

Decouples pure biometeorological hazard (UTCI / WBGT) from physical & demographic
vulnerability:
  - Elderly % (Census demographic tables: age 60+)
  - Outdoor-Worker Density (Census & economic tables: daily wage / construction / street labor)
  - Tree Canopy Cover % (OSM urban vegetation buffer: inversely related to heat stress)
  - Heat-Trapping Roof Type % (Census housing & OSM building materials: tin / asbestos sheets)

Computes a dynamic Vulnerability Multiplier (M_v in [0.70, 1.50]) that scales the
pure thermal hazard score into the final actionable Risk Index.
"""

from typing import Dict, Any, Optional


def calculate_vulnerability_score(
    elderly_pct: float = 9.5,
    outdoor_worker_pct: float = 24.0,
    tree_cover_pct: float = 18.0,
    high_heat_roof_pct: float = 32.0,
) -> Dict[str, Any]:
    """
    Computes multi-factor Census & OpenStreetMap (OSM) vulnerability score and multiplier.

    Indicators:
      - elderly_pct: % population >= 60 yrs (Census demographic table, baseline 4% - 20%)
      - outdoor_worker_pct: % outdoor manual laborers/vendors (Census/OSM, baseline 10% - 50%)
      - tree_cover_pct: % green canopy shade buffer (OSM landuse=forest/wood, 2% - 45%) [Inverted]
      - high_heat_roof_pct: % tin, asbestos, metal sheet roofs (Census housing, 5% - 65%)

    Weights:
      - Elderly: 30%
      - Outdoor Workers: 30%
      - Tree Canopy Deficit: 20%
      - Heat-Trapping Roofs: 20%

    Vulnerability Multiplier (M_v):
      M_v = 0.70 + 0.80 * (vulnerability_score / 100) -> range [0.70, 1.50]
    """
    # 1. Normalize indicators to 0.0 - 1.0 range
    v_elderly = max(0.0, min(1.0, (float(elderly_pct) - 4.0) / (20.0 - 4.0)))
    v_worker = max(0.0, min(1.0, (float(outdoor_worker_pct) - 10.0) / (50.0 - 10.0)))
    v_canopy_deficit = 1.0 - max(0.0, min(1.0, float(tree_cover_pct) / 45.0))
    v_roof = max(0.0, min(1.0, (float(high_heat_roof_pct) - 5.0) / (65.0 - 5.0)))

    # 2. Weighted composite vulnerability index (0.0 to 1.0)
    composite = (
        0.30 * v_elderly +
        0.30 * v_worker +
        0.20 * v_canopy_deficit +
        0.20 * v_roof
    )

    vulnerability_score = round(composite * 100.0, 2)
    # Multiplier: 0.70 (maximum resilience/protective buffer) to 1.50 (severe compound vulnerability)
    vulnerability_multiplier = round(0.70 + 0.80 * composite, 3)

    if vulnerability_score >= 75.0:
        tier = "SEVERE"
    elif vulnerability_score >= 50.0:
        tier = "HIGH"
    elif vulnerability_score >= 30.0:
        tier = "MODERATE"
    else:
        tier = "LOW"

    factors = {
        "elderly_vulnerability": round(v_elderly * 100, 1),
        "worker_vulnerability": round(v_worker * 100, 1),
        "canopy_deficit": round(v_canopy_deficit * 100, 1),
        "roof_heat_trap": round(v_roof * 100, 1),
    }
    dominant_factor = max(factors.items(), key=lambda x: x[1])[0]

    return {
        "elderly_pct": round(float(elderly_pct), 1),
        "outdoor_worker_pct": round(float(outdoor_worker_pct), 1),
        "tree_cover_pct": round(float(tree_cover_pct), 1),
        "high_heat_roof_pct": round(float(high_heat_roof_pct), 1),
        "vulnerability_score": vulnerability_score,
        "vulnerability_multiplier": vulnerability_multiplier,
        "vulnerability_tier": tier,
        "dominant_factor": dominant_factor,
        "component_breakdown": factors,
    }


def calculate_risk(
    utci: float,
    wbgt: float,
    vulnerability: float = 0.5,
    elderly_pct: Optional[float] = None,
    outdoor_worker_pct: Optional[float] = None,
    tree_cover_pct: Optional[float] = None,
    high_heat_roof_pct: Optional[float] = None,
    modis_lst_c: Optional[float] = None,
    sentinel2_ndvi: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calculates final heat risk by combining meteorological thermal hazard with
    the multi-factor Census/OSM vulnerability multiplier and satellite Earth Observation:
      Risk Score = Thermal Hazard Score (augmented with MODIS LST) * Vulnerability Multiplier
    """
    # 1. Thermal hazard score based on human biometeorological stress bands
    if utci >= 46 or wbgt >= 32:
        thermal_score = 90
    elif utci >= 38 or wbgt >= 29:
        thermal_score = 75
    elif utci >= 32 or wbgt >= 27:
        thermal_score = 50
    else:
        thermal_score = 25

    # 1b. Radiant ground/roof skin temperature adjustment from MODIS satellite
    if modis_lst_c is not None and modis_lst_c > 44.0:
        radiant_hazard_lift = min(12.0, (modis_lst_c - 44.0) * 1.5)
        thermal_score = min(100.0, thermal_score + radiant_hazard_lift)

    # Ground tree canopy using Sentinel-2 NDVI if provided
    if sentinel2_ndvi is not None and tree_cover_pct is None:
        tree_cover_pct = round(min(68.0, max(4.0, (sentinel2_ndvi - 0.10) * 115.0)), 1)

    # 2. Compute or retrieve multi-factor vulnerability
    if (
        elderly_pct is not None
        or outdoor_worker_pct is not None
        or tree_cover_pct is not None
        or high_heat_roof_pct is not None
    ):
        vuln_data = calculate_vulnerability_score(
            elderly_pct=elderly_pct if elderly_pct is not None else 9.5,
            outdoor_worker_pct=outdoor_worker_pct if outdoor_worker_pct is not None else 24.0,
            tree_cover_pct=tree_cover_pct if tree_cover_pct is not None else 18.0,
            high_heat_roof_pct=high_heat_roof_pct if high_heat_roof_pct is not None else 32.0,
        )
    else:
        # Support scalar vulnerability (0.0 to 1.0) for backward compatibility
        v_clamped = max(0.0, min(1.0, float(vulnerability)))
        vuln_score = round(v_clamped * 100.0, 2)
        vuln_mult = round(0.70 + 0.80 * v_clamped, 3)
        vuln_data = {
            "elderly_pct": round(4.0 + v_clamped * 16.0, 1),
            "outdoor_worker_pct": round(10.0 + v_clamped * 40.0, 1),
            "tree_cover_pct": round(max(3.0, (1.0 - v_clamped) * 42.0), 1),
            "high_heat_roof_pct": round(5.0 + v_clamped * 60.0, 1),
            "vulnerability_score": vuln_score,
            "vulnerability_multiplier": vuln_mult,
            "vulnerability_tier": "HIGH" if vuln_score >= 60 else ("MODERATE" if vuln_score >= 35 else "LOW"),
            "dominant_factor": "composite_spatial_density",
            "component_breakdown": {
                "elderly_vulnerability": round(v_clamped * 100, 1),
                "worker_vulnerability": round(v_clamped * 100, 1),
                "canopy_deficit": round(v_clamped * 100, 1),
                "roof_heat_trap": round(v_clamped * 100, 1),
            },
        }

    # 3. Apply the Vulnerability Multiplier
    # Decoupled calculation: Hazard * Multiplier
    risk_score = thermal_score * vuln_data["vulnerability_multiplier"]
    risk_score = min(100.0, max(0.0, risk_score))
    risk_score = round(risk_score, 2)

    # 4. Determine risk level
    if risk_score >= 85:
        risk_level = "EXTREME"
    elif risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 45:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    result = {
        "thermal_score": thermal_score,
        "vulnerability_score": vuln_data["vulnerability_score"],
        "vulnerability_multiplier": vuln_data["vulnerability_multiplier"],
        "risk_score": risk_score,
        "risk_level": risk_level,
        "vulnerability_details": vuln_data,
    }
    if modis_lst_c is not None:
        result["modis_lst_c"] = modis_lst_c
        result["uhi_anomaly_c"] = round(modis_lst_c - 41.2, 1)
    if sentinel2_ndvi is not None:
        result["sentinel2_ndvi"] = sentinel2_ndvi

    return result