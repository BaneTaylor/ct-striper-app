'use client';

import { useEffect, useState, useCallback } from 'react';
import type { RiverData } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface ThamesData {
  tideStage: { stage: string; height: number; flowStrength: string } | null;
  predictions: { t: string; v: string }[] | null;
}

interface RiverApiResponse {
  timestamp: string;
  ctRiver: RiverData | null;
  housatonic: RiverData | null;
  thames: ThamesData | null;
  waterTemp: number | null;
  errors?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const RIVER_ACCENT = '#0ea5e9'; // blue-green accent for river mode
const RIVER_ACCENT_DIM = 'rgba(14, 165, 233, 0.15)';

// ── Helpers ────────────────────────────────────────────────────────────────

function trendArrow(trend: RiverData['trend']): string {
  switch (trend) {
    case 'rising':
      return '\u2191';
    case 'falling':
      return '\u2193';
    default:
      return '\u2192';
  }
}

function trendColor(trend: RiverData['trend']): string {
  switch (trend) {
    case 'rising':
      return '#f59e0b';
    case 'falling':
      return '#3b82f6';
    default:
      return '#94a3b8';
  }
}

function getFlowAssessment(flowCfs: number, riverName: string): string {
  if (riverName === 'Connecticut River') {
    if (flowCfs > 20000)
      return 'River running high and likely stained after recent rain \u2014 use brighter colors, fish slower, target deeper holes.';
    if (flowCfs < 5000)
      return 'River running low and clear \u2014 downsize your presentation, fish early/late, target deeper pools.';
    return 'CT River running normal \u2014 standard presentations should work. Fish the bends and drop-offs.';
  }
  // Housatonic thresholds are proportionally smaller
  if (flowCfs > 8000)
    return 'Housatonic running high and muddy \u2014 fish the eddies with bright plugs and bucktails.';
  if (flowCfs < 1500)
    return 'Housatonic running low and clear \u2014 go finesse. Soft plastics on light jigs, dawn/dusk best.';
  return 'Housatonic running at a good level \u2014 work the current seams and drop-offs near Stevenson Dam.';
}

function getBaitfishStatus(waterTemp: number | null): {
  label: string;
  detail: string;
  color: string;
} {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // After June 15 or temp > 68
  if (month > 6 || (month === 6 && day > 15) || (waterTemp !== null && waterTemp > 68)) {
    return {
      label: 'Run Over',
      detail:
        'Run is over \u2014 focus on coastal spots and night fishing.',
      color: '#64748b',
    };
  }

  // Before April 1 or temp < 48
  if (month < 4 || (waterTemp !== null && waterTemp < 48)) {
    return {
      label: 'Too Early',
      detail:
        "Too early \u2014 baitfish haven't moved upriver yet.",
      color: '#64748b',
    };
  }

  // April 1-15, temp 48-52
  if (month === 4 && day <= 15) {
    if (waterTemp === null || (waterTemp >= 48 && waterTemp <= 52)) {
      return {
        label: 'Early Run',
        detail:
          'Early run \u2014 herring beginning to move. Scout the lower reaches.',
        color: '#f59e0b',
      };
    }
  }

  // April 15 - May 15, temp 52-58
  if (
    (month === 4 && day > 15) ||
    (month === 5 && day <= 15)
  ) {
    if (waterTemp === null || (waterTemp >= 52 && waterTemp <= 58)) {
      return {
        label: 'Peak Run',
        detail:
          'Peak run \u2014 herring and shad are in the rivers. Stripers are following. Fish the holes below dams.',
        color: '#22c55e',
      };
    }
  }

  // May 15 - June 15, temp 58-65
  if (
    (month === 5 && day > 15) ||
    (month === 6 && day <= 15)
  ) {
    if (waterTemp === null || (waterTemp >= 58 && waterTemp <= 65)) {
      return {
        label: 'Late Run',
        detail:
          'Late run \u2014 shad run winding down but big bass still hunting stragglers. Fish dawn/dusk.',
        color: '#f97316',
      };
    }
  }

  // Fallback based on temp alone if date doesn't match
  if (waterTemp !== null) {
    if (waterTemp < 48)
      return { label: 'Too Early', detail: "Too early \u2014 baitfish haven't moved upriver yet.", color: '#64748b' };
    if (waterTemp <= 52)
      return { label: 'Early Run', detail: 'Early run \u2014 herring beginning to move. Scout the lower reaches.', color: '#f59e0b' };
    if (waterTemp <= 58)
      return { label: 'Peak Run', detail: 'Peak run \u2014 herring and shad are in the rivers. Stripers are following. Fish the holes below dams.', color: '#22c55e' };
    if (waterTemp <= 65)
      return { label: 'Late Run', detail: 'Late run \u2014 shad run winding down but big bass still hunting stragglers. Fish dawn/dusk.', color: '#f97316' };
    return { label: 'Run Over', detail: 'Run is over \u2014 focus on coastal spots and night fishing.', color: '#64748b' };
  }

  // Fallback by month
  return {
    label: 'Active',
    detail: 'Baitfish run is underway \u2014 check local reports for specifics.',
    color: '#0ea5e9',
  };
}

function getLureRecommendations(
  flowCfs: number,
  riverName: string,
): { name: string; reason: string }[] {
  const isHigh =
    riverName === 'Connecticut River' ? flowCfs > 20000 : flowCfs > 8000;
  const isLow =
    riverName === 'Connecticut River' ? flowCfs < 5000 : flowCfs < 1500;

  if (isHigh) {
    return [
      { name: 'White Bucktail Jig (1 oz)', reason: 'Cuts through stained water, stays deep in heavy current' },
      { name: 'Chartreuse Paddle Tail', reason: 'Bright color for visibility in murky conditions' },
      { name: 'Lipless Crankbait (Chrome/Blue)', reason: 'Vibration helps fish locate it in dirty water' },
    ];
  }
  if (isLow) {
    return [
      { name: 'Soft Plastic Jerkbait (Pearl)', reason: 'Subtle action for clear, pressured water' },
      { name: 'Small Swimmer (3-4")', reason: 'Natural profile that won\'t spook fish in clear water' },
      { name: 'Al Gag\'s Whip-It Fish (Olive)', reason: 'Finesse presentation for wary bass' },
    ];
  }
  return [
    { name: 'White Bucktail Jig (3/4 oz)', reason: 'Versatile, works the current seams effectively' },
    { name: 'SP Minnow (Floating)', reason: 'Covers water column, great for sweeping bends' },
    { name: 'Slug-Go (White/Pearl)', reason: 'Deadly drifted through rips and eddies' },
  ];
}

// ── Components ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function RiverCard({
  title,
  data,
  riverName,
  delay = 0,
  loaded = false,
}: {
  title: string;
  data: RiverData | null;
  riverName: string;
  delay?: number;
  loaded?: boolean;
}) {
  if (!loaded) {
    return (
      <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <div className="space-y-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <p className="text-sm text-slate-500">Unable to load river data</p>
      </div>
    );
  }

  const assessment = getFlowAssessment(data.flowCfs, riverName);
  const lures = getLureRecommendations(data.flowCfs, riverName);

  return (
    <div
      className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 transition-all"
      style={{ animation: `fade-in 0.4s ease-out ${delay}ms both` }}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>

      {/* Flow + Trend */}
      <div className="mb-3 flex items-end gap-3">
        <span className="text-3xl font-bold text-white">
          {data.flowCfs.toLocaleString()}
        </span>
        <span className="mb-1 text-sm text-slate-400">CFS</span>
        <span
          className="mb-1 ml-auto flex items-center gap-1 text-lg font-semibold"
          style={{ color: trendColor(data.trend) }}
        >
          {trendArrow(data.trend)} {data.trend}
        </span>
      </div>

      {/* Gage Height */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
        <span>Gage Height:</span>
        <span className="font-medium text-white">{data.gageHeight} ft</span>
      </div>

      {/* Assessment */}
      <div
        className="mb-4 rounded-lg p-3 text-sm leading-relaxed"
        style={{ backgroundColor: RIVER_ACCENT_DIM, color: RIVER_ACCENT }}
      >
        {assessment}
      </div>

      {/* Lure Recommendations */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recommended Lures
        </h4>
        {lures.map((lure, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2"
          >
            <span className="mt-0.5 text-sm" style={{ color: RIVER_ACCENT }}>
              {'\u2022'}
            </span>
            <div>
              <div className="text-sm font-medium text-white">{lure.name}</div>
              <div className="text-xs text-slate-500">{lure.reason}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RiverPage() {
  const [data, setData] = useState<RiverApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/river');
      if (!res.ok) throw new Error('Failed to fetch river data');
      const json: RiverApiResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load river data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loaded = !loading && data !== null;
  const baitStatus = getBaitfishStatus(data?.waterTemp ?? null);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-white">River Mode</h1>
            <p className="text-xs text-slate-500">CT River Fishing Intelligence</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="min-h-[44px] rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-4 text-sm text-slate-300 transition-colors hover:border-sky-500/40 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-6">
        {/* Baitfish Run Tracker */}
        <section
          className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 transition-all"
          style={loaded ? { animation: 'fade-in 0.4s ease-out both' } : undefined}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Spring Baitfish Run Tracker
          </h3>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor: baitStatus.color + '1a',
                    color: baitStatus.color,
                  }}
                >
                  {baitStatus.label}
                </span>
                {data?.waterTemp !== null && data?.waterTemp !== undefined && (
                  <span className="text-sm text-slate-400">
                    Water Temp: <span className="font-medium text-white">{Math.round(data.waterTemp)}&deg;F</span>
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                {baitStatus.detail}
              </p>
            </div>
          )}
        </section>

        {/* Connecticut River */}
        <RiverCard
          title="Connecticut River \u2014 Haddam"
          data={data?.ctRiver ?? null}
          riverName="Connecticut River"
          delay={100}
          loaded={loaded}
        />

        {/* Housatonic River */}
        <RiverCard
          title="Housatonic River \u2014 Derby"
          data={data?.housatonic ?? null}
          riverName="Housatonic River"
          delay={200}
          loaded={loaded}
        />

        {/* Thames River (Tidal) */}
        <section
          className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 transition-all"
          style={loaded ? { animation: 'fade-in 0.4s ease-out 300ms both' } : undefined}
        >
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Thames River \u2014 New London (Tidal)
          </h3>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-[60px] w-full" />
            </div>
          ) : data?.thames?.tideStage ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">
                  {data.thames.tideStage.stage === 'incoming' ? '\u2191' : '\u2193'}
                </span>
                <div>
                  <div className="text-lg font-semibold capitalize text-white">
                    {data.thames.tideStage.stage}
                  </div>
                  <div className="text-sm text-slate-400">
                    {data.thames.tideStage.flowStrength} flow
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-slate-400">Height</div>
                  <div className="text-lg font-semibold text-white">
                    {data.thames.tideStage.height} ft
                  </div>
                </div>
              </div>

              {/* Mini tide curve */}
              {data.thames.predictions && data.thames.predictions.length > 2 && (
                <ThamesTideCurve predictions={data.thames.predictions} />
              )}

              <p
                className="mt-3 rounded-lg p-3 text-sm leading-relaxed"
                style={{ backgroundColor: RIVER_ACCENT_DIM, color: RIVER_ACCENT }}
              >
                Thames is tidal \u2014 no USGS gauge available. Showing NOAA tidal
                predictions from New London station. Best fishing on the outgoing
                tide as bait gets flushed from the harbors.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Unable to load Thames tidal data</p>
          )}
        </section>
      </main>
    </div>
  );
}

// Mini tide curve for Thames
function ThamesTideCurve({
  predictions,
}: {
  predictions: { t: string; v: string }[];
}) {
  const heights = predictions.map((p) => parseFloat(p.v));
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const range = maxH - minH || 1;

  const w = 280;
  const h = 60;
  const padY = 4;

  const points = predictions.map((p, i) => {
    const x = (i / (predictions.length - 1)) * w;
    const y = padY + (1 - (parseFloat(p.v) - minH) / range) * (h - 2 * padY);
    return `${x},${y}`;
  });

  const now = Date.now();
  let currentIdx = predictions.findIndex(
    (p) => new Date(p.t).getTime() > now,
  );
  if (currentIdx <= 0) currentIdx = Math.floor(predictions.length / 2);

  const cx = (currentIdx / (predictions.length - 1)) * w;
  const cy =
    padY +
    (1 - (parseFloat(predictions[currentIdx].v) - minH) / range) *
      (h - 2 * padY);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="mt-2">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={RIVER_ACCENT}
        strokeWidth="2"
        opacity="0.6"
      />
      <circle cx={cx} cy={cy} r="4" fill={RIVER_ACCENT} />
      <circle
        cx={cx}
        cy={cy}
        r="7"
        fill="none"
        stroke={RIVER_ACCENT}
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}
