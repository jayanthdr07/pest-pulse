export type Language = 'en' | 'kn';

export interface Farmer {
  farmer_id: string;
  name: string;
  contact: string;
  language: Language;
  farm_name?: string;
  farm_place?: string;
  lat?: number;
  lon?: number;
  created_at?: number;
  last_login?: number;
}

export interface Field {
  field_id: string;
  farmer_id: string;
  name: string;
  location_name: string;
  lat: number;
  lon: number;
  crop_type: string;
  crop_variety?: string;
  sowing_date?: string;
  growth_stage?: string;
  area_acres: number;
  created_at: number;
  is_active: number;
}

export interface Device {
  node: string;
  name: string;
  field_id?: string;
  trap: string;
  trap_label?: string;
  pest?: string;
  pest_en?: string;
  pest_kn?: string;
  scientific_name?: string;
  species?: string;
  interval_s: number;
  created?: number;
  last_seen?: number;
  rssi?: number;
  fw?: string;
  ip?: string;
  uptime_s?: number;
  battery_pct: number;
  battery_voltage: number;
  solar_charging: boolean;
  status: string;
  online: boolean;
  risk?: string;
  total?: number;
  new?: number;
  catches_24h?: number;
  temp?: number;
  hum?: number;
  card_found?: boolean;
  engine?: string;
  image?: string;
  thumb?: string;
  trend?: number[];
  is_simulated?: boolean;
}

export interface Observation {
  id: number;
  ts: number;
  node: string;
  field_id?: string;
  total: number;
  new: number;
  risk: string;
  counts?: Record<string, number>;
  image?: string;
  annotated?: string;
  thumb?: string;
  is_simulated?: number | boolean;
  is_hardware_live?: boolean;
}

export interface InsectDetection {
  id: number;
  reading_id: number;
  ts: number;
  node: string;
  field_id?: string;
  crop_type: string;
  insect_class: string;
  common_name_en: string;
  common_name_kn: string;
  scientific_name: string;
  count: number;
  confidence: number;
  box_json?: any;
  model_version?: string;
}

export interface PestDetails {
  en: string;
  kn: string;
  latin: string;
  life_stage?: string;
  crops_affected?: string[];
  infestation_signs?: { en: string; kn: string };
  potential_damage?: { en: string; kn: string };
  disease_vector?: { status: string; diseases: string[] };
  why: { en: string; kn: string };
  reference_image?: string;
  non_chemical: Array<{ en: string; kn: string; source?: string }>;
  chemical: Array<{
    name: string;
    trade: string;
    irac: string;
    per_l: number;
    unit: string;
    per_tank10: number;
    per_acre: number;
    colour?: string;
    source?: string;
    note?: string;
    phi_days?: number;
    suggested?: boolean;
    same_group_as_last?: boolean;
    field_acres?: number;
    total_for_field?: number;
    water_volume_field_l?: number;
  }>;
  associated_diseases?: Disease[];
}

export interface Disease {
  id: string;
  name_en: string;
  name_kn: string;
  pathogen: string;
  crops: string[];
  vector_pest?: string | null;
  vector_name_en: string;
  vector_name_kn: string;
  vector_status: string;
  vector_status_kn: string;
  transmission_explanation: { en: string; kn: string };
  symptoms: { en: string; kn: string };
  crop_damage: { en: string; kn: string };
  prevention: Array<{ en: string; kn: string }>;
  expert_consultation: { en: string; kn: string };
  source: string;
  source_url?: string;
}

export interface FertilizerItem {
  nutrient: string;
  nutrient_kn: string;
  category: string;
  verified_rate_per_acre: string;
  farm_area_acres: number;
  calculated_total_quantity: string;
  total_quantity_num: number;
  unit: string;
  application_method: string;
  application_method_kn: string;
  water_volume: string;
  water_volume_kn: string;
  precautions: string;
  source: string;
  reviewed_date: string;
}

