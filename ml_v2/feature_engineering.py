import pandas as pd
import numpy as np

def create_lag_features(df: pd.DataFrame, lag_hours: list, cols: list) -> pd.DataFrame:
    df = df.copy()
    for col in cols:
        for lag in lag_hours:
            df[f'{col}_lag_{lag}h'] = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])[col].shift(lag)
    return df

def create_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    group = df.groupby(['era5_grid_latitude', 'era5_grid_longitude'])
    
    # Must use closed='left' or shift(1) to avoid future leakage in rolling windows
    shifted_temp = group['temperature_c'].shift(1)
    
    # 24h rolling features (causal, excluding current hour)
    df['temperature_c_rolling_max_24h'] = group['temperature_c'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).max()).reset_index(level=[0,1], drop=True)
    df['temperature_c_rolling_min_24h'] = group['temperature_c'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).min()).reset_index(level=[0,1], drop=True)
    df['dew_point_c_rolling_mean_24h'] = group['dew_point_c'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).mean()).reset_index(level=[0,1], drop=True)
    df['relative_humidity_pct_rolling_mean_24h'] = group['relative_humidity_pct'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).mean()).reset_index(level=[0,1], drop=True)
    df['precipitation_mm_rolling_sum_24h'] = group['precipitation_mm'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).sum()).reset_index(level=[0,1], drop=True)
    df['wind_speed_ms_rolling_mean_24h'] = group['wind_speed_ms'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).mean()).reset_index(level=[0,1], drop=True)
    df['wind_speed_ms_rolling_max_24h'] = group['wind_speed_ms'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).max()).reset_index(level=[0,1], drop=True)
    df['wind_speed_ms_rolling_min_24h'] = group['wind_speed_ms'].apply(lambda x: x.shift(1).rolling(24, min_periods=1).min()).reset_index(level=[0,1], drop=True)
    
    return df

def create_seasonal_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    hours = df['timestamp'].dt.hour
    doy = df['timestamp'].dt.dayofyear
    
    df['hour_sin'] = np.sin(2 * np.pi * hours / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * hours / 24.0)
    
    days_in_year = 365.25
    df['doy_sin'] = np.sin(2 * np.pi * doy / days_in_year)
    df['doy_cos'] = np.cos(2 * np.pi * doy / days_in_year)
    return df
