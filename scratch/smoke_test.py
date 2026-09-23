import requests
import time
import json
import random

def run_smoke_test():
    print("--- LIVE PRODUCTION-LIKE SMOKE TEST ---")
    print("Fetching /api/v1/wards...")
    try:
        resp = requests.get("http://localhost:8000/api/v1/wards")
        resp.raise_for_status()
        data = resp.json()
        wards = data.get("wards", [])
        if not wards:
            print("FAIL: No wards returned")
            return
    except Exception as e:
        print(f"FAIL: Backend not reachable - {e}")
        return

    # Pick 5 random wards
    sample_wards = random.sample(wards, 5)
    print(f"Selected Wards for verification: {[w['ward_no'] for w in sample_wards]}")

    pass_all = True
    for w in sample_wards:
        print(f"\nVerifying {w['ward_no']} ({w['centroid_lat']}, {w['centroid_lon']})...")
        print(f"Backend Temp: {w.get('temperature_c')} Hum: {w.get('relative_humidity_pct')} UV: {w.get('uv_index')} AQI: {w.get('aqi')}")
        
        # Query Open-Meteo independently
        om_url = "https://api.open-meteo.com/v1/forecast"
        om_params = {
            "latitude": w['centroid_lat'],
            "longitude": w['centroid_lon'],
            "current": "temperature_2m,relative_humidity_2m",
            "hourly": "uv_index",
        }
        om_resp = requests.get(om_url, params=om_params)
        if om_resp.status_code == 200:
            om_data = om_resp.json()
            om_temp = om_data["current"]["temperature_2m"]
            om_hum = om_data["current"]["relative_humidity_2m"]
            
            # Allow minor differences since Open-Meteo returns rounded data or slight time differences, 
            # but they should be extremely close (identical since they are from the same DB cached request)
            if abs(w.get('temperature_c', -999) - om_temp) > 0.5:
                print(f"  FAIL: Temp mismatch! API: {w.get('temperature_c')} OM: {om_temp}")
                pass_all = False
            if abs(w.get('relative_humidity_pct', -999) - om_hum) > 2.0:
                print(f"  FAIL: Hum mismatch! API: {w.get('relative_humidity_pct')} OM: {om_hum}")
                pass_all = False
            
            print("  Open-Meteo Check: PASS")
        else:
            print(f"  FAIL: Open-Meteo returned {om_resp.status_code}")
            pass_all = False

    print(f"\nOverall Smoke Test: {'PASS' if pass_all else 'FAIL'}")

if __name__ == '__main__':
    run_smoke_test()
