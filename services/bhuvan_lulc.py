import os
import json
import datetime
import requests
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models import BhuvanLULCCache

ROLLOUT_WARDS = ["W9", "W25", "W51"]

class BhuvanLULCService:
    @staticmethod
    def _create_wkt(geom):
        geom_type = geom.get("type", "").upper()
        coords = geom.get("coordinates", [])
        
        if geom_type == "POLYGON":
            rings = []
            for ring in coords:
                rings.append("(" + ", ".join([f"{lon} {lat}" for lon, lat in ring]) + ")")
            return f"POLYGON ({', '.join(rings)})"
        elif geom_type == "MULTIPOLYGON":
            polys = []
            for poly in coords:
                rings = []
                for ring in poly:
                    rings.append("(" + ", ".join([f"{lon} {lat}" for lon, lat in ring]) + ")")
                polys.append("(" + ", ".join(rings) + ")")
            return f"MULTIPOLYGON ({', '.join(polys)})"
        else:
            raise ValueError(f"Unsupported geometry type: {geom_type}")

    @staticmethod
    def get_ward_context(ward_id: str, db: Session):
        if ward_id.upper() not in ROLLOUT_WARDS:
            return {
                "status": "PENDING_ROLLOUT",
                "source": "ISRO/NRSC Bhuvan",
                "dataset": "LULC 50K",
                "method": "AOI Wise Statistics API",
                "verification_status": "NEEDS_LEGEND_MAPPING",
                "statistics": None,
                "requested_at": None,
                "response_received_at": None
            }
            
        record = db.query(BhuvanLULCCache).filter(BhuvanLULCCache.ward_no == ward_id.upper()).first()
        if not record:
            return {
                "status": "PENDING_FETCH",
                "source": "ISRO/NRSC Bhuvan",
                "dataset": "LULC 50K",
                "method": "AOI Wise Statistics API",
                "verification_status": "NEEDS_LEGEND_MAPPING",
                "statistics": None,
                "requested_at": None,
                "response_received_at": None
            }
            
        stats = None
        if record.parsed_statistics:
            try:
                stats = json.loads(record.parsed_statistics)
            except json.JSONDecodeError:
                pass
                
        status_to_report = record.status
        if status_to_report == "API_RESPONSE_RECEIVED":
            status_to_report = "LAST_VERIFIED_REFERENCE"

        return {
            "status": status_to_report,
            "source": record.source,
            "dataset": record.dataset,
            "method": "AOI Wise Statistics API",
            "verification_status": record.verification_status,
            "statistics": stats,
            "requested_at": record.requested_at,
            "response_received_at": record.response_received_at
        }

    @staticmethod
    def sync_bhuvan_cache(db: Session):
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        load_dotenv(os.path.join(root_dir, '.env'))
        
        token = os.getenv("BHUVAN_LULC50K_TOKEN")
        if not token:
            load_dotenv(os.path.join(root_dir, '.env.example'))
            token = os.getenv("BHUVAN_LULC50K_TOKEN")
            
        token_status = "OK"
        if not token or not token.strip():
            token_status = "TOKEN_NOT_CONFIGURED"
        else:
            token = token.strip()
            
        geojson_path = os.path.join(root_dir, 'wards_bhubaneswar.geojson')
        try:
            with open(geojson_path, 'r') as f:
                fc = json.load(f)
        except Exception:
            return
            
        features = fc.get("features", [])
        
        for feat in features:
            props = feat.get("properties", {})
            ward_no = props.get("wardno", "").upper()
            if not ward_no or ward_no not in ROLLOUT_WARDS:
                continue
                
            req_ts = datetime.datetime.now().isoformat()
            
            record = db.query(BhuvanLULCCache).filter(BhuvanLULCCache.ward_no == ward_no).first()
            if not record:
                record = BhuvanLULCCache(ward_no=ward_no)
                db.add(record)
                
            record.requested_at = req_ts
            
            if token_status != "OK":
                record.status = token_status
                db.commit()
                continue
                
            try:
                geom = feat.get("geometry", {})
                wkt_geom = BhuvanLULCService._create_wkt(geom)
            except Exception:
                # If WKT conversion fails, we skip this ward for now
                continue
                
            url = "https://bhuvan-app1.nrsc.gov.in/api/lulc/curl_aoi.php"
            params = {
                "geom": wkt_geom,
                "token": token
            }
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            try:
                resp = requests.get(url, params=params, headers=headers, timeout=30)
                status_code = resp.status_code
                
                if status_code in (401, 403):
                    record.status = "AUTHENTICATION_FAILED"
                elif status_code != 200:
                    record.status = "UNAVAILABLE"
                else:
                    try:
                        data = resp.json()
                        if not data:
                            record.status = "DATA_NOT_AVAILABLE"
                        elif isinstance(data, dict) and "error" in data:
                            record.status = "AUTHENTICATION_FAILED"
                        else:
                            record.status = "API_RESPONSE_RECEIVED"
                            record.raw_response = resp.text
                            # Use just the first object in the array for simplicity
                            if isinstance(data, list) and len(data) > 0:
                                parsed = data[0]
                            else:
                                parsed = data
                            record.parsed_statistics = json.dumps(parsed)
                            record.response_received_at = datetime.datetime.now().isoformat()
                    except ValueError:
                        record.status = "DATA_NOT_AVAILABLE"
            except requests.exceptions.RequestException:
                record.status = "UNAVAILABLE"
                
            db.commit()
