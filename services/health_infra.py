import csv
import os
from typing import Dict, Any, List

DATA_PATH = "data/health_infrastructure_2019.csv"

def _normalize_type(t: str) -> str:
    if not t or t.lower() == "na":
        return "other"
    t = t.lower().strip()
    if "icds" in t:
        return "icds_center"
    if "hospital" in t:
        return "hospital"
    if "nursing" in t:
        return "nursing_home"
    if "community" in t or "uchc" in t:
        return "uchc"
    if "primary" in t or "uphc" in t:
        return "uphc"
    if "dispensary" in t:
        return "dispensary"
    return "other"

class HealthInfraService:
    def __init__(self):
        self.wards_cache: Dict[str, Dict[str, Any]] = {}
        self.total_csv_records = 0
        self._load_data()

    def _safe_val(self, val: str) -> Any:
        v = val.strip() if val else ""
        if not v or v.upper() == "NA":
            return None
        # Try convert to int if possible
        try:
            return int(v)
        except ValueError:
            return v

    def _load_data(self):
        if not os.path.exists(DATA_PATH):
            print(f"[HEALTH_INFRA] Warning: {DATA_PATH} not found.")
            return

        with open(DATA_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            ward_records = {}

            for row in reader:
                self.total_csv_records += 1
                ward_no_raw = row.get("Ward No.", "")
                ward_no = str(ward_no_raw).strip()
                if not ward_no or ward_no.upper() == "NA":
                    continue
                
                # Format exactly as W{number}
                try:
                    w_key = f"W{int(ward_no)}"
                except ValueError:
                    continue

                if w_key not in ward_records:
                    ward_records[w_key] = []

                ward_records[w_key].append({
                    "name": row.get("Facility Name", "").strip(),
                    "raw_type": row.get("Type  (Hospital / Nursing Home / Lab)", "").strip(),
                    "norm_type": _normalize_type(row.get("Type  (Hospital / Nursing Home / Lab)", "")),
                    "beds": self._safe_val(row.get("Number of Beds in facility type", "")),
                    "emergency_beds": self._safe_val(row.get("Number of Beds in Emergency Wards ", "")),
                    "doctors": self._safe_val(row.get("Number of Doctors / Physicians", "")),
                    "nurses": self._safe_val(row.get("Number of Nurses", "")),
                    "ambulance_available": self._safe_val(row.get("Ambulance Service Available", "")),
                    "ambulance_count": self._safe_val(row.get("Count of Ambulance", ""))
                })

        for w_key, records in ward_records.items():
            categories = {
                "icds_centers": 0,
                "hospitals": 0,
                "nursing_homes": 0,
                "uphc": 0,
                "uchc": 0,
                "dispensaries": 0,
                "other": 0
            }

            facilities = []
            for r in records:
                t = r["norm_type"]
                if t == "icds_center": categories["icds_centers"] += 1
                elif t == "hospital": categories["hospitals"] += 1
                elif t == "nursing_home": categories["nursing_homes"] += 1
                elif t == "uphc": categories["uphc"] += 1
                elif t == "uchc": categories["uchc"] += 1
                elif t == "dispensary": categories["dispensaries"] += 1
                else: categories["other"] += 1

                facilities.append({
                    "name": r["name"],
                    "type": r["raw_type"],
                    "beds": r["beds"],
                    "emergency_beds": r["emergency_beds"],
                    "doctors": r["doctors"],
                    "nurses": r["nurses"],
                    "ambulance_available": r["ambulance_available"],
                    "ambulance_count": r["ambulance_count"]
                })

            self.wards_cache[w_key] = {
                "status": "STATIC_REFERENCE",
                "facility_count": len(records),
                "categories": categories,
                "facilities": facilities,
                "source": "Odisha Government OGD",
                "dataset": "Health Infrastructure Bhubaneswar 2019",
                "dataset_year": 2019
            }

    def get_ward_infrastructure(self, ward_no: str) -> Dict[str, Any]:
        if ward_no in self.wards_cache:
            return self.wards_cache[ward_no]
        else:
            return {
                "status": "DATA_NOT_AVAILABLE",
                "facility_count": None
            }

health_infra = HealthInfraService()
