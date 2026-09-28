# HeatGuard AI — Data Directory & Provenance Registry

This directory contains spatial geometries, benchmark references, and machine learning artifacts required by HeatGuard AI.

---

## 📁 Directory Structure & File Catalog

```text
data/
├── README.md                                 # This data registry & provenance document
├── wards_bhubaneswar.geojson                 # GeoJSON polygons for Bhubaneswar's 67 municipal wards
├── odisha_districts.geojson                  # GeoJSON boundaries for Odisha's 30 administrative districts
├── ndma_heatwave_benchmarks.csv              # Historical NDMA Heat Action Plan validation benchmarks
│
├── ml_v2/                                    # Machine Learning V2 Artifacts & Datasets
│   ├── models/
│   │   ├── ml_v2_model.joblib                # Trained HistGradientBoostingRegressor model (438 KB)
│   │   └── ml_v2_model_metadata.json         # Feature definitions, hyperparameters, and validation metrics
│   ├── era5_grid_mapping.csv                 # Coordinate-to-district grid mapping
│   ├── historical_weather_era5_cds_2021_2025.csv # 262,656 hourly cleaned ERA5 training records (2021–2025)
│   └── predictions/
│       └── predictions.csv                   # Precomputed test-set inference predictions
│
└── physiology_reference/                     # Physiological Reference Metadata
    └── dataset_schema.json                   # Schema definition for offline biometric thermal stress research
```

---

## 🔒 Restricted / Third-Party Datasets Notice

In compliance with open-source licensing and data protection rules:
- **PhysioNet Stress Dataset:** The raw biometric dataset (*Wearable Device Dataset from Induced Stress and Structured Exercise Sessions*) is intentionally excluded from the repository. Only public reference schemas (`dataset_schema.json`) are maintained in version control.
- **Local Database:** SQLite operational databases (`*.db`) are generated dynamically at runtime and excluded via `.gitignore` to prevent committing ephemeral state.
- **Data Integrity:** All included GeoJSON and CSV datasets are public, open government, or open science reanalysis records with zero private personal identifiable information (PII).
