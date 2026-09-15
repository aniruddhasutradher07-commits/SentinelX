-- ============================================================================
-- SentinelX / THERMO-SHIELD AI: Supabase PostgreSQL Schema & Realtime Setup
-- Problem Statement 26083: Extreme Heatwave Early Warning & Thermal Stress Index
-- Ministry of Earth Sciences (MoES) / NCMRWF — Smart India Hackathon 2026
-- ============================================================================

-- 1. Entity: ward
CREATE TABLE IF NOT EXISTS public.ward (
    ward_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(100),
    centroid_lat DOUBLE PRECISION NOT NULL,
    centroid_lon DOUBLE PRECISION NOT NULL,
    population INT DEFAULT 12000,
    area_hectares NUMERIC(8, 2) DEFAULT 150.0,
    geometry JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Entity: ward_vulnerability (Census + OSM + Sentinel-2 NDVI + MODIS LST)
CREATE TABLE IF NOT EXISTS public.ward_vulnerability (
    ward_id VARCHAR(20) PRIMARY KEY REFERENCES public.ward(ward_id) ON DELETE CASCADE,
    elderly_share NUMERIC(5, 2) DEFAULT 9.5,         -- Census 2011 + demographic projection
    outdoor_worker_share NUMERIC(5, 2) DEFAULT 24.0,  -- Labour / street vendor / informal
    ndvi NUMERIC(4, 3) DEFAULT 0.210,                 -- Sentinel-2 Green Canopy (GEE)
    lst_mean NUMERIC(5, 2) DEFAULT 38.5,              -- MODIS Land Surface Temp (°C)
    built_density NUMERIC(6, 2) DEFAULT 45.0,         -- OSM Building footprint density
    health_access_km NUMERIC(5, 2) DEFAULT 3.2,       -- Distance to nearest PHC/Hospital
    tree_cover_pct NUMERIC(5, 2) DEFAULT 18.0,
    high_heat_roof_pct NUMERIC(5, 2) DEFAULT 32.0,
    vulnerability_score NUMERIC(5, 2) DEFAULT 48.0,   -- Normalised 0-100 score
    vulnerability_multiplier NUMERIC(5, 3) DEFAULT 1.084,
    top_drivers JSONB DEFAULT '["High outdoor-worker density", "Low canopy cover", "Hospital distance > 3km"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entity: weather_forecast (NWP 3-5 day horizon fields: NCMRWF / IMD)
CREATE TABLE IF NOT EXISTS public.weather_forecast (
    id BIGSERIAL PRIMARY KEY,
    ward_id VARCHAR(20) NOT NULL REFERENCES public.ward(ward_id) ON DELETE CASCADE,
    valid_date DATE NOT NULL,
    horizon_days INT NOT NULL DEFAULT 0,              -- 0 (Today), 3, 4, 5 days
    temp_c NUMERIC(5, 2) NOT NULL,
    rh_pct NUMERIC(5, 2) NOT NULL,
    wind_ms NUMERIC(5, 2) DEFAULT 2.1,
    solar_wm2 NUMERIC(7, 2) DEFAULT 750.0,            -- NASA POWER / NWP solar radiation
    source VARCHAR(50) DEFAULT 'NCMRWF/IMD-GFS',
    run_time TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Entity: thermal_stress (WBGT, UTCI, Heat Index, HTSI)
CREATE TABLE IF NOT EXISTS public.thermal_stress (
    id BIGSERIAL PRIMARY KEY,
    ward_id VARCHAR(20) NOT NULL REFERENCES public.ward(ward_id) ON DELETE CASCADE,
    valid_date DATE NOT NULL,
    wbgt NUMERIC(5, 2) NOT NULL,                      -- Wet-Bulb Globe Temp (outdoor)
    utci NUMERIC(5, 2) NOT NULL,                      -- Universal Thermal Climate Index
    heat_index NUMERIC(5, 2) NOT NULL,                -- Rothfusz Heat Index
    htsi NUMERIC(5, 2) NOT NULL,                      -- Normalised HTSI (0-100)
    thermal_hazard_score NUMERIC(5, 2) NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Entity: ward_risk_index (Fused Mortality Risk Index & CDC Realtime Stream)
CREATE TABLE IF NOT EXISTS public.ward_risk_index (
    id BIGSERIAL PRIMARY KEY,
    ward_no VARCHAR(20) NOT NULL REFERENCES public.ward(ward_id) ON DELETE CASCADE,
    zone VARCHAR(100) NOT NULL,
    population INT DEFAULT 12000,
    centroid_lat DOUBLE PRECISION NOT NULL,
    centroid_lon DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    valid_date DATE DEFAULT CURRENT_DATE,
    horizon_days INT DEFAULT 0,                       -- 0 (Today), 3, 4, 5 days
    temperature_c NUMERIC(5, 2) NOT NULL,
    relative_humidity_pct NUMERIC(5, 2) NOT NULL,
    wind_speed_ms NUMERIC(5, 2) DEFAULT 2.1,
    solar_radiation_wm2 NUMERIC(7, 2) DEFAULT 750.0,
    apparent_temp_c NUMERIC(5, 2),
    uhi_offset_c NUMERIC(5, 2) DEFAULT 0.20,
    adjusted_temp_c NUMERIC(5, 2),
    hi_celsius NUMERIC(5, 2),
    wbgt_celsius NUMERIC(5, 2) NOT NULL,
    utci_celsius NUMERIC(5, 2),
    thermal_hazard_score NUMERIC(5, 2) DEFAULT 75.0,
    elderly_pct NUMERIC(5, 2) DEFAULT 9.5,
    outdoor_worker_pct NUMERIC(5, 2) DEFAULT 24.0,
    tree_cover_pct NUMERIC(5, 2) DEFAULT 18.0,
    high_heat_roof_pct NUMERIC(5, 2) DEFAULT 32.0,
    vulnerability_score NUMERIC(5, 2) DEFAULT 48.0,
    vulnerability_multiplier NUMERIC(5, 3) DEFAULT 1.084,
    ward_risk_score NUMERIC(5, 2) NOT NULL,           -- Composite MRI (0-100)
    risk_tier VARCHAR(20) DEFAULT 'Orange',           -- Green / Yellow / Orange / Red
    top_drivers JSONB DEFAULT '["Elevated WBGT", "High outdoor-worker concentration"]'::jsonb,
    hospitalisation_flag BOOLEAN DEFAULT FALSE,       -- FR-C5 hospital surge trigger
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Entity: alert_log (Citizen SMS, WhatsApp, Regional IVRS Delivery Audit)
CREATE TABLE IF NOT EXISTS public.alert_log (
    alert_id BIGSERIAL PRIMARY KEY,
    ward_id VARCHAR(20) REFERENCES public.ward(ward_id),
    channel VARCHAR(30) NOT NULL,                     -- 'SMS', 'WhatsApp', 'IVRS', 'EMS_Push'
    language VARCHAR(10) NOT NULL DEFAULT 'or',       -- 'or' (Odia), 'hi' (Hindi), 'en' (English)
    message TEXT NOT NULL,
    triggering_mri NUMERIC(5, 2) NOT NULL,
    recipient_count INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'SENT',                -- 'SENT', 'DELIVERED', 'FAILED'
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Entity: action_trigger_log (Heat Action Plan Administrative Decisions Audit)
CREATE TABLE IF NOT EXISTS public.action_trigger_log (
    trigger_id BIGSERIAL PRIMARY KEY,
    ward_id VARCHAR(20) REFERENCES public.ward(ward_id),
    action_type VARCHAR(100) NOT NULL,                -- 'OPEN_COOLING_SHELTER', 'SHIFT_WORK_HOURS', 'GRID_LOAD_PEAK_WARNING', 'DISPATCH_ASHA_WORKERS'
    issued_by VARCHAR(100) NOT NULL DEFAULT 'Municipal Commissioner / ULB',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'EXECUTED',            -- 'EXECUTED', 'PENDING', 'CANCELLED'
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Realtime Subscriptions (Change Data Capture)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.ward_risk_index;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_trigger_log;

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_vulnerability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thermal_stress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_risk_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_trigger_log ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for public dashboards
CREATE POLICY "Allow public read on ward" ON public.ward FOR SELECT USING (true);
CREATE POLICY "Allow public read on ward_vulnerability" ON public.ward_vulnerability FOR SELECT USING (true);
CREATE POLICY "Allow public read on weather_forecast" ON public.weather_forecast FOR SELECT USING (true);
CREATE POLICY "Allow public read on thermal_stress" ON public.thermal_stress FOR SELECT USING (true);
CREATE POLICY "Allow public read on ward_risk_index" ON public.ward_risk_index FOR SELECT USING (true);
CREATE POLICY "Allow public read on alert_log" ON public.alert_log FOR SELECT USING (true);
CREATE POLICY "Allow public read on action_trigger_log" ON public.action_trigger_log FOR SELECT USING (true);

-- Allow authenticated / backend ingestion
CREATE POLICY "Allow backend write on all tables" ON public.ward_risk_index FOR ALL USING (true);
CREATE POLICY "Allow backend write on alert_log" ON public.alert_log FOR ALL USING (true);
CREATE POLICY "Allow backend write on action_trigger_log" ON public.action_trigger_log FOR ALL USING (true);

-- ---------------------------------------------------------------------------
-- Seed Data for Bhubaneswar Pilot City
-- ---------------------------------------------------------------------------
INSERT INTO public.ward (ward_id, name, zone, centroid_lat, centroid_lon, population) VALUES
('W21', 'Ward 21 - Saheed Nagar', 'North Zone', 20.3012, 85.8234, 14500),
('W9', 'Ward 9 - Chandrasekharpur', 'North Zone', 20.3264, 85.8325, 13932),
('W56', 'Ward 56 - Old Town', 'South East Zone', 20.2515, 85.8430, 11228)
ON CONFLICT (ward_id) DO NOTHING;

INSERT INTO public.ward_risk_index (
    ward_no, zone, population, centroid_lat, centroid_lon,
    temperature_c, relative_humidity_pct, wbgt_celsius,
    thermal_hazard_score, vulnerability_multiplier, ward_risk_score, risk_tier,
    top_drivers, hospitalisation_flag
) VALUES 
('W21', 'North Zone', 14500, 20.3012, 85.8234, 40.2, 68.0, 32.8, 78.0, 1.250, 97.5, 'Red', '["42% outdoor workers", "0.9% tree cover", "High tin roof density"]'::jsonb, TRUE),
('W9', 'North Zone', 13932, 20.3264, 85.8325, 38.4, 65.0, 30.8, 70.0, 0.887, 62.1, 'Yellow', '["High tree canopy 32%", "Low informal housing"]'::jsonb, FALSE),
('W56', 'South East Zone', 11228, 20.2515, 85.8430, 41.0, 72.0, 33.4, 85.0, 1.320, 100.0, 'Red', '["High elderly share 14%", "Hospital distance 4.8 km", "Extreme humidity load"]'::jsonb, TRUE)
ON CONFLICT DO NOTHING;

