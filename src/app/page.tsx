import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1628] px-6">
      {/* Animated wave background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-wave absolute -bottom-2 left-0 h-32 w-[200%] opacity-[0.06]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
              fill="#14b8a6"
            />
          </svg>
        </div>
        <div className="animate-wave absolute -bottom-2 left-0 h-24 w-[200%] opacity-[0.04]" style={{ animationDelay: '-2s' }}>
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              d="M0 80C360 40 720 100 1080 60C1260 40 1350 80 1440 80V120H0V80Z"
              fill="#0ea5e9"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14b8a6]/10 ring-1 ring-[#14b8a6]/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 12 5 4 12 4C19 4 22 12 22 12" />
              <path d="M2 12C2 12 5 20 12 20C19 20 22 12 22 12" />
              <circle cx="12" cy="12" r="2" fill="#14b8a6" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            CT Striper
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-slate-400">
            Real-time fishing intelligence for the Connecticut shoreline
          </p>
        </div>

        {/* Feature highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            Tides
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
            Weather
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
            Solunar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
            Scoring
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex h-12 min-w-[160px] items-center justify-center rounded-xl bg-[#14b8a6] px-8 text-base font-semibold text-[#0a1628] transition-all hover:bg-[#2dd4bf] hover:shadow-lg hover:shadow-[#14b8a6]/20"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex h-12 min-w-[160px] items-center justify-center rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] px-8 text-base font-semibold text-slate-200 transition-all hover:border-[#14b8a6]/40 hover:bg-[#162a4a]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
