export interface VulnerabilityProfile {
  elderly_pct: number;
  outdoor_worker_pct: number;
  tree_cover_pct: number;
  high_heat_roof_pct: number;
  vulnerability_score: number;
  vulnerability_multiplier: number;
  vulnerability_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  dominant_factor?: string;
}

export type RiskTier = 'Green' | 'Yellow' | 'Orange' | 'Red' | 'green' | 'yellow' | 'orange' | 'red';

export interface DistrictRiskRecord {
  district: string;
  population_2011_est: number;
  centroid_lat: number;
  centroid_lon: number;
  timestamp: string;
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
  apparent_temp_c: number;
  population_density_relative?: number;
  HI_celsius: number;
  WBGT_celsius: number;
  UTCI_celsius: number | null;
  thermal_hazard_score?: number;
  DistrictRiskScore: number;
  RiskTier: RiskTier;
  elderly_pct?: number;
  outdoor_worker_pct?: number;
  tree_cover_pct?: number;
  high_heat_roof_pct?: number;
  vulnerability_score?: number;
  vulnerability_multiplier?: number;
  vulnerability_tier?: string;
  dominant_factor?: string;
  modis_lst_c?: number;
  uhi_anomaly_c?: number;
  nasa_solar_wm2?: number;
}

export interface DistrictImpactRecord {
  district: string;
  date: string;
  population: number;
  wbgt_max: number;
  predicted_admissions: number;
  ImpactTier: 'Green' | 'Yellow' | 'Orange' | 'Red';
}

export interface WardRiskRecord {
  ward_no: string;
  zone: string;
  population: number;
  centroid_lat: number;
  centroid_lon: number;
  timestamp: string;
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
  apparent_temp_c: number;
  uhi_offset_c: number;
  adjusted_temp_c: number;
  HI_celsius: number;
  WBGT_celsius: number;
  UTCI_celsius: number | null;
  thermal_hazard_score?: number;
  WardRiskScore: number;
  RiskTier: 'Green' | 'Yellow' | 'Orange' | 'Red';
  elderly_pct?: number;
  outdoor_worker_pct?: number;
  tree_cover_pct?: number;
  high_heat_roof_pct?: number;
  vulnerability_score?: number;
  vulnerability_multiplier?: number;
  vulnerability_tier?: string;
  dominant_factor?: string;
  modis_lst_c?: number;
  modis_lst_day_c?: number;
  modis_lst_night_c?: number;
  sentinel2_ndvi?: number;
  uhi_anomaly_c?: number;
  uhi_classification?: string;
  nasa_solar_wm2?: number;
  nasa_solar_radiation_wm2?: number;
  satellite_tree_cover_pct?: number;
}

export interface SatelliteObservation {
  ward_no: string;
  modis_lst_c: number;
  modis_lst_night_c: number;
  sentinel2_ndvi: number;
  satellite_tree_cover_pct: number;
  uhi_anomaly_c: number;
  uhi_classification: string;
  nasa_solar_radiation_wm2: number;
  nasa_source: string;
}

export interface WardImpactRecord {
  ward_no: string;
  date: string;
  population: number;
  wbgt_max: number;
  predicted_admissions: number;
  ImpactTier: 'Green' | 'Yellow' | 'Orange' | 'Red';
}

export interface SystemSummary {
  timestamp_ist: string;
  odisha_statewide: {
    monitored_districts: number;
    total_population: number;
    today_expected_hospital_admissions: number;
    peak_wbgt_district: string;
    peak_wbgt_celsius: number;
    elevated_risk_districts_count: number;
  };
  bhubaneswar_urban_core: {
    monitored_wards: number;
    total_population: number;
    today_expected_hospital_admissions: number;
    peak_surge_ward: string;
    peak_ward_expected_admissions: number;
    elevated_risk_wards_count: number;
  };
  model_engine: string;
  confidence_score_r2: number;
}

export interface LiveTelemetry {
  sync_timestamp: string;
  sync_time_display: string;
  connection: string;
  refresh_interval_sec: number;
  telemetry: {
    monitored_districts: number;
    monitored_wards: number;
    peak_wbgt_statewide: number;
    peak_district: string;
    active_alert_level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    grid_status: string;
    hospitals_reporting: number;
  };
}

export interface HThermInput {
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
  exertion_level: 'resting' | 'moderate' | 'heavy';
}

export interface HThermResult {
  input: HThermInput;
  physiological_metrics: {
    wbgt_celsius: number;
    sweat_evaporation_efficiency_pct: number;
    h_therm_score: number;
    human_thermal_strain_tier: string;
  };
  clinical_advisory: {
    maximum_continuous_outdoor_work_minutes: number;
    required_hourly_hydration_ml: number;
    cooling_intervention: string;
    vulnerable_protocols: string;
  };
}

export interface AICopilotResponse {
  source: string;
  status: string;
  response: string;
  gemini_notice?: string;
}

export interface AlertDispatchResponse {
  dispatch_status: string;
  gateway: string;
  ward_no?: string;
  district?: string;
  recipient: string;
  timestamp: string;
  message_payload: string;
}

export interface NDMABenchmark {
  event_year: number;
  event_name: string;
  date_range: string;
  reported_peak_temp_c: number;
  confirmed_deaths: number;
  source: string;
}
