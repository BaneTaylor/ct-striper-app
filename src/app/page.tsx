import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a1628]">
      {/* Animated gradient overlay */}
      <div className="pointer-events-none absolute inset-0 animate-gradient-shift bg-gradient-to-br from-[#14b8a6]/[0.03] via-transparent to-[#0ea5e9]/[0.03] bg-[length:200%_200%]" />

      {/* Water ripple background glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 translate-y-1/3 rounded-full bg-[#14b8a6]/[0.03] blur-[120px]" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-4">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo icon */}
          <div className="animate-float flex h-20 w-20 items-center justify-center rounded-2xl glass-card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 12 5 4 12 4C19 4 22 12 22 12" />
              <path d="M2 12C2 12 5 20 12 20C19 20 22 12 22 12" />
              <circle cx="12" cy="12" r="2" fill="#14b8a6" />
            </svg>
          </div>

          {/* Title */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="gradient-text text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
              CT Striper
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-400 sm:text-xl">
              Real-time fishing intelligence for the Connecticut shoreline
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              { label: 'Live Tides', color: '#14b8a6' },
              { label: 'Weather', color: '#0ea5e9' },
              { label: 'Solunar', color: '#818cf8' },
              { label: 'Fish Score', color: '#14b8a6' },
            ].map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-[#1e3a5f]/60 bg-[#0f1f3d]/60 px-4 py-1.5 text-slate-300 backdrop-blur-sm"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.color}40` }}
                />
                {f.label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="btn-premium flex h-14 min-w-[200px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0ea5e9] px-10 text-base font-bold text-[#0a1628]"
            >
              Start Fishing Smarter
            </Link>
            <Link
              href="/signup"
              className="btn-secondary flex h-14 min-w-[200px] items-center justify-center rounded-2xl border border-[#1e3a5f] bg-[#0f1f3d]/80 px-10 text-base font-semibold text-slate-200 backdrop-blur-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16">
        <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Everything you need on the water
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Live Conditions',
              desc: 'Tides, wind, barometric pressure, and water temp updated in real time for every spot on the CT coast.',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v10l4.5 4.5" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              ),
            },
            {
              title: '7-Day Forecast',
              desc: 'AI-scored fishing windows that combine tide, solunar, weather, and seasonal patterns into one clear number.',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
            },
            {
              title: 'Crew & Spots',
              desc: 'Share conditions with your fishing crew. Track your favorite spots and log catches to find patterns.',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-card gradient-border group rounded-2xl p-6 transition-all duration-300 hover:bg-[#0f1f3d]/90"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0a1628]/60">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / builder section */}
      <section className="relative z-10 mx-auto w-full max-w-2xl px-6 py-12 text-center">
        <div className="glass-card rounded-2xl px-8 py-10">
          <p className="text-xl font-medium leading-relaxed text-slate-300 sm:text-2xl">
            &ldquo;Built by fishermen who know these waters.&rdquo;
          </p>
          <p className="mt-4 text-sm text-slate-500">
            From the Housatonic to the Thames, every feature is tuned for CT striper fishing.
          </p>
        </div>
      </section>

      {/* Bottom wave effect */}
      <div className="pointer-events-none relative z-10 -mb-1">
        <div className="animate-wave absolute bottom-0 left-0 h-32 w-[200%] opacity-[0.08]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
              fill="#14b8a6"
            />
          </svg>
        </div>
        <div className="animate-wave-slow absolute bottom-0 left-0 h-24 w-[200%] opacity-[0.05]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              d="M0 80C360 40 720 100 1080 60C1260 40 1350 80 1440 80V120H0V80Z"
              fill="#0ea5e9"
            />
          </svg>
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
