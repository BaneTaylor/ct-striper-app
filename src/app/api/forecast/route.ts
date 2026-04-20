import { NextRequest } from 'next/server';
import { getHighLowTides } from '@/lib/api/tides';
import { getForecast } from '@/lib/api/weather';
import { getSolunarData, getMoonPhase, getSunTimes } from '@/lib/api/solunar';

// ── Types ────────────────────────────────────────────────────────────────────

interface ForecastWindow {
  start: string;
  end: string;
  score: number;
  reasons: string[];
  label: string;
}

interface ForecastDayResult {
  date: string;
  dayName: string;
  overallScore: number;
  scoreLabel: string;
  weather: {
    high: number;
    low: number;
    description: string;
    icon: string;
    windSpeed: number;
    windGust: number;
    pop: number;
  } | null;
  moon: {
    phase: string;
    illumination: number;
    emoji: string;
  };
  sunTimes: {
    sunrise: string;
    sunset: string;
    civilDawn: string;
    civilDusk: string;
  };
  tides: { time: string; height: number; type: 'H' | 'L' }[];
  solunar: {
    majorPeriods: { start: string; end: string }[];
    minorPeriods: { start: string; end: string }[];
  };
  topWindows: ForecastWindow[];
  hourlyScores: { hour: number; score: number }[];
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '41.26');
  const lon = parseFloat(searchParams.get('lon') ?? '-72.55');
  const station = searchParams.get('station') ?? '8465705';

  const errors: string[] = [];

  // Fetch external data in parallel
  const [hiloResult, forecastResult] = await Promise.allSettled([
    getHighLowTides(station),
    getForecast(lat, lon),
  ]);

  const hiloTides = hiloResult.status === 'fulfilled' ? hiloResult.value : [];
  if (hiloResult.status === 'rejected') errors.push(`tides: ${hiloResult.reason}`);

  const weatherForecast = forecastResult.status === 'fulfilled' ? forecastResult.value : [];
  if (forecastResult.status === 'rejected') errors.push(`weather: ${forecastResult.reason}`);

  // Build 7 days starting today
  const days: ForecastDayResult[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);

    const dateStr = date.toISOString().slice(0, 10);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    // Sun times (local calculation)
    const sunTimes = getSunTimes(date, lat, lon);

    // Moon phase (local calculation)
    const moonData = getMoonPhase(date);

    // Solunar data (local calculation)
    const solunar = getSolunarData(date, lat, lon);

    // Tides: use NOAA data for days 0-1, extrapolate for days 2-6
    const dayTides = getTidesForDay(hiloTides, date, d);

    // Weather: match from forecast array
    const dayWeather = weatherForecast.find((w) => w.date === dateStr) ?? null;

    // Score each hour of the day
    const hourlyScores = scoreHours(date, sunTimes, solunar, dayTides, dayWeather);

    // Find top windows
    const topWindows = findTopWindows(date, sunTimes, solunar, dayTides, dayWeather, hourlyScores);

    // Overall day score = average of top 4 hours (represents fishing potential)
    const sortedScores = [...hourlyScores].sort((a, b) => b.score - a.score);
    const topHours = sortedScores.slice(0, 4);
    const overallScore = topHours.length > 0
      ? Math.round((topHours.reduce((s, h) => s + h.score, 0) / topHours.length) * 10) / 10
      : 3;

    days.push({
      date: dateStr,
      dayName,
      overallScore,
      scoreLabel: getScoreLabel(overallScore),
      weather: dayWeather
        ? {
            high: dayWeather.high,
            low: dayWeather.low,
            description: dayWeather.description,
            icon: dayWeather.icon,
            windSpeed: dayWeather.windSpeed,
            windGust: dayWeather.windGust,
            pop: dayWeather.pop,
          }
        : null,
      moon: {
        phase: moonData.phase,
        illumination: moonData.illumination,
        emoji: moonData.emoji,
      },
      sunTimes: {
        sunrise: sunTimes.sunrise.toISOString(),
        sunset: sunTimes.sunset.toISOString(),
        civilDawn: sunTimes.civilDawn.toISOString(),
        civilDusk: sunTimes.civilDusk.toISOString(),
      },
      tides: dayTides.map((t) => ({
        time: t.time,
        height: t.height,
        type: t.type,
      })),
      solunar: {
        majorPeriods: solunar.majorPeriods.map((p) => ({
          start: p.start.toISOString(),
          end: p.end.toISOString(),
        })),
        minorPeriods: solunar.minorPeriods.map((p) => ({
          start: p.start.toISOString(),
          end: p.end.toISOString(),
        })),
      },
      topWindows,
      hourlyScores,
    });
  }

  return Response.json({
    days,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ── Tide Extrapolation ───────────────────────────────────────────────────────

function getTidesForDay(
  hiloTides: { time: string; height: number; type: 'H' | 'L' }[],
  date: Date,
  dayOffset: number,
): { time: string; height: number; type: 'H' | 'L' }[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (dayOffset <= 1 && hiloTides.length > 0) {
    // Use actual NOAA data for today and tomorrow
    return hiloTides.filter((t) => {
      const tTime = new Date(t.time).getTime();
      return tTime >= dayStart.getTime() && tTime < dayEnd.getTime();
    });
  }

  // Extrapolate: semi-diurnal tides in CT repeat ~every 12h 25m with ~50 min daily shift
  // Take the tides from the earliest available day and shift forward
  if (hiloTides.length === 0) return [];

  const shiftMs = dayOffset * 50 * 60000; // ~50 min later per day
  const baseDayTides = hiloTides.slice(0, 4); // typically 4 tides per day

  return baseDayTides.map((t) => {
    const baseTime = new Date(t.time).getTime();
    const shifted = new Date(baseTime + dayOffset * 24 * 3600000 + shiftMs);
    return {
      time: shifted.toISOString(),
      height: t.height,
      type: t.type,
    };
  });
}

// ── Hourly Scoring ───────────────────────────────────────────────────────────

function scoreHours(
  date: Date,
  sunTimes: ReturnType<typeof getSunTimes>,
  solunar: ReturnType<typeof getSolunarData>,
  tides: { time: string; height: number; type: 'H' | 'L' }[],
  weather: { windSpeed: number; windGust: number; pop: number; pressure: number } | null,
): { hour: number; score: number }[] {
  const scores: { hour: number; score: number }[] = [];

  for (let h = 0; h < 24; h++) {
    const hourTime = new Date(date);
    hourTime.setHours(h, 30, 0, 0); // mid-hour

    let score = 3; // baseline

    // Time of day scoring
    score += scoreTimeOfDay(hourTime, sunTimes);

    // Solunar overlap
    score += scoreSolunarOverlap(hourTime, solunar);

    // Tide movement scoring
    score += scoreTideMovement(hourTime, tides);

    // Weather penalty
    if (weather) {
      if (weather.windGust > 25) score -= 1.5;
      else if (weather.windSpeed > 15) score -= 0.5;
      if (weather.pop > 0.7) score -= 0.5;
    }

    // Moon phase bonus
    if (solunar.moonPhase === 'new' || solunar.moonPhase === 'full') {
      score += 0.5;
    }

    scores.push({ hour: h, score: clamp(Math.round(score * 10) / 10, 0, 10) });
  }

  return scores;
}

function scoreTimeOfDay(time: Date, sun: ReturnType<typeof getSunTimes>): number {
  const ms = time.getTime();
  const sunrise = sun.sunrise.getTime();
  const sunset = sun.sunset.getTime();
  const civilDawn = sun.civilDawn.getTime();
  const civilDusk = sun.civilDusk.getTime();
  const goldenStart = sun.goldenHourStart.getTime();

  // Dawn zone: civil dawn to 1h after sunrise
  if (ms >= civilDawn - 30 * 60000 && ms <= sunrise + 60 * 60000) return 3;
  // Dusk zone: golden hour start to 30m after civil dusk
  if (ms >= goldenStart && ms <= civilDusk + 30 * 60000) return 3;
  // Night
  if (ms > civilDusk + 30 * 60000 || ms < civilDawn - 30 * 60000) return 1.5;
  // Early morning / late afternoon
  if (ms <= sunrise + 2 * 3600000 || ms >= goldenStart - 2 * 3600000) return 1;
  // Midday
  return 0;
}

function scoreSolunarOverlap(time: Date, solunar: ReturnType<typeof getSolunarData>): number {
  const ms = time.getTime();
  const halfHour = 30 * 60000;

  for (const p of solunar.majorPeriods) {
    if (ms >= p.start.getTime() - halfHour && ms <= p.end.getTime() + halfHour) return 2;
  }
  for (const p of solunar.minorPeriods) {
    if (ms >= p.start.getTime() - halfHour && ms <= p.end.getTime() + halfHour) return 1;
  }
  return 0;
}

function scoreTideMovement(
  time: Date,
  tides: { time: string; height: number; type: 'H' | 'L' }[],
): number {
  if (tides.length < 2) return 0.5;

  const ms = time.getTime();

  // Find bracketing tides
  let prev: typeof tides[0] | null = null;
  let next: typeof tides[0] | null = null;

  for (const t of tides) {
    const tMs = new Date(t.time).getTime();
    if (tMs <= ms) prev = t;
    else if (!next) next = t;
  }

  if (!prev || !next) return 0.5;

  const prevMs = new Date(prev.time).getTime();
  const nextMs = new Date(next.time).getTime();
  const cycleDuration = nextMs - prevMs;
  if (cycleDuration <= 0) return 0.5;

  const pctThrough = (ms - prevMs) / cycleDuration;

  // Near slack (within 10%) = low score
  if (pctThrough < 0.1 || pctThrough > 0.9) return -0.5;

  // Mid-tide (strongest flow, 30-70%) = best
  if (pctThrough >= 0.3 && pctThrough <= 0.7) return 1.5;

  // Building/dying flow
  return 0.5;
}

// ── Window Detection ─────────────────────────────────────────────────────────

function findTopWindows(
  date: Date,
  sunTimes: ReturnType<typeof getSunTimes>,
  solunar: ReturnType<typeof getSolunarData>,
  tides: { time: string; height: number; type: 'H' | 'L' }[],
  weather: { windSpeed: number; windGust: number } | null,
  hourlyScores: { hour: number; score: number }[],
): ForecastWindow[] {
  const windows: ForecastWindow[] = [];

  // Dawn window
  const dawnCenter = sunTimes.sunrise;
  windows.push(buildWindow(
    new Date(dawnCenter.getTime() - 90 * 60000),
    new Date(dawnCenter.getTime() + 90 * 60000),
    'Dawn',
    hourlyScores,
    sunTimes,
    solunar,
    tides,
  ));

  // Dusk window
  const duskCenter = sunTimes.sunset;
  windows.push(buildWindow(
    new Date(duskCenter.getTime() - 90 * 60000),
    new Date(duskCenter.getTime() + 90 * 60000),
    'Dusk',
    hourlyScores,
    sunTimes,
    solunar,
    tides,
  ));

  // Major solunar periods
  for (const p of solunar.majorPeriods) {
    // Skip if it overlaps significantly with dawn/dusk (avoid duplicates)
    const pCenter = (p.start.getTime() + p.end.getTime()) / 2;
    const nearDawn = Math.abs(pCenter - dawnCenter.getTime()) < 2 * 3600000;
    const nearDusk = Math.abs(pCenter - duskCenter.getTime()) < 2 * 3600000;

    if (!nearDawn && !nearDusk) {
      windows.push(buildWindow(
        p.start,
        p.end,
        'Major Solunar',
        hourlyScores,
        sunTimes,
        solunar,
        tides,
      ));
    }
  }

  // Peak tide movement windows (mid-tide between each pair of high/low)
  for (let i = 0; i < tides.length - 1; i++) {
    const t1 = new Date(tides[i].time).getTime();
    const t2 = new Date(tides[i + 1].time).getTime();
    const midPoint = (t1 + t2) / 2;
    const windowStart = new Date(midPoint - 60 * 60000);
    const windowEnd = new Date(midPoint + 60 * 60000);

    // Skip if overlaps with existing windows
    const overlaps = windows.some((w) => {
      const wCenter = (new Date(w.start).getTime() + new Date(w.end).getTime()) / 2;
      return Math.abs(wCenter - midPoint) < 2 * 3600000;
    });

    if (!overlaps) {
      const direction = tides[i].type === 'L' ? 'incoming' : 'outgoing';
      windows.push(buildWindow(
        windowStart,
        windowEnd,
        `Peak ${direction} tide`,
        hourlyScores,
        sunTimes,
        solunar,
        tides,
      ));
    }
  }

  // Sort by score and return top 2
  return windows
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function buildWindow(
  start: Date,
  end: Date,
  primaryReason: string,
  hourlyScores: { hour: number; score: number }[],
  sunTimes: ReturnType<typeof getSunTimes>,
  solunar: ReturnType<typeof getSolunarData>,
  tides: { time: string; height: number; type: 'H' | 'L' }[],
): ForecastWindow {
  // Calculate window score from hourly scores
  const startHour = start.getHours();
  const endHour = end.getHours() || 24;
  const relevantScores = hourlyScores.filter(
    (h) => h.hour >= startHour && h.hour <= endHour,
  );
  let score = relevantScores.length > 0
    ? relevantScores.reduce((s, h) => s + h.score, 0) / relevantScores.length
    : 4;

  // Build reasons list
  const reasons: string[] = [primaryReason];
  const midTime = new Date((start.getTime() + end.getTime()) / 2);

  // Check for overlapping factors
  const isDawn = midTime.getTime() >= sunTimes.civilDawn.getTime() - 30 * 60000 &&
    midTime.getTime() <= sunTimes.sunrise.getTime() + 60 * 60000;
  const isDusk = midTime.getTime() >= sunTimes.goldenHourStart.getTime() &&
    midTime.getTime() <= sunTimes.civilDusk.getTime() + 30 * 60000;

  if (isDawn && primaryReason !== 'Dawn') { reasons.push('dawn'); score += 0.5; }
  if (isDusk && primaryReason !== 'Dusk') { reasons.push('dusk'); score += 0.5; }

  // Solunar overlap
  for (const p of solunar.majorPeriods) {
    if (midTime.getTime() >= p.start.getTime() && midTime.getTime() <= p.end.getTime()) {
      if (primaryReason !== 'Major Solunar') { reasons.push('major solunar'); score += 1; }
    }
  }
  for (const p of solunar.minorPeriods) {
    if (midTime.getTime() >= p.start.getTime() && midTime.getTime() <= p.end.getTime()) {
      reasons.push('minor solunar');
      score += 0.5;
    }
  }

  // Tide movement check
  const tideInfo = getTideDirection(midTime, tides);
  if (tideInfo) {
    if (!primaryReason.includes('tide')) reasons.push(tideInfo);
  }

  score = clamp(Math.round(score * 10) / 10, 0, 10);

  // Build label
  const label = score >= 7 ? 'Strong window' : score >= 5 ? 'Decent window' : 'Slow window';

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    score,
    reasons,
    label: `${formatTimeShort(start)}-${formatTimeShort(end)} -- ${reasons.join(', ')}. ${label}.`,
  };
}

function getTideDirection(
  time: Date,
  tides: { time: string; height: number; type: 'H' | 'L' }[],
): string | null {
  const ms = time.getTime();
  let prev: typeof tides[0] | null = null;
  let next: typeof tides[0] | null = null;

  for (const t of tides) {
    const tMs = new Date(t.time).getTime();
    if (tMs <= ms) prev = t;
    else if (!next) next = t;
  }

  if (!prev || !next) return null;

  const direction = prev.type === 'L' ? 'incoming tide' : 'outgoing tide';
  const pct = (ms - new Date(prev.time).getTime()) /
    (new Date(next.time).getTime() - new Date(prev.time).getTime());

  if (pct >= 0.3 && pct <= 0.7) return `${direction} peak`;
  return direction;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'epic';
  if (score >= 6.5) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3.5) return 'fair';
  return 'poor';
}

function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
