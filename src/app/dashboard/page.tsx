'use client';

import { useEffect, useState, useCallback } from 'react';
import { defaultSpots } from '@/lib/spots/default-spots';

// ── Types for API response ──────────────────────────────────────────────────

interface TideStageData {
  stage: 'incoming' | 'outgoing' | 'slack_high' | 'slack_low';
  height: number;
  nextHigh: string;
  nextLow: string;
  timeToNextHigh: number;
  timeToNextLow: number;
  flowStrength: 'strong' | 'moderate' | 'weak';
}

interface PredictionPoint {
  time: string;
  height: number;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  pressureTrend: 'rising' | 'falling' | 'steady' | 'rapidly_rising' | 'rapidly_falling';
  windSpeed: number;
  windGust: number;
  windDirection: number;
  windDirectionStr: string;
  description: string;
  icon: string;
  cloudCover: number;
  visibility: number;
}

interface SolunarData {
  majorPeriods: { start: string; end: string }[];
  minorPeriods: { start: string; end: string }[];
  moonPhase: string;
  moonPhasePct: number;
  moonrise: string;
  moonset: string;
}

interface SunData {
  sunrise: string;
  sunset: string;
  goldenHourStart: string;
  goldenHourEnd: string;
  civilDawn: string;
  civilDusk: string;
}

interface MoonInfo {
  phase: string;
  illumination: number;
  emoji: string;
}

interface FishingScoreData {
  overall: number;
  breakdown: {
    tideMovement: number;
    timeOfDay: number;
    moonPhase: number;
    barometricPressure: number;
    waterTemp: number;
  };
  label: string;
  summary: string;
}

interface BestWindow {
  time: string;
  score: number;
  reason: string;
}

interface ConditionsResponse {
  timestamp: string;
  tideStage: TideStageData | null;
  predictions: PredictionPoint[] | null;
  weather: WeatherData | null;
  solunar: SolunarData | null;
  sunTimes: SunData | null;
  moonData: MoonInfo | null;
  fishingScore: FishingScoreData | null;
  bestWindows: BestWindow[];
  errors?: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function scoreColor(score: number): string {
  if (score >= 9) return '#22c55e';
  if (score >= 7) return '#14b8a6';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function scoreGlowClass(score: number): string {
  if (score >= 9) return 'score-glow-excellent';
  if (score >= 7) return 'score-glow-good';
  if (score >= 4) return 'score-glow-fair';
  return 'score-glow-poor';
}

function pressureArrow(trend: WeatherData['pressureTrend']): string {
  switch (trend) {
    case 'rising':
    case 'rapidly_rising':
      return '\u2191';
    case 'falling':
    case 'rapidly_falling':
      return '\u2193';
    default:
      return '\u2192';
  }
}

function getLightStatus(sunTimes: SunData): string {
  const now = Date.now();
  const sunrise = new Date(sunTimes.sunrise).getTime();
  const sunset = new Date(sunTimes.sunset).getTime();
  const goldenStart = new Date(sunTimes.goldenHourStart).getTime();
  const civilDawn = new Date(sunTimes.civilDawn).getTime();
  const civilDusk = new Date(sunTimes.civilDusk).getTime();

  if (now < civilDawn) return 'Night';
  if (now < sunrise) return 'Civil Dawn';
  if (now >= goldenStart && now < sunset) return 'Golden Hour';
  if (now >= sunset && now < civilDusk) return 'Dusk';
  if (now > civilDusk) return 'Night';
  return 'Daylight';
}

function moonPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    new: 'New Moon',
    waxing_crescent: 'Waxing Crescent',
    first_quarter: 'First Quarter',
    waxing_gibbous: 'Waxing Gibbous',
    full: 'Full Moon',
    waning_gibbous: 'Waning Gibbous',
    last_quarter: 'Last Quarter',
    waning_crescent: 'Waning Crescent',
  };
  return labels[phase] ?? phase;
}

// ── Components ──────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-premium ${className}`} />;
}

