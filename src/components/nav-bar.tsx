'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/spots', label: 'Spots', icon: 'pin' },
  { href: '/log', label: 'Log', icon: 'edit' },
  { href: '/forecast', label: 'Forecast', icon: 'chart' },
  { href: '/menu', label: 'More', icon: 'more' },
];

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? '#14b8a6' : '#94a3b8';
  const size = 24;

  switch (icon) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'pin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'edit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'chart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'more':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1e3a5f]/40 bg-[#0a1628]/80 backdrop-blur-xl">
      {/* Top gradient border line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#14b8a6]/30 to-transparent" />

      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const moreSubPaths = ['/menu', '/lures', '/regulations', '/settings', '/tips'];
          const active =
            item.icon === 'more'
              ? moreSubPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
              : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-all duration-200 ${
                active ? 'text-[#14b8a6]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <NavIcon icon={item.icon} active={active} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {/* Active indicator - glowing teal dot */}
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#14b8a6]" style={{ boxShadow: '0 0 6px #14b8a6, 0 0 12px rgba(20, 184, 166, 0.3)' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
