'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { defaultSpots } from '@/lib/spots/default-spots';
import type { Spot } from '@/lib/types';

// ── Lure suggestions ─────────────────────────────────────────────────────────

const lureSuggestions = [
  'Live Eel',
  'Bucktail',
  'Topwater Popper',
  'SP Minnow',
  'Soft Plastic Paddletail',
  'Sluggo',
  'Chunk Bait (Bunker)',
  'Live Bunker',
  'Darter',
  'Needlefish',
  'Metal Lip Swimmer',
  'Tin/Kastmaster',
  'Fly - Clouser Minnow',
  'Fly - Deceiver',
  'Worm (Sandworm/Bloodworm)',
  'Clam',
  'Shad Dart',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function toLocalDateTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Main Form ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react';

function NewCatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSpot = searchParams.get('spot') ?? '';

  // Spot list (defaults + custom from Supabase)
  const [allSpots, setAllSpots] = useState<{ id: string; name: string; lat: number; lon: number; noaaStation: string }[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  // Form state
  const [spotId, setSpotId] = useState('');
  const [dateTime, setDateTime] = useState(toLocalDateTimeValue(new Date()));
  const [fishLength, setFishLength] = useState('');
  const [fishWeight, setFishWeight] = useState('');
  const [lure, setLure] = useState('');
  const [showLureSuggestions, setShowLureSuggestions] = useState(false);
  const [tideStage, setTideStage] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [windSpeed, setWindSpeed] = useState('');
  const [windDirection, setWindDirection] = useState('');
  const [pressure, setPressure] = useState('');
  const [moonPhase, setMoonPhase] = useState('');
  const [weatherDesc, setWeatherDesc] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [conditionsLoaded, setConditionsLoaded] = useState(false);

  // Load spots
  useEffect(() => {
    async function load() {
      const spots: { id: string; name: string; lat: number; lon: number; noaaStation: string }[] = [];

      // Load from Supabase
      try {
        const supabase = createClient();
        const { data } = await supabase.from('spots').select('id, name, latitude, longitude, noaa_station_id').order('name');
        if (data) {
          for (const s of data) {
            spots.push({
              id: s.id,
              name: s.name,
              lat: s.latitude,
              lon: s.longitude,
              noaaStation: s.noaa_station_id ?? '8465705',
            });
          }
        }
      } catch {
        // If Supabase fails, use defaults only
      }

      // If no spots from DB, create entries from defaults
      if (spots.length === 0) {
        for (const s of defaultSpots) {
          spots.push({
            id: s.name,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            noaaStation: s.noaaStation,
          });
        }
      }

      setAllSpots(spots);

      // Preselect spot
      if (preselectedSpot) {
        const match = spots.find((s) => s.name === preselectedSpot);
        if (match) setSpotId(match.id);
      }

      setLoadingSpots(false);
    }
    load();
  }, [preselectedSpot]);

  // Auto-fetch conditions when spot is selected
  useEffect(() => {
    if (!spotId || conditionsLoaded) return;

    const selected = allSpots.find((s) => s.id === spotId);
    if (!selected) return;

    let cancelled = false;
    setLoadingConditions(true);

    async function fetchConditions() {
      try {
        const res = await fetch(
          `/api/conditions?lat=${selected!.lat}&lon=${selected!.lon}&station=${selected!.noaaStation}`,
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (cancelled) return;

        // Auto-populate fields
        if (data.tideStage?.stage) setTideStage(data.tideStage.stage);
        if (data.weather?.temp) setWaterTemp(''); // water temp not always in weather
        if (data.weather?.windSpeed) setWindSpeed(String(Math.round(data.weather.windSpeed)));
        if (data.weather?.windDirectionStr) setWindDirection(data.weather.windDirectionStr);
        if (data.weather?.pressure) setPressure(String(data.weather.pressure));
        if (data.weather?.description) setWeatherDesc(data.weather.description);
        if (data.moonData?.phase) setMoonPhase(data.moonData.phase);
        setConditionsLoaded(true);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoadingConditions(false);
      }
    }

    fetchConditions();
    return () => { cancelled = true; };
  }, [spotId, allSpots, conditionsLoaded]);

  // Reset conditions loaded when spot changes
  useEffect(() => {
    setConditionsLoaded(false);
  }, [spotId]);

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fishLength) {
      setError('Fish length is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to log a catch');
        setSaving(false);
        return;
      }

      const weatherConditions: Record<string, unknown> = {};
      if (weatherDesc) weatherConditions.description = weatherDesc;
      if (windSpeed) weatherConditions.windSpeed = parseFloat(windSpeed);
      if (windDirection) weatherConditions.windDirection = windDirection;
      if (pressure) weatherConditions.pressure = parseFloat(pressure);

      const { error: insertError } = await supabase.from('catches').insert({
        user_id: user.id,
        spot_id: spotId || null,
        caught_at: new Date(dateTime).toISOString(),
        fish_length: parseFloat(fishLength),
        fish_weight: fishWeight ? parseFloat(fishWeight) : null,
        lure_or_bait: lure || null,
        tide_stage: tideStage || null,
        water_temp: waterTemp ? parseFloat(waterTemp) : null,
        wind_speed: windSpeed ? parseFloat(windSpeed) : null,
        wind_direction: windDirection || null,
        barometric_pressure: pressure ? parseFloat(pressure) : null,
        moon_phase: moonPhase || null,
        weather_conditions: weatherConditions,
        photo_url: photoUrl || null,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      router.push('/log');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save catch');
    } finally {
      setSaving(false);
    }
  }

  const filteredLures = lureSuggestions.filter((l) =>
    l.toLowerCase().includes(lure.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/log" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Log a Catch</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Spot Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Spot
            </label>
            {loadingSpots ? (
              <Skeleton className="h-[48px] w-full" />
            ) : (
              <select
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white outline-none focus:border-teal-500"
              >
                <option value="">Select a spot (optional)</option>
                {allSpots.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            {loadingConditions && (
              <div className="mt-1 flex items-center gap-2 text-xs text-teal-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                Auto-filling conditions...
              </div>
            )}
          </div>

          {/* Date/Time */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white outline-none focus:border-teal-500 [color-scheme:dark]"
            />
          </div>

          {/* Fish Length + Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Length (inches) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={fishLength}
                onChange={(e) => setFishLength(e.target.value)}
                placeholder="e.g. 28"
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fishWeight}
                onChange={(e) => setFishWeight(e.target.value)}
                placeholder="optional"
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Lure / Bait */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lure or Bait
            </label>
            <input
              type="text"
              value={lure}
              onChange={(e) => { setLure(e.target.value); setShowLureSuggestions(true); }}
              onFocus={() => setShowLureSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLureSuggestions(false), 200)}
              placeholder="e.g. Live Eel"
              className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
            />
            {showLureSuggestions && filteredLures.length > 0 && lure.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] shadow-xl">
                {filteredLures.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onMouseDown={() => { setLure(l); setShowLureSuggestions(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-[#162a4a]"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tide Stage */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tide Stage {conditionsLoaded && <span className="text-teal-500 normal-case">(auto-detected)</span>}
            </label>
            <select
              value={tideStage}
              onChange={(e) => setTideStage(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white outline-none focus:border-teal-500"
            >
              <option value="">Unknown</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="slack_high">Slack High</option>
              <option value="slack_low">Slack Low</option>
            </select>
          </div>

          {/* Water Temp + Weather (auto-populated) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Water Temp (&deg;F)
              </label>
              <input
                type="number"
                step="0.1"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                placeholder="optional"
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Wind {conditionsLoaded && <span className="text-teal-500 normal-case">(auto)</span>}
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="1"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(e.target.value)}
                  placeholder="mph"
                  className="min-h-[48px] w-1/2 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  value={windDirection}
                  onChange={(e) => setWindDirection(e.target.value)}
                  placeholder="dir"
                  className="min-h-[48px] w-1/2 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Weather description (auto-populated) */}
          {weatherDesc && (
            <div className="rounded-lg bg-[#162a4a] px-3 py-2 text-xs text-slate-400">
              <span className="text-slate-500">Weather: </span>
              <span className="capitalize text-slate-300">{weatherDesc}</span>
              {pressure && <span className="ml-2 text-slate-500">{pressure} hPa</span>}
              {moonPhase && <span className="ml-2 text-slate-500 capitalize">{moonPhase.replace(/_/g, ' ')}</span>}
            </div>
          )}

          {/* Photo URL */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Photo URL
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Paste a photo URL (upload coming soon)"
              className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any details about the catch..."
              className="w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="min-h-[52px] w-full rounded-xl bg-teal-600 text-base font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Catch'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function NewCatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <NewCatchForm />
    </Suspense>
  );
}
