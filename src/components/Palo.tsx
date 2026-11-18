const PALOS = ['oros', 'copas', 'espadas', 'bastos'] as const;
export type Palo = (typeof PALOS)[number];

export function paloFor(index: number): Palo {
  return PALOS[index % PALOS.length];
}

/** Los cuatro palos de la baraja, dibujados simples. Solo decoran, por eso van ocultos al lector de pantalla. */
export function PaloIcon({ palo, size = 22 }: { palo: Palo; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
    style: { flex: 'none' },
  } as const;
  const stroke = { stroke: '#14213d', strokeWidth: 2, strokeLinejoin: 'round' } as const;

  if (palo === 'oros') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#f2b705" {...stroke} />
        <circle cx="12" cy="12" r="4" fill="none" {...stroke} />
      </svg>
    );
  }
  if (palo === 'copas') {
    return (
      <svg {...common}>
        <path d="M5 3h14v5a7 7 0 0 1-14 0z" fill="#d6283b" {...stroke} />
        <path d="M12 15v5M8 21h8" fill="none" {...stroke} strokeLinecap="round" />
      </svg>
    );
  }
  if (palo === 'espadas') {
    return (
      <svg {...common}>
        <path d="M12 2l4.5 9L12 22l-4.5-11z" fill="#1e3fa6" {...stroke} />
        <path d="M7 12h10" fill="none" {...stroke} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="9" y="2" width="6" height="20" rx="3" fill="#ffffff" {...stroke} />
      <path d="M9 8h6M9 14h6" fill="none" {...stroke} />
    </svg>
  );
}
