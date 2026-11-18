import type { CSSProperties } from 'react';
import { PaloIcon, paloFor } from './Palo';

type Props = {
  /** Índice del equipo; define el palo. */
  index: number;
  names: string[];
  deal?: boolean;
  dealIndex?: number;
  champion?: boolean;
};

/** Carta de equipo: los dos compañeros, uno sobre otro, con el palo del equipo. */
export function Naipe({ index, names, deal = false, dealIndex = 0, champion = false }: Props) {
  const palo = paloFor(index);
  const [first = '', second = ''] = names;
  const label = second ? `${first} y ${second}` : first;
  return (
    <article
      className="naipe"
      role="group"
      aria-label={label}
      data-deal={deal}
      data-champion={champion}
      style={{ '--i': dealIndex } as CSSProperties}
    >
      <div className="naipe-half">
        <PaloIcon palo={palo} />
        <span className="naipe-name">{first}</span>
      </div>
      <div className="naipe-half naipe-second" aria-hidden="true">
        <PaloIcon palo={palo} />
        <span className="naipe-name">{second}</span>
      </div>
    </article>
  );
}
