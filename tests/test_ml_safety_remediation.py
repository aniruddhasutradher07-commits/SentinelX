"""
SentinelX / HeatGuard AI — ML Safety Remediation Test Suite
============================================================
Validates P0, P1, and P2 safety remediation requirements:
1. Application startup does not train legacy ML models.
2. Legacy heatwave classifier is isolated and never exposed as operational LIVE model.
3. Hospital admissions remain strictly null.
4. Mortality remains strictly null.
5. Synthetic 48h random-walk forecast is deprecated/removed and never returned as LIVE forecast.
6. ML V2 refuses/flags insufficient historical lag buffer with INSUFFICIENT_HISTORY.
7. ML V2 metrics remain exactly tied to verified metadata (MAE 1.0829°C, RMSE 1.3862°C, R² 0.9055).
8. No misleading ML claims remain in public UI/docs.
"""

import os
import json
import pytest
import inspect
from fastapi.testclient import TestClient

from main import app, lifespan
from experimental_ml.heatwave_classifier import (
    HeatwaveModel,
    HeatwaveClassifier,
    get_model,
    predict_heatwave_risk,
    _generate_48h_trend
)
from prediction_engine import PredictionEngine, NDMA_ANCHORS
import ml_v2.live_features as lf

client = TestClient(app)


def test_startup_does_not_train_legacy_ml():
    """1. Application startup must NEVER train legacy ML models."""
    lifespan_source = inspect.getsource(lifespan)
    assert "model.train()" not in lifespan_source, "lifespan must not synchronously train ML model"
    assert "HeatwaveClassifier.get_instance().train()" not in lifespan_source
    assert "train(" not in lifespan_source, "Startup lifespan should not call model training"


def test_legacy_heatwave_classifier_isolation():
    """2. Legacy heatwave classifier is isolated and never exposed as operational LIVE model."""
    pred = predict_heatwave_risk(38.5, 65.0)
    assert pred.status == "EXPERIMENTAL_NOT_VALIDATED"
    assert pred.model_type == "EXPERIMENTAL_RESEARCH"
    assert pred.operational_use is False
    assert pred.clinical_validation is False
    assert pred.forecast_status == "UNAVAILABLE / DEPRECATED"

    # Also test get_instance alias
    instance = HeatwaveClassifier.get_instance()
    assert isinstance(instance, HeatwaveModel)


def test_hospital_admissions_remain_null():
    """3. Hospital admissions remain strictly null across all engines and research routes."""
    # PredictionEngine static interface
    surge_res = PredictionEngine.predict_surge()
    assert surge_res["predicted_admissions"] is None
    assert surge_res["status"] == "EXPERIMENTAL_NOT_VALIDATED"
    assert surge_res["clinical_validation"] is False

    # Pan India stress engine
    from services.pan_india_engine import compute_biometeorological_profile
    stress = compute_biometeorological_profile(38.0, 65.0, 2.0, 600.0, 20.25, 85.75, "Bhubaneswar")
    assert stress.get("estimated_er_admissions_day") is None
    assert stress.get("predicted_admissions") is None

    # Ward hospital demand research endpoint
    resp = client.get("/api/v1/wards/W21/hospital-demand")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("admissions_prediction") is None
    for forecast in data.get("multi_day_surge_forecast", []):
        assert forecast.get("predicted_admissions") is None


def test_mortality_remains_null():
    """4. Mortality remains strictly null across all engines and research routes."""
    surge_res = PredictionEngine.predict_surge()
    assert surge_res["predicted_mortality"] is None

    from services.pan_india_engine import compute_biometeorological_profile
    stress = compute_biometeorological_profile(38.0, 65.0, 2.0, 600.0, 20.25, 85.75, "Bhubaneswar")
    assert stress.get("predicted_mortality") is None


