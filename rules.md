# RULES.md — Rulebook for AI coding tools working on SentinelX

## 🚨 Non-negotiable security rules
1. **NEVER hardcode an API key, token, or secret as a default value in code** — not even as a `.get("KEY", "fallback-value")` fallback. This has already happened once (`routers/copilot.py` had a live Gemini key as the default). Always require the env var and fail loudly / fall back to offline mode if missing — never fall back to a literal secret string.
2. Never commit `.env` — confirm `.gitignore` covers it before every commit.
3. Any new secret goes in `.env.example` as a placeholder only (`YOUR_KEY_HERE`), never a real value.
4. Before any git push, grep the diff for API key patterns (`AIza`, `sk-`, `SUPABASE`, etc.) as a manual check.

## Libraries / stack — use what's already there
- Backend: FastAPI + SQLAlchemy + Pydantic. Don't introduce Flask, Django, or a second backend framework.
- ML: scikit-learn, XGBoost, SHAP, pythermalcomfort — already pinned in `requirements.txt`. Match existing version constraints.
- Frontend: React + TypeScript + Vite + Tailwind + Recharts. Don't introduce a second UI framework or CSS system.
- GIS: Folium/Leaflet only — don't add Mapbox/Google Maps JS unless explicitly asked (sovereignty/cost implications).

## Structural rules
- New backend logic goes in `services/` (business logic) or `routers/` (HTTP layer) — never directly in `main.py` beyond wiring.
- Do NOT add new logic to `teammate_backend/` — it's legacy/duplicate. All new work happens in root `routers/` and `services/`.
- New ML models: save as `.joblib` in `data/`, document training period (train/val/test split) in code comments, and register accuracy metrics somewhere retrievable (feeds the Model Validation Dashboard).
- Every new risk/score output must carry a **provenance label**: `"Real"` (measured), `"Calculated"` (formula from real inputs), `"Modelled"` (ML prediction), or `"Synthetic"` (demo/placeholder data). Never present modelled numbers as observed facts.

## Error handling
- Use `exception_handlers.py` conventions already in the repo — consistent JSON error responses, no bare `except: pass` except where explicitly justified (e.g. optional `.env` load).
- External API calls (weather, satellite, Gemini) must have a try/except fallback to cached/mock/offline data — the system must degrade gracefully during a real disaster with no internet, per the existing "dual-tier resilience" design.

## Claims / pitch discipline
- Never state an unvalidated accuracy number (e.g. "97% accuracy") without showing the train/val/test split it came from.
- Always distinguish "modelled estimate" from "observed data" in any UI text or pitch script, especially for hospital admissions and population counts.
- False negatives (missed extreme-heat events) are worse than false positives for an early-warning system — prioritize recall on the critical-risk class when tuning any classifier.

## What to avoid adding
- Don't add features merely to inflate the feature count — depth over breadth (this was true before and still is).
- Don't duplicate a capability that already exists (check `services/`, `routers/`, and `SIH_2026_WINNING_PITCH_AND_DEMO_SCRIPT.md` before building something new — it may already be shipped).
- Don't claim ambulance dispatch, ration deployment, or other real-world action as automated unless a real integration exists — SentinelX currently generates directives/recommendations, it does not execute physical dispatch.
