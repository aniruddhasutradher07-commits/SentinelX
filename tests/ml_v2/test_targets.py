import pandas as pd
from ml_v2.targets import create_target_temperature_t24

def test_target_horizon():
    df = pd.DataFrame({
        'era5_grid_latitude': [20.0]*25,
        'era5_grid_longitude': [85.0]*25,
        'temperature_c': list(range(25))
    })
    res = create_target_temperature_t24(df)
    assert res['target_temperature_c_t24'].iloc[0] == 24.0
