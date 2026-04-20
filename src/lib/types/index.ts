export type SpotType = 'jetty' | 'river_mouth' | 'beach_surf' | 'bridge' | 'rocky_point' | 'tidal_flat' | 'deep_water' | 'inlet' | 'rocky_shore' | 'estuary' | 'flat';

export type Spot = {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  spot_type: SpotType;
  is_default: boolean;
  created_by: string | null;
  best_tide: string | null;
  best_time: string | null;
  noaa_station_id: string | null;
  notes: string | null;
  created_at: string;
};

export type Catch = {
  id: string;
  user_id: string;
  spot_id: string | null;
  caught_at: string;
  fish_length: number | null;
  fish_weight: number | null;
  lure_or_bait: string | null;
  tide_stage: string | null;
  water_temp: number | null;
  wind_speed: number | null;
  wind_direction: string | null;
  barometric_pressure: number | null;
  moon_phase: string | null;
  weather_conditions: Record<string, unknown>;
  photo_url: string | null;
  notes: string | null;
};

export type TideData = {
  predictions: { t: string; v: string }[];
  station: string;
};

// ── Legacy WeatherData (kept for backward compatibility) ────────────────────
export type WeatherData = {
  temp: number;
  windSpeed: number;
  windDirection: string;
  windDeg: number;
  pressure: number;
  humidity: number;
  description: string;
  icon: string;
};

// ── Legacy FishingScore (kept for backward compatibility) ────────────────────
export type FishingScore = {
  overall: number; // 0-10
  tideScore: number;
  timeScore: number;
  moonScore: number;
  pressureScore: number;
  tempScore: number;
  summary: string;
};

export type Crew = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
};

export type SpotReport = {
  id: string;
  user_id: string;
  spot_id: string | null;
  report_type: string;
  message: string;
  created_at: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// Extended types for API helpers and scoring engine
// ═══════════════════════════════════════════════════════════════════════════

// ── Tide Types ──────────────────────────────────────────────────────────────

export interface TidePrediction {
  time: string; // ISO 8601
  height: number; // feet
}

export interface HighLowTide {
  time: string; // ISO 8601
  height: number; // feet
  type: 'H' | 'L';
}

export interface TideStage {
  stage: 'incoming' | 'outgoing' | 'slack_high' | 'slack_low';
  height: number;
  nextHigh: string;
  nextLow: string;
  timeToNextHigh: number; // minutes
  timeToNextLow: number; // minutes
  flowStrength: 'strong' | 'moderate' | 'weak';
}

// ── Extended Weather Types ──────────────────────────────────────────────────

export interface ExtendedWeatherData {
  temp: number; // °F
  feelsLike: number;
  humidity: number;
  pressure: number; // hPa
  pressureTrend: 'rising' | 'falling' | 'steady' | 'rapidly_rising' | 'rapidly_falling';
  windSpeed: number; // mph
  windGust: number;
  windDirection: number; // degrees
  windDirectionStr: string;
  description: string;
  icon: string;
  cloudCover: number;
  visibility: number; // miles
  rainLastHour?: number;
}

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  pressure: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  description: string;
  icon: string;
  pop: number; // probability of precipitation 0-1
}

// ── USGS River Types ────────────────────────────────────────────────────────

export interface RiverData {
  flowCfs: number;
  trend: 'rising' | 'falling' | 'stable';
  gageHeight: number;
  timestamp: string;
}

// ── Solunar Types ───────────────────────────────────────────────────────────

export interface SolunarPeriod {
  start: Date;
  end: Date;
}

export interface SolunarData {
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  moonPhase: string;
  moonPhasePct: number;
  moonrise: Date;
  moonset: Date;
  moonOverhead: Date;
  moonUnderfoot: Date;
}

export interface MoonData {
  phase: string;
  illumination: number;
  emoji: string;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  goldenHourStart: Date;
  goldenHourEnd: Date;
  civilDawn: Date;
  civilDusk: Date;
}

// ── Extended Fishing Score ──────────────────────────────────────────────────

export interface ExtendedFishingScore {
  overall: number; // 1-10
  breakdown: {
    tideMovement: number;
    timeOfDay: number;
    moonPhase: number;
    barometricPressure: number;
    waterTemp: number;
  };
  label: 'poor' | 'fair' | 'good' | 'excellent' | 'epic';
  summary: string;
}

// ── Lure Types ──────────────────────────────────────────────────────────────

export interface LureRecommendation {
  name: string;
  type: 'lure' | 'bait';
  retrieve: string;
  why: string;
  confidence: number;
}

// ── Station Constants ───────────────────────────────────────────────────────

export const CT_TIDE_STATIONS = {
  BRIDGEPORT_AREA: '8465705',
  NEW_LONDON: '8461490',
  BRIDGEPORT_HOUSATONIC: '8467150',
} as const;

export const CT_RIVER_GAUGES = {
  CT_RIVER_HADDAM: '01193050',
  HOUSATONIC_DERBY: '01205500',
} as const;
