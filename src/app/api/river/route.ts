import { NextRequest } from 'next/server';
import { getRiverFlow } from '@/lib/api/usgs';
import { CT_RIVER_GAUGES } from '@/lib/types';

const NOAA_WATER_TEMP_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const THAMES_STATION = '8461490'; // New London

async function getNoaaTideData(stationId: string) {
  const now = new Date();
  const begin = new Date(now.getTime() - 6 * 3600000);
  const end = new Date(now.getTime() + 12 * 3600000);

  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    begin_date: fmt(begin),
    end_date: fmt(end),
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    units: 'english',
    time_zone: 'lst_ldt',
    interval: '6',
    format: 'json',
    application: 'ct_striper',
  });

  const res = await fetch(`${NOAA_WATER_TEMP_BASE}?${params}`);
  if (!res.ok) throw new Error(`NOAA tide API error: ${res.status}`);
  const data = await res.json();
  return data.predictions ?? [];
}

async function getNoaaWaterTemp(stationId: string): Promise<number | null> {
  const params = new URLSearchParams({
    date: 'latest',
    station: stationId,
    product: 'water_temperature',
    units: 'english',
    time_zone: 'lst_ldt',
    format: 'json',
    application: 'ct_striper',
  });

  try {
    const res = await fetch(`${NOAA_WATER_TEMP_BASE}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data.data?.[0];
    return latest ? parseFloat(latest.v) : null;
  } catch {
    return null;
  }
}

function deriveTideStage(predictions: { t: string; v: string }[]): {
  stage: string;
  height: number;
  flowStrength: string;
} {
  if (!predictions || predictions.length < 3) {
    return { stage: 'unknown', height: 0, flowStrength: 'unknown' };
  }

  const now = Date.now();
  let closestIdx = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < predictions.length; i++) {
    const diff = Math.abs(new Date(predictions[i].t).getTime() - now);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }

  const currentHeight = parseFloat(predictions[closestIdx].v);
  const prevIdx = Math.max(0, closestIdx - 3);
  const nextIdx = Math.min(predictions.length - 1, closestIdx + 3);
  const prevHeight = parseFloat(predictions[prevIdx].v);
  const nextHeight = parseFloat(predictions[nextIdx].v);

  const rising = nextHeight > prevHeight;
  const rate = Math.abs(nextHeight - prevHeight);

  return {
    stage: rising ? 'incoming' : 'outgoing',
    height: Math.round(currentHeight * 100) / 100,
    flowStrength: rate > 1.5 ? 'strong' : rate > 0.5 ? 'moderate' : 'weak',
  };
}

export async function GET(_request: NextRequest) {
  const errors: string[] = [];

  const [ctResult, housResult, thamesResult, waterTempResult] =
    await Promise.allSettled([
      getRiverFlow(CT_RIVER_GAUGES.CT_RIVER_HADDAM),
      getRiverFlow(CT_RIVER_GAUGES.HOUSATONIC_DERBY),
      getNoaaTideData(THAMES_STATION),
      getNoaaWaterTemp(THAMES_STATION),
    ]);

  const ctRiver =
    ctResult.status === 'fulfilled' ? ctResult.value : null;
  if (ctResult.status === 'rejected') errors.push(`ct_river: ${ctResult.reason}`);

  const housatonic =
    housResult.status === 'fulfilled' ? housResult.value : null;
  if (housResult.status === 'rejected') errors.push(`housatonic: ${housResult.reason}`);

  const thamesTides =
    thamesResult.status === 'fulfilled' ? thamesResult.value : null;
  if (thamesResult.status === 'rejected') errors.push(`thames: ${thamesResult.reason}`);

  const waterTemp =
    waterTempResult.status === 'fulfilled' ? waterTempResult.value : null;

  const thamesTideStage = thamesTides ? deriveTideStage(thamesTides) : null;

  return Response.json({
    timestamp: new Date().toISOString(),
    ctRiver,
    housatonic,
    thames: {
      tideStage: thamesTideStage,
      predictions: thamesTides?.slice(0, 60) ?? null,
    },
    waterTemp,
    errors: errors.length > 0 ? errors : undefined,
  });
}
