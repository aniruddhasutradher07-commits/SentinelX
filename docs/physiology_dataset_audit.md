# PhysioNet Wearable Device Dataset Audit

## Dataset Overview
- **Dataset Version**: 1.0.1
- **Total Files**: 710 files
- **Total Size**: 306 MB
- **Location**: `data/wearable-device-dataset-from-induced-stress-and-structured-exercise-sessions-1.0.1`

## Subjects and Sessions
- **Number of Subjects/Participants**: 36 total (18 from Stage 1 labeled `S01-S18`, 18 from Stage 2 labeled `f01-f18`).
- **Number of Sessions/Experiments**: 3 main activities (`STRESS`, `AEROBIC`, `ANAEROBIC`), giving a potential for ~108 sessions (some participants did not complete all protocols).
- **Constraints/Anomalies**: Bluetooth disconnections, empty files (e.g., S01 IBI), missed protocols (e.g., S12 missed aerobic), and sensor coverage issues (e.g., f07). Detailed in `data_constraints.txt`.

## Signal Definitions (from `Data_Dictionary.csv`)

| Code | Variable Name | Description | Sampling Frequency (Hz) | Units |
|---|---|---|---|---|
| **EDA** | Electrodermal Activity | Data from the electrodermal activity sensor | 4 | microsiemens (uS) |
| **TEMP** | Skin Temperature | Data from temperature sensor | 4 | Celsius (°C) |
| **BVP** | Blood Volume Pulse | Data from photoplethysmograph | 64 | - |
| **HR** | Heart Rate | Average heart rate extracted from BVP | 1 | beats per minute (BPM) |
| **IBI** | Inter Beat Interval | Time between individual heart beats (from BVP) | - | seconds (s) |
| **ACC** | 3-axis Accelerometer | Data from 3-axis accelerometer (x;y;z) | 32 | 1/64g |

## Timestamp Structure
- For most sensor files (`ACC.csv`, `BVP.csv`, `EDA.csv`, `HR.csv`, `TEMP.csv`):
  - Row 1: Initial timestamp of the session (UTC Unix time).
  - Row 2: Sample rate (Hz).
  - Row 3 onwards: Continuous signal values.
- For `IBI.csv`:
  - Column 1: Time (relative to the initial time in seconds).
  - Column 2: Duration of the inter-beat interval (seconds).

## Labels and Event Marks
- **Stress/Exercise Labels**: Self-reported stress levels are available in `Stress_Level_v1.csv` and `Stress_Level_v2.csv`.
- **Event Marks**: `tags.csv` contains times for physical button presses on the Empatica E4 device.

## Usability for SentinelX
### Usable Signals
- **Heart Rate (`HR`)**: Critical for experimental workload/strain visualizations.
- **Skin Temperature (`TEMP`)**: Can support thermoregulation models or core temperature approximations.

### Unusable / Unclear Signals
- **Blood Volume Pulse (`BVP`) & Inter Beat Interval (`IBI`)**: Raw physiological signals that require excessive preprocessing and are unnecessary for high-level command/control strain metrics.
- **Electrodermal Activity (`EDA`) & Accelerometer (`ACC`)**: Irrelevant to direct environmental heat hazard mapping, though useful for movement activity detection.

### Recommendation for Dashboard Integration
The `HR` and `TEMP` signals from this dataset can be sampled to provide realistic telemetry streams for the **H-THERM** physiological strain models within SentinelX without fabricating fake physiological data.

## Access Constraints
- Released under **Open Data Commons Attribution License v1.0 (ODC-By)**.
- **Do not** connect this dataset directly to production hazard alerting, and **do not** make clinical claims based on this experimental data. This should be utilized strictly for safe telemetry simulations in non-production experimental views.
