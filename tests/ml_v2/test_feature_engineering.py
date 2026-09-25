import pandas as pd
import numpy as np
from ml_v2.feature_engineering import create_lag_features, create_rolling_features, create_seasonal_features

def test_lag_correctness():
    df = pd.DataFrame({
        'era5_grid_latitude': [20.0, 20.0],
        'era5_grid_longitude': [85.0, 85.0],
        'temperature_c': [25.0, 30.0]
    })
    res = create_lag_features(df, [1], ['temperature_c'])
    assert np.isnan(res['temperature_c_lag_1h'].iloc[0])
    assert res['temperature_c_lag_1h'].iloc[1] == 25.0

def test_rolling_causality():
    df = pd.DataFrame({
        'era5_grid_latitude': [20.0]*5,
        'era5_grid_longitude': [85.0]*5,
        'temperature_c': [1, 2, 3, 4, 5],
        'dew_point_c': [1]*5, 'relative_humidity_pct': [1]*5, 'precipitation_mm': [1]*5, 'wind_speed_ms': [1]*5
    })
    res = create_rolling_features(df)
    # The max rolling of previous 24h at index 1 (which only has 1 previous) should be 1.0, not 2.0
    assert np.isnan(res['temperature_c_rolling_max_24h'].iloc[0])
    assert res['temperature_c_rolling_max_24h'].iloc[1] == 1.0
