import type { Match, State } from './types';

/** Con menos equipos que esto no hay fase de grupos: se juega eliminación directa. */
export const GROUP_MIN_TEAMS = 6;

export function groupName(index: number): string {
  return `Grupo ${String.fromCharCode(65 + index)}`;
}

/** Grupos de 3 o 4 equipos. */
export function groupCount(teamCount: number): number {
  return Math.ceil(teamCount / 4);
}

/**
 * Equipos que pasan a la eliminatoria: siempre una potencia de 2 (mínimo 4). Primero entran todos los
 * ganadores de grupo y se completa con los mejores segundos.
 */
export function qualifierCount(groups: number): number {
  if (groups <= 2) return 4;
  let q = 1;
  while (q < groups) q *= 2;
  return q;
}

export type GroupRow = {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

export function groupMatches(state: State, group: number): Match[] {
  return state.matches
    .filter((m) => m.group === group)
    .sort((x, y) => x.slot - y.slot);
}

export function tiebreakMatches(state: State): Match[] {
  return state.matches.filter((m) => m.tb).sort((x, y) => x.slot - y.slot);
}

/**
 * Compara dos filas por rendimiento: proporción de partidos ganados, luego diferencia de puntos y puntos
 * a favor por partido. Así vale también entre grupos con distinta cantidad de partidos. 0 = empate exacto.
 */
function compareStats(x: GroupRow, y: GroupRow): number {
  const rate = (r: GroupRow) => (r.played ? r.wins / r.played : 0);
  const diff = (r: GroupRow) => (r.played ? (r.pointsFor - r.pointsAgainst) / r.played : 0);
  const pf = (r: GroupRow) => (r.played ? r.pointsFor / r.played : 0);
  return rate(y) - rate(x) || diff(y) - diff(x) || pf(y) - pf(x);
}

/** Tabla de un grupo, del primero al último. */
export function groupTable(state: State, group: number): GroupRow[] {
  const ids = state.groups?.[group] ?? [];
  const rows = new Map<string, GroupRow>(
    ids.map((teamId) => [
      teamId,
      { teamId, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    ]),
  );
  // Los partidos de desempate (tb) no están en un grupo: no suman partidos ni puntos a la tabla.
  for (const m of state.matches) {
    if (m.group !== group || !m.winner || !m.a || !m.b) continue;
    const a = rows.get(m.a);
    const b = rows.get(m.b);
    if (!a || !b) continue;
    const sa = m.scoreA ?? 0;
    const sb = m.scoreB ?? 0;
    a.played++;
    b.played++;
    a.pointsFor += sa;
    a.pointsAgainst += sb;
    b.pointsFor += sb;
    b.pointsAgainst += sa;
    const [won, lost] = m.winner === m.a ? [a, b] : [b, a];
    won.wins++;
    lost.losses++;
  }
  // Si sigue habiendo empate total, queda el orden del sorteo (el orden en que están en el grupo).
  return [...rows.values()].sort(compareStats);
}

/** Victorias y diferencia en los desempates entre segundos. */
function secondsTb(state: State, teamId: string): { wins: number; diff: number } {
  let wins = 0;
  let diff = 0;
  for (const m of state.matches) {
    if (m.tb !== 'segundos' || !m.winner || !m.a || !m.b) continue;
    if (m.a !== teamId && m.b !== teamId) continue;
    const margin = Math.abs((m.scoreA ?? 0) - (m.scoreB ?? 0));
    if (m.winner === teamId) {
      wins++;
      diff += margin;
    } else {
      diff -= margin;
    }
  }
  return { wins, diff };
}

/** Orden entre equipos de distintos grupos (segundos): rendimiento y, si empatan exacto, desempate. */
function compareAcross(state: State) {
  return (x: GroupRow, y: GroupRow): number => {
    const tx = secondsTb(state, x.teamId);
    const ty = secondsTb(state, y.teamId);
    return compareStats(x, y) || ty.wins - tx.wins || ty.diff - tx.diff;
  };
}

function groupGamesDone(state: State): boolean {
  if (!state.groups) return false;
  const games = state.matches.filter((m) => m.group !== undefined);
  return games.length > 0 && games.every((m) => m.winner);
}

/** La fase de grupos terminó: todos los partidos, incluidos los de desempate que hayan hecho falta. */
export function groupStageDone(state: State): boolean {
  return groupGamesDone(state) && state.matches.filter((m) => m.round === 0).every((m) => m.winner);
}

export type TieSet = { kind: 'segundos'; teams: string[] };

/**
 * Empate exacto en el último cupo entre los segundos de cada grupo, que todavía hay que resolver con
 * partidos de desempate. Si empatan más de 2, juegan todos contra todos. Solo se considera cuando
 * terminaron todos los partidos de grupo. El primer lugar de un grupo no se desempata: siempre clasifica.
 */
export function findTies(state: State): TieSet[] {
  if (!state.groups || !groupGamesDone(state)) return [];
  const tables = state.groups.map((_, i) => groupTable(state, i));

  const needed = qualifierCount(state.groups.length) - state.groups.length;
  const seconds = tables.map((t) => t[1]).filter(Boolean);
  if (needed <= 0 || needed >= seconds.length) return [];
  const cmp = compareAcross(state);
  const sorted = [...seconds].sort(cmp);
  if (cmp(sorted[needed - 1], sorted[needed]) !== 0) return [];
  const edge = sorted[needed];
  return [{ kind: 'segundos', teams: sorted.filter((r) => cmp(r, edge) === 0).map((r) => r.teamId) }];
}

/**
 * Clasificados en orden de cabeza de serie (el mejor primero), o null si la fase de grupos no terminó.
 */
export function qualifiedTeams(state: State): string[] | null {
  if (!state.groups || !groupStageDone(state)) return null;
  const tables = state.groups.map((_, i) => groupTable(state, i));
  const cmp = compareAcross(state);
  const winners = tables.map((t) => t[0]).sort(cmp);
  const seconds = tables.map((t) => t[1]).filter(Boolean).sort(cmp);
  return [...winners, ...seconds].slice(0, qualifierCount(state.groups.length)).map((r) => r.teamId);
}

/** Grupo al que pertenece cada equipo. */
export function groupOf(state: State): Map<string, number> {
  const map = new Map<string, number>();
  state.groups?.forEach((ids, i) => ids.forEach((id) => map.set(id, i)));
  return map;
}
