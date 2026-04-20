'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { defaultSpots } from '@/lib/spots/default-spots';
import SpotMap from '@/components/spot-map';
import type { Spot, SpotType } from '@/lib/types';

// ── Region groupings ──────────────────────────────────────────────────────────

type Region = { label: string; spots: typeof defaultSpots };

function groupByRegion(spots: typeof defaultSpots): Region[] {
  const western = ['Greenwich Point', 'Housatonic River Mouth'];
  const central = [
    'New Haven Harbor',
    'Westbrook Town Beach',
    "Harvey's Beach",
    'Clinton Town Beach',
    'Hammonasset Beach State Park',
    'Meigs Point Jetty',
  ];
  const eastern = [
    'Rocky Neck State Park',
    'Niantic River',
    'CT River Mouth - Old Lyme',
    'I-95 Bridge - CT River',
    'Thames River - New London',
  ];
  const rivers = ['CT River - Haddam', 'Housatonic River - Derby'];

  const groups: Region[] = [
    { label: 'Western CT', spots: spots.filter((s) => western.includes(s.name)) },
    { label: 'Central CT', spots: spots.filter((s) => central.includes(s.name)) },
    { label: 'Eastern CT', spots: spots.filter((s) => eastern.includes(s.name)) },
    { label: 'Rivers', spots: spots.filter((s) => rivers.includes(s.name)) },
  ];

  // Catch any that didn't match
  const all = [...western, ...central, ...eastern, ...rivers];
  const uncategorized = spots.filter((s) => !all.includes(s.name));
  if (uncategorized.length > 0) {
    groups.push({ label: 'Other', spots: uncategorized });
  }

  return groups;
}

// ── Type badge colors ─────────────────────────────────────────────────────────

function typeBadge(type: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    jetty: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
    river_mouth: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    beach_surf: { bg: 'bg-green-500/15', text: 'text-green-400' },
    bridge: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    rocky_point: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    inlet: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
    rocky_shore: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
    tidal_flat: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
    deep_water: { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
    estuary: { bg: 'bg-lime-500/15', text: 'text-lime-400' },
  };
  const c = colors[type] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400' };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function tideLabel(tide: string) {
  if (tide === 'incoming') return 'Incoming';
  if (tide === 'outgoing') return 'Outgoing';
  return 'Any';
}

