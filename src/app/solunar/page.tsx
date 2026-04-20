'use client';

import { useEffect, useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface SolunarPeriod {
  start: string;
  end: string;
}

interface DaySolunar {
  date: string;
  dateLabel: string;
  dayOfWeek: string;
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  moonPhase: string;
  moonPhasePct: number;
  moonEmoji: string;
  moonrise: string;
  moonset: string;
  moonOverhead: string;
  moonUnderfoot: string;
  sunrise: string;
  sunset: string;
  goldenWindows: GoldenWindow[];
}

interface GoldenWindow {
  start: string;
  end: string;
  reason: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

// Default location: central CT coast
const DEFAULT_LAT = 41.26;
const DEFAULT_LON = -72.55;
const DEFAULT_STATION = '8465705';

// ── Helpers ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

function MoonIllustration({
  illumination,
  phase,
  size = 40,
}: {
  illumination: number;
  phase: string;
  size?: number;
}) {
  const isWaning = phase.startsWith('waning') || phase === 'last_quarter';
  const pct = illumination / 100;
  const litPct = Math.round(pct * 100);

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
      className="rounded-full border border-[#2a4a6f] flex-shrink-0"
      style={{ width: size, height: size, background: gradient }}
    />
  );
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SolunarPage() {
  const [days, setDays] = useState<DaySolunar[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number>(0);

  const fetchSolunarData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch 8 days of solunar data (today + 7)
      const results: DaySolunar[] = [];

      for (let offset = 0; offset < 8; offset++) {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        const dateStr = date.toISOString().split('T')[0];

        // Use the conditions API to get solunar + sun data
        const res = await fetch(
          `/api/conditions?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&station=${DEFAULT_STATION}&date=${dateStr}`,
        );

        if (!res.ok) continue;

        const data = await res.json();

        // Find golden windows (major solunar during peak tide movement)
        const goldenWindows: GoldenWindow[] = [];
        if (data.solunar?.majorPeriods && data.sunTimes) {
          for (const period of data.solunar.majorPeriods) {
            const pStart = new Date(period.start).getTime();
            const pEnd = new Date(period.end).getTime();

            // Check if period overlaps with dawn/dusk
            if (data.sunTimes.civilDawn && data.sunTimes.sunrise) {
              const dawnStart = new Date(data.sunTimes.civilDawn).getTime();
              const dawnEnd =
                new Date(data.sunTimes.sunrise).getTime() + 60 * 60000;
              if (pStart < dawnEnd && pEnd > dawnStart) {
                goldenWindows.push({
                  start: period.start,
                  end: period.end,
                  reason: 'Major solunar period at dawn',
                });
              }
            }
            if (data.sunTimes.sunset && data.sunTimes.civilDusk) {
              const duskStart =
                new Date(data.sunTimes.sunset).getTime() - 60 * 60000;
              const duskEnd = new Date(data.sunTimes.civilDusk).getTime();
              if (pStart < duskEnd && pEnd > duskStart) {
                goldenWindows.push({
                  start: period.start,
                  end: period.end,
                  reason: 'Major solunar period at dusk',
                });
              }
            }
          }
        }

        // Also check if tide movement coincides with solunar
        if (data.solunar?.majorPeriods && data.tideStage) {
          const tideFlowStrength = data.tideStage.flowStrength;
          if (tideFlowStrength === 'strong') {
            for (const period of data.solunar.majorPeriods) {
              const alreadyGolden = goldenWindows.some(
                (g) => g.start === period.start,
              );
              if (!alreadyGolden) {
                goldenWindows.push({
                  start: period.start,
                  end: period.end,
                  reason: 'Major solunar + strong tide movement',
                });
              }
            }
          }
        }

        results.push({
          date: dateStr,
          dateLabel: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
          majorPeriods: data.solunar?.majorPeriods ?? [],
          minorPeriods: data.solunar?.minorPeriods ?? [],
          moonPhase: data.moonData?.phase ?? 'unknown',
          moonPhasePct: data.moonData?.illumination ?? 0,
          moonEmoji: data.moonData?.emoji ?? '',
          moonrise: data.solunar?.moonrise ?? '',
          moonset: data.solunar?.moonset ?? '',
          moonOverhead: data.solunar?.moonOverhead ?? '',
          moonUnderfoot: data.solunar?.moonUnderfoot ?? '',
          sunrise: data.sunTimes?.sunrise ?? '',
          sunset: data.sunTimes?.sunset ?? '',
          goldenWindows,
        });
      }

      setDays(results);
    } catch (err) {
      console.error('Failed to load solunar data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolunarData();
  }, [fetchSolunarData]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-white">Solunar Tables</h1>
            <p className="text-xs text-slate-500">
              8-day forecast &middot; Major &amp; minor feeding periods
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Day selector strip */}
        {loading ? (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {days.map((day, i) => (
              <button
                key={day.date}
                onClick={() => setExpandedDay(i)}
                className={`flex min-w-[64px] flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-colors ${
                  expandedDay === i
                    ? 'border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]'
                    : 'border-[#1e3a5f] bg-[#0f1f3d] text-slate-400'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {isToday(day.date) ? 'Today' : day.dayOfWeek}
                </span>
                <span className="text-sm font-semibold">{day.dateLabel}</span>
                <MoonIllustration
                  illumination={day.moonPhasePct}
                  phase={day.moonPhase}
                  size={20}
                />
              </button>
            ))}
          </div>
        )}

        {/* Selected day detail */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : days[expandedDay] ? (
          <DayDetail day={days[expandedDay]} />
        ) : (
          <p className="text-center text-sm text-slate-500">
            No solunar data available
          </p>
        )}
      </main>
    </div>
  );
}

// ── Day Detail Component ───────────────────────────────────────────────────

function DayDetail({ day }: { day: DaySolunar }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Golden Windows */}
      {day.goldenWindows.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Golden Windows
          </h3>
          <div className="space-y-2">
            {day.goldenWindows.map((gw, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm text-amber-400">
                  {'\u2605'}
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-300">
                    {formatTime(gw.start)} - {formatTime(gw.end)}
                  </div>
                  <div className="text-xs text-amber-400/70">{gw.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Moon Phase */}
      <section className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Moon Phase
        </h3>
        <div className="flex items-center gap-4">
          <MoonIllustration
            illumination={day.moonPhasePct}
            phase={day.moonPhase}
            size={56}
          />
          <div className="flex-1">
            <div className="text-base font-semibold text-white">
              {moonPhaseLabel(day.moonPhase)}
            </div>
            <div className="text-sm text-slate-400">
              {day.moonPhasePct}% illuminated
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {day.moonrise && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Moonrise</span>
              <span className="text-white">{formatTime(day.moonrise)}</span>
            </div>
          )}
          {day.moonset && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Moonset</span>
              <span className="text-white">{formatTime(day.moonset)}</span>
            </div>
          )}
          {day.moonOverhead && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Overhead</span>
              <span className="text-white">{formatTime(day.moonOverhead)}</span>
            </div>
          )}
          {day.moonUnderfoot && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Underfoot</span>
              <span className="text-white">
                {formatTime(day.moonUnderfoot)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Major Periods */}
      <section className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Major Periods (2 hr &mdash; peak feeding)
        </h3>
        {day.majorPeriods.length === 0 ? (
          <p className="text-sm text-slate-500">No major periods available</p>
        ) : (
          <div className="space-y-2">
            {day.majorPeriods.map((p, i) => {
              const isGolden = day.goldenWindows.some(
                (g) => g.start === p.start,
              );
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isGolden
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-[#1e3a5f] bg-[#0a1628]'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isGolden
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-[#14b8a6]/20 text-[#14b8a6]'
                    }`}
                  >
                    M{i + 1}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-base font-semibold ${isGolden ? 'text-amber-300' : 'text-white'}`}
                    >
                      {formatTime(p.start)} - {formatTime(p.end)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {i === 0 ? 'Moon Overhead' : 'Moon Underfoot'}
                      {isGolden ? ' \u2022 GOLDEN WINDOW' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Minor Periods */}
      <section className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Minor Periods (1 hr &mdash; secondary feeding)
        </h3>
        {day.minorPeriods.length === 0 ? (
          <p className="text-sm text-slate-500">No minor periods available</p>
        ) : (
          <div className="space-y-2">
            {day.minorPeriods.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-slate-400">
                  m{i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-white">
                    {formatTime(p.start)} - {formatTime(p.end)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {i === 0 ? 'Moonrise' : 'Moonset'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sun Times */}
      <section className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sun
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {day.sunrise && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Sunrise</span>
              <span className="text-amber-300">{formatTime(day.sunrise)}</span>
            </div>
          )}
          {day.sunset && (
            <div className="flex justify-between rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
              <span className="text-slate-500">Sunset</span>
              <span className="text-orange-300">{formatTime(day.sunset)}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