export interface FertilizerStage {
  stage_id: string;
  stage: string;
  stage_kn: string;
  purpose: string;
  purpose_kn: string;
  is_current_stage: boolean;
  items: FertilizerItem[];
}

export interface FertilizerPlan {
  crop: string;
  farm_area_acres: number;
  water_volume_per_acre_l: number;
  citation: string;
  guidance_note: { en: string; kn: string };
  stages: FertilizerStage[];
}

export interface AlertItem {
  id: number;
  ts: number;
  farmer_id?: string;
  field_id?: string;
  node: string;
  level: string;
  species: string;
  catches_24h: number;
  title_en: string;
  title_kn: string;
  body_en: string;
  body_kn: string;
  steps: Array<{ en: string; kn: string }>;
  done: number[];
  image?: string;
  acked: number;
}

export interface SprayRecord {
  id?: number;
  ts: number;
  field_id?: string;
  pest: string;
  pest_en?: string;
  pest_kn?: string;
  product: string;
  irac: string;
  dose: string;
  area_acres?: number;
  phi_days?: number;
  safe_harvest_ts?: number;
  notes?: string;
  by_name?: string;
  effect?: {
    before_per_day: number;
    after_per_day: number;
    change_pct: number;
  };
}

export interface WeatherData {
  source: string;
  temp: number;
  hum: number;
  wind: number;
  rain_now: number;
  cond: string;
  cond_kn: string;
  rain_prob_6h: number;
  wind_max_6h: number;
  days: Array<{
    date: string;
    tmax: number;
    tmin: number;
    rh: number;
    rain_prob: number;
    cond: string;
    cond_kn: string;
  }>;
}

export interface HomeData {
  farmer: Farmer;
  selected_field: Field | null;
  fields: Field[];
  crop: string;
  server_time: number;
  overall: string;
  weather: WeatherData;
  climate?: { temp: number; hum: number; ts: number; node: string };
  outlook?: { level: string; en: string; kn: string };
  traps: Device[];
  species_24h: Record<string, number>;
  total_insects_detected: number;
  insect_types_count: number;
  dominant_pest: {
    key: string;
    en: string;
    kn: string;
    scientific: string;
  };
  hardware_summary: {
    total_devices: number;
    online_count: number;
    battery_avg: number;
    solar_active: boolean;
    all_online: boolean;
  };
  suggestions: Array<{
    icon: string;
    tone: string;
    node?: string;
    en: string;
    kn: string;
  }>;
  unread_alerts: number;
  spray?: {
    status: string;
    pest: string;
    en_name: string;
    kn_name: string;
    reason: { en: string; kn: string };
    count_spray: number;
  };
}

export interface CropPassport {
  passport_id: string;
  field_id: string;
  farmer_id: string;
  crop_type?: string;
  token_hash: string;
  access_type: 'summary' | 'detailed' | 'private';
  created_at: number;
  expires_at?: number;
  is_revoked: number;
  views_count: number;
  last_viewed_at?: number;
  custom_notes?: string;
}

export interface PassportReport {
  passport: {
    passport_id: string;
    token: string;
    access_type: string;
    created_at: number;
    views_count: number;
    custom_notes?: string;
    passport_url: string;
    qr_data_url: string;
  };
  crop_identity: {
    field_id: string;
    field_name: string;
    crop_type: string;
    crop_variety: string;
    growth_stage: string;
    area_acres: number;
    sowing_date?: string;
    farm_name: string;
    farmer_name: string;
    general_location: string;
  };
  monitoring_summary: {
    monitoring_days: number;
    observations_count: number;
    active_devices: number;
    dominant_pest: string;
    total_insects_recorded: number;
    pest_distribution: Array<{ species: string; count: number }>;
    last_observation_ts: number;
    status: string;
  };
  environmental_history: {
    average_temp_c?: number;
    average_humidity_pct?: number;
    sensor_source: string;
    microclimate_stability: string;
  };
  treatments: Array<{
    treatment_id: string;
    target_pest: string;
    product_name: string;
    category: string;
    applied_date: string;
    rate_per_acre?: string;
    status: string;
    follow_up_obs?: string;
    source_ref?: string;
    notes?: string;
  }>;
  expert_consultations: Array<{
    appointment_id: string;
    expert_name?: string;
    expert_title?: string;
    institution?: string;
    date: string;
    status: string;
    recommendations?: string;
  }>;
  hardware_observations: Array<{
    id: number;
    ts: number;
    node: string;
    raw_image: string;
    annotated_image?: string;
    insects_detected: number;
    risk: string;
    temp?: number;
    hum?: number;
  }>;
  integrity: {
    generated_at: number;
    data_source: string;
    contains_simulated: boolean;
    regulatory_statement: string;
  };
}

