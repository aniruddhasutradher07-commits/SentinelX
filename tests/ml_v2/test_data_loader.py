import pandas as pd
import pytest
from ml_v2.validation import validate_schema, validate_chronological

def test_missing_column_rejection():
    df = pd.DataFrame({'timestamp': ['2021-01-01']})
    with pytest.raises(ValueError):
        validate_schema(df)
        
def test_duplicate_rejection():
    df = pd.DataFrame({
        'timestamp': ['2021-01-01', '2021-01-01'],
        'era5_grid_latitude': [20.0, 20.0],
        'era5_grid_longitude': [85.0, 85.0],
        'temperature_c': [20, 20], 'dew_point_c': [10, 10], 'relative_humidity_pct': [50, 50],
        'apparent_temperature_c': [20, 20], 'wind_u_ms': [1, 1], 'wind_v_ms': [1, 1],
        'wind_speed_ms': [1, 1], 'wind_direction_deg': [90, 90], 'pressure_hpa': [1000, 1000],
        'precipitation_mm': [0, 0], 'cloud_cover_pct': [0, 0]
    })
    with pytest.raises(ValueError):
        validate_schema(df)
