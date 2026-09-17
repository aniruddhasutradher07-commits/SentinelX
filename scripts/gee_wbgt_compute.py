"""
SentinelX — Google Earth Engine WBGT Computation for Odisha
============================================================
Fetches ERA5 reanalysis data from GEE, computes simplified WBGT,
and exports district-level mean values as CSV.
"""

import ee
import json
import csv
import os
from datetime import datetime, timedelta

# Initialize Earth Engine
ee.Initialize(project='neural-myth-470816-a4')
print("[GEE] ✅ Earth Engine initialized with project: neural-myth-470816-a4")

# ─── Load Odisha boundary from GeoJSON ───────────────────────────────
geojson_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "odisha_districts.geojson")
with open(geojson_path, "r") as f:
    odisha_geojson = json.load(f)

# Create Odisha FeatureCollection
odisha_fc = ee.FeatureCollection([
    ee.Feature(ee.Geometry(feat["geometry"]), feat["properties"])
    for feat in odisha_geojson["features"]
])
odisha_boundary = odisha_fc.geometry()
print(f"[GEE] Loaded Odisha boundary with {len(odisha_geojson['features'])} districts")

# ─── Fetch ERA5 Hourly Data (last 7 days) ────────────────────────────
end_date = datetime.utcnow()
start_date = end_date - timedelta(days=7)

start_str = start_date.strftime('%Y-%m-%d')
end_str = end_date.strftime('%Y-%m-%d')
print(f"[GEE] Fetching ERA5 data: {start_str} to {end_str}")

era5 = ee.ImageCollection('ECMWF/ERA5_LAND/HOURLY') \
    .filterDate(start_str, end_str) \
    .filterBounds(odisha_boundary)

print(f"[GEE] ERA5 collection loaded. Computing WBGT...")

# ─── Compute WBGT for each image ─────────────────────────────────────
def compute_wbgt(image):
    # Temperature (Kelvin → Celsius)
    tempC = image.select('temperature_2m').subtract(273.15)
    
    # Dewpoint temperature (Kelvin → Celsius) — proxy for humidity
    dewpointC = image.select('dewpoint_temperature_2m').subtract(273.15)
    
    # Wind components → speed
    windU = image.select('u_component_of_wind_10m')
    windV = image.select('v_component_of_wind_10m')
    windSpeed = windU.pow(2).add(windV.pow(2)).sqrt()
    
    # Solar radiation
    solar = image.select('surface_solar_radiation_downwards_hourly')
    
    # Simplified WBGT approximation (Liljegren et al. adapted)
    # WBGT ≈ 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
    # Tw ≈ dewpoint (natural wet bulb proxy)
    # Tg ≈ Ta + 0.02 * solar_wm2 (globe temp approximation)
    # solar: ERA5 gives J/m² (hourly accum), divide by 3600 → W/m²
    solar_wm2 = solar.divide(3600)
    
    wbgt = dewpointC.multiply(0.7) \
        .add(tempC.multiply(0.3)) \
        .add(solar_wm2.multiply(0.004)) \
        .add(windSpeed.multiply(-0.02)) \
        .rename('WBGT')
    
    return image.addBands(wbgt).addBands(tempC.rename('temp_c')).addBands(dewpointC.rename('dewpoint_c')).addBands(windSpeed.rename('wind_ms'))

wbgt_collection = era5.map(compute_wbgt)

# ─── Compute mean WBGT per district ──────────────────────────────────
print("[GEE] Computing district-level mean WBGT (this may take ~30 seconds)...")

# Get mean composite over the time range
mean_composite = wbgt_collection.select(['WBGT', 'temp_c', 'dewpoint_c', 'wind_ms']).mean()

# Reduce regions to get per-district stats
district_stats = mean_composite.reduceRegions(
    collection=odisha_fc,
    reducer=ee.Reducer.mean(),
    scale=11132,  # ~0.1 degree ERA5 resolution
)

# Fetch results
results = district_stats.getInfo()
print(f"[GEE] ✅ Received {len(results['features'])} district results from Earth Engine")

# ─── Save to CSV ─────────────────────────────────────────────────────
output_csv = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "gee_wbgt_odisha.csv")
os.makedirs(os.path.dirname(output_csv), exist_ok=True)

with open(output_csv, 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['district', 'WBGT_celsius', 'temperature_c', 'dewpoint_c', 'wind_speed_ms', 'data_source', 'period'])
    
    for feat in results['features']:
        props = feat['properties']
        district_name = props.get('dtname', props.get('district', props.get('NAME_2', 'Unknown')))
        wbgt_val = round(props.get('WBGT', 0), 2)
        temp_val = round(props.get('temp_c', 0), 2)
        dew_val = round(props.get('dewpoint_c', 0), 2)
        wind_val = round(props.get('wind_ms', 0), 2)
        
        writer.writerow([district_name, wbgt_val, temp_val, dew_val, wind_val, 'GEE_ERA5_LAND', f'{start_str}_to_{end_str}'])
        print(f"  📍 {district_name:20s} → WBGT: {wbgt_val:5.1f}°C | Temp: {temp_val:5.1f}°C | Wind: {wind_val:4.1f} m/s")

print(f"\n[GEE] ✅ Results saved to: {output_csv}")
print(f"[GEE] 🎯 Total districts processed: {len(results['features'])}")
