# HeatGuard AI — Research & Experimental Boundaries

To uphold the highest standards of scientific integrity and Responsible AI during Smart India Hackathon 2026, HeatGuard AI strictly defines the operational and research boundaries of the platform.

---

## 🚫 What HeatGuard AI Is NOT

1. **NOT a Temperature-Only Dashboard:**  
   HeatGuard AI evaluates *what the weather will do to human bodies*, translating dry-bulb temperature, humidity, solar radiation, and wind into physiological heat stress metrics (WBGT, UTCI, Heat Index).

2. **NOT a Clinical Diagnostic System:**  
   The platform produces decision-support indices for municipal administration, disaster response staging, and occupational safety. It does not provide medical diagnoses, triage patients, or replace certified clinical judgment.

3. **NOT a Validated Hospital Admissions or Mortality Predictor:**  
   While architectural endpoints for healthcare capacity planning exist (`/api/v1/wards/{ward_no}/hospital-demand`), clinical outcome numbers (expected admissions, mortality probability) are explicitly returned as **`NULL` / `UNAVAILABLE`**. HeatGuard AI does not fabricate clinical statistics in the absence of verified, HIPAA/DPDP-compliant hospital electronic health records.

4. **NOT an Active Emergency Carrier Dispatch System:**  
   All broadcast triggers and emergency alerts executed in the demonstration platform operate in **`SIMULATED / DRY-RUN`** mode. No real SMS gateways are triggered, and no actual field emergency personnel are dispatched.

---

## 🔬 Experimental Machine Learning (ML V2) Boundaries

- **Prediction Scope:** The ML V2 model (`ml_v2_model.joblib`) predicts an **environmental variable** — namely, the `NEXT_24H_MAX_APPARENT_TEMPERATURE` across spatial coordinate grids.
- **Independence from Operational Tiers:** The life-critical municipal alert tiers (Green, Yellow, Orange, Red) are computed using **deterministic bio-meteorological math** (Steadman, ISO 7243 WBGT). ML outputs do not override deterministic safety thresholds.
- **Labeling:** All ML predictions on the dashboard are prominently tagged with the badge **`[EXPERIMENTAL]`**.

---

## 📊 Offline Reference Datasets

### 1. PhysioNet Stress Study Reference
- **Dataset:** *Wearable Device Dataset from Induced Stress and Structured Exercise Sessions* (PhysioNet).
- **Project Role:** Used strictly as an offline architectural reference for physiological thermal response curves.
- **Status:** **`EXPERIMENTAL / REFERENCE`**. Not connected as a live human biometric monitor.

### 2. External Feeds Without Credentials
- When credentials for official government portals (CPCB OGD or IMD) are not configured in the host environment, HeatGuard AI transparently reports:
  ```json
  {
    "status": "CREDENTIALS_NOT_CONFIGURED",
    "notice": "Official credentials not provided in environment; relying on verified meteorological fallback."
  }
  ```
  The platform never invents synthetic numbers and labels them as live official government data.
