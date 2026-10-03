"""
experimental_ml/heatwave_classifier.py — Legacy Heatwave Risk ML Classifier (EXPERIMENTAL)
===========================================================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

⚠️ LEGACY EXPERIMENTAL RESEARCH MODEL
⚠️ NOT USED FOR OPERATIONAL HEAT FORECASTING
⚠️ NOT CLINICALLY VALIDATED

AUDITED SCIENTIFIC INTEGRITY WARNINGS & KNOWN METHODOLOGICAL PROBLEMS:
1. Target Leakage: Target labels were derived directly from HI and HTSI thresholds
   which were simultaneously supplied to the model as input features.
2. Extreme Class Imbalance: In historical ERA5 data, Class 2 (Critical Emergency) has zero
   training samples (or extreme sparsity), causing the model to never learn genuine critical heatwaves.
3. Temporal Autocorrelation Leakage: Random train_test_split on continuous hourly time-series
   causes temporal leakage between train and test sets, artificially inflating accuracy.
4. Synthetic / Non-Meteorological 48h Trend: Legacy code generated future trends using sine curves
   and pseudo-random Gaussian noise. This is DEPRECATED and REMOVED; operational forecasting must
   rely solely on verified meteorological forecast models or ML V2 calibrated reanalysis.
5. Fabricated Proxies & Inferences: Static fallback AQI and zero-trend lags manufacture false state.
6. Out-of-Distribution Inferences: Day-of-year seasonal variables do not generalize across distinct
   climate zones without full spatial multi-station calibration.

THIS MODULE IS PRESERVED STRICTLY FOR ACADEMIC/EXPLORATORY MLOps ARCHITECTURE REFERENCE.
IT IS NEVER EXPOSED AS LIVE OPERATIONAL HEATWAVE PREDICTION.
"""

from __future__ import annotations

import os
import math
import datetime
import warnings
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Local import — the HTSI calculator from the core package
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.thermal_stress import heat_index_celsius, compute_environmental_score


# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

MODEL_CACHE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "heatwave_rf_model.joblib"
)

RISK_LABELS = {0: "Low/Normal", 1: "High Warning", 2: "Critical Emergency"}

FEATURE_NAMES = [
    "temperature_c",
    "humidity_pct",
    "uv_index",
    "aqi",
    "wind_speed_ms",
    "heat_index_c",
    "htsi_score",
    "day_of_year",
    "temp_trend_24h",  # +ve = warming trend, -ve = cooling
]


# ═══════════════════════════════════════════════════════════════════════════
# Result dataclass
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class HeatwavePrediction:
    risk_level: int              # 0, 1, 2
    risk_label: str              # "Low/Normal", "High Warning", "Critical Emergency"
    confidence: float            # probability of the predicted class
    probabilities: Dict[str, float]   # {label: probability}
    features_used: Dict[str, float]
    status: str = "EXPERIMENTAL_NOT_VALIDATED"
    model_type: str = "EXPERIMENTAL_RESEARCH"
    clinical_validation: bool = False
    operational_use: bool = False
    temperature_trend_48h: Optional[List[float]] = None  # Deprecated: synthetic trend points removed
    forecast_status: str = "UNAVAILABLE / DEPRECATED"


