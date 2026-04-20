'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JoinCrewPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to join a crew.');
        setSubmitting(false);
        return;
      }

      // Look up crew by invite code
      const { data: crew, error: findError } = await supabase
        .from('crews')
        .select('id, name')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (findError || !crew) {
        setError('Invalid invite code. Double-check and try again.');
        setSubmitting(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('crew_members')
        .select('id')
        .eq('crew_id', crew.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Already a member, just redirect
        router.push('/crew');
        return;
      }

      // Insert into crew_members
      const { error: joinError } = await supabase
        .from('crew_members')
        .insert({ crew_id: crew.id, user_id: user.id });

      if (joinError) {
        setError('Failed to join crew. Please try again.');
        setSubmitting(false);
        return;
      }

      // Redirect to crew page
      router.push('/crew');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-4 pb-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Join a Crew
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          Enter the invite code your buddy gave you.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
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
              autoFocus
              className="min-h-[56px] w-full rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 text-center text-2xl font-mono tracking-[0.3em] text-white placeholder-slate-600 outline-none focus:border-[#14b8a6]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || inviteCode.length < 4}
            className="min-h-[48px] w-full rounded-lg bg-[#14b8a6] text-base font-semibold text-white transition-colors hover:bg-[#0d9488] disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join Crew'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/crew')}
            className="min-h-[44px] w-full rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] text-sm text-slate-400 transition-colors hover:text-white"
          >
            Back to Crew
          </button>
        </form>
      </div>
    </div>
  );
}
