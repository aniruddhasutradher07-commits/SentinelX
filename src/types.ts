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
  is_live?: boolean;
  is_stale?: boolean;
  data_age_minutes?: number;
  source?: string;
  observed_at?: string;
  fetched_at?: string;
  uv_index?: number;
  aqi?: number;
  aqi_standard?: string;

  telemetry?: {
    temperature_c: number;
    relative_humidity_pct: number;
    wind_speed_ms: number;
    uv_index: number;
    source: string;
    status: string;
    observed_at: string;
    fetched_at: string;
    data_age_minutes: number;
  };
  air_quality?: {
    status: string;
    aqi?: number;
    aqi_standard?: string;
    source?: string;
    station_id?: string;
    station_name?: string;
    prominent_pollutant?: string;
    distance_to_ward_km?: number;
    spatial_quality?: string;
    observed_at?: string;
    fetched_at?: string;
    data_age_minutes?: number;
    reason?: string;
  };
  imd_context?: {
    status: string;
    district?: string;
    warning_level?: string;
    nowcast?: string;
    source?: string;
    observed_at?: string;
    fetched_at?: string;
    data_age_minutes?: number;
    reason?: string;
  };
  data_quality?: {
    weather: string;
    air_quality: string;
    imd: string;
  };
  ward_profile?: {
    status: string;
    source: string;
    dataset: string;
    dataset_year: number;
    municipal_zone: string | null;
    corporator_name: string | null;
    corporator_mobile: number | string | null;
    ward_officer: string | null;
    ward_officer_mobile: string | null;
    households: number | null;
    population_total: number | null;
    population_male: number | null;
    population_female: number | null;
    sc_population: number | null;
    st_population: number | null;
  };
  bhuvan_lulc?: {
    status: string;
    source: string;
    dataset: string;
    method: string;
    verification_status: string;
    fetched_at?: string;
    requested_at?: string;
    response_received_at?: string;
    statistics?: any;
  };
  health_infrastructure?: {
    status: string;
    facility_count: number | null;
    categories?: {
      icds_centers: number;
      hospitals: number;
      nursing_homes: number;
      uphc: number;
      uchc: number;
      dispensaries: number;
      other: number;
    };
    facilities?: Array<{
      name: string;
      type: string;
      beds: number | null;
      emergency_beds: number | null;
      doctors: number | null;
      nurses: number | null;
      ambulance_available: string | null;
      ambulance_count: number | null;
    }>;
    source?: string;
    dataset?: string;
    dataset_year?: number;
  };
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
  multi_hazard?: {
    updated_at: string;
    overall_status: string;
    cyclone: {
      status: string;
      system_type?: string;
      message?: string;
      source?: string;
      source_url?: string;
    };
    heavy_rain: {
      status: string;
      message?: string;
      source?: string;
      source_url?: string;
    };
    flood: {
      status: string;
      message?: string;
      source?: string;
      source_url?: string;
    };
    landslide: {
      status: string;
      message?: string;
      source?: string;
      source_url?: string;
    };
    rain?: {
      status: string;
      value_mm: number | null;
      source: string;
      freshness: string;
      observed_at?: string;
      fetched_at?: string;
    };
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
