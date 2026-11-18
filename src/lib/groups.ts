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

/**
 * Orden de dos filas. Se compara por proporción de partidos ganados y luego por diferencia de puntos
 * y puntos a favor por partido, así vale también entre grupos con distinta cantidad de partidos.
 */
function compare(x: GroupRow, y: GroupRow): number {
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
  for (const m of groupMatches(state, group)) {
    if (!m.winner || !m.a || !m.b) continue;
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
  // Si hay empate total, queda el orden del sorteo (el orden en que están en el grupo).
  return [...rows.values()].sort(compare);
}

export function groupStageDone(state: State): boolean {
  if (!state.groups) return false;
  const games = state.matches.filter((m) => m.group !== undefined);
  return games.length > 0 && games.every((m) => m.winner);
}

/**
 * Clasificados en orden de cabeza de serie (el mejor primero), o null si la fase de grupos no terminó.
 */
export function qualifiedTeams(state: State): string[] | null {
  if (!state.groups || !groupStageDone(state)) return null;
  const tables = state.groups.map((_, i) => groupTable(state, i));
  const winners = tables.map((t) => t[0]).sort(compare);
  const seconds = tables.map((t) => t[1]).filter(Boolean).sort(compare);
  return [...winners, ...seconds].slice(0, qualifierCount(state.groups.length)).map((r) => r.teamId);
}

/** Grupo al que pertenece cada equipo. */
export function groupOf(state: State): Map<string, number> {
  const map = new Map<string, number>();
  state.groups?.forEach((ids, i) => ids.forEach((id) => map.set(id, i)));
  return map;
}
