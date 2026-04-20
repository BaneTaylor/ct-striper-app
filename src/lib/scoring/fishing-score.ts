import type {
  TideStage,
  SunTimes,
  MoonData,
  ExtendedWeatherData,
  SpotType,
  ExtendedFishingScore,
} from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Weights
// ═══════════════════════════════════════════════════════════════════════════

const WEIGHT_TIDE = 0.30;
const WEIGHT_TIME = 0.25;
const WEIGHT_MOON = 0.20;
const WEIGHT_PRESSURE = 0.15;
const WEIGHT_TEMP = 0.10;

// ═══════════════════════════════════════════════════════════════════════════
// Main scoring function
// ═══════════════════════════════════════════════════════════════════════════

export function calculateFishingScore(params: {
  tideStage: TideStage;
  currentTime: Date;
  sunTimes: SunTimes;
  moonData: MoonData;
  weather: ExtendedWeatherData;
  waterTemp?: number;
  spotType?: SpotType;
}): ExtendedFishingScore {
  const { tideStage, currentTime, sunTimes, moonData, weather, waterTemp, spotType } = params;

  let tideScore = scoreTide(tideStage);
  let timeScore = scoreTimeOfDay(currentTime, sunTimes);
  const moonScore = scoreMoonPhase(moonData);
  const pressureScore = scorePressure(weather.pressureTrend);
  const tempScore = waterTemp != null ? scoreWaterTemp(waterTemp) : 6; // default mid-range

  // ── Spot type modifiers ─────────────────────────────────────────────────
  if (spotType) {
    const mods = getSpotModifiers(spotType, tideStage, currentTime, sunTimes);
    tideScore = clamp(tideScore * mods.tideMultiplier, 1, 10);
    timeScore = clamp(timeScore * mods.timeMultiplier, 1, 10);
  }

  const overall =
    tideScore * WEIGHT_TIDE +
    timeScore * WEIGHT_TIME +
    moonScore * WEIGHT_MOON +
    pressureScore * WEIGHT_PRESSURE +
    tempScore * WEIGHT_TEMP;

  const overallRounded = Math.round(overall * 10) / 10;

  const label = getLabel(overallRounded);

  const summary = generateSummary(
    { overall: overallRounded, breakdown: { tideMovement: tideScore, timeOfDay: timeScore, moonPhase: moonScore, barometricPressure: pressureScore, waterTemp: tempScore }, label, summary: '' },
    tideStage,
    sunTimes,
    moonData,
    weather,
  );

  return {
    overall: overallRounded,
    breakdown: {
      tideMovement: Math.round(tideScore * 10) / 10,
      timeOfDay: Math.round(timeScore * 10) / 10,
      moonPhase: moonScore,
      barometricPressure: pressureScore,
      waterTemp: tempScore,
    },
    label,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-scores
// ═══════════════════════════════════════════════════════════════════════════

function scoreTide(tide: TideStage): number {
  if (tide.stage === 'slack_high' || tide.stage === 'slack_low') {
    return 2;
  }

  // Incoming or outgoing — score by flow strength
  switch (tide.flowStrength) {
    case 'strong':
      return 10;
    case 'moderate':
      return 8;
    case 'weak':
      return 6; // just started or about to stop
  }
}

function scoreTimeOfDay(time: Date, sun: SunTimes): number {
  const ms = time.getTime();
  const sunrise = sun.sunrise.getTime();
  const sunset = sun.sunset.getTime();
  const civilDawn = sun.civilDawn.getTime();
  const civilDusk = sun.civilDusk.getTime();
  const goldenStart = sun.goldenHourStart.getTime();
  const goldenEnd = sun.goldenHourEnd.getTime();

  // Dawn golden hour: from civil dawn to ~1 hour after sunrise
  const morningGoldenEnd = sunrise + 60 * 60000;
  // Dusk golden hour: from golden hour start to civil dusk
  const eveningGoldenStart = goldenStart;

  if (ms >= civilDawn && ms <= morningGoldenEnd) return 10; // dawn/golden hour
  if (ms >= eveningGoldenStart && ms <= civilDusk) return 10; // dusk/golden hour

  // Night (after civil dusk or before civil dawn)
  if (ms > civilDusk || ms < civilDawn) return 8;

  // Early morning (1 hour after sunrise to 2 hours after)
  if (ms > morningGoldenEnd && ms <= sunrise + 2 * 3600000) return 6;

  // Late afternoon (2 hours before golden hour)
  if (ms >= goldenStart - 2 * 3600000 && ms < eveningGoldenStart) return 6;

  // Midday
  return 3;
}

function scoreMoonPhase(moon: MoonData): number {
  switch (moon.phase) {
    case 'new':
    case 'full':
      return 10;
    case 'first_quarter':
    case 'last_quarter':
      return 6;
    case 'waxing_crescent':
    case 'waning_crescent':
    case 'waxing_gibbous':
    case 'waning_gibbous':
      return 4;
    default:
      return 5;
  }
}

function scorePressure(
  trend: ExtendedWeatherData['pressureTrend'],
): number {
  switch (trend) {
    case 'steady':
      return 10;
    case 'falling':
      return 10; // slowly falling is great for fishing
    case 'rising':
      return 7;
    case 'rapidly_falling':
      return 5;
    case 'rapidly_rising':
      return 3;
    default:
      return 6;
  }
}

function scoreWaterTemp(temp: number): number {
  // Optimal striper temps in Fahrenheit
  if (temp >= 55 && temp <= 65) return 10;
  if ((temp >= 50 && temp < 55) || (temp > 65 && temp <= 70)) return 8;
  if ((temp >= 45 && temp < 50) || (temp > 70 && temp <= 75)) return 5;
  return 2; // below 45 or above 75
}

// ═══════════════════════════════════════════════════════════════════════════
// Spot type modifiers
// ═══════════════════════════════════════════════════════════════════════════

function getSpotModifiers(
  spotType: SpotType,
  tide: TideStage,
  time: Date,
  sun: SunTimes,
): { tideMultiplier: number; timeMultiplier: number } {
  let tideMultiplier = 1.0;
  let timeMultiplier = 1.0;

  const isNight =
    time.getTime() > sun.civilDusk.getTime() ||
    time.getTime() < sun.civilDawn.getTime();
  const isDawnDusk =
    (time.getTime() >= sun.civilDawn.getTime() &&
      time.getTime() <= sun.sunrise.getTime() + 3600000) ||
    (time.getTime() >= sun.goldenHourStart.getTime() &&
      time.getTime() <= sun.civilDusk.getTime());

  switch (spotType) {
    case 'river_mouth':
      // Outgoing tide pushes bait out of rivers — stripers stack up
      if (tide.stage === 'outgoing') tideMultiplier = 1.2;
      if (isNight) timeMultiplier = 1.15;
      break;

    case 'jetty':
      // Incoming tide brings bait against structure
      if (tide.stage === 'incoming') tideMultiplier = 1.15;
      break;

    case 'bridge':
      // Bridge fishing excels at night — lights attract bait
      if (isNight) timeMultiplier = 1.25;
      break;

    case 'beach_surf':
      // Dawn and dusk patrol is classic surf fishing
      if (isDawnDusk) timeMultiplier = 1.1;
      break;

    case 'rocky_point':
    case 'rocky_shore':
      // Current flowing past rocks creates ambush points
      if (tide.flowStrength === 'strong') tideMultiplier = 1.1;
      break;

    case 'deep_water':
      // Strong current positions fish predictably in deep water
      if (tide.flowStrength === 'strong') tideMultiplier = 1.1;
      break;

    case 'inlet':
      // Inlets are like river mouths — outgoing is key
      if (tide.stage === 'outgoing') tideMultiplier = 1.15;
      if (isNight) timeMultiplier = 1.1;
      break;

    default:
      break;
  }

  return { tideMultiplier, timeMultiplier };
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary generation
// ═══════════════════════════════════════════════════════════════════════════

export function generateSummary(
  score: ExtendedFishingScore,
  tide: TideStage,
  sun: SunTimes,
  moon: MoonData,
  weather: ExtendedWeatherData,
): string {
  const parts: string[] = [];

  // Overall quality
  const qualityWord = {
    poor: 'poor',
    fair: 'fair',
    good: 'good',
    excellent: 'excellent',
    epic: 'epic',
  }[score.label];
  parts.push(`Conditions are ${qualityWord}`);

  // Tide description
  const tideDesc = describeTide(tide);
  parts.push(tideDesc);

  // Time of day
  const now = new Date();
  const timeDesc = describeTimeOfDay(now, sun);
  parts.push(timeDesc);

  // Moon
  const moonDesc = describeMoon(moon);
  parts.push(moonDesc);

  // Wind if notable
  if (weather.windSpeed > 15) {
    parts.push(`winds ${Math.round(weather.windSpeed)} mph ${weather.windDirectionStr}`);
  }

  // Pressure
  if (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling') {
    parts.push('falling barometer');
  }

  // Advice
  const advice = getAdvice(tide, score);
  if (advice) parts.push(advice);

  return parts.join(' — ') + '.';
}

function describeTide(tide: TideStage): string {
  if (tide.stage === 'slack_high') return 'slack high tide, water about to turn';
  if (tide.stage === 'slack_low') return 'slack low tide, water about to turn';

  const direction = tide.stage === 'incoming' ? 'incoming' : 'outgoing';
  const strengthAdj =
    tide.flowStrength === 'strong'
      ? 'strong'
      : tide.flowStrength === 'moderate'
        ? 'moderate'
        : 'light';

  // Time remaining to next change
  const minutesLeft =
    tide.stage === 'incoming' ? tide.timeToNextHigh : tide.timeToNextLow;
  const hoursLeft = Math.floor(minutesLeft / 60);
  const minsLeft = minutesLeft % 60;
  const timeStr =
    hoursLeft > 0
      ? `${hoursLeft}h ${minsLeft}m`
      : `${minsLeft}m`;

  return `${direction} tide with ${strengthAdj} flow, ${timeStr} remaining`;
}

function describeTimeOfDay(time: Date, sun: SunTimes): string {
  const ms = time.getTime();
  if (ms < sun.civilDawn.getTime()) return 'pre-dawn darkness';
  if (ms < sun.sunrise.getTime()) return 'civil dawn';
  if (ms < sun.sunrise.getTime() + 3600000) return 'post-sunrise';
  if (ms < sun.goldenHourStart.getTime()) return 'midday';
  if (ms < sun.sunset.getTime()) return 'approaching sunset';
  if (ms < sun.civilDusk.getTime()) return 'post-sunset';
  return 'after dark';
}

function describeMoon(moon: MoonData): string {
  const phaseNames: Record<string, string> = {
    new: 'new moon',
    waxing_crescent: 'waxing crescent moon',
    first_quarter: 'first quarter moon',
    waxing_gibbous: 'waxing gibbous moon',
    full: 'full moon',
    waning_gibbous: 'waning gibbous moon',
    last_quarter: 'last quarter moon',
    waning_crescent: 'waning crescent moon',
  };
  return phaseNames[moon.phase] ?? moon.phase;
}

function getAdvice(
  tide: TideStage,
  score: ExtendedFishingScore,
): string {
  if (score.overall >= 8) {
    if (tide.stage === 'outgoing' && tide.flowStrength === 'strong') {
      return 'Fish moving water near structure';
    }
    if (tide.stage === 'incoming') {
      return 'Work incoming current seams and rip edges';
    }
    return 'Prime conditions — cover water and stay focused';
  }
  if (score.overall >= 6) {
    return 'Solid window — adjust presentation to conditions';
  }
  if (score.overall >= 4) {
    return 'Patience will be key — slow down and fish thoroughly';
  }
  return 'Tough bite expected — downsize presentations and fish structure';
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getLabel(
  score: number,
): ExtendedFishingScore['label'] {
  if (score >= 9) return 'epic';
  if (score >= 7.5) return 'excellent';
  if (score >= 5.5) return 'good';
  if (score >= 3.5) return 'fair';
  return 'poor';
}
