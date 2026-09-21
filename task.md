# TASK.md — SentinelX remaining work, broken into single-AI-session tasks

Give the AI ONE task at a time. Each task below is scoped to be completed in one focused session.

## 🔴 P0 — Security (do first, before anything else)
- [x] **Task 1:** Rotate the exposed Gemini API key in Google AI Studio. Remove the hardcoded fallback value from `routers/copilot.py` — require `GEMINI_API_KEY` from env only, with a graceful offline-fallback message (not a literal key) if missing.
- [x] **Task 2:** Audit repo history for any other committed secrets (grep past commits for `AIza`, `sk-`, Supabase keys). Rotate anything found.

## 🟠 P1 — Genuine feature gaps
- [x] **Task 3:** Build Nighttime Recovery Failure Index — new function in `core/thermal_stress.py` combining daytime HTSI + nighttime min temp + humidity into a "24h Thermal Burden" score. Add a `NightRecoveryCard` component (reuse ThermalStressCard pattern) and one chart panel (Day Risk / Night Recovery / 24h Burden, 3-value display per design.md).
- [x] **Task 4:** Build Model Validation Dashboard — new route `/api/v1/model-validation` exposing train/val/test split, accuracy/precision/recall/F1/ROC-AUC/confusion matrix for both the Random Forest classifier and the 2-stage surge model, with false-negative rate called out explicitly. One frontend page reusing existing chart components.
- [x] **Task 5:** Add explicit data-provenance labels across the UI — every card/number gets a small tag (Real/Calculated/Modelled/Synthetic) per design.md checklist. Completed across all UI screens (WardView, HospitalSurgeView, DemographicsTab, CitizenAdvisoryView, SolarNoonFluxWidget, OrganStrainHologram, WhatIfSimulator, HThermCalculator, BenchmarksView, CommandTab, OverviewTab).

## 🟡 P2 — Sector modules (breadth, do after P0/P1)
- [x] **Task 6:** Construction Worker Safety module — input form (location, worker count, work type, shift timing) → time-sliced Worker Heat Exposure Score (LOW/MODERATE/HIGH/EXTREME per time block) → recovery-break recommendation. New router `routers/worker_safety.py` + new frontend tab.
- [x] **Task 7:** School Heat Safety module — per-school heat risk + recommended actions (cancel outdoor sports, modify assembly timing, indoor activities). New router + frontend tab, reusing the Action Engine pattern from `copilot.py`.
- [x] **Task 10:** Cooling-Center Optimization & Emergency Routing — spatial gap detection across wards for temporary cooling point deployment + advisory emergency hospital transport routing with explicit disclaimer. New router `routers/resource_allocation.py` + new frontend tab `ResourceAllocationTab.tsx`.

## 🟢 P3 — Architecture cleanup (do once features are locked, before final pitch)
- [x] **Task 8:** Resolve `teammate_backend/` vs root `routers/` duplication — confirm which is actually deployed (check `render.yaml` / `main.py` imports), delete or clearly archive the unused copy.
- [x] **Task 9:** Tighten CORS from `allow_origins=["*"]` to explicit frontend origin(s), document this as a "known demo limitation, production would add auth" line in the pitch script (judges respect an honest limitations slide).
- [x] **Task 11:** Multi-Layer GIS Map — extended Folium & Leaflet map engines (`services/gis_map.py` & `OdishaMap.tsx`) with toggleable layers (Thermal Stress, Vulnerability, Cooling Centers, Emergency Hospital Transport Routing Vectors), bento-glass layer toggle panel, "Show Underserved High-Risk Areas" filter overlay button, and sovereign India bounds clamping.
- [x] **Task 12:** Historical Event Replay — day-by-day disaster playback engine (`routers/historical_replay.py` & `HistoricalReplayTab.tsx`) reconstructing HTSI risk curves, DLNM+XGBoost hospital surge forecasts, and Action Engine statutory directives across 3 landmark NDMA Odisha heatwave catastrophes (1998, 2015, 2019) with strict `[REAL / REPORTED ESTIMATE]` vs `[MODELLED RECONSTRUCTION]` provenance badges.

## Order of execution
P0 → P1 (Tasks 3, 4, 5 can run in parallel across sessions) → P2 (6, 7 independent of each other) → P3 last.
