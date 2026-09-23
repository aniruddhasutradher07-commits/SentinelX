import os
import json
import requests
import datetime
from dotenv import load_dotenv

# Ensure dotenv is loaded
load_dotenv()

def create_wkt(geom):
    # Basic GeoJSON to WKT conversion for Polygon/MultiPolygon
    geom_type = geom.get("type", "").upper()
    coords = geom.get("coordinates", [])
    
    if geom_type == "POLYGON":
        # coords is a list of rings, each ring is a list of [lon, lat]
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

def run_poc():
    # 1. Select exactly ONE real ward
    geojson_path = os.path.join(os.path.dirname(__file__), '..', 'wards_bhubaneswar.geojson')
    with open(geojson_path, 'r') as f:
        fc = json.load(f)
    
    features = fc.get("features", [])
    if not features:
        print("No features found in geojson.")
        return
        
    ward_feature = features[0]
    props = ward_feature.get("properties", {})
    ward_no = props.get("wardno", "W1")
    ward_name = props.get("wardname", "Unknown")
    
    # 2. Convert to WKT
    geom = ward_feature.get("geometry", {})
    try:
        wkt_geom = create_wkt(geom)
    except Exception as e:
        print(f"Geometry conversion failed: {e}")
        return
        
    # 3. Validate
    if not wkt_geom.startswith("POLYGON") and not wkt_geom.startswith("MULTIPOLYGON"):
        print("Invalid WKT generated.")
        return
        
    print(f"Selected Ward: {ward_no} ({ward_name})")
    print(f"Geometry Type: {geom.get('type')}")
    
    # 4. Make request
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    load_dotenv(os.path.join(root_dir, '.env'))
    
    token = os.getenv("BHUVAN_LULC50K_TOKEN")
    if not token:
        load_dotenv(os.path.join(root_dir, '.env.example'))
        token = os.getenv("BHUVAN_LULC50K_TOKEN")
        
    if not token or not token.strip():
        print("TOKEN_NOT_CONFIGURED")
        return
        
    token = token.strip()
        
    url = "https://bhuvan-app1.nrsc.gov.in/api/lulc/curl_aoi.php"
    params = {
        "geom": wkt_geom,
        "token": token
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    print("Sending request to Bhuvan API...")
    req_ts = datetime.datetime.now().isoformat()
    
    try:
        # Timeout <= 30 seconds, maximum one retry inside requests (omitted explicit retry logic for simplicity, just one call)
        resp = requests.get(url, params=params, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        print("API_UNAVAILABLE")
        print(f"Network failure: {e}")
        return
        
    status_code = resp.status_code
    resp_size = len(resp.content)
    
    print(f"HTTP Status: {status_code}")
    print(f"Response Size: {resp_size} bytes")
    print(f"Request Timestamp: {req_ts}")
    
    if status_code == 401 or status_code == 403:
        print("AUTHENTICATION_FAILED")
        return
    
    poc_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'bhuvan_poc')
    os.makedirs(poc_dir, exist_ok=True)
    out_file = os.path.join(poc_dir, f"ward_{ward_no}_lulc50k_response.json")
    
    try:
        data = resp.json()
        with open(out_file, 'w') as f:
            json.dump(data, f, indent=2)
        print("API_RESPONSE_RECEIVED")
        print(f"Response saved to: {out_file}")
    except ValueError:
        print("DATA_NOT_AVAILABLE: Response is not valid JSON")
        # Save raw anyway
        with open(out_file.replace(".json", ".txt"), 'w') as f:
            f.write(resp.text)
        return

if __name__ == "__main__":
    run_poc()
