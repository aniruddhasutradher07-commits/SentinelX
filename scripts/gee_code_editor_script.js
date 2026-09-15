/**
 * scripts/gee_code_editor_script.js
 * =================================
 * Google Earth Engine (GEE) Code Editor Script (JavaScript)
 * ---------------------------------------------------------
 * Open https://code.earthengine.google.com and paste this script directly
 * into the online GEE JavaScript editor to visualize real-time MODIS LST
 * and Copernicus Sentinel-2 NDVI layers over Bhubaneswar, Odisha.
 *
 * SIH 2026 · PS 26083 · SentinelX Heatwave Disaster Management System
 */

// 1. Center map on Bhubaneswar Municipal Corporation (BMC)
var bhubaneswar = ee.Geometry.Point([85.8245, 20.2961]);
Map.centerObject(bhubaneswar, 12);
Map.setOptions('HYBRID');

// 2. Define Observation Window (Peak Pre-Monsoon Summer Heat)
var startDate = '2024-05-01';
var endDate = '2024-05-31';

// 3. Load MODIS Daily Land Surface Temperature (MOD11A1 V6.1)
var modisLST = ee.ImageCollection('MODIS/061/MOD11A1')
  .filterDate(startDate, endDate)
  .select('LST_Day_1km')
  .mean()
  .multiply(0.02)
  .subtract(273.15); // Convert Kelvin to Celsius

// Palette for LST: Blue (Cool/Water) -> Yellow (Moderate) -> Orange -> Dark Red/Purple (Extreme Hotspot >48°C)
var lstVis = {
  min: 35.0,
  max: 52.0,
  palette: [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ]
};

// 4. Load Copernicus Sentinel-2 MSI Surface Reflectance (10m NDVI)
function maskClouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(bhubaneswar)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskClouds)
  .median();

// Compute NDVI: (NIR - Red) / (NIR + Red) -> (B8 - B4) / (B8 + B4)
var ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI');

var ndviVis = {
  min: 0.05,
  max: 0.65,
  palette: ['#CE7E45', '#DF923D', '#F1B555', '#FCD163', '#99B718', '#74A901', '#66A000', '#529400', '#3E8601', '#207401', '#056201', '#004C00']
};

// 5. Urban Heat Island (UHI) Anomaly Differential Layer
// Rural baseline temperature around Chandaka forest buffer ≈ 41.2°C
var ruralBaseline = 41.2;
var uhiAnomaly = modisLST.subtract(ruralBaseline).rename('UHI_Anomaly');

var uhiVis = {
  min: -2.0,
  max: 6.0,
  palette: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
};

// 6. Add Layers to the Earth Engine Canvas
Map.addLayer(ndvi.clip(bhubaneswar.buffer(20000)), ndviVis, '🌱 Sentinel-2 NDVI (Tree Canopy)', true);
Map.addLayer(modisLST.clip(bhubaneswar.buffer(20000)), lstVis, '🛰️ MODIS Land Surface Temperature (LST °C)', false);
Map.addLayer(uhiAnomaly.clip(bhubaneswar.buffer(20000)), uhiVis, '🔥 Urban Heat Island (UHI Hotspots ΔT)', true);

print('SentinelX Earth Observation Layers Loaded: MODIS LST, Sentinel-2 NDVI, and UHI Anomaly');
