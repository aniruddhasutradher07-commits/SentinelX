# HeatGuard AI — Experimental ML Research Directory

This directory contains experimental machine learning research and legacy exploratory models developed during the exploratory phase of the project.

---

## ⚠️ Research Status & Demarcation

The code in this directory (`heatwave_classifier.py`) is preserved strictly for **exploratory MLOps research** and architectural demonstration.

### Key Boundaries:
1. **Not Part of Production Safety Alerts:** Operational heat health tiers on the HeatGuard AI platform are calculated deterministically using standard bio-meteorological math (ISO 7243 WBGT and Steadman Heat Index).
2. **Synthetic Target Demarcation:** The exploratory Random Forest classifier in this directory was prototyped using synthetic target heuristics. In accordance with HeatGuard AI's Responsible AI guidelines, this model is **not** validated and is **never** presented as an operational medical or clinical predictor.
3. **Primary Validated ML Model:** The validated environmental forecasting model used by the live platform is **ML V2** (`data/ml_v2/models/ml_v2_model.joblib`), which is documented in [`docs/validation/README.md`](../docs/validation/README.md) and trained on 262k hourly records of Copernicus ERA5 reanalysis data.
