'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { defaultSpots } from '@/lib/spots/default-spots';
import SpotMap from '@/components/spot-map';
import type { Catch, Spot } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConditionsData {
  tideStage: { stage: string; height: number; flowStrength: string; nextHigh: string; nextLow: string; timeToNextHigh: number; timeToNextLow: number } | null;
  weather: { temp: number; windSpeed: number; windGust: number; windDirectionStr: string; pressure: number; pressureTrend: string; description: string } | null;
  fishingScore: { overall: number; label: string; summary: string; breakdown: Record<string, number> } | null;
  sunTimes: { sunrise: string; sunset: string } | null;
  moonData: { phase: string; illumination: number; emoji: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function scoreColor(score: number): string {
  if (score >= 7) return '#14b8a6';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function typeBadge(type: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    jetty: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    river_mouth: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    beach_surf: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    bridge: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    rocky_point: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
    inlet: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };
  const c = colors[type] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400' };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function getRecommendation(type: string, currentTide: string, bestTime: string, timeOfDay: string): string {
  const isNight = timeOfDay === 'night';
  const isDawn = timeOfDay === 'dawn';
  const isDusk = timeOfDay === 'dusk';

  if (type === 'river_mouth' && currentTide === 'outgoing' && isNight) {
    return 'River mouth + outgoing tide + night = Prime conditions. Try live eels near the current seam.';
  }
  if (type === 'river_mouth' && currentTide === 'outgoing') {
    return 'Outgoing tide at a river mouth is excellent. Bait gets pushed out — work the current edges with bucktails or live eels.';
  }
  if (type === 'jetty' && currentTide === 'incoming') {
    return 'Incoming tide on the jetty creates feeding lanes. Cast topwater at the tip or work soft plastics along the rocks.';
  }
  if (type === 'beach_surf' && currentTide === 'outgoing' && isDawn) {
    return 'Dawn + outgoing tide on the beach — ideal surf casting. Target the troughs and cuts as water drains.';
  }
  if (type === 'bridge' && isNight) {
    return 'Night fishing the bridge shadow lines is deadly. Use live eels or soft plastics worked through the light/dark edges.';
  }
  if (type === 'rocky_point' && isDawn) {
    return 'Dawn on the rocks — topwater poppers and swimmers. Fish the white water and current breaks.';
  }
  if (currentTide === 'outgoing') {
    return 'Outgoing tide concentrates bait. Work the current seams and channel edges.';
  }
  if (currentTide === 'incoming') {
    return 'Incoming tide floods the structure with bait. Position yourself on points and ambush spots.';
  }
  return 'Moving water is key. Try different presentations and let conditions guide your approach.';
}

function getTimeOfDay(sunTimes: { sunrise: string; sunset: string } | null): string {
  if (!sunTimes) return 'unknown';
  const now = Date.now();
  const sunrise = new Date(sunTimes.sunrise).getTime();
  const sunset = new Date(sunTimes.sunset).getTime();
  const dawnStart = sunrise - 60 * 60 * 1000;
  const duskEnd = sunset + 60 * 60 * 1000;

  if (now < dawnStart || now > duskEnd) return 'night';
  if (now < sunrise) return 'dawn';
  if (now > sunset) return 'dusk';
  return 'day';
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const [spot, setSpot] = useState<typeof defaultSpots[0] | null>(null);
  const [dbSpot, setDbSpot] = useState<Spot | null>(null);
  const [conditions, setConditions] = useState<ConditionsData | null>(null);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCatches, setLoadingCatches] = useState(true);

  // Find spot from defaults or DB
  useEffect(() => {
    const found = defaultSpots.find((s) => s.name === decodedId);
    if (found) {
      setSpot(found);
      setNotes(found.description);
    } else {
      // Try to find in Supabase
      const supabase = createClient();
      supabase
        .from('spots')
        .select('*')
        .eq('name', decodedId)
        .single()
        .then(({ data }) => {
          if (data) {
            setDbSpot(data);
            setSpot({
              name: data.name,
              lat: data.latitude,
              lon: data.longitude,
              type: data.spot_type,
              bestTide: data.best_tide ?? 'any',
              bestTime: data.best_time ?? 'any',
              noaaStation: data.noaa_station_id ?? '8465705',
              description: data.description ?? '',
            });
            setNotes(data.notes ?? data.description ?? '');
          }
        });
    }
  }, [decodedId]);

  // Fetch conditions
  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/conditions?lat=${spot!.lat}&lon=${spot!.lon}&station=${spot!.noaaStation}`,
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled) setConditions(data);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [spot]);

  // Fetch catches for this spot
  const loadCatches = useCallback(async () => {
    if (!spot) return;
    try {
      const supabase = createClient();
      // First find the spot ID
      const { data: spotData } = await supabase
        .from('spots')
        .select('id')
        .eq('name', spot.name)
        .single();

      if (spotData) {
        const { data } = await supabase
          .from('catches')
          .select('*')
          .eq('spot_id', spotData.id)
          .order('caught_at', { ascending: false })
          .limit(20);
        setCatches(data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCatches(false);
    }
  }, [spot]);

  useEffect(() => {
    loadCatches();
  }, [loadCatches]);

  // Save notes
  async function saveNotes() {
    if (!spot) return;
    setSavingNotes(true);
    try {
      const supabase = createClient();
      const { data: spotData } = await supabase
        .from('spots')
        .select('id')
        .eq('name', spot.name)
        .single();

      if (spotData) {
        await supabase
          .from('spots')
          .update({ notes })
          .eq('id', spotData.id);
      }
      setEditingNotes(false);
    } catch {
      // silently fail
    } finally {
      setSavingNotes(false);
    }
  }

  if (!spot) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
        <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <Link href="/spots" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const timeOfDay = getTimeOfDay(conditions?.sunTimes ?? null);
  const currentTide = conditions?.tideStage?.stage ?? '';
  const recommendation = getRecommendation(spot.type, currentTide, spot.bestTime, timeOfDay);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/spots" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-white">{spot.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 space-y-6">
        {/* Spot Info */}
        <section className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {typeBadge(spot.type)}
            <span className="text-xs text-slate-500">Best tide: {spot.bestTide}</span>
            <span className="text-xs text-slate-500">Best time: {spot.bestTime}</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{spot.description}</p>
        </section>

        {/* Embedded Map */}
        <section className="animate-fade-in rounded-xl border border-[#1e3a5f] overflow-hidden" style={{ animationDelay: '50ms' }}>
          <SpotMap
            spots={[spot]}
            height="200px"
            center={[spot.lon, spot.lat]}
            zoom={13}
            singleSpot={true}
          />
        </section>

        {/* Fishing Score */}
        <section className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Current Conditions</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ) : conditions?.fishingScore ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold"
                  style={{
                    backgroundColor: scoreColor(conditions.fishingScore.overall) + '1a',
                    color: scoreColor(conditions.fishingScore.overall),
                  }}
                >
                  {conditions.fishingScore.overall.toFixed(1)}
                </div>
                <div>
                  <div className="text-sm font-semibold capitalize text-white">{conditions.fishingScore.label}</div>
                  <p className="text-xs text-slate-400">{conditions.fishingScore.summary}</p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(conditions.fishingScore.breakdown).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="text-sm font-bold" style={{ color: scoreColor(val) }}>{val}</div>
                    <div className="text-[9px] text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>

              {/* Current conditions details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                {conditions.tideStage && (
                  <div className="rounded-lg bg-[#0a1628] p-2.5">
                    <div className="text-slate-500 mb-1">Tide</div>
                    <div className="font-medium capitalize text-white">{conditions.tideStage.stage.replace('_', ' ')}</div>
                    <div>{conditions.tideStage.flowStrength} flow, {conditions.tideStage.height.toFixed(1)} ft</div>
                  </div>
                )}
                {conditions.weather && (
                  <div className="rounded-lg bg-[#0a1628] p-2.5">
                    <div className="text-slate-500 mb-1">Weather</div>
                    <div className="font-medium text-white">{Math.round(conditions.weather.temp)}&deg;F</div>
                    <div>Wind {conditions.weather.windDirectionStr} {Math.round(conditions.weather.windSpeed)} mph</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Unable to load conditions</p>
          )}
        </section>

        {/* Recommendation */}
        {!loading && (
          <section className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-400">Recommendation</h2>
            <p className="text-sm leading-relaxed text-teal-200">{recommendation}</p>
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <Link
            href={`/log/new?spot=${encodeURIComponent(spot.name)}`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-lg bg-teal-600 font-medium text-white transition-colors hover:bg-teal-500"
          >
            Log a Catch Here
          </Link>
        </div>

        {/* Catch History */}
        <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Catch History</h2>
          {loadingCatches ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : catches.length > 0 ? (
            <div className="space-y-2">
              {catches.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {c.fish_length && <span className="text-sm font-semibold text-white">{c.fish_length}&quot;</span>}
                      {c.fish_weight && <span className="ml-2 text-xs text-slate-400">{c.fish_weight} lbs</span>}
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(c.caught_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    {c.lure_or_bait && <span>{c.lure_or_bait}</span>}
                    {c.tide_stage && <span>Tide: {c.tide_stage}</span>}
                    {c.water_temp && <span>{c.water_temp}&deg;F water</span>}
                  </div>
                  {c.notes && <p className="mt-1 text-xs text-slate-400">{c.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#1e3a5f] bg-[#0f1f3d]/50 p-6 text-center">
              <p className="text-sm text-slate-500">No catches logged at this spot yet</p>
              <Link
                href={`/log/new?spot=${encodeURIComponent(spot.name)}`}
                className="mt-2 inline-block text-sm font-medium text-teal-400 hover:text-teal-300"
              >
                Be the first
              </Link>
            </div>
          )}
        </section>

        {/* Spot Notes */}
        <section className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Spot Notes</h2>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs font-medium text-teal-400 hover:text-teal-300"
              >
                Edit
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
                placeholder="Add notes about this spot..."
              />
              <div className="flex gap-2">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="min-h-[36px] rounded-lg bg-teal-600 px-4 text-xs font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="min-h-[36px] rounded-lg border border-[#1e3a5f] px-4 text-xs text-slate-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
              <p className="text-sm leading-relaxed text-slate-400">
                {notes || 'No notes yet. Tap Edit to add tips and observations.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
