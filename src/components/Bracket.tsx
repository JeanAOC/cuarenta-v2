'use client';

import { useState, type CSSProperties } from 'react';
import { readyMatches, roundCount, roundTitle, teamLabel } from '@/lib/labels';
import type { Match, State } from '@/lib/types';

function Slot({ state, match, side }: { state: State; match: Match; side: 'a' | 'b' }) {
  const teamId = side === 'a' ? match.a : match.b;
  const score = side === 'a' ? match.scoreA : match.scoreB;
  const decided = Boolean(match.winner) && !match.bye;
  let slotState: 'won' | 'lost' | 'empty' | 'open' = 'open';
  if (!teamId) slotState = 'empty';
  else if (decided) slotState = match.winner === teamId ? 'won' : 'lost';
  return (
    <div className="slot" data-state={slotState}>
      <span className="slot-name">{teamId ? teamLabel(state, teamId) : 'Por definir'}</span>
      {score !== null && <span className="slot-pts">{score}</span>}
    </div>
  );
}

export function MatchBox({ state, match, ready }: { state: State; match: Match; ready: boolean }) {
  return (
    <div className="match" data-ready={ready}>
      <Slot state={state} match={match} side="a" />
      <Slot state={state} match={match} side="b" />
      {match.games && (
        <p className="match-games">
          Mejor de 3, partidas: {match.games.map((g) => `${g.a}–${g.b}`).join(', ')}
        </p>
      )}
    </div>
  );
}

type Node = {
  match: Match;
  /** Fila de inicio (desde 0) dentro de la cuadrícula. */
  row: number;
  span: number;
  hasIn: boolean;
  hasOut: boolean;
  /** Si hay un rival de cruce dibujado, la línea vertical que los une. */
  join: 'up' | 'down' | null;
};

/**
 * Coloca cada partido en una cuadrícula: la ronda 1 ocupa 1 fila por cruce, la ronda 2 ocupa 2,
 * la 3 ocupa 4, etc. Así cada partido queda centrado entre los dos que lo alimentan.
 * Los pases directos no se dibujan: el equipo aparece directamente en la ronda 2.
 */
function layout(state: State, total: number): Node[] {
  const isReal = (slot: number) => {
    const m = state.matches.find((x) => x.round === 1 && x.slot === slot);
    return Boolean(m) && !m!.bye;
  };
  const nodes: Node[] = [];
  for (const m of state.matches) {
    // Los partidos de la fase de grupos (ronda 0) se muestran en su propia sección, no en el cuadro.
    if (m.round < 1) continue;
    if (m.round === 1) {
      if (m.bye) continue;
      const siblingDrawn = isReal(m.slot ^ 1);
      // Sin rival de cruce dibujado, el partido ocupa las dos filas y queda a la altura del siguiente.
      const merged = !siblingDrawn && total > 1;
      nodes.push({
        match: m,
        row: merged ? m.slot - (m.slot % 2) : m.slot,
        span: merged ? 2 : 1,
        hasIn: false,
        hasOut: total > 1,
        join: siblingDrawn && total > 1 ? (m.slot % 2 === 0 ? 'down' : 'up') : null,
      });
    } else {
      const span = 2 ** (m.round - 1);
      nodes.push({
        match: m,
        row: m.slot * span,
        span,
        hasIn: m.round > 2 || isReal(2 * m.slot) || isReal(2 * m.slot + 1),
        hasOut: m.round < total,
        join: m.round < total ? (m.slot % 2 === 0 ? 'down' : 'up') : null,
      });
    }
  }
  return nodes;
}

export function Bracket({ state }: { state: State }) {
  const total = roundCount(state);
  const rounds = Array.from({ length: total }, (_, i) => i + 1);
  const readyList = readyMatches(state);
  const ready = new Set(readyList.map((m) => m.id));
  const [active, setActive] = useState(readyList.find((m) => m.round >= 1)?.round ?? total);
  const nodes = layout(state, total);
  const rows = 2 ** (total - 1);

  return (
    <div>
      <div className="tree-wrap">
        <div className="tree" style={{ '--rounds': total, '--rows': rows } as CSSProperties}>
          {rounds.map((r) => (
            <h3 key={`t${r}`} className="tree-title" style={{ gridColumn: r, gridRow: 1 }}>
              {roundTitle(state, r)}
            </h3>
          ))}
          {nodes.map((n) => (
            <div
              key={n.match.id}
              className="node"
              style={{ gridColumn: n.match.round, gridRow: `${n.row + 2} / span ${n.span}` }}
            >
              <MatchBox state={state} match={n.match} ready={ready.has(n.match.id)} />
              {n.hasIn && <span className="wire wire-in" aria-hidden="true" />}
              {n.hasOut && <span className="wire wire-out" aria-hidden="true" />}
              {n.join && <span className="wire wire-join" data-side={n.join} aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bracket-mobile">
        <div className="bracket-tabs" role="group" aria-label="Elegir ronda">
          {rounds.map((r) => (
            <button
              key={r}
              type="button"
              className="tab"
              aria-pressed={active === r}
              onClick={() => setActive(r)}
            >
              {roundTitle(state, r)}
            </button>
          ))}
        </div>
        {rounds.map((r) => (
          <section key={r} className="round" data-active={active === r} aria-label={roundTitle(state, r)}>
            <div className="round-matches">
              {state.matches
                .filter((m) => m.round === r && !m.bye)
                .sort((x, y) => x.slot - y.slot)
                .map((m) => (
                  <MatchBox key={m.id} state={state} match={m} ready={ready.has(m.id)} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
