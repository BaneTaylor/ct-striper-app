'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRecommendations } from '@/lib/lures/recommender';
import type { SpotType, LureRecommendation } from '@/lib/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function autoDetectTimeOfDay(): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

function autoDetectSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'fall';
  return 'winter';
}

const SEASONAL_TIPS: Record<string, string> = {
  spring:
    'Spring Run (April-May): Fish are moving up from southern waters following herring and shad runs. Focus on river mouths and inlets. Water temps 48-55F signal the start. Slow presentations work best in cool water.',
  summer:
    'Summer Pattern (June-August): Night fishing is king. Live eels after dark near structure produce trophy fish. Dawn and dusk blitzes happen along beaches. Topwater action peaks in July.',
  fall:
    'Fall Run (September-November): The best time of year. Migrating bass gorge on bunker and peanut bunker. Match the hatch with large swimmers and tins. Fish all day when the blitz is on.',
  winter:
    'Winter Holdovers (December-March): Slow down dramatically. Target warm water discharges and deep holes. Small soft plastics and blade baits jigged vertically. Catch and release only mindset.',
};

const SPOT_TYPES: { value: SpotType; label: string }[] = [
  { value: 'jetty', label: 'Jetty' },
  { value: 'river_mouth', label: 'River Mouth' },
  { value: 'beach_surf', label: 'Beach / Surf' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'rocky_point', label: 'Rocky Point' },
  { value: 'rocky_shore', label: 'Rocky Shore' },
  { value: 'inlet', label: 'Inlet' },
  { value: 'estuary', label: 'Estuary' },
  { value: 'tidal_flat', label: 'Tidal Flat' },
  { value: 'deep_water', label: 'Deep Water' },
];

interface SavedRec {
  id: string;
  timestamp: string;
  conditions: string;
  recommendations: LureRecommendation[];
}

// ── Components ───────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 8 ? '#22c55e' : value >= 6 ? '#14b8a6' : value >= 4 ? '#f59e0b' : '#64748b';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e3a5f]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{value}/10</span>
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: LureRecommendation; index: number }) {
  return (
    <div
      className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4 transition-all"
      style={{ animation: `fade-in 0.4s ease-out ${index * 100}ms both` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white leading-tight">{rec.name}</h3>
        </div>
        <span
          className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            rec.type === 'bait'
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-[#14b8a6]/15 text-[#14b8a6]'
          }`}
        >
          {rec.type}
        </span>
      </div>

      <div className="mb-3">
        <ConfidenceBar value={rec.confidence} />
      </div>

      <div className="mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          How to fish it
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{rec.retrieve}</p>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Why it works
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{rec.why}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LuresPage() {
  const [spotType, setSpotType] = useState<SpotType>('jetty');
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>(autoDetectTimeOfDay);
  const [season, setSeason] = useState<'spring' | 'summer' | 'fall' | 'winter'>(autoDetectSeason);
  const [waterTemp, setWaterTemp] = useState<string>('');
  const [tideDirection, setTideDirection] = useState<'incoming' | 'outgoing' | 'slack'>('incoming');
  const [waterClarity, setWaterClarity] = useState<'clear' | 'stained' | 'murky'>('stained');
  const [recommendations, setRecommendations] = useState<LureRecommendation[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const generateRecommendations = useCallback(() => {
    const temp = waterTemp === '' ? 58 : parseFloat(waterTemp);
    const recs = getRecommendations({
      spotType,
      timeOfDay,
      season,
      waterTemp: isNaN(temp) ? 58 : temp,
      tideDirection,
      tideStrength: 'moderate',
      waterClarity,
    });
    setRecommendations(recs.slice(0, 3));
    setHasResults(true);
  }, [spotType, timeOfDay, season, waterTemp, tideDirection, waterClarity]);

  // Auto-generate on mount
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const handleSave = () => {
    const saved: SavedRec[] = JSON.parse(localStorage.getItem('ct-striper-saved-recs') ?? '[]');
    const newRec: SavedRec = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      conditions: `${spotType} | ${timeOfDay} | ${season} | ${tideDirection} | ${waterClarity}`,
      recommendations,
    };
    saved.unshift(newRec);
    // Keep last 20
    localStorage.setItem('ct-striper-saved-recs', JSON.stringify(saved.slice(0, 20)));
    setSaveMessage('Saved for offline reference');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const selectClass =
    'min-h-[44px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white outline-none focus:border-[#14b8a6] transition-colors';
  const labelClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1';

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-base font-bold text-white">Lure & Bait Recommender</h1>
          <p className="text-[10px] text-slate-500">Set conditions, get top picks</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        {/* Input Form */}
        <div className="mb-6 rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Spot Type */}
            <div>
              <label className={labelClass}>Spot Type</label>
              <select
                value={spotType}
                onChange={(e) => setSpotType(e.target.value as SpotType)}
                className={selectClass}
              >
                {SPOT_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Time of Day */}
            <div>
              <label className={labelClass}>Time of Day</label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as typeof timeOfDay)}
                className={selectClass}
              >
                <option value="dawn">Dawn</option>
                <option value="day">Day</option>
                <option value="dusk">Dusk</option>
                <option value="night">Night</option>
              </select>
            </div>

            {/* Season */}
            <div>
              <label className={labelClass}>Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as typeof season)}
                className={selectClass}
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            {/* Water Temp */}
            <div>
              <label className={labelClass}>Water Temp (F)</label>
              <input
                type="number"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                placeholder="Unknown"
                className={selectClass}
              />
            </div>

            {/* Tide Direction */}
            <div>
              <label className={labelClass}>Tide Direction</label>
              <select
                value={tideDirection}
                onChange={(e) => setTideDirection(e.target.value as typeof tideDirection)}
                className={selectClass}
              >
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="slack">Slack</option>
              </select>
            </div>

            {/* Water Clarity */}
            <div>
              <label className={labelClass}>Water Clarity</label>
              <select
                value={waterClarity}
                onChange={(e) => setWaterClarity(e.target.value as typeof waterClarity)}
                className={selectClass}
              >
                <option value="clear">Clear</option>
                <option value="stained">Stained</option>
                <option value="murky">Murky</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateRecommendations}
            className="mt-4 min-h-[48px] w-full rounded-lg bg-[#14b8a6] font-semibold text-white transition-colors hover:bg-[#0d9488] active:bg-[#0f766e]"
          >
            Get Recommendations
          </button>
        </div>

        {/* Results */}
        {hasResults && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Top Picks
              </h2>
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className="text-[10px] text-[#14b8a6] animate-fade-in">{saveMessage}</span>
                )}
                <button
                  onClick={handleSave}
                  className="min-h-[36px] rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-3 text-xs text-slate-300 transition-colors hover:border-[#14b8a6]/40 hover:text-white"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={rec.name} rec={rec} index={i} />
              ))}
            </div>

            {recommendations.length === 0 && (
              <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-6 text-center">
                <p className="text-sm text-slate-400">
                  No strong matches for these exact conditions. Try adjusting the inputs.
                </p>
              </div>
            )}

            {/* Seasonal Tip */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
                Seasonal Tip
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {SEASONAL_TIPS[season]}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
