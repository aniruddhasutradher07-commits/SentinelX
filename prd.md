# PRD.md — SentinelX

## What we're building
SentinelX is India's Pan-India Human Thermal Stress & Healthcare Surge Intelligence Platform, built for Smart India Hackathon 2026, Problem Statement 26083 (MoES / NCMRWF, Disaster Management theme).

It is NOT a weather app. It converts raw meteorological data into **human physiological risk** and **operational government action** — for any of India's 780+ districts, wards, and PIN codes, clamped strictly to Indian sovereign borders.

## Problem being solved
Standard weather apps report dry-bulb air temperature only. This is physiologically misleading — e.g. a 37°C humid day can be more dangerous than a dry 44°C day, because the human body cannot dissipate heat through sweat evaporation. Existing government systems (like NDMA's SACHET) dispatch alerts but don't compute localized human physiological risk, don't forecast hospital surge, and don't auto-generate legally-grounded response directives.

## Target users
1. **District Collectors / Disaster Management Authorities** — need real-time risk + ready-to-sign statutory directives (Section 144 labor halts, cooling center activation)
2. **Hospital administrators** — need advance warning of heat-related ER surge to plan cold-bed capacity
3. **Field health/municipal teams** — need ward-level actionable "who/where/when/what" guidance
4. **Citizens** — need simple, multilingual, personalized heat-risk advisories

## Core features (already implemented, source of truth is the repo, not this doc)
- Human Thermal Stress computation: Heat Index, WBGT (ISO 7243), UTCI, HTSI composite (0-100)
- Random Forest 3-class heatwave risk classifier (Low/Warning/Critical)
- 2-Stage DLNM + XGBoost hospital ER surge forecaster (up to 5-day horizon)
- Census + OpenStreetMap-based Vulnerability Multiplier engine (elderly %, outdoor-worker %, tree canopy, heat-trapping roofs)
- SHAP explainability (per-ward "why is this risk high" panel)
- Pan-India sovereign GIS explorer (spatial grid cache, PIN/ward/district search, Leaflet maxBounds clamped to India)
- Satellite engine (MODIS/Sentinel-2 LST/NDVI integration)
- Multi-hazard evaluation module
- AI Incident Copilot (Gemini) — generates statutory directives under Disaster Management Act 2005 / Factories Act 1948, multilingual SMS
- 1-click District Collector Heat Action Directive PDF export (SHA-256 verified)
- Multi-channel alert dispatcher (SMS/WhatsApp/Email/108 ambulance)
- Citizen Advisory view

## What's genuinely still missing (target for this build cycle)
- Nighttime Recovery Failure Index (day risk vs night recovery vs 24h cumulative burden)
- Model validation/transparency dashboard (precision/recall/ROC-AUC/confusion matrix, especially false-negative rate)
- Explicit data provenance labeling across all UI (Real / Modelled / Synthetic) — currently only partial ("Estimated" on Demographics tab)
- Sector-specific safety modules: Construction Worker Safety, School Heat Safety
- Production security hardening (see rules.md — CORS, auth, rate limiting, secret rotation)

## Non-goals
- Not claiming to directly dispatch ambulances/police (routing/advisory only, unless a real integration exists)
- Not claiming unvalidated model accuracy numbers in the pitch — always show train/val/test split
