import type { TidePrediction, HighLowTide, TideStage } from '@/lib/types';

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

/**
 * Format a Date as YYYYMMDD for the NOAA API.
 */
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Parse a NOAA datetime string "YYYY-MM-DD HH:MM" into a JS Date (UTC-like,
 * since we request LST_LDT the value is already in local time but JS will
 * interpret it as UTC unless we append a timezone — we treat it as-is).
 */
function parseNoaaTime(t: string): Date {
  // NOAA returns "2024-06-15 14:30" — convert to ISO-ish
  return new Date(t.replace(' ', 'T'));
}

/**
 * Fetch 6-minute-interval tide predictions for a given station and date.
 *
 * @param stationId  NOAA station ID (e.g. "8465705")
 * @param date       "today" or an ISO date string like "2024-06-15"
 */
export async function getTidePredictions(
  stationId: string,
  date: string = 'today',
): Promise<TidePrediction[]> {
  const begin = date === 'today' ? new Date() : new Date(date);
  const end = new Date(begin);
  end.setDate(end.getDate() + 1);

  const params = new URLSearchParams({
    begin_date: formatDate(begin),
    end_date: formatDate(end),
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    units: 'english',
    time_zone: 'lst_ldt',
    interval: '6',
    format: 'json',
    application: 'ct_striper_app',
  });

  const res = await fetch(`${NOAA_BASE}?${params}`);
  if (!res.ok) {
    throw new Error(`NOAA predictions API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.predictions) {
    throw new Error('No prediction data returned from NOAA');
  }

  return (data.predictions as { t: string; v: string }[]).map((p) => ({
    time: parseNoaaTime(p.t).toISOString(),
    height: parseFloat(p.v),
  }));
}

/**
 * Fetch high/low tide predictions for a station over the next 48 hours.
 */
export async function getHighLowTides(stationId: string): Promise<HighLowTide[]> {
  const begin = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 2);

  const params = new URLSearchParams({
    begin_date: formatDate(begin),
    end_date: formatDate(end),
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    units: 'english',
    time_zone: 'lst_ldt',
    interval: 'hilo',
    format: 'json',
    application: 'ct_striper_app',
  });

  const res = await fetch(`${NOAA_BASE}?${params}`);
  if (!res.ok) {
    throw new Error(`NOAA hilo API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.predictions) {
    throw new Error('No high/low data returned from NOAA');
  }

  return (data.predictions as { t: string; v: string; type: 'H' | 'L' }[]).map((p) => ({
    time: parseNoaaTime(p.t).toISOString(),
    height: parseFloat(p.v),
    type: p.type,
  }));
}

/**
 * Determine the current tide stage from a list of 6-minute predictions.
 *
 * Examines the predictions around the current time to determine whether the
 * tide is incoming, outgoing, or at slack, and calculates flow strength based
 * on the position within the tide cycle.
 */
export function getCurrentTideStage(predictions: TidePrediction[]): TideStage {
  const now = Date.now();

  // Find the two predictions that bracket the current time
  let idx = predictions.findIndex((p) => new Date(p.time).getTime() > now);
  if (idx <= 0) idx = 1;

  const prev = predictions[idx - 1];
  const next = predictions[idx];
  const currentHeight = interpolateHeight(prev, next, now);

  // Find the local highs and lows in the prediction set
  const extremes = findExtremes(predictions);

  // Find the previous and next extreme relative to now
  let prevExtreme: { time: string; height: number; type: 'H' | 'L' } | undefined;
  let nextExtreme: { time: string; height: number; type: 'H' | 'L' } | undefined;

  for (const e of extremes) {
    if (new Date(e.time).getTime() <= now) {
      prevExtreme = e;
    } else if (!nextExtreme) {
      nextExtreme = e;
    }
  }

  // If we cannot determine extremes, fall back to simple slope analysis
  if (!prevExtreme || !nextExtreme) {
    return buildFallbackStage(predictions, idx, currentHeight, now);
  }

  const prevTime = new Date(prevExtreme.time).getTime();
  const nextTime = new Date(nextExtreme.time).getTime();
  const cycleDuration = nextTime - prevTime;
  const elapsed = now - prevTime;
  const pctThrough = cycleDuration > 0 ? elapsed / cycleDuration : 0.5;

  // Determine direction
  const isRising = nextExtreme.type === 'H';

  // Determine slack windows: within 10% of a cycle at either end
  const slackThreshold = 0.10;
  const isNearPrevExtreme = pctThrough < slackThreshold;
  const isNearNextExtreme = pctThrough > 1 - slackThreshold;

  let stage: TideStage['stage'];
  if (isNearPrevExtreme) {
    stage = prevExtreme.type === 'H' ? 'slack_high' : 'slack_low';
  } else if (isNearNextExtreme) {
    stage = nextExtreme.type === 'H' ? 'slack_high' : 'slack_low';
  } else {
    stage = isRising ? 'incoming' : 'outgoing';
  }

  // Flow strength based on distance from extremes (mid-cycle = strongest)
  let flowStrength: TideStage['flowStrength'];
  const midDistance = Math.abs(pctThrough - 0.5);
  if (stage.startsWith('slack')) {
    flowStrength = 'weak';
  } else if (midDistance < 0.15) {
    flowStrength = 'strong';
  } else if (midDistance < 0.30) {
    flowStrength = 'moderate';
  } else {
    flowStrength = 'weak';
  }

  // Find next high and next low
  const futureExtremes = extremes.filter((e) => new Date(e.time).getTime() > now);
  const nextHighObj = futureExtremes.find((e) => e.type === 'H');
  const nextLowObj = futureExtremes.find((e) => e.type === 'L');

  const nextHigh = nextHighObj?.time ?? '';
  const nextLow = nextLowObj?.time ?? '';
  const timeToNextHigh = nextHighObj
    ? Math.round((new Date(nextHighObj.time).getTime() - now) / 60000)
    : 0;
  const timeToNextLow = nextLowObj
    ? Math.round((new Date(nextLowObj.time).getTime() - now) / 60000)
    : 0;

  return {
    stage,
    height: Math.round(currentHeight * 100) / 100,
    nextHigh,
    nextLow,
    timeToNextHigh,
    timeToNextLow,
    flowStrength,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function interpolateHeight(a: TidePrediction, b: TidePrediction, nowMs: number): number {
  const tA = new Date(a.time).getTime();
  const tB = new Date(b.time).getTime();
  const frac = (nowMs - tA) / (tB - tA);
  return a.height + frac * (b.height - a.height);
}

/**
 * Find local maxima and minima in the prediction set.
 */
function findExtremes(
  predictions: TidePrediction[],
): { time: string; height: number; type: 'H' | 'L' }[] {
  const result: { time: string; height: number; type: 'H' | 'L' }[] = [];
  // Use a sliding window of ~30 points (~3 hours) to smooth noise
  const window = 30;

  for (let i = window; i < predictions.length - window; i++) {
    const cur = predictions[i].height;
    let isMax = true;
    let isMin = true;

    for (let j = i - window; j <= i + window; j++) {
      if (j === i) continue;
      if (predictions[j].height >= cur) isMax = false;
      if (predictions[j].height <= cur) isMin = false;
    }

    if (isMax) {
      result.push({ time: predictions[i].time, height: cur, type: 'H' });
    } else if (isMin) {
      result.push({ time: predictions[i].time, height: cur, type: 'L' });
    }
  }

  return result;
}

function buildFallbackStage(
  predictions: TidePrediction[],
  idx: number,
  currentHeight: number,
  now: number,
): TideStage {
  // Simple: look at slope around current position
  const lookback = Math.max(0, idx - 5);
  const slope = predictions[idx].height - predictions[lookback].height;
  const stage: TideStage['stage'] =
    Math.abs(slope) < 0.05 ? (currentHeight > 3 ? 'slack_high' : 'slack_low') : slope > 0 ? 'incoming' : 'outgoing';

  return {
    stage,
    height: Math.round(currentHeight * 100) / 100,
    nextHigh: '',
    nextLow: '',
    timeToNextHigh: 0,
    timeToNextLow: 0,
    flowStrength: Math.abs(slope) < 0.05 ? 'weak' : Math.abs(slope) > 0.15 ? 'strong' : 'moderate',
  };
}
