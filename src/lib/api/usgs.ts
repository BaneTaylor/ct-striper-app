import type { RiverData } from '@/lib/types';

const USGS_BASE = 'https://waterservices.usgs.gov/nwis/iv';

// USGS parameter codes
const PARAM_DISCHARGE = '00060'; // Discharge, cubic feet per second
const PARAM_GAGE_HEIGHT = '00065'; // Gage height, feet

/**
 * Fetch the latest instantaneous river flow data for a USGS site.
 *
 * Common CT sites:
 *   - 01193050 — Connecticut River at Middle Haddam
 *   - 01205500 — Housatonic River at Stevenson (near Derby)
 *
 * @param siteId  USGS site number
 */
export async function getRiverFlow(siteId: string): Promise<RiverData> {
  const params = new URLSearchParams({
    format: 'json',
    sites: siteId,
    parameterCd: `${PARAM_DISCHARGE},${PARAM_GAGE_HEIGHT}`,
    // Fetch last 24 hours so we can calculate trend
    period: 'PT24H',
    siteStatus: 'active',
  });

  const res = await fetch(`${USGS_BASE}?${params}`);
  if (!res.ok) {
    throw new Error(`USGS API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const timeSeries: USGSTimeSeries[] = data.value?.timeSeries ?? [];

  if (timeSeries.length === 0) {
    throw new Error(`No data returned for USGS site ${siteId}`);
  }

  // Extract discharge and gage height series
  const dischargeSeries = timeSeries.find(
    (ts) => ts.variable?.variableCode?.[0]?.value === PARAM_DISCHARGE,
  );
  const gageSeries = timeSeries.find(
    (ts) => ts.variable?.variableCode?.[0]?.value === PARAM_GAGE_HEIGHT,
  );

  const dischargeValues = dischargeSeries?.values?.[0]?.value ?? [];
  const gageValues = gageSeries?.values?.[0]?.value ?? [];

  if (dischargeValues.length === 0) {
    throw new Error(`No discharge data for USGS site ${siteId}`);
  }

  // Latest reading
  const latest = dischargeValues[dischargeValues.length - 1];
  const latestFlow = parseFloat(latest.value);
  const timestamp = latest.dateTime;

  // Gage height — use latest if available
  const latestGage =
    gageValues.length > 0
      ? parseFloat(gageValues[gageValues.length - 1].value)
      : 0;

  // Calculate trend from the last 6 hours of data
  const trend = calculateFlowTrend(dischargeValues);

  return {
    flowCfs: Math.round(latestFlow),
    trend,
    gageHeight: Math.round(latestGage * 100) / 100,
    timestamp,
  };
}

// ── Trend Calculation ───────────────────────────────────────────────────────

function calculateFlowTrend(
  values: { value: string; dateTime: string }[],
): RiverData['trend'] {
  if (values.length < 4) return 'stable';

  // Compare the average of the last quarter to the average of the third quarter
  const n = values.length;
  const recentStart = Math.floor(n * 0.75);
  const midStart = Math.floor(n * 0.5);

  const recentAvg = avgValues(values.slice(recentStart));
  const midAvg = avgValues(values.slice(midStart, recentStart));

  if (midAvg === 0) return 'stable';

  const pctChange = ((recentAvg - midAvg) / midAvg) * 100;

  // More than 5% change is considered rising/falling
  if (pctChange > 5) return 'rising';
  if (pctChange < -5) return 'falling';
  return 'stable';
}

function avgValues(vals: { value: string }[]): number {
  if (vals.length === 0) return 0;
  const sum = vals.reduce((s, v) => s + parseFloat(v.value), 0);
  return sum / vals.length;
}

// ── USGS response types (internal) ─────────────────────────────────────────

interface USGSTimeSeries {
  variable?: {
    variableCode?: { value: string }[];
  };
  values?: {
    value: { value: string; dateTime: string }[];
  }[];
}