def load_era5_dataset(csv_path: str) -> Tuple[np.ndarray, np.ndarray]:
    """
    Load historical ERA5 weather dataset and compute features/labels for heatwave classification.
    """
    print(f"[heatwave_classifier] Loading real ERA5 dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Parse timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Feature 1: Day of year
    df['day_of_year'] = df['timestamp'].dt.dayofyear
    
    # Feature 2: 24h temperature trend (assuming hourly data, shift by 24)
    # Forward fill to handle any NaNs at the beginning
    df['temp_trend_24h'] = df['temperature_c'] - df['temperature_c'].shift(24)
    df['temp_trend_24h'] = df['temp_trend_24h'].fillna(0.0)
    
    # Feature 3: Proxy UV Index from solar radiation (approx: 1 UV = 25 W/m2)
    df['uv_index'] = (df['solar_radiation_wm2'] / 25.0).clip(upper=14.0)
    
    # Feature 4: Proxy AQI (simulated baseline with seasonal variation for HTSI)
    # Poorer AQI in winter (low doy/high doy), better in monsoon (mid doy)
    base_aqi = 150 - (60 * np.sin(np.pi * df['day_of_year'] / 180))
    noise = np.random.normal(0, 20, len(df))
    df['aqi'] = (base_aqi + noise).clip(lower=20, upper=500)
    
    records_X = []
    records_y = []
    
    for _, row in df.iterrows():
        temp = row['temperature_c']
        rh = row['relative_humidity_pct']
        uv = row['uv_index']
        aqi = row['aqi']
        wind = row['wind_speed_ms']
        doy = row['day_of_year']
        trend = row['temp_trend_24h']
        
        hi = heat_index_celsius(temp, rh)
        htsi_result = compute_environmental_score(temp, rh, uv, aqi, wind)
        htsi = htsi_result.environmental_score
        
        features = [temp, rh, uv, aqi, wind, hi, htsi, doy, trend]
        records_X.append(features)
        
        # Ground-truth labeling (NDMA criteria)
        if hi > 54 or (temp > 45 and htsi > 75):
            label = 2
        elif hi > 41 or htsi > 55:
            label = 1
        else:
            label = 0
            
        records_y.append(label)
        
    X = np.array(records_X, dtype=np.float64)
    y = np.array(records_y, dtype=np.int32)
    
    return X, y


# ═══════════════════════════════════════════════════════════════════════════
# 2.  48-hour temperature trend generator (DEPRECATED)
# ═══════════════════════════════════════════════════════════════════════════

def _generate_48h_trend(current_temp: float, risk_level: int, seed: int = 0) -> Optional[List[float]]:
    """
    DEPRECATED / REMOVED.
    Synthetic sine + random noise trend generation is scientifically invalid.
    Returns None (UNAVAILABLE / DEPRECATED) instead of pseudo-random forecast observations.
    Never present synthetic trend points as forecast observations.
    """
    return None


# ═══════════════════════════════════════════════════════════════════════════
# 3.  HeatwaveModel singleton
# ═══════════════════════════════════════════════════════════════════════════

class HeatwaveModel:
    """
    Singleton Random Forest classifier for heatwave risk prediction.
    Auto-trains on first access if no cached model exists.
    """

    _instance: Optional[HeatwaveModel] = None
    _model: Optional[RandomForestClassifier] = None
    _is_trained: bool = False
    _train_metrics: Dict[str, Any] = {}

    def __new__(cls) -> HeatwaveModel:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def train(self, force: bool = False) -> Dict[str, Any]:
        """
        Train (or retrain) the Random Forest classifier.
        Uses synthetic data; persists model to disk.
        """
        if self._is_trained and not force:
            return self._train_metrics

        era5_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "historical_weather_era5.csv"
        )
        X, y = load_era5_dataset(era5_path)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        print(f"[heatwave_classifier] Training Random Forest "
              f"(n={len(X_train)} train, {len(X_test)} test)...")

        self._model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self._model.fit(X_train, y_train)

        y_pred = self._model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Feature importances
        importances = dict(zip(FEATURE_NAMES, self._model.feature_importances_.tolist()))

        # Class distribution
        unique, counts = np.unique(y, return_counts=True)
        class_dist = {RISK_LABELS.get(int(u), str(u)): int(c) for u, c in zip(unique, counts)}

        self._train_metrics = {
            "accuracy": round(accuracy, 4),
            "total_samples": len(X),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "class_distribution": class_dist,
            "feature_importances": {k: round(v, 4) for k, v in importances.items()},
            "model_type": "RandomForestClassifier",
            "n_estimators": 200,
            "max_depth": 12,
        }

        self._is_trained = True

        # Persist to disk
        try:
            os.makedirs(os.path.dirname(MODEL_CACHE_PATH), exist_ok=True)
            joblib.dump(self._model, MODEL_CACHE_PATH)
            print(f"[heatwave_classifier] Model saved to {MODEL_CACHE_PATH}")
        except Exception as e:
            print(f"[heatwave_classifier] Could not persist model: {e}")

        print(f"[heatwave_classifier] ✅ Training complete — accuracy: {accuracy:.1%}")
        return self._train_metrics

    def _ensure_trained(self) -> None:
        """Load from disk or train from scratch."""
        if self._is_trained and self._model is not None:
            return

        # Try loading from disk first
        if os.path.exists(MODEL_CACHE_PATH):
            try:
                self._model = joblib.load(MODEL_CACHE_PATH)
                self._is_trained = True
                print(f"[heatwave_classifier] Loaded cached model from {MODEL_CACHE_PATH}")
                return
            except Exception:
                pass

        self.train()

    def predict(
        self,
        temperature_c: float,
        humidity_pct: float,
        uv_index: float = 6.0,
        aqi: float = 50.0,
        wind_speed_ms: float = 2.0,
        temp_trend_24h: float = 0.0,
    ) -> HeatwavePrediction:
        """
        Predict 24-hour heatwave risk from current weather conditions.

        Returns a ``HeatwavePrediction`` with risk level, confidence,
        class probabilities, and 48-hour temperature trend.
        """
        self._ensure_trained()

        hi = heat_index_celsius(temperature_c, humidity_pct)
        htsi = compute_environmental_score(temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms).environmental_score
        doy = datetime.datetime.now().timetuple().tm_yday

        features = np.array([[
            temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms,
            hi, htsi, doy, temp_trend_24h
        ]])

        risk_level = int(self._model.predict(features)[0])
        probas = self._model.predict_proba(features)[0]

        # Map probabilities to labels
        prob_dict = {}
        for cls_idx, cls_label in RISK_LABELS.items():
            if cls_idx < len(probas):
                prob_dict[cls_label] = round(float(probas[cls_idx]), 4)
            else:
                prob_dict[cls_label] = 0.0

        confidence = round(float(max(probas)), 4)

        # 48h trend is DEPRECATED and UNAVAILABLE; never return synthetic observations
        trend_48h = _generate_48h_trend(
            temperature_c, risk_level,
            seed=int(temperature_c * 100 + humidity_pct)
        )

        return HeatwavePrediction(
            risk_level=risk_level,
            risk_label=RISK_LABELS.get(risk_level, "Unknown"),
            confidence=confidence,
            probabilities=prob_dict,
            features_used={
                name: round(float(features[0][i]), 4)
                for i, name in enumerate(FEATURE_NAMES)
            },
            status="EXPERIMENTAL_NOT_VALIDATED",
            model_type="EXPERIMENTAL_RESEARCH",
            clinical_validation=False,
            operational_use=False,
            temperature_trend_48h=trend_48h,
            forecast_status="UNAVAILABLE / DEPRECATED"
        )

    @classmethod
    def get_instance(cls) -> HeatwaveModel:
        """Alias for get_model() singleton access."""
        return get_model()

    def get_feature_importance(self) -> Dict[str, float]:
        """Return feature importance scores from the trained model."""
        self._ensure_trained()
        return dict(zip(FEATURE_NAMES, self._model.feature_importances_.tolist()))

    def get_train_metrics(self) -> Dict[str, Any]:
        """Return training metrics from the last training run."""
        self._ensure_trained()
        return self._train_metrics


# HeatwaveClassifier class alias for backward compatibility
HeatwaveClassifier = HeatwaveModel


# ═══════════════════════════════════════════════════════════════════════════
# Module-level convenience
# ═══════════════════════════════════════════════════════════════════════════

_model_instance: Optional[HeatwaveModel] = None


def get_model() -> HeatwaveModel:
    """Get the global singleton model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = HeatwaveModel()
    return _model_instance


def predict_heatwave_risk(
    temperature_c: float,
    humidity_pct: float,
    uv_index: float = 6.0,
    aqi: float = 50.0,
    wind_speed_ms: float = 2.0,
    temp_trend_24h: float = 0.0,
) -> HeatwavePrediction:
    """Module-level shorthand for prediction."""
    return get_model().predict(
        temperature_c, humidity_pct, uv_index, aqi, wind_speed_ms, temp_trend_24h
    )
