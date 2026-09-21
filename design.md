# DESIGN.md — SentinelX visual system

Source of truth: `SentinelX_Design_Doc_v1.0.docx` (already authored). This file is the quick-reference AI tools should follow so every new screen matches.

## Visual identity
- **Reference style:** Zoom Earth-style — dark, full-bleed interactive map as the canvas, with translucent floating panels ("bento glass cards") layered on top. Not a traditional dashboard-with-sidebar layout.
- **Theme:** Dark mode only (glassmorphism). No light-mode variant needed for the demo.
- **Feel:** Command-center / situation-room, not a consumer weather app. Should read as serious government infrastructure, not a startup product.

## Color logic
- Base: near-black background, translucent glass panels (backdrop-blur, low-opacity white/gray borders)
- Risk-tier color coding (consistent everywhere — map, cards, charts, PDF):
  - 🟢 Normal/Low
  - 🟡 Elevated
  - 🟠 Warning
  - 🔴 Critical
- Never invent a new risk-color scale per component — reuse the same 4-tier palette across HTSI, WBGT, hospital surge, and vulnerability displays.

## Typography & components
- Existing component set to reuse (don't recreate): `HeatRiskCard`, `ThermalStressCard`, `StressIndexCard`, `ForecastChart`, `WardView`, `HospitalSurgeView`, `CitizenAdvisoryView`, `AICopilotModal`.
- Charts: Recharts, dual-axis ComposedChart pattern already established for the 5-day forecast (WBGT line + surge bars) — follow this pattern for new charts (e.g. Nighttime Recovery Index) rather than inventing a new chart style.
- SHAP explainability: horizontal red/green bar chart (already in WardView.tsx) — reuse this exact pattern for any new "why" panel.

## New-screen checklist (before shipping any new feature UI)
1. Does it fit inside the existing bento-glass-card grid, or does it need a new modal (like AICopilotModal)?
2. Does every number on screen carry a provenance label (Real/Calculated/Modelled/Synthetic) per rules.md?
3. Is the 4-tier risk color scale used consistently?
4. Is there a Hindi/Odia string ready if this is citizen-facing (CitizenAdvisoryView pattern)?
