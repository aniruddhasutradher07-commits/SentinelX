import re

path = "services/live_sync.py"
try:
    with open(path, "r") as f:
        content = f.read()

    # Replace fetch_all_wards_weather import with fetch_multi_location
    content = content.replace("from services.ingestion import fetch_all_wards_weather", "from services.ingestion import fetch_multi_location\nimport json\nimport os")
    
    # Replace open_meteo_loop implementation
    new_loop = """def _run_open_meteo_loop():
    while True:
        try:
            geojson_path = "wards_bhubaneswar.geojson"
            features = []
            if os.path.exists(geojson_path):
                with open(geojson_path, "r", encoding="utf-8") as f:
                    features = json.load(f).get("features", [])
            locations = []
            for idx, feat in enumerate(features):
                p = feat.get("properties", {})
                w_no = p.get("wardno") or f"W{idx + 1}"
                lat = p.get("latitudei") or (20.29 + idx * 0.001)
                lon = p.get("longitudei") or (85.82 + idx * 0.001)
                locations.append({"lat": lat, "lon": lon, "name": w_no})
            fetch_multi_location(locations)
        except Exception as e:
            print(f"[live_sync] Open-Meteo Sync failed: {e}")
        time.sleep(OPEN_METEO_REFRESH_SECONDS)"""

    content = re.sub(
        r"def _run_open_meteo_loop\(\):[\s\S]*?time\.sleep\(OPEN_METEO_REFRESH_SECONDS\)",
        new_loop,
        content
    )

    with open(path, "w") as f:
        f.write(content)
    print("Patched live_sync.py")
except Exception as e:
    print(f"Error: {e}")
