'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Catch } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CatchWithSpot extends Catch {
  spot_name?: string;
}

interface Insight {
  label: string;
  value: string;
  detail: string;
  icon: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function getTimeOfDayFromHour(hour: number): string {
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function getMonthName(month: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
}

function calculateInsights(catches: CatchWithSpot[]): Insight[] {
  if (catches.length < 5) return [];

  const insights: Insight[] = [];
  const total = catches.length;

  // 1. Average fish length
  const lengths = catches.filter((c) => c.fish_length).map((c) => c.fish_length!);
  if (lengths.length > 0) {
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const biggest = Math.max(...lengths);
    insights.push({
      label: 'Average Fish',
      value: `${avg.toFixed(1)}"`,
      detail: `Biggest: ${biggest}" across ${lengths.length} catches`,
      icon: 'ruler',
    });
  }

  // 2. Tide stage breakdown
  const tideCounts: Record<string, number> = {};
  for (const c of catches) {
    if (c.tide_stage) {
      tideCounts[c.tide_stage] = (tideCounts[c.tide_stage] ?? 0) + 1;
    }
  }
  const tideEntries = Object.entries(tideCounts).sort((a, b) => b[1] - a[1]);
  if (tideEntries.length > 0) {
    const [bestTide, count] = tideEntries[0];
    const pct = Math.round((count / total) * 100);
    insights.push({
      label: 'Best Tide',
      value: `${pct}% ${bestTide}`,
      detail: `You catch ${pct}% of your fish on ${bestTide} tide`,
      icon: 'tide',
    });
  }

  // 3. Best spot
  const spotCounts: Record<string, number> = {};
  for (const c of catches) {
    const name = c.spot_name ?? 'Unknown';
    spotCounts[name] = (spotCounts[name] ?? 0) + 1;
  }
  const spotEntries = Object.entries(spotCounts).sort((a, b) => b[1] - a[1]);
  if (spotEntries.length > 0 && spotEntries[0][0] !== 'Unknown') {
    const [bestSpot, count] = spotEntries[0];
    insights.push({
      label: 'Top Spot',
      value: bestSpot,
      detail: `${count} catches at this location`,
      icon: 'pin',
    });
  }

  // 4. Best lure
  const lureCounts: Record<string, number> = {};
  for (const c of catches) {
    if (c.lure_or_bait) {
      lureCounts[c.lure_or_bait] = (lureCounts[c.lure_or_bait] ?? 0) + 1;
    }
  }
  const lureEntries = Object.entries(lureCounts).sort((a, b) => b[1] - a[1]);
  if (lureEntries.length > 0) {
    const [bestLure, count] = lureEntries[0];
    // Check night catches with this lure
    const nightCatchesWithLure = catches.filter(
      (c) => c.lure_or_bait === bestLure && getTimeOfDayFromHour(new Date(c.caught_at).getHours()) === 'night',
    ).length;
    const lastN = Math.min(20, total);
    const recentCount = catches.slice(0, lastN).filter((c) => c.lure_or_bait === bestLure).length;

    let detail = `${count} catches total`;
    if (nightCatchesWithLure > 0) {
      detail = `${bestLure} accounts for ${recentCount} of your last ${lastN} catches`;
      if (nightCatchesWithLure > 1) detail += ` (${nightCatchesWithLure} at night)`;
    }

    insights.push({
      label: 'Top Lure',
      value: bestLure,
      detail,
      icon: 'lure',
    });
  }

  // 5. Best month
  const monthCounts: Record<number, number> = {};
  for (const c of catches) {
    const month = new Date(c.caught_at).getMonth();
    monthCounts[month] = (monthCounts[month] ?? 0) + 1;
  }
  const monthEntries = Object.entries(monthCounts)
    .map(([m, count]) => [Number(m), count] as [number, number])
    .sort((a, b) => b[1] - a[1]);
  if (monthEntries.length > 0) {
    const [bestMonth, count] = monthEntries[0];
    insights.push({
      label: 'Best Month',
      value: getMonthName(bestMonth),
      detail: `${count} catches in ${getMonthName(bestMonth)}`,
      icon: 'calendar',
    });
  }

  // 6. Most productive time of day
  const timeCounts: Record<string, number> = { dawn: 0, day: 0, dusk: 0, night: 0 };
  for (const c of catches) {
    const hour = new Date(c.caught_at).getHours();
    const tod = getTimeOfDayFromHour(hour);
    timeCounts[tod]++;
  }
  const timeEntries = Object.entries(timeCounts).sort((a, b) => b[1] - a[1]);
  if (timeEntries[0][1] > 0) {
    const [bestTime, count] = timeEntries[0];
    const pct = Math.round((count / total) * 100);
    insights.push({
      label: 'Best Time',
      value: bestTime.charAt(0).toUpperCase() + bestTime.slice(1),
      detail: `${pct}% of catches during ${bestTime} (${count} fish)`,
      icon: 'clock',
    });
  }

  return insights;
}

// ── Insight Card Icon ─────────────────────────────────────────────────────────

function InsightIcon({ icon }: { icon: string }) {
  const color = '#14b8a6';
  switch (icon) {
    case 'ruler':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M4 10h4M4 14h2M4 18h3" />
        </svg>
      );
    case 'tide':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      );
    case 'pin':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'lure':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6z" />
          <path d="M2 10s2-2 4-2" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Main Insights Page ────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [catches, setCatches] = useState<CatchWithSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('catches')
        .select('*, spots(name)')
        .eq('user_id', user.id)
        .order('caught_at', { ascending: false });

      const mapped: CatchWithSpot[] = (data ?? []).map((row: Record<string, unknown>) => {
        const spots = row.spots as { name: string } | null;
        return {
          ...row,
          spot_name: spots?.name ?? undefined,
        } as CatchWithSpot;
      });

      setCatches(mapped);
      setInsights(calculateInsights(mapped));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/log" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Pattern Insights</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : catches.length < 5 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#0f1f3d]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Not enough data yet</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              You need at least 5 logged catches to see pattern insights. You have {catches.length} so far.
            </p>
            <div className="mt-2 w-full max-w-xs">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{catches.length} catches</span>
                <span>5 needed</span>
              </div>
              <div className="h-2 rounded-full bg-[#1e3a5f]">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${Math.min(100, (catches.length / 5) * 100)}%` }}
                />
              </div>
            </div>
            <Link
              href="/log/new"
              className="mt-6 min-h-[48px] flex items-center rounded-lg bg-teal-600 px-6 font-medium text-white transition-colors hover:bg-teal-500"
            >
              Log a Catch
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary header */}
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 text-center animate-fade-in">
              <div className="text-3xl font-bold text-white">{catches.length}</div>
              <div className="text-sm text-slate-400">Total Catches Logged</div>
            </div>

            {/* Insight Cards */}
            {insights.map((insight, i) => (
              <div
                key={insight.label}
                className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 animate-fade-in"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                    <InsightIcon icon={insight.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {insight.label}
                    </div>
                    <div className="mt-0.5 text-xl font-bold text-white">{insight.value}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">{insight.detail}</div>
                  </div>
                </div>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#1e3a5f] bg-[#0f1f3d]/50 p-6 text-center">
                <p className="text-sm text-slate-500">No patterns detected yet. Keep logging catches!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
