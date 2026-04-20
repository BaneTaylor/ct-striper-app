'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Crew } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface CrewMember {
  id: string;
  user_id: string;
  email?: string;
  catch_count: number;
}

interface CrewCatch {
  id: string;
  user_id: string;
  user_email?: string;
  caught_at: string;
  fish_length: number | null;
  fish_weight: number | null;
  lure_or_bait: string | null;
  notes: string | null;
  spot_name?: string;
}

interface CrewReport {
  id: string;
  user_id: string;
  user_email?: string;
  report_type: string;
  message: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface LeaderboardEntry {
  user_id: string;
  email?: string;
  value: number | string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: 'bunker_sighting', label: 'Bunker Sighting' },
  { value: 'blitz', label: 'Blitz' },
  { value: 'bait', label: 'Bait Report' },
  { value: 'fish_caught', label: 'Fish Caught' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'general', label: 'General' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function reportTypeLabel(type: string): string {
  return REPORT_TYPES.find((r) => r.value === type)?.label ?? type;
}

function reportTypeColor(type: string): string {
  switch (type) {
    case 'blitz':
      return '#22c55e';
    case 'bunker_sighting':
      return '#f59e0b';
    case 'fish_caught':
      return '#14b8a6';
    case 'bait':
      return '#3b82f6';
    case 'conditions':
      return '#a78bfa';
    default:
      return '#94a3b8';
  }
}

function displayName(email?: string, userId?: string): string {
  if (email) {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return userId?.slice(0, 8) ?? 'Unknown';
}

// ── No Crew View ───────────────────────────────────────────────────────────

function NoCrewView({
  onCreated,
  onJoin,
}: {
  onCreated: () => void;
  onJoin: () => void;
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [crewName, setCrewName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!crewName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error: insertError } = await supabase.from('crews').insert({
        name: crewName.trim(),
        invite_code: code,
        created_by: user.id,
      });

      if (insertError) throw insertError;

      // Also add creator as a member
      const { data: crew } = await supabase
        .from('crews')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (crew) {
        await supabase.from('crew_members').insert({
          crew_id: crew.id,
          user_id: user.id,
        });
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create crew');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { data: crew, error: findError } = await supabase
        .from('crews')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (findError || !crew) throw new Error('Invalid invite code');

      const { error: joinError } = await supabase
        .from('crew_members')
        .insert({ crew_id: crew.id, user_id: user.id });

      if (joinError) {
        if (joinError.code === '23505') throw new Error('You are already a member of this crew');
        throw joinError;
      }

      onJoin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join crew');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-4 pb-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Crew Up
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          Create or join a crew to share catches, reports, and compete with your fishing buddies.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="flex w-full min-h-[56px] items-center justify-center rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] px-4 text-base font-medium text-white transition-colors hover:border-[#14b8a6]/40 hover:bg-[#162a4a]"
            >
              Create a Crew
            </button>
            <button
              onClick={() => setMode('join')}
              className="flex w-full min-h-[56px] items-center justify-center rounded-xl border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-4 text-base font-medium text-[#14b8a6] transition-colors hover:bg-[#14b8a6]/20"
            >
              Join with Invite Code
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Crew Name
              </label>
              <input
                type="text"
                value={crewName}
                onChange={(e) => setCrewName(e.target.value)}
                placeholder="e.g. Night Stalkers"
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 text-white placeholder-slate-600 outline-none focus:border-[#14b8a6]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('choose')}
                className="min-h-[48px] flex-1 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] text-sm text-slate-400"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !crewName.trim()}
                className="min-h-[48px] flex-1 rounded-lg bg-[#14b8a6] text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Crew'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A3F8K2"
                maxLength={6}
                className="min-h-[48px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 outline-none focus:border-[#14b8a6]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('choose')}
                className="min-h-[48px] flex-1 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] text-sm text-slate-400"
              >
                Back
              </button>
              <button
                onClick={handleJoin}
                disabled={submitting || inviteCode.length < 4}
                className="min-h-[48px] flex-1 rounded-lg bg-[#14b8a6] text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Joining...' : 'Join Crew'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick Report Modal ─────────────────────────────────────────────────────

function QuickReportModal({
  crewId,
  onClose,
  onPosted,
}: {
  crewId: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [reportType, setReportType] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Try to get location
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000,
              }),
          );
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          // Location not available, that's fine
        }
      }

      const { error: insertError } = await supabase
        .from('crew_reports')
        .insert({
          crew_id: crewId,
          user_id: user.id,
          report_type: reportType,
          message: message.trim(),
          latitude,
          longitude,
        });

      if (insertError) throw insertError;

      onPosted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-[#1e3a5f] bg-[#0f1f3d] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Quick Report</h3>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setReportType(rt.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  reportType === rt.value
                    ? 'bg-[#14b8a6] text-white'
                    : 'border border-[#1e3a5f] bg-[#0a1628] text-slate-400'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What are you seeing out there?"
            rows={3}
            className="w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-[#14b8a6]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="min-h-[48px] w-full rounded-lg bg-[#14b8a6] text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Report'}
        </button>
      </div>
    </div>
  );
}

// ── Main Crew Page ─────────────────────────────────────────────────────────

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [catches, setCatches] = useState<CrewCatch[]>([]);
  const [reports, setReports] = useState<CrewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCrew, setHasCrew] = useState<boolean | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'reports'>('feed');

  const loadCrewData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHasCrew(false);
        setLoading(false);
        return;
      }