def test_synthetic_48h_random_walk_trend_deprecated():
    """5. Synthetic 48h random-walk trend is removed and never returned as LIVE forecast."""
    trend = _generate_48h_trend(40.0, 2)
    assert trend is None, "Synthetic sine+noise 48h trend must be None / removed"

    pred = predict_heatwave_risk(41.0, 70.0)
    assert pred.temperature_trend_48h is None
    assert "UNAVAILABLE" in pred.forecast_status


def test_ml_v2_refuses_insufficient_historical_lag_buffer(monkeypatch):
    """6. ML V2 flags insufficient historical lag buffer with INSUFFICIENT_HISTORY / UNAVAILABLE."""
    import requests

    class IncompleteHistoryResponse:
        def __init__(self):
            self.status_code = 200
        def json(self):
            # 10 distinct hourly timestamps (insufficient: requires 25)
            times = [f"2026-09-24T{h:02d}:00:00" for h in range(10)]
            return {
                "hourly": {
                    "time": times,
                    "temperature_2m": [30.0] * 10,
                    "relative_humidity_2m": [65.0] * 10,
                    "wind_speed_10m": [10.0] * 10,
                    "wind_direction_10m": [180.0] * 10,
                    "precipitation": [0.0] * 10,
                    "surface_pressure": [1013.25] * 10,
                    "cloud_cover": [0.0] * 10,
                    "weather_code": [0.0] * 10,
                    "wind_gusts_10m": [0.0] * 10,
                }
            }
        def raise_for_status(self):
            pass

    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: IncompleteHistoryResponse())

    # Direct feature builder check
    res = lf.build_live_feature_vector(20.25, 85.75, "2026-09-24T12:00:00Z")
    assert res["status"] == "DATA_UNAVAILABLE"
    assert res.get("data_state") == "INSUFFICIENT_HISTORY"

    # API endpoint check
    resp = client.get("/api/v1/ml-v2/forecast?lat=20.25&lon=85.75")
    assert resp.status_code == 200
    api_data = resp.json()
    assert api_data["status"] == "DATA_UNAVAILABLE"
    assert api_data.get("data_state") == "INSUFFICIENT_HISTORY"


def test_ml_v2_metrics_tied_to_verified_metadata():
    """7. ML V2 metrics remain exactly tied to verified metadata."""
    meta_path = os.path.join("data", "ml_v2", "models", "ml_v2_model_metadata.json")
    assert os.path.exists(meta_path), "ml_v2_model_metadata.json must exist"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_type"] == "HistGradientBoosting"
    assert meta["target_definition"] == "NEXT_24H_MAX_APPARENT_TEMPERATURE"
    assert len(meta["features"]) == 36

    # Verify temporal splits: 2021-2023 Train, 2024 Val, 2025 Test
    assert meta["train_period"][0].startswith("2021")
    assert meta["train_period"][1].startswith("2023")
    assert meta["val_period"][0].startswith("2024")
    assert meta["test_period"][0].startswith("2025")

    # Verify holdout metrics on 2025 holdout
    test_metrics = meta["test_metrics"]
    assert round(test_metrics["mae"], 4) == 1.0829
    assert round(test_metrics["rmse"], 4) == 1.3862
    assert round(test_metrics["r2"], 4) == 0.9055


def test_no_misleading_ml_claims_in_public_ui_and_docs():
    """8. No misleading unvalidated ML claims remain presented as live operational truth."""
    # Check NDMA anchors
    for anchor in NDMA_ANCHORS:
        assert anchor.get("status") == "STATIC REFERENCE / BENCHMARK ONLY"

    # Check model validation endpoint
    val_resp = client.get("/api/v1/model-validation")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["status"] == "EXPERIMENTAL_NOT_VALIDATED"
    rf = val_data["models"]["random_forest_classifier"]
    assert rf["operational_use"] is False
    assert "LEGACY / EXPERIMENTAL" in rf["provenance"]

    surge = val_data["models"]["surge_2stage_forecaster"]
    assert surge["clinical_validation"] is False
    assert surge["predicted_admissions"] is None
    assert surge["predicted_mortality"] is None
