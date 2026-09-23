import os
import re

# Patch routers/sentinelx.py
path = "routers/sentinelx.py"
with open(path, "r") as f:
    content = f.read()

content = content.replace("from ml_models.heatwave_classifier import predict_heatwave_risk", "from core.risk_rules import evaluate_environmental_risk")
content = re.sub(
    r"ml_pred = predict_heatwave_risk\(temp, rh, uv, aqi, wind\)",
    r"risk_result = evaluate_environmental_risk(temp, rh, uv, aqi, wind, getattr(weather, 'is_stale', False))",
    content
)

# In the returned JSON:
replacement = """        "environmental_risk": risk_result,
        "hospital_surge_model": {
            "status": "EXPERIMENTAL_NOT_VALIDATED",
            "message": "Model removed from production alerting due to target leakage. Retained for research."
        },"""

content = re.sub(
    r'"ml_prediction":\s*\{\s*"risk_level":.*?\s*\},',
    replacement,
    content,
    flags=re.DOTALL
)

with open(path, "w") as f:
    f.write(content)

# Patch main.py
path = "main.py"
with open(path, "r") as f:
    content = f.read()

content = content.replace("from ml_models.heatwave_classifier import predict_heatwave_risk", "from core.risk_rules import evaluate_environmental_risk\n    from core.thermal_stress import compute_environmental_score")
content = re.sub(
    r"htsi_result = compute_htsi\([\s\S]*?wind_speed_ms\n    \)",
    r"htsi_result = compute_environmental_score(\n        weather.temperature_c, weather.humidity_pct,\n        weather.uv_index, weather.aqi, weather.wind_speed_ms\n    )",
    content
)
content = re.sub(
    r"ml_pred = predict_heatwave_risk\([\s\S]*?\)",
    r"risk_result = evaluate_environmental_risk(weather.temperature_c, weather.humidity_pct, weather.uv_index, weather.aqi, weather.wind_speed_ms, getattr(weather, 'is_stale', False))",
    content
)
content = re.sub(
    r'"htsi_score": htsi_result\.htsi_score,',
    r'"environmental_score": htsi_result.environmental_score,\n            "apparent_temperature_c": htsi_result.apparent_temperature_c,',
    content
)
content = re.sub(
    r'"risk_tier": htsi_result\.risk_tier,',
    r'"environmental_tier": htsi_result.environmental_tier,',
    content
)

replacement2 = """        "environmental_risk": risk_result,
        "hospital_surge_model": {
            "status": "EXPERIMENTAL_NOT_VALIDATED"
        },"""

content = re.sub(
    r'"ml_prediction":\s*\{[\s\S]*?\},',
    replacement2,
    content
)

with open(path, "w") as f:
    f.write(content)

print("Patched routers/sentinelx.py and main.py successfully.")
