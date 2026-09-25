import os
import pytest
import pandas as pd

FILE_PATH = "data/ml_v2/era5_7day_clean.csv"

@pytest.fixture
def data():
    assert os.path.exists(FILE_PATH), f"File not found: {FILE_PATH}"
    return pd.read_csv(FILE_PATH)

def test_exactly_168_hourly_timestamps(data):
    # A single grid point should have 168 hours (7 days)
    # The file has multiple grid points
    grid_points = data.groupby(['era5_grid_latitude', 'era5_grid_longitude']).size()
    for gp, count in grid_points.items():
        assert count == 168, f"Grid point {gp} has {count} timestamps instead of 168"

def test_expected_grid(data):
    # Depending on bounds, [20.5, 20.25] lat and [85.75, 86.0] lon
    lats = data['era5_grid_latitude'].unique()
    lons = data['era5_grid_longitude'].unique()
    assert len(lats) == 2, f"Expected 2 latitudes, got {len(lats)}"
    assert len(lons) == 2, f"Expected 2 longitudes, got {len(lons)}"

def test_expected_variables_exist(data):
    expected_vars = [
        'temperature_c', 'dew_point_c', 'wind_u_ms', 'wind_v_ms', 
        'wind_speed_ms', 'wind_direction_deg', 'pressure_hpa', 
        'precipitation_mm', 'cloud_cover_pct'
    ]
    for var in expected_vars:
        assert var in data.columns, f"Variable {var} missing"

def test_no_negative_precipitation(data):
    invalid = data[data['precipitation_mm'] < 0]
    # Small floating point issues from cfgrib might exist, we check strictly less than -1e-6
    invalid = invalid[invalid['precipitation_mm'] < -1e-6]
    assert len(invalid) == 0, "Found negative precipitation"

def test_no_duplicate_timestamps_per_grid(data):
    duplicates = data.duplicated(subset=['timestamp', 'era5_grid_latitude', 'era5_grid_longitude']).sum()
    assert duplicates == 0, "Duplicate timestamps found for the same grid point"

def test_no_synthetic_or_future_variables(data):
    # Ensure no synthetic generation leakage
    synthetic_vars = ['risk_score', 'admissions', 'predicted_admissions']
    for var in synthetic_vars:
        assert var not in data.columns, f"Found synthetic variable: {var}"
