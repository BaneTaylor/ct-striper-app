'use client';

import { useState } from 'react';

// ── Quick Measure Tool ───────────────────────────────────────────────────────

function QuickMeasure() {
  const [length, setLength] = useState('');

  const inches = parseFloat(length);
  const hasInput = !isNaN(inches) && inches > 0;

  let result: { keep: boolean; message: string; detail: string } | null = null;

  if (hasInput) {
    if (inches < 28) {
      result = {
        keep: false,
        message: 'RELEASE',
        detail: `${inches}" is under the 28" minimum slot size. Must be released.`,
      };
    } else if (inches >= 28 && inches <= 35) {
      result = {
        keep: true,
        message: 'KEEP (Slot Fish)',
        detail: `${inches}" falls within the 28"-35" slot. Legal to keep (1 per day).`,
      };
    } else {
      result = {
        keep: false,
        message: 'RELEASE',
        detail: `${inches}" exceeds the 35" slot limit. Must be released. Note: Check current CT DEEP regulations for any trophy fish provisions.`,
      };
    }
  }

  return (
    <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Quick Measure Tool
      </h3>
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          placeholder="Fish length (inches)"
          className="min-h-[48px] flex-1 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-sm text-white outline-none focus:border-[#14b8a6] transition-colors"
          step="0.5"
          min="0"
          max="60"
        />
        <button
          onClick={() => setLength('')}
          className="min-h-[48px] rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>

      {result && (
        <div
          className={`rounded-lg p-4 transition-all animate-fade-in ${
            result.keep
              ? 'border border-green-500/30 bg-green-500/10'
              : 'border border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-2xl font-bold ${result.keep ? 'text-green-400' : 'text-red-400'}`}>
              {result.keep ? '\u2713' : '\u2717'}
            </span>
            <span className={`text-lg font-bold ${result.keep ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </span>
          </div>
          <p className={`text-sm ${result.keep ? 'text-green-300' : 'text-red-300'}`}>
            {result.detail}
          </p>
        </div>
      )}

      {/* Visual ruler reference */}
      {!result && (
        <div className="mt-2 rounded-md bg-[#0a1628]/60 p-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>0"</span>
            <span className="text-red-400">28"</span>
            <span className="text-green-400">35"</span>
            <span>50"</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full">
            <div className="bg-red-500/30" style={{ width: '56%' }} />
            <div className="bg-green-500/40" style={{ width: '14%' }} />
            <div className="bg-red-500/30" style={{ width: '30%' }} />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-slate-600">
            <span>Release</span>
            <span className="text-green-500">Slot (Keep 1)</span>
            <span>Release</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Regulation Section ───────────────────────────────────────────────────────

function RegSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RegulationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-base font-bold text-white">CT Regulations</h1>
          <p className="text-[10px] text-slate-500">Striped Bass - Always verify with CT DEEP</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4">
        {/* Quick Measure */}
        <QuickMeasure />

        {/* Size Regulations */}
        <RegSection title="Size & Bag Limits">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#14b8a6]/15">
                <span className="text-xs text-[#14b8a6]">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Slot Size: 28" to 35"</div>
                <p className="text-xs text-slate-400">
                  One (1) fish per day must be within the 28" to 35" total length slot.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <span className="text-xs text-amber-400">!</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Over 35"</div>
                <p className="text-xs text-slate-400">
                  Fish over 35" must be released. Check CT DEEP for any current trophy fish bonus provisions which may change year to year.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                <span className="text-xs text-blue-400">#</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Daily Bag Limit</div>
                <p className="text-xs text-slate-400">
                  1 fish per angler per day within the legal slot size.
                </p>
              </div>
            </div>
          </div>
        </RegSection>

        {/* Season */}
        <RegSection title="Season">
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Catch and release: Open year-round</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Harvest season: Typically April 1 - December 31</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Exact dates may vary by year. Always confirm current dates with CT DEEP before keeping fish.
            </p>
          </div>
        </RegSection>

        {/* Circle Hook Requirement */}
        <RegSection title="Gear Requirements">
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[#14b8a6]">&bull;</span>
              <span>
                <strong className="text-white">Circle hooks required</strong> when using bait (natural or scented) for striped bass in CT marine waters.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[#14b8a6]">&bull;</span>
              <span>
                Inline circle hooks only (non-offset). J-hooks and treble hooks are <strong className="text-white">not allowed</strong> with bait.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[#14b8a6]">&bull;</span>
              <span>
                Artificial lures with treble hooks are permitted when no bait is used.
              </span>
            </div>
          </div>
        </RegSection>

        {/* Special Areas */}
        <RegSection title="Special Area Regulations">
          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <div className="font-medium text-white mb-0.5">Connecticut River</div>
              <p className="text-slate-400">
                Special regulations may apply in the Connecticut River and its tributaries during spring spawning season. Catch and release only periods may be in effect.
              </p>
            </div>
            <div>
              <div className="font-medium text-white mb-0.5">Housatonic River</div>
              <p className="text-slate-400">
                Check for special consumption advisories in the Housatonic due to historical contamination. Catch and release recommended in some sections.
              </p>
            </div>
          </div>
        </RegSection>

        {/* Best Practices */}
        <RegSection title="Catch & Release Best Practices">
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-green-400">&bull;</span>
              <span>Use barbless or crimped-barb hooks to minimize handling time</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-green-400">&bull;</span>
              <span>Keep fish in the water as much as possible</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-green-400">&bull;</span>
              <span>Support the fish horizontally, never vertically by the jaw</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-green-400">&bull;</span>
              <span>In warm water (70F+), fight fish quickly to reduce stress mortality</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-green-400">&bull;</span>
              <span>Revive exhausted fish by holding them facing into the current until they swim away strongly</span>
            </div>
          </div>
        </RegSection>

        {/* Warning / Disclaimer */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-lg leading-none mt-0.5">!</span>
            <div>
              <div className="text-xs font-semibold text-amber-400 mb-1">Important Disclaimer</div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Regulations change frequently. This information is provided as a general reference based on recent CT DEEP regulations but may not reflect the most current rules. Always verify current regulations before fishing.
              </p>
            </div>
          </div>
        </div>

        {/* Official Link */}
        <a
          href="https://portal.ct.gov/DEEP/Fishing/Saltwater/Striped-Bass"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#14b8a6]/30 bg-[#14b8a6]/5 px-4 py-3 text-sm font-semibold text-[#14b8a6] transition-colors hover:bg-[#14b8a6]/10 active:bg-[#14b8a6]/15"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          CT DEEP Official Regulations
        </a>
      </main>
    </div>
  );
}
