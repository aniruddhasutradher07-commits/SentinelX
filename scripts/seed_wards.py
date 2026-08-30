"""
scripts/seed_wards.py
========================
Populates the `wards` table with SentinelX's real Bhubaneswar ward data
(67 wards, official corporator-verified names, Census-linked population
and area) instead of leaving it empty. Uses ward_code as the natural key
so it's safe to re-run (upserts rather than duplicating rows).

HOW TO RUN:
    python scripts/seed_wards.py
(run once, before starting the server / triggering the live refresh)
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models import Ward

GEOJSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "wards_bhubaneswar.geojson")


def compute_vulnerability_scores(features):
    """Density-based vulnerability proxy (0-1), same approach as the
    SentinelX ward-level UHI offset — denser wards score higher."""
    densities = {}
    for feat in features:
        p = feat["properties"]
        pop = p.get("totalwardpopulation") or 0
        area = p.get("area_in_he") or 1
        densities[p.get("wardno")] = pop / area

    vals = list(densities.values())
    dmin, dmax = min(vals), max(vals)
    spread = (dmax - dmin) or 1.0
    return {w: round((d - dmin) / spread, 3) for w, d in densities.items()}


def main():
    print("Creating tables if they don't exist yet...")
    Base.metadata.create_all(bind=engine)

    print(f"Loading {GEOJSON_PATH}...")
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)
    features = geo["features"]
    print(f"Loaded {len(features)} wards")

    vuln_scores = compute_vulnerability_scores(features)

    db = SessionLocal()
    created, updated = 0, 0
    try:
        for feat in features:
            p = feat["properties"]
            ward_code = p.get("wardno")

            existing = db.query(Ward).filter(Ward.ward_code == ward_code).first()
            if existing:
                existing.ward_name = ward_code
                existing.population = p.get("totalwardpopulation") or 0
                existing.vulnerability_score = vuln_scores.get(ward_code, 0.0)
                existing.zone = p.get("municipalzone")
                existing.area_hectares = p.get("area_in_he")
                updated += 1
            else:
                ward = Ward(
                    ward_name=ward_code,
                    population=p.get("totalwardpopulation") or 0,
                    vulnerability_score=vuln_scores.get(ward_code, 0.0),
                    ward_code=ward_code,
                    zone=p.get("municipalzone"),
                    area_hectares=p.get("area_in_he"),
                )
                db.add(ward)
                created += 1

        db.commit()
        print(f"Done. Created {created} new wards, updated {updated} existing wards.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
