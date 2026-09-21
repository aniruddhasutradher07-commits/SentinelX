import json
import itertools
from services.thermal_engine import heat_index_celsius, wbgt_outdoor_celsius
from services.risk_engine import calculate_risk

temps = [35, 40, 45, 50]
hums = [20, 50, 80]
winds = [0, 10, 20]
sols = [800] # Standard high solar

results = []
for t, h, w, s in itertools.product(temps, hums, winds, sols):
    hi = heat_index_celsius(t, h)
    w_ms = w / 3.6
    wbgt = wbgt_outdoor_celsius(t, h, s, w_ms)
    
    results.append({
        "t": t, "h": h, "w": w, "hi": hi, "wbgt": wbgt
    })
    
with open("scratch/parity_data.json", "w") as f:
    json.dump(results, f)

print("Generated parity_data.json")
