import { roundCount, roundTitle, teamLabel } from './labels';
import type { State } from './types';

export type Row = {
  teamId: string;
  label: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  champion: boolean;
  alive: boolean;
  /** Ronda en la que perdió; 0 si sigue en juego. */
  outRound: number;
  status: string;
};

/**
 * Clasificación por avance: campeón, luego quienes siguen en juego y después los eliminados,
 * del que llegó más lejos al que menos. Los pases directos no cuentan como partido jugado.
 * Desempates: partidos ganados, diferencia de puntos y puntos a favor.
 */
export function standings(state: State): Row[] {
  const total = roundCount(state);
  const rows = new Map<string, Row>();
  for (const t of state.teams) {
    rows.set(t.id, {
      teamId: t.id,
      label: teamLabel(state, t.id),
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      champion: false,
      alive: true,
      outRound: 0,
      status: 'En juego',
    });
  }

  for (const m of state.matches) {
    if (m.bye || !m.winner || !m.a || !m.b) continue;
    const a = rows.get(m.a);
    const b = rows.get(m.b);
    if (!a || !b) continue;
    // En una final al mejor de 3, los puntos son la suma de todas las partidas.
    const sa = m.games ? m.games.reduce((t, g) => t + g.a, 0) : (m.scoreA ?? 0);
    const sb = m.games ? m.games.reduce((t, g) => t + g.b, 0) : (m.scoreB ?? 0);
    a.played++;
    b.played++;
    a.pointsFor += sa;
    a.pointsAgainst += sb;
    b.pointsFor += sb;
    b.pointsAgainst += sa;
    const [won, lost] = m.winner === m.a ? [a, b] : [b, a];
    won.wins++;
    lost.losses++;
    lost.alive = false;
    lost.outRound = m.round;
    if (m.round === total) {
      won.champion = true;
      won.status = 'Campeón';
      lost.status = 'Subcampeón';
    } else {
      lost.status = `Eliminado en ${roundTitle(state, m.round).toLowerCase()}`;
    }
  }

  const tier = (r: Row) => (r.champion ? 3 : r.alive ? 2 : 1);
  const diff = (r: Row) => r.pointsFor - r.pointsAgainst;
  return [...rows.values()].sort(
    (x, y) =>
      tier(y) - tier(x) ||
      y.outRound - x.outRound ||
      y.wins - x.wins ||
      diff(y) - diff(x) ||
      y.pointsFor - x.pointsFor ||
      x.label.localeCompare(y.label, 'es'),
  );
}
