'use client';

import Link from 'next/link';

const menuItems = [
  {
    href: '/lures',
    label: 'Lure & Bait Guide',
    description: 'Get recommendations based on conditions',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2l-3 8h6L9 22l3-10H6L14 2" />
      </svg>
    ),
  },
  {
    href: '/regulations',
    label: 'CT Regulations',
    description: 'Size limits, seasons & quick measure tool',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/forecast',
    label: '7-Day Forecast',
    description: 'Bite windows, tides & solunar periods',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'Preferences and account',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24">
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f] bg-[#0a1628]/95 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-base font-bold text-white">More</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[56px] items-center gap-4 rounded-xl border border-[#1e3a5f] bg-[#0f1f3d] px-4 py-3 transition-colors hover:border-[#14b8a6]/30 hover:bg-[#162a4a] active:bg-[#1a3050]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0a1628]">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-[11px] text-slate-500">{item.description}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* App version */}
        <div className="mt-8 text-center text-[10px] text-slate-600">
          CT Striper v1.0 - Built for the Connecticut shoreline
        </div>
      </main>
    </div>
  );
}
