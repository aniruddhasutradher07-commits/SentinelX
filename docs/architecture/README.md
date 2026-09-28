# HeatGuard AI — System Architecture

HeatGuard AI operates on an 8-tier, fault-tolerant, hybrid pipeline that decouples real-time deterministic bio-meteorology from asynchronous machine learning and simulated operational workflows.

---

## 🏛️ End-to-End Pipeline Diagram

```mermaid
flowchart TD
    subgraph Clients["1. User & Client Presentation Layer"]
        B["Browser (React 18 + TS + Tailwind + Leaflet)"]
        Landing["Landing Page Showcase"]
        CommandCenter["Command Center (Tactical Cockpit)"]
        GIS67["Bhubaneswar 67-Ward Interactive GIS"]
    end

    subgraph API["2. API Gateway & Microservices (FastAPI / Express)"]
        FServer["Express & Vite Middleware (Port 3000)"]
        FastAPIServer["FastAPI ASGI Core Engine (Port 8000)"]
        CORS["CORS & Error Handlers"]
    end

    subgraph Ingestion["3. Data Ingestion, Normalization & Caching"]
        MemCache["In-Memory LRU & TTL Caches"]
        ColdStart["Cold-Start Fallback Manager"]
        RealtimeCDC["Supabase PostgreSQL CDC Sync"]
    end

    subgraph Science["4. Deterministic Bio-Meteorological Core"]
        HI["Steadman Heat Index"]
        WBGT["ISO 7243 Wet Bulb Globe Temp"]
        UTCI["Universal Thermal Climate Index"]
        NightRecovery["Nocturnal Recovery Index"]
    end

    subgraph Spatial["5. Ward-Level Spatial & Vulnerability Engine"]
        BMCGeo["67-Ward GeoJSON Polygon Registry"]
        OdishaGeo["30-District Administrative Geometry"]
        VulnEngine["Vulnerability Multiplier Engine<br>(Elderly, Workers, Canopy, Roofs)"]
    end

    subgraph ML["6. Predictive ML Layer (Experimental)"]
        MLV2["HistGradientBoostingRegressor<br>(Target: Next 24h Max Apparent Temp)"]
        Holdout2025["2025 Chronological Holdout<br>(MAE 1.08°C, R² 0.91)"]
    end

    subgraph Actions["7. Tactical Advisory & Simulated Alert Dispatch"]
        WorkerAdvisory["Occupational Work/Rest Protocols"]
        SchoolAdvisory["Pediatric Activity Limits"]
        ResourceAlloc["Water Tanker & Shelter Siting"]
        SimulatedDispatch["Simulated Emergency Broadcast Gateway<br>(NIC / Twilio Dry-Run + DPDP Audit)"]
    end

    subgraph ExternalSources["8. External Ground & Remote Feeds"]
        OpenMeteo["Open-Meteo API<br>[LIVE / CACHED]"]
        ERA5["Copernicus CDS / ERA5<br>[HISTORICAL ML]"]
        CPCB["CPCB OGD Platform<br>[CREDENTIALS_NOT_CONFIGURED]"]
        IMD["IMD Synoptic Observations<br>[CREDENTIALS_NOT_CONFIGURED]"]
        Bhuvan["ISRO NRSC Bhuvan<br>[PENDING LEGEND ROLLOUT]"]
    end

    B --> FServer
    FServer --> FastAPIServer
    FastAPIServer --> Ingestion
    ExternalSources --> Ingestion
    Ingestion --> Science
    Science --> Spatial
    Spatial --> ML
    Spatial --> Actions
    ML --> Actions
    Actions --> B
```

---

## 🔬 Core Architectural Principles

1. **Separation of Determinism and Heuristics:**
   - Life-critical operational heat tiers (Green, Yellow, Orange, Red) are computed deterministically using standard bio-meteorological equations (ISO 7243, Steadman).
   - Machine Learning models (ML V2) are reserved exclusively for forward environmental outlook (predicting continuous apparent temperature 24 hours ahead) and are clearly demarcated as `EXPERIMENTAL`.

2. **Graceful Degradation:**
   - When external feeds (such as CPCB or IMD) are unauthenticated or offline, the system never halts. It tags data with explicit truth states (`CREDENTIALS_NOT_CONFIGURED` or `STATIC REFERENCE`) and continues calculating deterministic risk using verified fallback observations.

3. **Strict Spatial Normalization:**
   - All 67 wards of Bhubaneswar are individually mapped to high-resolution polygon geometries (`wards_bhubaneswar.geojson`), pairing microclimate metrics with census-derived demographic vulnerability.
