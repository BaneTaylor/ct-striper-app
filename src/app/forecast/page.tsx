'use client';

import { useEffect, useState, useCallback } from 'react';
import { defaultSpots } from '@/lib/spots/default-spots';

// ── Types ────────────────────────────────────────────────────────────────────

interface ForecastWindow {
  start: string;
  end: string;
  score: number;
  reasons: string[];
  label: string;
}

interface ForecastDay {
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 4) return '#f59e0b';
  return '#64748b';
}

function scoreBg(score: number): string {
  if (score >= 7) return 'rgba(34,197,94,0.15)';
  if (score >= 4) return 'rgba(245,158,11,0.15)';
  return 'rgba(100,116,139,0.08)';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function moonPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    new: 'New Moon',
    waxing_crescent: 'Wax Cres',
    first_quarter: '1st Qtr',
    waxing_gibbous: 'Wax Gib',
    full: 'Full Moon',
    waning_gibbous: 'Wan Gib',
    last_quarter: 'Last Qtr',
    waning_crescent: 'Wan Cres',
  };
  return labels[phase] ?? phase;
}

function owmIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1e3a5f]/50 ${className}`}
    />
  );
}

// ── Hourly Radar Bar ─────────────────────────────────────────────────────────

function HourlyBar({ scores }: { scores: { hour: number; score: number }[] }) {
  return (
    <div className="relative mt-2 h-8 w-full overflow-hidden rounded-md bg-[#060e1a] border border-[#1e3a5f]/40">
      {/* Radar sweep effect */}
      <div className="absolute inset-0 opacity-10" style={{
        background: 'repeating-linear-gradient(90deg, transparent, transparent 4.1%, rgba(20,184,166,0.3) 4.1%, rgba(20,184,166,0.3) 4.2%)',
      }} />
      <div className="flex h-full">
        {scores.map((s) => {
          const color = s.score >= 7
            ? 'rgba(34,197,94,0.7)'
            : s.score >= 4
              ? 'rgba(245,158,11,0.5)'
              : 'rgba(30,58,95,0.3)';
          return (
            <div
              key={s.hour}
              className="flex-1 border-r border-[#0a1628]/30"
              style={{ backgroundColor: color }}
              title={`${s.hour}:00 - Score: ${s.score}`}
            />
          );
        })}
      </div>
      {/* Hour labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0.5">
        {[0, 6, 12, 18].map((h) => (
          <span key={h} className="text-[8px] text-slate-600">
            {h === 0 ? '12a' : h === 6 ? '6a' : h === 12 ? '12p' : '6p'}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({
  day,
  isExpanded,
  onToggle,
  isToday,
}: {
  day: ForecastDay;
  isExpanded: boolean;
  onToggle: () => void;
  isToday: boolean;
}) {
  return (
    <div
      className={`flex-shrink-0 rounded-xl border transition-all duration-200 ${
        isExpanded
          ? 'w-full border-[#14b8a6]/40 bg-[#0f1f3d]'
          : 'w-[160px] border-[#1e3a5f] bg-[#0f1f3d] cursor-pointer hover:border-[#14b8a6]/30'
      }`}
      onClick={!isExpanded ? onToggle : undefined}
    >
      {/* Compact view */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-[#14b8a6]' : 'text-slate-400'}`}>
              {isToday ? 'Today' : day.dayName}
            </div>
            <div className="text-[10px] text-slate-500">{formatDateShort(day.date)}</div>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: scoreBg(day.overallScore),
              color: scoreColor(day.overallScore),
            }}
          >
            {day.overallScore.toFixed(1)}
          </div>
        </div>

        {/* Weather + Moon row */}
        <div className="flex items-center justify-between mt-1">
          {day.weather ? (
            <div className="flex items-center gap-1">
              <img
                src={owmIconUrl(day.weather.icon)}
                alt={day.weather.description}
                className="h-7 w-7 -ml-1"
              />
              <span className="text-[10px] text-slate-400">
                {day.weather.high}/{day.weather.low}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500">--</span>
          )}
          <div className="flex items-center gap-1">
            <span className="text-sm">{day.moon.emoji}</span>
            <span className="text-[9px] text-slate-500">{moonPhaseLabel(day.moon.phase)}</span>
          </div>
        </div>

        {/* Hourly bar */}
        <HourlyBar scores={day.hourlyScores} />

        {/* Top windows (compact) */}
        {!isExpanded && day.topWindows.length > 0 && (
          <div className="mt-2 space-y-1">
            {day.topWindows.slice(0, 2).map((w, i) => (
              <div
                key={i}
                className="rounded-md px-2 py-1 text-[10px] leading-tight"
                style={{ backgroundColor: scoreBg(w.score) }}
              >
                <span style={{ color: scoreColor(w.score) }} className="font-semibold">
                  {formatTime(w.start)}-{formatTime(w.end)}
                </span>
                <span className="text-slate-400 ml-1">{w.reasons[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-[#1e3a5f] px-3 pb-4 pt-3">
          {/* Close button */}
          <button
            onClick={onToggle}
            className="mb-3 flex items-center gap-1 text-xs text-[#14b8a6] hover:text-[#2dd4bf] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
            Collapse
          </button>

          {/* Top Windows (detailed) */}
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Top Windows
            </h4>
            <div className="space-y-2">
              {day.topWindows.map((w, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#1e3a5f]/60 p-3"
                  style={{ backgroundColor: scoreBg(w.score) }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: scoreColor(w.score) }}>
                      {formatTime(w.start)} - {formatTime(w.end)}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: scoreColor(w.score) + '1a',
                        color: scoreColor(w.score),
                      }}
                    >
                      {w.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{w.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tide Schedule */}
          {day.tides.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Tide Schedule
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {day.tides.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-[#0a1628]/60 px-2 py-1.5"
                  >
                    <span className={`text-lg ${t.type === 'H' ? 'text-blue-400' : 'text-cyan-600'}`}>
                      {t.type === 'H' ? '\u2191' : '\u2193'}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-300">
                        {t.type === 'H' ? 'High' : 'Low'} - {t.height.toFixed(1)} ft
                      </div>
                      <div className="text-[10px] text-slate-500">{formatTime(t.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solunar Periods */}
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Solunar Periods
            </h4>
            <div className="space-y-1">
              {day.solunar.majorPeriods.map((p, i) => (
                <div key={`major-${i}`} className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-[#14b8a6]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#14b8a6]">
                    MAJOR
                  </span>
                  <span className="text-slate-300">
                    {formatTime(p.start)} - {formatTime(p.end)}
                  </span>
                </div>
              ))}
              {day.solunar.minorPeriods.map((p, i) => (
                <div key={`minor-${i}`} className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    MINOR
                  </span>
                  <span className="text-slate-300">
                    {formatTime(p.start)} - {formatTime(p.end)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Details */}
          {day.weather && (
            <div className="mb-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Weather
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5">
                  <span className="text-slate-500">High / Low</span>
                  <span className="text-slate-200">{day.weather.high}&deg; / {day.weather.low}&deg;</span>
                </div>
                <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5">
                  <span className="text-slate-500">Wind</span>
                  <span className="text-slate-200">{day.weather.windSpeed} mph (G{day.weather.windGust})</span>
                </div>
                <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5">
                  <span className="text-slate-500">Rain</span>
                  <span className="text-slate-200">{Math.round(day.weather.pop * 100)}%</span>
                </div>
                <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5 capitalize">
                  <span className="text-slate-500">Sky</span>
                  <span className="text-slate-200">{day.weather.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sun Times */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Sun
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5">
                <span className="text-amber-400">Sunrise</span>
                <span className="text-slate-200">{formatTime(day.sunTimes.sunrise)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-[#0a1628]/60 px-2 py-1.5">
                <span className="text-orange-400">Sunset</span>
                <span className="text-slate-200">{formatTime(day.sunTimes.sunset)}</span>
              </div>
            </div>
          </div>

          {/* All Hourly Scores */}
          <div className="mt-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Hourly Quality
            </h4>
            <div className="grid grid-cols-12 gap-0.5">
              {day.hourlyScores.map((s) => (
                <div key={s.hour} className="flex flex-col items-center">
                  <div
                    className="mb-0.5 h-6 w-full rounded-sm"
                    style={{
                      backgroundColor:
                        s.score >= 7
                          ? 'rgba(34,197,94,0.6)'
                          : s.score >= 4
                            ? 'rgba(245,158,11,0.4)'
                            : 'rgba(30,58,95,0.4)',
                    }}
                  />
                  <span className="text-[7px] text-slate-600">
                    {s.hour % 3 === 0 ? (s.hour === 0 ? '12a' : s.hour <= 12 ? `${s.hour}` : `${s.hour - 12}`) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const [days, setDays] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [selectedSpot, setSelectedSpot] = useState(0);

  const spot = defaultSpots[selectedSpot];

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/forecast?lat=${spot.lat}&lon=${spot.lon}&station=${spot.noaaStation}`,
      );
      if (!res.ok) throw new Error('Failed to fetch forecast');
      const json = await res.json();
      setDays(json.days ?? []);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  }, [spot.lat, spot.lon, spot.noaaStation]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-bold text-white">7-Day Bite Forecast</h1>
            <p className="text-[10px] text-slate-500">Tap a day to expand details</p>
          </div>
          <select
            value={selectedSpot}
            onChange={(e) => setSelectedSpot(Number(e.target.value))}
            className="min-h-[44px] max-w-[160px] truncate rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-2 text-xs text-white outline-none focus:border-[#14b8a6]"
          >
            {defaultSpots.map((s, i) => (
              <option key={i} value={i}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        {loading ? (
          // Skeleton
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-3">
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-9 w-9 rounded-full mb-2" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : expandedDay !== null && days[expandedDay] ? (
          // Expanded single-day view
          <DayCard
            day={days[expandedDay]}
            isExpanded={true}
            onToggle={() => setExpandedDay(null)}
            isToday={expandedDay === 0}
          />
        ) : (
          // Scrollable 7-day cards
          <>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {days.map((day, i) => (
                <DayCard
                  key={day.date}
                  day={day}
                  isExpanded={false}
                  onToggle={() => setExpandedDay(i)}
                  isToday={i === 0}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(34,197,94,0.7)' }} />
                <span>Prime (7+)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(245,158,11,0.5)' }} />
                <span>Decent (4-6)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(30,58,95,0.3)' }} />
                <span>Poor (0-3)</span>
              </div>
            </div>

            {/* Best day callout */}
            {days.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#14b8a6] mb-2">
                  Best Day This Week
                </h3>
                {(() => {
                  const best = days.reduce((a, b) => (a.overallScore > b.overallScore ? a : b));
                  return (
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-sm font-bold"
                          style={{ color: scoreColor(best.overallScore) }}
                        >
                          {best.overallScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-white font-medium">
                          {best.dayName}, {formatDateShort(best.date)}
                        </span>
                      </div>
                      {best.topWindows[0] && (
                        <p className="mt-1 text-xs text-slate-400">
                          {best.topWindows[0].label}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
