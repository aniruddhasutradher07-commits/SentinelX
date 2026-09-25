import pandas as pd
import pytest
from ml_v2.validation import validate_chronological

def test_chronological_ordering():
    df = pd.DataFrame({
        'timestamp': pd.to_datetime(['2021-01-02', '2021-01-01']),
        'era5_grid_latitude': [20.0, 20.0],
        'era5_grid_longitude': [85.0, 85.0]
    })
    with pytest.raises(ValueError):
        validate_chronological(df)