export interface Treatment {
  treatment_id: string;
  field_id: string;
  farmer_id: string;
  target_pest: string;
  product_name: string;
  category: string;
  active_ingredient?: string;
  application_method: string;
  rate_per_acre?: string;
  total_quantity?: string;
  water_volume_liters?: number;
  area_treated_acres?: number;
  applied_date: string;
  status: string;
  source_ref?: string;
  follow_up_obs?: string;
  notes?: string;
  image_path?: string;
  created_at: number;
}

export interface Escalation {
  escalation_id: string;
  farmer_id: string;
  field_id: string;
  crop_type: string;
  pest_type: string;
  reading_id?: number;
  severity: 'warning' | 'high' | 'critical';
  reason_en: string;
  reason_kn: string;
  pest_count_before: number;
  pest_count_after: number;
  status: 'active' | 'reviewed' | 'consultation_scheduled' | 'resolved';
  suggested_action_en: string;
  suggested_action_kn: string;
  created_at: number;
  resolved_at?: number;
}

export interface Expert {
  expert_id: string;
  name: string;
  title: string;
  institution: string;
  qualifications: string;
  specialization: string;
  languages: string;
  experience_years: number;
  rating: number;
  avatar_url?: string;
  available_days: string;
  available_hours: string;
  is_verified: number;
}

export interface Appointment {
  appointment_id: string;
  farmer_id: string;
  expert_id: string;
  field_id: string;
  crop_type: string;
  appointment_date: string;
  appointment_time: string;
  time_zone: string;
  consultation_type: string;
  status: string;
  jitsi_room_id: string;
  escalation_id?: string;
  passport_id?: string;
  problem_description?: string;
  notes?: string;
  expert_recommendations?: string;
  created_at: number;
  expert_name?: string;
  expert_title?: string;
  institution?: string;
  languages?: string;
  expert_rating?: number;
}

export interface VoiceCommunication {
  comm_id: string;
  farmer_id: string;
  field_id?: string;
  alert_id?: number;
  escalation_id?: string;
  channel: string;
  language: string;
  script_en: string;
  script_kn: string;
  status: string;
  duration_s: number;
  created_at: number;
  played_at?: number;
}

export interface FarmerPreferences {
  farmer_id: string;
  auto_voice_alerts: number;
  auto_schedule_consultation: number;
  preferred_language: string;
  preferred_hours: string;
  preferred_expert_id?: string;
  attach_passport_default: number;
  voice_provider: string;
}

export interface TrapImage {
  id: number;
  node: string;
  field_id?: string;
  trap_type: string;
  ts: number;
  date_str: string;
  raw_image_url: string;
  annotated_image_url?: string;
  thumbnail_url?: string;
  total_insects: number;
  new_catches: number;
  counts: Record<string, number>;
  temp?: number;
  hum?: number;
  battery_pct?: number;
  risk: string;
  engine: string;
}

export interface UploadCountResult {
  ok: boolean;
  reading_id: number;
  field_id: string;
  crop_type: string;
  trap_type: string;
  total_detected: number;
  counts: Record<string, number>;
  risk_level: string;
  engine: string;
  raw_image_url: string;
  annotated_image_url: string;
  detections: Array<{
    box: number[];
    class: string;
    confidence: number;
  }>;
  recommendations: string[];
}
