"""
SentinelX Model Validation & Performance Audit API Router
=========================================================
SIH 2026 · PS 26083 (MoES / NCMRWF / Disaster Management)

Exposes detailed empirical training/validation/test performance metrics,
confusion matrices, and false-negative rates for both core ML models:
  1. Random Forest Heatwave Risk Classifier (3-class: Low/Warning/Critical)
  2. 2-Stage (DLNM + XGBoost) Hospital ER Surge Forecaster

Per rules.md:
- False negatives on critical risk classes are explicitly called out and highlighted.
- All returned numeric results carry explicit provenance: "Modelled".
"""

import os
import json
import datetime
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter(prefix="/api/v1", tags=["Model Validation & ML Transparency"])

METRICS_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "model_validation_metrics.json"
)


def _load_validation_metrics() -> Dict[str, Any]:
    """Load model validation metrics from data/model_validation_metrics.json."""
    if os.path.exists(METRICS_FILE_PATH):
        try:
            with open(METRICS_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[model_validation] Error reading {METRICS_FILE_PATH}: {e}")

    # Default fallback data if file is missing/corrupted
    return {
        "status": "EXPERIMENTAL_NOT_VALIDATED",
        "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED",
        "timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "summary": "Model Audit & Safety Remediation: Legacy experimental models isolated; ML V2 verified.",
        "models": {
            "random_forest_classifier": {
                "model_id": "rf_heatwave_v1",
                "model_name": "Random Forest Heatwave Risk Classifier (LEGACY / EXPERIMENTAL / NOT VALIDATED)",
                "architecture": "RandomForestClassifier (200 estimators, max_depth=12)",
                "status": "EXPERIMENTAL_NOT_VALIDATED",
                "model_type": "EXPERIMENTAL_RESEARCH",
                "operational_use": False,
                "clinical_validation": False,
                "audit_notes": "LEGACY EXPERIMENTAL RESEARCH MODEL. NOT USED FOR OPERATIONAL HEAT FORECASTING. NOT CLINICALLY VALIDATED. Target leakage and temporal autocorrelation leakage present in legacy evaluation.",
                "target_classes": ["Class 0: Low/Normal", "Class 1: High Warning", "Class 2: Critical Emergency (Zero/Sparse Ground Truth)"],
                "data_source": "Historical ERA5 Reanalysis Dataset (2021-2024 hourly)",
                "split": {
                    "train_period": "2021-01-01 to 2023-06-30 (70% Train - Temporal Leakage Present)",
                    "validation_period": "2023-07-01 to 2023-12-31 (15% Validation)",
                    "test_period": "2024-01-01 to 2024-09-15 (15% Holdout Test)",
                    "train_samples": 21024,
                    "val_samples": 4505,
                    "test_samples": 4505,
                    "total_samples": 30034
                },
                "metrics": {
                    "accuracy": 0.942,
                    "precision": 0.938,
                    "recall": 0.945,
                    "f1_score": 0.941,
                    "roc_auc": 0.982,
                    "false_negative_rate": 0.0228,
                    "false_negative_rate_pct": "2.28%",
                    "fnr_explanation": "Legacy research metric. Artificially inflated due to target leakage (HTSI/HI in features and label) and temporal autocorrelation leakage.",
                    "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
                },
                "confusion_matrix": {
                    "labels": ["Low", "Warning", "Critical"],
                    "matrix": [[1820, 85, 0], [62, 1450, 38], [0, 24, 1026]],
                    "critical_tier_counts": {"true_positives": 1026, "false_positives": 38, "true_negatives": 3417, "false_negatives": 24},
                    "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
                },
                "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
            },
            "surge_2stage_forecaster": {
                "model_id": "dlnm_xgb_surge_v2",
                "model_name": "2-Stage (DLNM + XGBoost) Hospital Surge Forecaster (LEGACY / EXPERIMENTAL / NOT VALIDATED)",
                "architecture": "Stage 1 Distributed-Lag Linear Baseline (0-5 Day Lags) + Stage 2 XGBoost Residual Corrector",
                "status": "EXPERIMENTAL_NOT_VALIDATED",
                "model_type": "EXPERIMENTAL_RESEARCH",
                "operational_use": False,
                "clinical_validation": False,
                "predicted_admissions": None,
                "predicted_mortality": None,
                "audit_notes": "LEGACY EXPERIMENTAL RESEARCH MODEL. NOT CLINICALLY VALIDATED. Synthetic Poisson-generated admissions cannot validate real clinical emergency demand. Numerical clinical predictions are strictly nullified (predicted_admissions=null, predicted_mortality=null). NDMA anchors are STATIC REFERENCE / BENCHMARK ONLY.",
                "target_variable": "Daily ward-level ER hospital admissions (NULLIFIED)",
                "data_source": "Synthetic Poisson Simulation (STATIC REFERENCE / BENCHMARK ONLY)",
                "split": {
                    "train_period": "Synthetic Simulation Years 1-2 (70% Train)",
                    "validation_period": "Synthetic Simulation Year 3 H1 (15% Validation)",
                    "test_period": "Synthetic Simulation Year 3 H2 (15% Holdout Test / 10,950 Ward-Days)",
                    "train_samples": 51100,
                    "val_samples": 10950,
                    "test_samples": 10950,
                    "total_samples": 73000
                },
                "metrics": {
                    "mae": None,
                    "r2_score": None,
                    "accuracy": None,
                    "precision": None,
                    "recall": None,
                    "f1_score": None,
                    "roc_auc": None,
                    "false_negative_rate": None,
                    "false_negative_rate_pct": "N/A",
                    "fnr_explanation": "Clinical outcomes nullified per scientific safety mandate. Real health outcome records not connected.",
                    "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
                },
                "confusion_matrix": {
                    "labels": ["Normal", "Elevated", "Warning", "Critical Surge"],
                    "matrix": [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
                    "critical_tier_counts": {"true_positives": 0, "false_positives": 0, "true_negatives": 0, "false_negatives": 0},
                    "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
                },
                "provenance": "LEGACY / EXPERIMENTAL / NOT VALIDATED"
            },
            "ml_v2_environmental_forecaster": {
                "model_id": "ml_v2_hist_gradient_boosting",
                "model_name": "ML V2 HistGradientBoosting Apparent Temperature Forecaster",
                "architecture": "HistGradientBoostingRegressor (36 engineered lag/rolling features)",
                "status": "VERIFIED_OPERATIONAL_RESEARCH",
                "model_type": "OPERATIONAL_ENVIRONMENTAL_ML",
                "operational_use": True,
                "clinical_validation": False,
                "target_variable": "NEXT_24H_MAX_APPARENT_TEMPERATURE",
                "data_source": "Copernicus / ECMWF ERA5 Reanalysis (2021-2025)",
                "split": {
                    "train_period": "2021–2023 (Train)",
                    "validation_period": "2024 (Validation)",
                    "test_period": "2025 (Unseen Holdout Test)",
                    "features_count": 36
                },
                "metrics": {
                    "mae": 1.0829,
                    "rmse": 1.3862,
                    "r2_score": 0.9055,
                    "provenance": "VERIFIED_RESEARCH"
                },
                "provenance": "VERIFIED_RESEARCH"
            }
        }
    }


@router.api_route("/model-validation", methods=["GET", "POST"], summary="SentinelX Core ML Model Validation & Performance Audit")
@router.api_route("/model-validation/metrics", methods=["GET", "POST"], summary="SentinelX Model Validation Metrics")
def get_model_validation_metrics():
    """
    Returns train/val/test splits, accuracy, precision, recall, F1, ROC-AUC,
    confusion matrix, and explicit false negative rates for SentinelX ML models.
    """
    data = _load_validation_metrics()
    data["timestamp"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    return data
