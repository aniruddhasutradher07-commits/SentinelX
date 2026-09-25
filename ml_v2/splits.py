import pandas as pd

def chronological_split(df: pd.DataFrame, train_end: str, val_end: str):
    train_df = df[df['timestamp'] <= train_end].copy()
    val_df = df[(df['timestamp'] > train_end) & (df['timestamp'] <= val_end)].copy()
    test_df = df[df['timestamp'] > val_end].copy()
    
    print(f"Train range: {train_df['timestamp'].min()} to {train_df['timestamp'].max()}")
    print(f"Val range: {val_df['timestamp'].min()} to {val_df['timestamp'].max()}")
    print(f"Test range: {test_df['timestamp'].min()} to {test_df['timestamp'].max()}")
    
    return train_df, val_df, test_df
