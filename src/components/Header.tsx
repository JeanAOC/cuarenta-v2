'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PaloIcon } from './Palo';

const LINKS = [
  { href: '/', label: 'Cuadro' },
  { href: '/posiciones', label: 'Posiciones' },
  { href: '/jugadores', label: 'Jugadores' },
  { href: '/reglas', label: 'Reglas' },
  { href: '/admin', label: 'Organizador' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <PaloIcon palo="oros" size={26} />
          Cuarenta B-TECH
        </Link>
        <nav className="nav" aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
