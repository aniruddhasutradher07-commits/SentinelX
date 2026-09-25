import pandas as pd
import numpy as np

class PersistenceBaseline:
    def predict(self, X: pd.DataFrame, feature_col: str) -> np.ndarray:
        return X[feature_col].values

class SeasonalBaseline:
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return np.zeros(len(X)) # Placeholder
