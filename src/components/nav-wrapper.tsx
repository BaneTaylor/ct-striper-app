'use client';

import { usePathname } from 'next/navigation';
import NavBar from './nav-bar';

const AUTH_ROUTES = ['/dashboard', '/spots', '/log', '/forecast', '/menu', '/lures', '/regulations', '/settings', '/river', '/crew', '/solunar', '/tips'];

export default function NavWrapper() {
  const pathname = usePathname();
  const showNav = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  if (!showNav) return null;

  return <NavBar />;
}