function conditionColor(score: number | undefined): string {
  if (score === undefined) return '#1e3a5f';
  if (score >= 8) return '#22c55e';
  if (score >= 6) return '#14b8a6';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function Card({
  title,
  children,
  delay = 0,
  loaded = false,
  conditionScore,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  loaded?: boolean;
  conditionScore?: number;
}) {
  const borderColor = conditionScore !== undefined ? conditionColor(conditionScore) : undefined;
  return (
    <div
      className="glass-card rounded-2xl p-5 transition-all duration-300"
      style={{
        ...(loaded ? { animation: `fade-in 0.5s ease-out ${delay}ms both` } : {}),
        ...(borderColor ? { borderLeft: `3px solid ${borderColor}`, boxShadow: `inset 3px 0 12px -6px ${borderColor}40` } : {}),
        border: borderColor ? undefined : '1px solid rgba(30, 58, 95, 0.5)',
        borderTop: borderColor ? '1px solid rgba(30, 58, 95, 0.5)' : undefined,
        borderRight: borderColor ? '1px solid rgba(30, 58, 95, 0.5)' : undefined,
        borderBottom: borderColor ? '1px solid rgba(30, 58, 95, 0.5)' : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          {title}
        </h3>
        {conditionScore !== undefined && (
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: borderColor, background: `${borderColor}15` }}>
            {conditionScore.toFixed(1)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Circular score gauge with glowing ring
function ScoreGauge({ score, label, summary }: { score: number; label: string; summary: string }) {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const progress = (score / 10) * circumference;
  const isHigh = score >= 7;
  const glowClass = scoreGlowClass(score);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className={`relative rounded-full ${isHigh ? 'animate-score-pulse' : ''}`}>
        <div className={`rounded-full ${glowClass}`}>
          <svg width="160" height="160" viewBox="0 0 120 120">
            {/* Outer glow ring */}
            {isHigh && (
              <circle
                cx="60"
                cy="60"
                r="58"
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity="0.15"
              />
            )}
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#1e3a5f"
              strokeWidth="8"
              opacity="0.5"
            />
            {/* Score arc */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            {/* Inner subtle ring */}
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity="0.1"
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-5xl font-extrabold tracking-tight ${isHigh ? 'gradient-text' : ''}`}
              style={!isHigh ? { color } : undefined}
            >
              {score.toFixed(1)}
            </span>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {label}
            </span>
          </div>
        </div>
      </div>
      <p className="max-w-md text-center text-sm leading-relaxed text-slate-400">
        {summary}
      </p>
    </div>
  );
}

// Mini tide curve SVG
function TideCurve({ predictions }: { predictions: PredictionPoint[] }) {
  if (predictions.length < 2) return null;

  const heights = predictions.map((p) => p.height);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const range = maxH - minH || 1;

  const w = 280;
  const h = 60;
  const padY = 4;

  const points = predictions.map((p, i) => {
    const x = (i / (predictions.length - 1)) * w;
    const y = padY + (1 - (p.height - minH) / range) * (h - 2 * padY);
    return `${x},${y}`;
  });

  // Find current position
  const now = Date.now();
  let currentIdx = predictions.findIndex((p) => new Date(p.time).getTime() > now);
  if (currentIdx <= 0) currentIdx = Math.floor(predictions.length / 2);

  const cx = (currentIdx / (predictions.length - 1)) * w;
  const cy =
    padY +
    (1 - (predictions[currentIdx].height - minH) / range) * (h - 2 * padY);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="mt-3">
      <defs>
        <linearGradient id="tideGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="url(#tideGrad)"
        strokeWidth="2.5"
      />
      {/* Current position */}
      <circle cx={cx} cy={cy} r="4" fill="#14b8a6" />
      <circle cx={cx} cy={cy} r="8" fill="none" stroke="#14b8a6" strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// Wind compass arrow
function WindArrow({ direction, speed }: { direction: number; speed: number }) {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div className="absolute h-full w-full rounded-full border border-[#1e3a5f]/60" />
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${direction}deg)` }}
      >
        <path d="M12 2L8 14h8L12 2z" fill="#14b8a6" />
        <path d="M12 22L8 14h8L12 22z" fill="#1e3a5f" />
      </svg>
      <span className="absolute -bottom-6 text-[10px] font-medium text-slate-400">{Math.round(speed)} mph</span>
    </div>
  );
}

// Moon phase circle
function MoonPhaseIcon({ illumination, phase }: { illumination: number; phase: string }) {
  const isWaning = phase.startsWith('waning') || phase === 'last_quarter';
  const litPct = Math.round((illumination / 100) * 100);

  let gradient: string;
  if (phase === 'new') {
    gradient = 'radial-gradient(circle, #1e3a5f 100%, #1e3a5f 100%)';
  } else if (phase === 'full') {
    gradient = 'radial-gradient(circle, #e2e8f0 100%, #e2e8f0 100%)';
  } else if (!isWaning) {
    gradient = `linear-gradient(to right, #1e3a5f ${100 - litPct}%, #e2e8f0 ${100 - litPct}%)`;
  } else {
    gradient = `linear-gradient(to left, #1e3a5f ${100 - litPct}%, #e2e8f0 ${100 - litPct}%)`;
  }

  return (
    <div
      className="h-14 w-14 rounded-full border border-[#2a4a6f]/50"
      style={{ background: gradient, boxShadow: '0 0 15px rgba(226, 232, 240, 0.05)' }}
    />
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<ConditionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(0);
  const [now, setNow] = useState(new Date());

  const spot = defaultSpots[selectedSpot];

  const fetchConditions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/conditions?lat=${spot.lat}&lon=${spot.lon}&station=${spot.noaaStation}`,
      );
      if (!res.ok) throw new Error('Failed to fetch conditions');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load conditions:', err);
    } finally {
      setLoading(false);
    }
  }, [spot.lat, spot.lon, spot.noaaStation]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loaded = !loading && data !== null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24 water-ripple">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f]/50 bg-[#0a1628]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <select
            value={selectedSpot}
            onChange={(e) => setSelectedSpot(Number(e.target.value))}
            className="min-h-[48px] max-w-[200px] truncate rounded-xl border border-[#1e3a5f]/50 bg-[#0f1f3d]/80 px-3 text-sm text-white outline-none backdrop-blur-sm transition-colors focus:border-[#14b8a6]/50"
          >
            {defaultSpots.map((s, i) => (
              <option key={i} value={i}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-slate-500">
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* ── Current Conditions Header ─────────────────────────────── */}
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Current Conditions
          </h2>
          {loaded && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              Live
            </span>
          )}
        </div>

        {/* ── Fishing Score ──────────────────────────────────────────── */}
        <section className="mb-8">
          {loading ? (
            <div className="flex flex-col items-center gap-5">
              <Skeleton className="h-[160px] w-[160px] rounded-full" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
          ) : data?.fishingScore ? (
            <div className="animate-fade-in-up">
              <ScoreGauge
                score={data.fishingScore.overall}
                label={data.fishingScore.label}
                summary={data.fishingScore.summary}
              />
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500">
              Unable to calculate fishing score
            </div>
          )}
        </section>

        {/* ── Conditions Grid ────────────────────────────────────────── */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1: Tide */}
          <Card title="Tide" delay={0} loaded={loaded} conditionScore={data?.fishingScore?.breakdown?.tideMovement}>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-[60px] w-full rounded-lg" />
              </div>
            ) : data?.tideStage ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">
                    {data.tideStage.stage === 'incoming'
                      ? '\u2191'
                      : data.tideStage.stage === 'outgoing'
                        ? '\u2193'
                        : '\u2014'}
                  </span>
                  <div>
                    <div className="text-base font-bold capitalize text-white">
                      {data.tideStage.stage.replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {data.tideStage.flowStrength} flow
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Height: {data.tideStage.height.toFixed(1)} ft
                </div>
                {data.tideStage.timeToNextHigh > 0 && (
                  <div className="text-[11px] text-slate-500">
                    Next high: {formatMinutes(data.tideStage.timeToNextHigh)}
                  </div>
                )}
                {data.tideStage.timeToNextLow > 0 && (
                  <div className="text-[11px] text-slate-500">
                    Next low: {formatMinutes(data.tideStage.timeToNextLow)}
                  </div>
                )}
                {data.predictions && <TideCurve predictions={data.predictions} />}
              </>
            ) : (
              <div className="text-xs text-slate-500">No tide data</div>
            )}
          </Card>

          {/* Card 2: Wind & Weather */}
          <Card title="Wind & Weather" delay={100} loaded={loaded} conditionScore={data?.fishingScore?.breakdown?.barometricPressure}>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            ) : data?.weather ? (
              <>
                <div className="mb-3 flex items-start gap-3">
                  <WindArrow
                    direction={data.weather.windDirection}
                    speed={data.weather.windSpeed}
                  />
                  <div className="mt-1">
                    <div className="text-lg font-bold text-white">
                      {data.weather.windDirectionStr}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Gust {Math.round(data.weather.windGust)} mph
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Temp</span>
                    <span className="font-medium text-white">{Math.round(data.weather.temp)}&deg;F</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pressure</span>
                    <span className="font-medium text-white">
                      {data.weather.pressure} hPa{' '}
                      <span
                        className={
                          data.weather.pressureTrend.includes('falling')
                            ? 'text-amber-400'
                            : data.weather.pressureTrend.includes('rising')
                              ? 'text-teal-400'
                              : ''
                        }
                      >
                        {pressureArrow(data.weather.pressureTrend)}
                      </span>
                    </span>
                  </div>
                  <div className="capitalize text-slate-300">
                    {data.weather.description}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">No weather data</div>
            )}
          </Card>

          {/* Card 3: Moon & Solunar */}
          <Card title="Moon & Solunar" delay={200} loaded={loaded} conditionScore={data?.fishingScore?.breakdown?.moonPhase}>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            ) : data?.moonData ? (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <MoonPhaseIcon
                    illumination={data.moonData.illumination}
                    phase={data.moonData.phase}
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      {moonPhaseLabel(data.moonData.phase)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {data.moonData.illumination}% illuminated
                    </div>
                  </div>
                </div>
                {data.solunar && (
                  <div className="space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Moonrise</span>
                      <span className="font-medium text-white">{formatTime(data.solunar.moonrise)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moonset</span>
                      <span className="font-medium text-white">{formatTime(data.solunar.moonset)}</span>
                    </div>
                    {data.solunar.majorPeriods[0] && (
                      <div className="mt-3 rounded-xl bg-[#14b8a6]/10 px-3 py-2 text-[#14b8a6]">
                        <div className="font-semibold">Next Major Period</div>
                        <div>
                          {formatTime(data.solunar.majorPeriods[0].start)} -{' '}
                          {formatTime(data.solunar.majorPeriods[0].end)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500">No moon data</div>
            )}
          </Card>

          {/* Card 4: Sun */}
          <Card title={`Sun · ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`} delay={300} loaded={loaded} conditionScore={data?.fishingScore?.breakdown?.timeOfDay}>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ) : data?.sunTimes ? (
              <>
                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">&#9728;</span> Sunrise
                    </span>
                    <span className="font-medium text-white">{formatTime(data.sunTimes.sunrise)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-orange-400">&#9728;</span> Sunset
                    </span>
                    <span className="font-medium text-white">{formatTime(data.sunTimes.sunset)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Golden Hour</span>
                    <span className="font-medium text-amber-300">
                      {formatTime(data.sunTimes.goldenHourStart)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${
                      getLightStatus(data.sunTimes) === 'Night'
                        ? 'bg-indigo-500/10 text-indigo-300'
                        : getLightStatus(data.sunTimes) === 'Golden Hour'
                          ? 'bg-amber-500/10 text-amber-300'
                          : getLightStatus(data.sunTimes) === 'Dusk' || getLightStatus(data.sunTimes) === 'Civil Dawn'
                            ? 'bg-orange-500/10 text-orange-300'
                            : 'bg-sky-500/10 text-sky-300'
                    }`}
                  >
                    {getLightStatus(data.sunTimes)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">No sun data</div>
            )}
          </Card>
        </section>

        {/* ── Best Windows ───────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Best Windows Today
          </h2>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : data?.bestWindows && data.bestWindows.length > 0 ? (
            <div className="space-y-3">
              {data.bestWindows.map((w, i) => (
                <div
                  key={i}
                  className="glass-card flex items-center gap-4 rounded-2xl p-4 animate-fade-in"
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                    style={{
                      backgroundColor: scoreColor(w.score) + '15',
                      color: scoreColor(w.score),
                      boxShadow: `0 0 12px ${scoreColor(w.score)}15`,
                    }}
                  >
                    {w.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{w.time}</div>
                    <div className="truncate text-[11px] text-slate-400">{w.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No windows available</div>
          )}
        </section>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Log Catch', href: '/log', icon: '\u270F' },
              { label: 'Check Spots', href: '/spots', icon: '\uD83D\uDCCD' },
              { label: 'Lure Guide', href: '/menu', icon: '\uD83C\uDFA3' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="glass-card flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 text-center transition-all duration-300 hover:bg-[#162a4a]/80"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-[11px] font-semibold text-slate-300">{action.label}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
