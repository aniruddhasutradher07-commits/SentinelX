import os
import pytest
import pandas as pd

FILE_PATH = "data/ml_v2/historical_weather_clean.csv"

@pytest.fixture
def data():
    if not os.path.exists(FILE_PATH):
        pytest.skip(f"File not found: {FILE_PATH}, pipeline might be running")
    return pd.read_csv(FILE_PATH)

def test_chronological_order(data):
    # Ensure it's sorted by time
    assert data['timestamp'].is_monotonic_increasing or data.sort_values(by=['timestamp', 'era5_grid_latitude', 'era5_grid_longitude']).equals(data), "Data is not in chronological order"

def test_timestamp_uniqueness_per_grid(data):
    dups = data.duplicated(subset=['timestamp', 'era5_grid_latitude', 'era5_grid_longitude']).sum()
    assert dups == 0, "Duplicate timestamps found per grid"

def test_variable_existence(data):
    expected_vars = [
        'timestamp', 'era5_grid_latitude', 'era5_grid_longitude', 
        'temperature_c', 'dew_point_c', 'wind_u_ms', 'wind_v_ms', 
        'wind_speed_ms', 'wind_direction_deg', 'pressure_hpa', 
        'precipitation_mm', 'cloud_cover_pct'
    ]
    for var in expected_vars:
        assert var in data.columns, f"Missing variable: {var}"

def test_precipitation_bounds(data):
    assert data['precipitation_mm'].min() >= 0, "Precipitation contains negative values"

def test_wind_bounds(data):
    assert data['wind_speed_ms'].min() >= 0, "Wind speed contains negative values"
    assert data['wind_direction_deg'].min() >= 0, "Wind direction is negative"
    assert data['wind_direction_deg'].max() <= 360, "Wind direction > 360"

def test_no_synthetic_values(data):
    synthetic = ['synthetic', 'admissions', 'risk_score', 'imputed']
    for col in data.columns:
        assert not any(s in col.lower() for s in synthetic), f"Found potential synthetic column: {col}"
