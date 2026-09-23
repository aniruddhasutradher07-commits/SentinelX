import math
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.thermal_stress import compute_htsi

# Phase 3
cases = [
    {"name": "Mild", "t": 25, "rh": 50, "uv": 3, "aqi": 30, "wind": 3},
    {"name": "Hot+Humid", "t": 35, "rh": 80, "uv": 8, "aqi": 100, "wind": 2},
    {"name": "Hot+Dry", "t": 42, "rh": 15, "uv": 10, "aqi": 150, "wind": 5},
    {"name": "High Hum+Low wind", "t": 32, "rh": 95, "uv": 5, "aqi": 60, "wind": 0},
    {"name": "Strong Sun+Mod Temp", "t": 28, "rh": 50, "uv": 12, "aqi": 40, "wind": 3},
]
print("PHASE 3: Reference Tests")
for c in cases:
    res = compute_htsi(c["t"], c["rh"], c["uv"], c["aqi"], c["wind"])
    print(f"{c['name']} (T={c['t']} RH={c['rh']}) -> HTSI={res.htsi_score} (HI={res.heat_index_c})")

print("\nPHASE 4: Sensitivities")
base_htsi = compute_htsi(30, 50, 5, 50, 2).htsi_score

# T up
t_up = compute_htsi(35, 50, 5, 50, 2).htsi_score
print(f"T 30->35: {base_htsi} -> {t_up}")

# RH up
rh_up = compute_htsi(30, 80, 5, 50, 2).htsi_score
print(f"RH 50->80: {base_htsi} -> {rh_up}")

# Wind up (HTSI shouldn't change as per codebase, only feels_like changes)
w_up = compute_htsi(30, 50, 5, 50, 10).htsi_score
fl_base = compute_htsi(30, 50, 5, 50, 2).feels_like_c
fl_up = compute_htsi(30, 50, 5, 50, 10).feels_like_c
print(f"Wind 2->10: HTSI {base_htsi} -> {w_up} | Feels_like {fl_base} -> {fl_up}")
