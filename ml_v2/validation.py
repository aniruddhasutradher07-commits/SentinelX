import pandas as pd

def validate_schema(df: pd.DataFrame):
    required_cols = [
        'timestamp', 'era5_grid_latitude', 'era5_grid_longitude',
        'temperature_c', 'dew_point_c', 'relative_humidity_pct',
        'apparent_temperature_c', 'wind_u_ms', 'wind_v_ms',
        'wind_speed_ms', 'wind_direction_deg', 'pressure_hpa',
        'precipitation_mm', 'cloud_cover_pct'
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
            
    if df.duplicated(subset=['timestamp', 'era5_grid_latitude', 'era5_grid_longitude']).any():
        raise ValueError("Duplicate timestamp for grid point detected.")
        
    if df.isnull().any().any():
        raise ValueError("Dataset contains missing values. Silent imputation is forbidden.")

def validate_chronological(df: pd.DataFrame):
    for _, group in df.groupby(['era5_grid_latitude', 'era5_grid_longitude']):
        if not group['timestamp'].is_monotonic_increasing:
            raise ValueError("Data is not strictly chronologically ordered.")
