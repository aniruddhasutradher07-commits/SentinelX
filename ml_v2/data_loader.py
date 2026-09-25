import pandas as pd
from .validation import validate_schema, validate_chronological

def load_data(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort strictly chronologically per grid point
    df = df.sort_values(by=['era5_grid_latitude', 'era5_grid_longitude', 'timestamp']).reset_index(drop=True)
    
    validate_schema(df)
    validate_chronological(df)
    return df