      // Find user's crew
      const { data: membership } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) {
        setHasCrew(false);
        setLoading(false);
        return;
      }

      setHasCrew(true);
      const crewId = membership.crew_id;

      // Fetch crew info, members, catches, and reports in parallel
      const [crewRes, membersRes, catchesRes, reportsRes] =
        await Promise.allSettled([
          supabase.from('crews').select('*').eq('id', crewId).single(),
          supabase.from('crew_members').select('*').eq('crew_id', crewId),
          supabase
            .from('catches')
            .select('*')
            .in(
              'user_id',
              (
                await supabase
                  .from('crew_members')
                  .select('user_id')
                  .eq('crew_id', crewId)
              ).data?.map((m: { user_id: string }) => m.user_id) ?? [],
            )
            .order('caught_at', { ascending: false })
            .limit(50),
          supabase
            .from('crew_reports')
            .select('*')
            .eq('crew_id', crewId)
            .order('created_at', { ascending: false })
            .limit(30),
        ]);

      if (crewRes.status === 'fulfilled' && crewRes.value.data) {
        setCrew(crewRes.value.data as Crew);
      }

      if (membersRes.status === 'fulfilled' && membersRes.value.data) {
        // Enrich members with catch counts
        const memberData = membersRes.value.data;
        const enriched: CrewMember[] = memberData.map(
          (m: { id: string; user_id: string }) => ({
            id: m.id,
            user_id: m.user_id,
            catch_count: 0,
          }),
        );

        // Count catches per member
        if (catchesRes.status === 'fulfilled' && catchesRes.value.data) {
          const catchData = catchesRes.value.data;
          for (const c of catchData) {
            const member = enriched.find(
              (m) => m.user_id === c.user_id,
            );
            if (member) member.catch_count++;
          }
          setCatches(
            catchData.map(
              (c: {
                id: string;
                user_id: string;
                caught_at: string;
                fish_length: number | null;
                fish_weight: number | null;
                lure_or_bait: string | null;
                notes: string | null;
              }) => ({
                id: c.id,
                user_id: c.user_id,
                caught_at: c.caught_at,
                fish_length: c.fish_length,
                fish_weight: c.fish_weight,
                lure_or_bait: c.lure_or_bait,
                notes: c.notes,
              }),
            ),
          );
        }
        setMembers(enriched);
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
        setReports(
          reportsRes.value.data.map(
            (r: {
              id: string;
              user_id: string;
              report_type: string;
              message: string;
              created_at: string;
              latitude?: number;
              longitude?: number;
            }) => ({
              id: r.id,
              user_id: r.user_id,
              report_type: r.report_type,
              message: r.message,
              created_at: r.created_at,
              latitude: r.latitude,
              longitude: r.longitude,
            }),
          ),
        );
      }
    } catch (err) {
      console.error('Failed to load crew data:', err);
      setHasCrew(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrewData();
  }, [loadCrewData]);

  // Loading state
  if (loading || hasCrew === null) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
        <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </main>
      </div>
    );
  }

  // No crew
  if (!hasCrew) {
    return <NoCrewView onCreated={loadCrewData} onJoin={loadCrewData} />;
  }

  // Build leaderboards
  const biggestFish = [...catches]
    .filter((c) => c.fish_length !== null)
    .sort((a, b) => (b.fish_length ?? 0) - (a.fish_length ?? 0))
    .slice(0, 5);

  const mostFish: LeaderboardEntry[] = members
    .map((m) => ({ user_id: m.user_id, email: m.email, value: m.catch_count }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

  // Best lure
  const lureCounts: Record<string, number> = {};
  for (const c of catches) {
    if (c.lure_or_bait) {
      lureCounts[c.lure_or_bait] = (lureCounts[c.lure_or_bait] ?? 0) + 1;
    }
  }
  const bestLures = Object.entries(lureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const tabs = [
    { key: 'feed' as const, label: 'Catch Feed' },
    { key: 'leaderboard' as const, label: 'Leaderboard' },
    { key: 'reports' as const, label: 'Reports' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-white">
              {crew?.name ?? 'My Crew'}
            </h1>
            <p className="text-xs text-slate-500">
              {members.length} member{members.length !== 1 ? 's' : ''} &middot;
              Code: {crew?.invite_code}
            </p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="min-h-[44px] rounded-lg bg-[#14b8a6] px-4 text-sm font-semibold text-white"
          >
            + Report
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Members */}
        <section className="mb-4 rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4 animate-fade-in">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Members
          </h3>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-full border border-[#1e3a5f] bg-[#0a1628] px-3 py-1.5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14b8a6]/20 text-xs font-bold text-[#14b8a6]">
                  {displayName(m.email, m.user_id).charAt(0)}
                </div>
                <span className="text-sm text-white">
                  {displayName(m.email, m.user_id)}
                </span>
                <span className="text-xs text-slate-500">
                  {m.catch_count} fish
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tab bar */}
        <div className="mb-4 flex gap-1 rounded-lg border border-[#1e3a5f] bg-[#0a1628] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`min-h-[40px] flex-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0f1f3d] text-[#14b8a6]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Catch Feed */}
        {activeTab === 'feed' && (
          <section className="space-y-2 animate-fade-in">
            {catches.length === 0 ? (
              <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-8 text-center text-sm text-slate-500">
                No catches logged yet. Get out there!
              </div>
            ) : (
              catches.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {displayName(c.user_email, c.user_id)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(c.caught_at)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {c.fish_length && (
                      <span className="text-slate-300">
                        {c.fish_length}&quot; long
                      </span>
                    )}
                    {c.fish_weight && (
                      <span className="text-slate-300">
                        {c.fish_weight} lbs
                      </span>
                    )}
                    {c.lure_or_bait && (
                      <span className="text-[#14b8a6]">{c.lure_or_bait}</span>
                    )}
                  </div>
                  {c.notes && (
                    <p className="mt-2 text-xs text-slate-500">{c.notes}</p>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <section className="space-y-4 animate-fade-in">
            {/* Biggest Fish */}
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Biggest Fish (by length)
              </h4>
              {biggestFish.length === 0 ? (
                <p className="text-sm text-slate-500">No fish with lengths logged yet</p>
              ) : (
                <div className="space-y-2">
                  {biggestFish.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : i === 1
                              ? 'bg-slate-400/20 text-slate-300'
                              : i === 2
                                ? 'bg-orange-600/20 text-orange-400'
                                : 'bg-[#1e3a5f] text-slate-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-white">
                        {displayName(c.user_email, c.user_id)}
                      </span>
                      <span className="text-sm font-semibold text-[#14b8a6]">
                        {c.fish_length}&quot;
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Fish */}
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Most Fish This Season
              </h4>
              {mostFish.length === 0 ? (
                <p className="text-sm text-slate-500">No catches yet</p>
              ) : (
                <div className="space-y-2">
                  {mostFish.map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center gap-3 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[#1e3a5f] text-slate-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-white">
                        {displayName(entry.email, entry.user_id)}
                      </span>
                      <span className="text-sm font-semibold text-[#14b8a6]">
                        {entry.value as number} fish
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Best Lure */}
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Best Lure (most catches)
              </h4>
              {bestLures.length === 0 ? (
                <p className="text-sm text-slate-500">No lure data yet</p>
              ) : (
                <div className="space-y-2">
                  {bestLures.map(([lure, count], i) => (
                    <div
                      key={lure}
                      className="flex items-center gap-3 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-3 py-2"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[#1e3a5f] text-slate-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-white">{lure}</span>
                      <span className="text-sm font-semibold text-[#14b8a6]">
                        {count} catches
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <section className="space-y-2 animate-fade-in">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-8 text-center text-sm text-slate-500">
                No reports yet. Hit the + Report button to share intel with your crew.
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: reportTypeColor(r.report_type) + '1a',
                        color: reportTypeColor(r.report_type),
                      }}
                    >
                      {reportTypeLabel(r.report_type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {displayName(r.user_email, r.user_id)}
                    </span>
                    <span className="ml-auto text-xs text-slate-600">
                      {formatRelativeTime(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {r.message}
                  </p>
                  {r.latitude && r.longitude && (
                    <p className="mt-1 text-xs text-slate-600">
                      Location: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Quick Report Modal */}
      {showReport && crew && (
        <QuickReportModal
          crewId={crew.id}
          onClose={() => setShowReport(false)}
          onPosted={loadCrewData}
        />
      )}
    </div>
  );
}
