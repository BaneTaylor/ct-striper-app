'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-white">
            CT Striper
          </Link>
          <p className="mt-2 text-sm text-slate-400">Create your account</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="rounded-lg bg-teal-500/10 px-6 py-5 ring-1 ring-teal-500/20 mb-6">
              <p className="text-teal-400 font-medium mb-2">Check your email!</p>
              <p className="text-slate-400 text-sm">
                We sent a verification link to your inbox. Click it to activate your account, then come back to log in.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#14b8a6] px-8 text-base font-semibold text-[#0a1628] hover:bg-[#2dd4bf]"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="displayName" className="text-sm font-medium text-slate-300">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-12 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
                  placeholder="Captain Ahab"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-12 rounded-lg border border-[#1e3a5f] bg-[#0f1f3d] px-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
                  placeholder="At least 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 items-center justify-center rounded-xl bg-[#14b8a6] text-base font-semibold text-[#0a1628] transition-all hover:bg-[#2dd4bf] disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#14b8a6] hover:text-[#2dd4bf]">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
