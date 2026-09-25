# Configuration for ML V2 Pipeline
FEATURES_CURRENT = ['temperature_c', 'relative_humidity_pct', 'dew_point_c', 'apparent_temperature_c', 'wind_u_ms', 'wind_v_ms', 'wind_speed_ms', 'precipitation_mm', 'pressure_hpa', 'cloud_cover_pct']
LAG_HOURS = [1, 3, 6, 12, 24]
ROLLING_HOURS = [3, 6, 12, 24]
TARGET_HORIZON = 24