function timeLabel(time: string) {
  const map: Record<string, string> = { dawn: 'Dawn', dusk: 'Dusk', night: 'Night', any: 'Any' };
  return map[time] ?? time;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// ── Spot Conditions (inline expand) ───────────────────────────────────────────

function SpotConditions({ spot }: { spot: typeof defaultSpots[0] }) {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState('');
  const [tideStage, setTideStage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/conditions?lat=${spot.lat}&lon=${spot.lon}&station=${spot.noaaStation}`,
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (cancelled) return;
        setScore(data.fishingScore?.overall ?? null);
        setSummary(data.fishingScore?.summary ?? '');
        setTideStage(data.tideStage?.stage ?? '');
      } catch {
        if (!cancelled) {
          setSummary('Unable to load conditions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [spot.lat, spot.lon, spot.noaaStation]);

  if (loading) {
    return (
      <div className="mt-3 space-y-2 border-t border-[#1e3a5f] pt-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  const scoreColor = score !== null
    ? score >= 7 ? 'text-teal-400' : score >= 4 ? 'text-amber-400' : 'text-red-400'
    : 'text-slate-500';

  // Dynamic recommendation
  const rec = getRecommendation(spot.type, tideStage, spot.bestTime);

  return (
    <div className="mt-3 space-y-3 border-t border-[#1e3a5f] pt-3">
      {score !== null && (
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{score.toFixed(1)}</span>
          <span className="text-xs text-slate-500">/ 10 current score</span>
        </div>
      )}
      {summary && <p className="text-xs leading-relaxed text-slate-400">{summary}</p>}
      {rec && (
        <div className="rounded-lg bg-teal-500/10 px-3 py-2 text-xs leading-relaxed text-teal-300">
          {rec}
        </div>
      )}
      <div className="flex gap-2">
        <Link
          href={`/spots/${encodeURIComponent(spot.name)}`}
          className="min-h-[36px] rounded-lg border border-[#1e3a5f] bg-[#162a4a] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-teal-500/40"
        >
          Full Details
        </Link>
        <Link
          href={`/log/new?spot=${encodeURIComponent(spot.name)}`}
          className="min-h-[36px] rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-500"
        >
          Log Catch Here
        </Link>
      </div>
    </div>
  );
}

function getRecommendation(type: string, currentTide: string, bestTime: string): string {
  const tips: Record<string, Record<string, string>> = {
    river_mouth: {
      outgoing: 'Outgoing tide at a river mouth — prime conditions. Try live eels near the current seam.',
      incoming: 'Incoming tide pushes bait upriver. Work bucktails along the channel edges.',
      '': 'River mouths fish best on moving water. Try soft plastics on a jighead.',
    },
    jetty: {
      incoming: 'Incoming tide on the jetty — fish the rip at the tip. Topwater or bucktails.',
      outgoing: 'Outgoing tide sweeps bait past the rocks. Cast parallel to the structure.',
      '': 'Work the shadow lines and current seams around the rocks.',
    },
    beach_surf: {
      outgoing: 'Outgoing tide exposes sandbars and troughs — cast into the cuts.',
      incoming: 'Incoming tide floods the flats. Look for nervous water and bait.',
      '': 'Walk the beach and look for bird activity or bait schools.',
    },
    bridge: {
      '': 'Fish the shadow lines at night. Stripers ambush bait in the light/dark edges. Live eels or soft plastics.',
    },
    rocky_point: {
      incoming: 'Incoming tide brings bait over the rocks. Topwater poppers at dawn.',
      outgoing: 'Fish the wash — stripers feed in the white water on rocks.',
      '': 'Cast around structure and current breaks. Bucktails and soft plastics.',
    },
    inlet: {
      incoming: 'Incoming tide funnels bait through the inlet. Work the channel edges.',
      outgoing: 'Outgoing flow concentrates bait at the mouth. Cast across the current.',
      '': 'Inlets fish well on any moving water. Try swimming plugs.',
    },
  };

  const typeRecs = tips[type] ?? {};
  return typeRecs[currentTide] ?? typeRecs[''] ?? 'Check current conditions and try different presentations.';
}

// ── Add Custom Spot Modal ─────────────────────────────────────────────────────

function AddSpotForm({
  onClose,
  onAdded,
  initialLat,
  initialLon,
}: {
  onClose: () => void;
  onAdded: () => void;
  initialLat?: number;
  initialLon?: number;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(initialLat?.toFixed(6) ?? '');
  const [lon, setLon] = useState(initialLon?.toFixed(6) ?? '');
  const [spotType, setSpotType] = useState<SpotType>('beach_surf');
  const [bestTide, setBestTide] = useState('any');
  const [bestTime, setBestTime] = useState('any');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const spotTypes: SpotType[] = [
    'jetty', 'river_mouth', 'beach_surf', 'bridge', 'rocky_point',
    'tidal_flat', 'deep_water', 'inlet', 'rocky_shore', 'estuary',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!lat || !lon) { setError('Latitude and longitude are required'); return; }

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('spots').insert({
        name: name.trim(),
        description: description.trim() || null,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        spot_type: spotType,
        is_default: false,
        created_by: user?.id ?? null,
        best_tide: bestTide,
        best_time: bestTime,
        noaa_station_id: '8465705', // default to Bridgeport
      });

      if (insertError) throw insertError;
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save spot');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Custom Spot</h2>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white">
            &#10005;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Spot name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude *"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude *"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
            />
          </div>
          <select
            value={spotType}
            onChange={(e) => setSpotType(e.target.value as SpotType)}
            className="min-h-[44px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white outline-none focus:border-teal-500"
          >
            {spotTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={bestTide}
              onChange={(e) => setBestTide(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white outline-none focus:border-teal-500"
            >
              <option value="any">Any Tide</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
            <select
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white outline-none focus:border-teal-500"
            >
              <option value="any">Any Time</option>
              <option value="dawn">Dawn</option>
              <option value="dusk">Dusk</option>
              <option value="night">Night</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] w-full rounded-lg bg-teal-600 font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Spot'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Spot Card ─────────────────────────────────────────────────────────────────

function SpotCard({ spot, index }: { spot: typeof defaultSpots[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4 transition-all animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">{spot.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {typeBadge(spot.type)}
              <span className="text-[10px] text-slate-500">
                Tide: {tideLabel(spot.bestTide)}
              </span>
              <span className="text-[10px] text-slate-500">
                Time: {timeLabel(spot.bestTime)}
              </span>
            </div>
          </div>
          <span className="mt-1 text-slate-500 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </button>

      {expanded && <SpotConditions spot={spot} />}
    </div>
  );
}

// ── View Toggle ──────────────────────────────────────────────────────────────

function ViewToggle({ view, onViewChange }: { view: 'map' | 'list'; onViewChange: (v: 'map' | 'list') => void }) {
  return (
    <div className="flex rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] p-0.5">
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === 'map'
            ? 'bg-teal-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Map
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === 'list'
            ? 'bg-teal-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List
      </button>
    </div>
  );
}

// ── Main Spots Page ───────────────────────────────────────────────────────────

export default function SpotsPage() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingSpotOnMap, setAddingSpotOnMap] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lng: number; lat: number } | null>(null);
  const [customSpots, setCustomSpots] = useState<Spot[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const hasToken = true; // Using Leaflet (free, no token needed)

  const loadCustomSpots = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('spots')
        .select('*')
        .eq('is_default', false)
        .order('created_at', { ascending: false });
      setCustomSpots(data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingCustom(false);
    }
  }, []);

  useEffect(() => {
    loadCustomSpots();
  }, [loadCustomSpots]);

  // If no mapbox token, default to list view
  useEffect(() => {
    if (!hasToken) setView('list');
  }, [hasToken]);

  const regions = groupByRegion(defaultSpots);

  // Convert custom spots to the format used by SpotCard
  const customSpotsConverted = customSpots.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.latitude,
    lon: s.longitude,
    type: s.spot_type,
    bestTide: s.best_tide ?? 'any',
    bestTime: s.best_time ?? 'any',
    noaaStation: s.noaa_station_id ?? '8465705',
    description: s.description ?? '',
  }));

  // All spots for the map
  const allMapSpots = [...defaultSpots, ...customSpotsConverted];

  function handleAddSpotClick() {
    if (view === 'map' && hasToken) {
      setAddingSpotOnMap(true);
      setPendingPin(null);
    } else {
      setShowAddForm(true);
    }
  }

  function handleMapClick(lngLat: { lng: number; lat: number }) {
    if (addingSpotOnMap) {
      setPendingPin(lngLat);
      setAddingSpotOnMap(false);
      setShowAddForm(true);
    }
  }

  function handleCancelAddSpot() {
    setAddingSpotOnMap(false);
    setPendingPin(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white">Spot Map</h1>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
          <div className="flex items-center gap-2">
            {addingSpotOnMap && (
              <button
                onClick={handleCancelAddSpot}
                className="min-h-[44px] rounded-lg border border-[#1e3a5f] px-3 text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleAddSpotClick}
              className="min-h-[44px] rounded-lg bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-500"
            >
              + Add Spot
            </button>
          </div>
        </div>
      </header>

      {/* Map View */}
      {view === 'map' && (
        <div className="relative">
          <SpotMap
            spots={allMapSpots}
            height="calc(100vh - 180px)"
            onSpotClick={(spot) => {
              if ('id' in spot) {
                window.location.href = `/spots/${spot.id}`;
              }
            }}
          />

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-[#1e3a5f] bg-[#0a1628]/90 px-3 py-2 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { type: 'jetty', color: '#14b8a6', label: 'Jetty' },
                { type: 'river_mouth', color: '#3b82f6', label: 'River Mouth' },
                { type: 'beach_surf', color: '#22c55e', label: 'Beach' },
                { type: 'bridge', color: '#f59e0b', label: 'Bridge' },
                { type: 'rocky_point', color: '#a855f7', label: 'Rocky Point' },
                { type: 'inlet', color: '#06b6d4', label: 'Inlet' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: color, boxShadow: `0 0 4px ${color}88` }}
                  />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* No token fallback message shown above the list */}
          {!hasToken && (
            <div className="mx-auto max-w-2xl px-4 py-3">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
                <p className="text-sm text-amber-300">Map requires Mapbox token</p>
                <p className="mt-1 text-xs text-slate-500">Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment to enable the interactive map</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
          {!hasToken && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
              <p className="text-sm text-amber-300">Map requires Mapbox token</p>
              <p className="mt-1 text-xs text-slate-500">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the interactive map view</p>
            </div>
          )}

          {regions.map((region) => (
            <section key={region.label} className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {region.label}
              </h2>
              <div className="space-y-2">
                {region.spots.map((spot, i) => (
                  <SpotCard key={spot.name} spot={spot} index={i} />
                ))}
              </div>
            </section>
          ))}

          {/* Custom Spots */}
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Custom Spots
            </h2>
            {loadingCustom ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : customSpotsConverted.length > 0 ? (
              <div className="space-y-2">
                {customSpotsConverted.map((spot, i) => (
                  <SpotCard key={spot.name + i} spot={spot} index={i} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#1e3a5f] bg-[#0f1f3d]/50 p-6 text-center">
                <p className="text-sm text-slate-500">No custom spots yet</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 text-sm font-medium text-teal-400 hover:text-teal-300"
                >
                  Add your first spot
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Add Spot Modal */}
      {showAddForm && (
        <AddSpotForm
          onClose={() => {
            setShowAddForm(false);
            setPendingPin(null);
          }}
          onAdded={loadCustomSpots}
          initialLat={pendingPin?.lat}
          initialLon={pendingPin?.lng}
        />
      )}
    </div>
  );
}
