import requests
import json
import os

API_KEY = "579b464db66ec23bdd00000186623b3a69f9495f6afff1a0a9ee615c"
RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

url = f"https://api.data.gov.in/resource/{RESOURCE_ID}?api-key={API_KEY}&format=json&filters[state]=Odisha"
# Fetching for entire state just in case Bhubaneswar has no data right now
resp = requests.get(url, timeout=30)
print(f"Status Code: {resp.status_code}")
try:
    data = resp.json()
    print("Records found:", len(data.get("records", [])))
    if data.get("records"):
        print(json.dumps(data["records"][0], indent=2))
        
        # Let's find a Bhubaneswar record
        for r in data["records"]:
            if r.get("city", "").lower() == "bhubaneswar":
                print("\nFound Bhubaneswar record:")
                print(json.dumps(r, indent=2))
                break
except Exception as e:
    print("Failed to parse JSON:", e)
