'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Catch } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function tideIcon(stage: string | null): string {
  if (!stage) return '';
  if (stage === 'incoming') return '\u2191';
  if (stage === 'outgoing') return '\u2193';
  return '\u2014';
}

// ── Catch Card ────────────────────────────────────────────────────────────────

interface CatchWithSpot extends Catch {
  spot_name?: string;
}

function CatchCard({ c, index }: { c: CatchWithSpot; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] transition-all animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Photo thumbnail or fish icon */}
          {c.photo_url ? (
            <div
              className="h-12 w-12 flex-shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${c.photo_url})` }}
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#162a4a] text-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6z" />
                <path d="M2 10s2-2 4-2 3 1.5 3 4-1 4-3 4-4-2-4-2" />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {c.fish_length && (
                  <span className="text-lg font-bold text-white">{c.fish_length}&quot;</span>
                )}
                {c.fish_weight && (
                  <span className="text-sm text-slate-400">{c.fish_weight} lbs</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{formatDate(c.caught_at)}</span>
              <span>{formatTime(c.caught_at)}</span>
              {c.spot_name && (
                <span className="rounded-full bg-[#162a4a] px-2 py-0.5 text-[10px] text-slate-400">
                  {c.spot_name}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-2">
              {c.lure_or_bait && (
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400">
                  {c.lure_or_bait}
                </span>
              )}
              {c.tide_stage && (
                <span className="text-[10px] text-slate-500">
                  {tideIcon(c.tide_stage)} {c.tide_stage}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#1e3a5f] px-4 py-3 space-y-2 text-xs text-slate-400">
          <div className="grid grid-cols-2 gap-2">
            {c.water_temp !== null && c.water_temp !== undefined && (
              <div>
                <span className="text-slate-500">Water Temp: </span>
                <span className="text-white">{c.water_temp}&deg;F</span>
              </div>
            )}
            {c.wind_speed !== null && c.wind_speed !== undefined && (
              <div>
                <span className="text-slate-500">Wind: </span>
                <span className="text-white">{c.wind_speed} mph {c.wind_direction ?? ''}</span>
              </div>
            )}
            {c.barometric_pressure !== null && c.barometric_pressure !== undefined && (
              <div>
                <span className="text-slate-500">Pressure: </span>
                <span className="text-white">{c.barometric_pressure} hPa</span>
              </div>
            )}
            {c.moon_phase && (
              <div>
                <span className="text-slate-500">Moon: </span>
                <span className="text-white capitalize">{c.moon_phase.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
          {c.notes && (
            <div className="mt-2">
              <span className="text-slate-500">Notes: </span>
              <span className="text-slate-300">{c.notes}</span>
            </div>
          )}
          {c.weather_conditions && Object.keys(c.weather_conditions).length > 0 && (
            <div className="mt-2">
              <span className="text-slate-500">Weather: </span>
              <span className="text-slate-300 capitalize">
                {(c.weather_conditions as Record<string, unknown>).description as string ?? 'N/A'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Log Page ─────────────────────────────────────────────────────────────

export default function LogPage() {
  const [catches, setCatches] = useState<CatchWithSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const loadCatches = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('catches')
        .select('*, spots(name)')
        .order('caught_at', { ascending: false })
        .limit(50);

      if (filter === 'mine' && user) {
        query = query.eq('user_id', user.id);
      }

      const { data } = await query;

      const mapped: CatchWithSpot[] = (data ?? []).map((row: Record<string, unknown>) => {
        const spots = row.spots as { name: string } | null;
        return {
          ...row,
          spot_name: spots?.name ?? undefined,
        } as CatchWithSpot;
      });

      setCatches(mapped);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCatches();
  }, [loadCatches]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-white">Catch Log</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#1e3a5f] bg-[#0a1628]">
              <button
                onClick={() => setFilter('all')}
                className={`min-h-[36px] px-3 text-xs font-medium transition-colors ${
                  filter === 'all' ? 'bg-[#162a4a] text-teal-400' : 'text-slate-400'
                } rounded-l-lg`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`min-h-[36px] px-3 text-xs font-medium transition-colors ${
                  filter === 'mine' ? 'bg-[#162a4a] text-teal-400' : 'text-slate-400'
                } rounded-r-lg`}
              >
                Mine
              </button>
            </div>
            <Link
              href="/log/insights"
              className="min-h-[36px] flex items-center rounded-lg border border-[#1e3a5f] px-3 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              Insights
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : catches.length > 0 ? (
          <div className="space-y-3">
            {catches.map((c, i) => (
              <CatchCard key={c.id} c={c} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl opacity-30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6z" />
                <path d="M2 10s2-2 4-2 3 1.5 3 4-1 4-3 4-4-2-4-2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">No catches yet</h2>
            <p className="mt-1 text-sm text-slate-500">Log your first catch to start tracking patterns</p>
            <Link
              href="/log/new"
              className="mt-4 min-h-[48px] flex items-center rounded-lg bg-teal-600 px-6 font-medium text-white transition-colors hover:bg-teal-500"
            >
              Log a Catch
            </Link>
          </div>
        )}
      </main>

      {/* Floating + button */}
      {catches.length > 0 && (
        <Link
          href="/log/new"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold text-white shadow-lg shadow-teal-600/30 transition-transform hover:scale-105 active:scale-95"
        >
          +
        </Link>
      )}
    </div>
  );
}
