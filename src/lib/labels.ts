import { groupName } from './groups';
import type { Match, State } from './types';

export function teamNames(state: State, teamId: string | null): string[] {
  if (!teamId) return [];
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) return [];
  return team.playerIds
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

export function teamLabel(state: State, teamId: string | null): string {
  const names = teamNames(state, teamId);
  if (names.length === 0) return 'Por definir';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

/** Rondas del torneo: el cuadro se arma para la siguiente potencia de 2. */
export function totalRounds(teamCount: number): number {
  return teamCount < 2 ? 0 : Math.ceil(Math.log2(teamCount));
}

/** Rondas de eliminatoria. La fase de grupos (ronda 0) no cuenta. */
export function roundCount(state: State): number {
  return Math.max(0, ...state.matches.map((m) => m.round));
}

/** Nombre de la ronda. Si hay pases directos, la primera es la ronda previa. */
export function roundTitle(state: State, round: number): string {
  if (round === 0) return 'Fase de grupos';
  if (round === 1 && state.matches.some((m) => m.round === 1 && m.bye)) return 'Ronda previa';
  const fromEnd = roundCount(state) - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Cuartos de final';
  if (fromEnd === 3) return 'Octavos de final';
  return `Ronda ${round}`;
}

/** Título de un partido: el grupo si es de la fase de grupos, si no la ronda. */
export function matchTitle(state: State, m: Match): string {
  if (m.tb) return 'Desempate entre segundos';
  return m.group !== undefined ? groupName(m.group) : roundTitle(state, m.round);
}

/** Partidos con los dos equipos definidos y sin resultado. */
export function readyMatches(state: State): Match[] {
  return state.matches
    .filter((m) => m.a && m.b && !m.winner && !m.bye)
    .sort((x, y) => x.round - y.round || x.slot - y.slot);
}

export function champion(state: State): string | null {
  const total = roundCount(state);
  const final = state.matches.find((m) => m.round === total);
  return final?.winner ?? null;
}

export function teamIndex(teamId: string): number {
  return Math.max(0, Number(teamId.replace(/\D/g, '')) - 1);
}
