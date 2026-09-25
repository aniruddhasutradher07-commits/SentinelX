import pandas as pd

def create_target_temperature_t24(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['target_temperature_c_t24'] = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])['temperature_c'].shift(-24)
    return df

def create_target_max_temperature_24h(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    indexer = pd.api.indexers.FixedForwardWindowIndexer(window_size=24)
    df['target_max_temperature_c_24h'] = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])['temperature_c'].apply(lambda x: x.shift(-1).rolling(window=indexer).max()).reset_index(level=[0,1], drop=True)
    return df

def create_target_apparent_temperature_t24(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['target_apparent_temperature_c_t24'] = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])['apparent_temperature_c'].shift(-24)
    return df

def create_target_max_apparent_temperature_24h(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    indexer = pd.api.indexers.FixedForwardWindowIndexer(window_size=24)
    df['target_max_apparent_temperature_c_24h'] = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])['apparent_temperature_c'].apply(lambda x: x.shift(-1).rolling(window=indexer).max()).reset_index(level=[0,1], drop=True)
    return df

def create_binary_heat_exposure_target(df: pd.DataFrame, threshold: float) -> pd.DataFrame:
    df = df.copy()
    df['target_binary_heat_exposure'] = (df['target_max_apparent_temperature_c_24h'] >= threshold).astype(float)
    return df
