import { randomInt, randomUUID } from 'node:crypto';
import { AppError } from './errors';
import {
  GROUP_MIN_TEAMS,
  findTies,
  groupCount,
  groupOf,
  qualifiedTeams,
  qualifierCount,
} from './groups';
import type { Match, State, Team } from './types';

type Rand = (max: number) => number;
const secureRand: Rand = (max) => randomInt(max);

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 64;
export const WIN_SCORE = 40;

export function emptyState(): State {
  return { status: 'registro', players: [], teams: [], matches: [], drawnAt: null };
}

export function shuffle<T>(items: readonly T[], rand: Rand = secureRand): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Orden estándar de cabezas de serie: 1 enfrenta al último, 2 al penúltimo, etc. */
function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export function addPlayer(state: State, rawName: unknown, rulesAcceptedAt?: string): State {
  if (state.status !== 'registro') {
    throw new AppError(409, 'El sorteo ya se hizo; no se pueden agregar jugadores.');
  }
  const name = typeof rawName === 'string' ? rawName.replace(/\s+/g, ' ').trim() : '';
  if (name.length < 2 || name.length > 30) {
    throw new AppError(400, 'Escribe un nombre de 2 a 30 letras.');
  }
  if (name.includes('�')) {
    throw new AppError(400, 'El nombre tiene caracteres que no se pudieron leer. Escríbelo de nuevo.');
  }
  const same = (p: { name: string }) =>
    p.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es');
  if (state.players.some(same)) {
    throw new AppError(409, `"${name}" ya está en la lista. Si es otra persona, agrega su apellido.`);
  }
  if (state.players.length >= MAX_PLAYERS) {
    throw new AppError(409, `Se llegó al máximo de ${MAX_PLAYERS} jugadores.`);
  }
  state.players.push({ id: randomUUID(), name, ...(rulesAcceptedAt ? { rulesAcceptedAt } : {}) });
  return state;
}

export function removePlayer(state: State, id: unknown): State {
  if (state.status !== 'registro') {
    throw new AppError(409, 'El sorteo ya se hizo; no se pueden quitar jugadores.');
  }
  const before = state.players.length;
  state.players = state.players.filter((p) => p.id !== id);
  if (state.players.length === before) throw new AppError(404, 'Ese jugador no existe.');
  return state;
}

export function drawTournament(state: State, rand: Rand = secureRand): State {
  if (state.status !== 'registro') {
    throw new AppError(409, 'El sorteo ya se hizo. Reinicia el torneo para repetirlo.');
  }
  if (state.players.length < MIN_PLAYERS) {
    throw new AppError(400, `Se necesitan al menos ${MIN_PLAYERS} jugadores (2 equipos).`);
  }
  if (state.players.length % 2 === 1) {
    throw new AppError(
      400,
      'No se puede iniciar porque un jugador no puede quedar fuera. Agrega o quita un jugador para que todos tengan pareja.',
    );
  }

  // Equipos de 2 al azar.
  const players = shuffle(state.players, rand);
  const pairCount = Math.floor(players.length / 2);
  const groups: string[][] = [];
  for (let i = 0; i < pairCount; i++) groups.push([players[2 * i].id, players[2 * i + 1].id]);

  const teams: Team[] = shuffle(groups, rand).map((playerIds, i) => ({ id: `t${i + 1}`, playerIds }));

  if (teams.length >= GROUP_MIN_TEAMS) {
    // Fase de grupos (todos contra todos) y luego eliminatoria entre los clasificados.
    const count = groupCount(teams.length);
    const groups: string[][] = Array.from({ length: count }, () => []);
    teams.forEach((t, i) => groups[i % count].push(t.id));

    const matches: Match[] = [];
    groups.forEach((ids, group) => {
      roundRobin(ids).forEach(([a, b], slot) => {
        matches.push({ ...emptyMatch(`g${group}m${slot}`, 0, slot), a, b, group });
      });
    });
    matches.push(...knockoutMatches(qualifierCount(count)));

    state.groups = groups;
    state.teams = teams;
    state.matches = matches;
  } else {
    // Cuadro fijo para la siguiente potencia de 2. Sin ranking, la posición de cada equipo
    // (y por tanto quién pasa directo) sale del sorteo.
    const size = nextPow2(teams.length);
    const order = seedOrder(size);
    const matches = knockoutMatches(size);

    // Ronda previa: los lugares que sobran quedan vacíos y su rival pasa directo.
    for (const m of matches.filter((x) => x.round === 1)) {
      m.a = teams[order[2 * m.slot] - 1]?.id ?? null;
      m.b = teams[order[2 * m.slot + 1] - 1]?.id ?? null;
      if (!m.a || !m.b) {
        m.bye = true;
        m.winner = m.a ?? m.b;
        advance(matches, m);
      }
    }

    delete state.groups;
    state.teams = teams;
    state.matches = matches;
  }

  state.status = 'en_juego';
  state.drawnAt = new Date().toISOString();
  return state;
}

function emptyMatch(id: string, round: number, slot: number): Match {
  return { id, round, slot, a: null, b: null, scoreA: null, scoreB: null, winner: null, bye: false };
}

/** Cuadro de eliminación directa vacío para `size` equipos (potencia de 2). */
function knockoutMatches(size: number): Match[] {
  const matches: Match[] = [];
  for (let round = 1; round <= Math.log2(size); round++) {
    for (let slot = 0; slot < size / 2 ** round; slot++) {
      matches.push(emptyMatch(`r${round}s${slot}`, round, slot));
    }
  }
  return matches;
}

/** Todos contra todos, ordenado por jornadas para que nadie juegue dos veces seguidas si se puede evitar. */
function roundRobin(ids: string[]): [string, string][] {
  const list: (string | null)[] = [...ids];
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const pairs: [string, string][] = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const x = list[i];
      const y = list[n - 1 - i];
      if (x && y) pairs.push([x, y]);
    }
    list.splice(1, 0, list.pop() as string | null);
  }
  return pairs;
}

/**
 * Crea los partidos de desempate que hagan falta cuando terminan los partidos de grupo y queda un empate
 * exacto que decide quién clasifica. Son partidos normales (a 40) que no suman a las tablas.
 */
function syncTiebreaks(state: State): void {
  const key = (kind: string, a: string, b: string) => `${kind}|${[a, b].sort().join('|')}`;
  const existing = new Set(
    state.matches.filter((m) => m.tb && m.a && m.b).map((m) => key(m.tb!, m.a!, m.b!)),
  );
  for (const set of findTies(state)) {
    for (let i = 0; i < set.teams.length; i++) {
      for (let j = i + 1; j < set.teams.length; j++) {
        const a = set.teams[i];
        const b = set.teams[j];
        if (existing.has(key(set.kind, a, b))) continue;
        const slot = state.matches.filter((m) => m.tb).length;
        state.matches.push({ ...emptyMatch(`tb${slot}`, 0, slot), a, b, tb: set.kind });
        existing.add(key(set.kind, a, b));
      }
    }
  }
}

/**
 * Cuando termina la fase de grupos, pone a los clasificados en la primera ronda de la eliminatoria:
 * el mejor contra el peor, y evitando que dos equipos del mismo grupo se enfrenten de entrada.
 */
function syncKnockout(state: State): void {
  const seeds = qualifiedTeams(state);
  if (!seeds) return;
  const size = seeds.length;
  const order = seedOrder(size);
  const group = groupOf(state);
  const pairs: [string, string][] = [];
  for (let slot = 0; slot < size / 2; slot++) {
    pairs.push([seeds[order[2 * slot] - 1], seeds[order[2 * slot + 1] - 1]]);
  }
  const clash = (p: [string, string]) => group.get(p[0]) === group.get(p[1]);
  for (let i = 0; i < pairs.length; i++) {
    if (!clash(pairs[i])) continue;
    for (let j = 0; j < pairs.length; j++) {
      if (j === i) continue;
      const x: [string, string] = [pairs[i][0], pairs[j][1]];
      const y: [string, string] = [pairs[j][0], pairs[i][1]];
      if (!clash(x) && !clash(y)) {
        pairs[i] = x;
        pairs[j] = y;
        break;
      }
    }
  }

  const round1 = state.matches.filter((m) => m.round === 1).sort((x, y) => x.slot - y.slot);
  if (round1.every((m, i) => m.a === pairs[i][0] && m.b === pairs[i][1])) return;
  if (state.matches.some((m) => m.round >= 1 && m.winner)) {
    throw new AppError(
      409,
      'No se puede cambiar este resultado: cambiaría quién clasifica y la eliminatoria ya empezó.',
    );
  }
  round1.forEach((m, i) => {
    [m.a, m.b] = pairs[i];
  });
}

function nextMatchOf(matches: Match[], m: Match): Match | undefined {
  return matches.find((x) => x.round === m.round + 1 && x.slot === Math.floor(m.slot / 2));
}

function advance(matches: Match[], m: Match): void {
  const next = nextMatchOf(matches, m);
  if (!next || !m.winner) return;
  if (m.slot % 2 === 0) next.a = m.winner;
  else next.b = m.winner;
}

export function recordResult(
  state: State,
  matchId: unknown,
  scoreA: unknown,
  scoreB: unknown,
): State {
  if (state.status === 'registro') throw new AppError(409, 'Todavía no se hizo el sorteo.');
  const m = state.matches.find((x) => x.id === matchId);
  if (!m) throw new AppError(404, 'Ese partido no existe.');
  if (m.bye || !m.a || !m.b) {
    throw new AppError(409, 'Este partido todavía no tiene los dos equipos.');
  }
  const valid = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 99;
  if (!valid(scoreA) || !valid(scoreB)) {
    throw new AppError(400, 'Los puntos deben ser números enteros entre 0 y 99.');
  }
  if (scoreA === scoreB) {
    throw new AppError(400, 'No puede haber empate: gana quien llegue a 40 o más con más puntos.');
  }
  if (Math.max(scoreA, scoreB) < WIN_SCORE) {
    throw new AppError(400, `El equipo ganador debe tener al menos ${WIN_SCORE} puntos.`);
  }

  const winner = scoreA > scoreB ? m.a : m.b;
  if (m.group !== undefined || m.tb) {
    m.scoreA = scoreA;
    m.scoreB = scoreB;
    m.winner = winner;
    // Si fue el último partido de grupos, crea los desempates que hagan falta o arma la eliminatoria.
    // Puede rechazar la corrección si la eliminatoria ya empezó.
    syncTiebreaks(state);
    syncKnockout(state);
  } else {
    const next = nextMatchOf(state.matches, m);
    if (m.winner && m.winner !== winner && next?.winner) {
      throw new AppError(409, 'No se puede cambiar el ganador: el siguiente partido ya tiene resultado.');
    }

    m.scoreA = scoreA;
    m.scoreB = scoreB;
    m.winner = winner;
    delete m.games; // un resultado de una sola partida reemplaza cualquier serie anterior
    advance(state.matches, m);
  }

  const total = Math.max(...state.matches.map((x) => x.round));
  const final = state.matches.find((x) => x.round === total);
  state.status = final?.winner ? 'finalizado' : 'en_juego';
  return state;
}

/**
 * Final al mejor de 3 (opcional). Gana la pareja que gane 2 partidas, cada una a 40 o más y sin
 * empate. scoreA y scoreB quedan como partidas ganadas; los puntos de cada una van en `games`.
 */
export function recordSeries(state: State, matchId: unknown, rawGames: unknown): State {
  if (state.status === 'registro') throw new AppError(409, 'Todavía no se hizo el sorteo.');
  const m = state.matches.find((x) => x.id === matchId);
  if (!m) throw new AppError(404, 'Ese partido no existe.');
  if (m.bye || !m.a || !m.b) {
    throw new AppError(409, 'Este partido todavía no tiene los dos equipos.');
  }
  const total = Math.max(...state.matches.map((x) => x.round));
  if (m.round !== total) throw new AppError(400, 'El mejor de 3 solo se puede jugar en la final.');
  if (!Array.isArray(rawGames) || rawGames.length < 2 || rawGames.length > 3) {
    throw new AppError(400, 'Anota 2 o 3 partidas.');
  }

  const valid = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 99;
  const games = rawGames.map((g: unknown, i) => {
    const { a, b } = (g ?? {}) as { a?: unknown; b?: unknown };
    const n = i + 1;
    if (!valid(a) || !valid(b)) {
      throw new AppError(400, `Partida ${n}: los puntos deben ser números enteros entre 0 y 99.`);
    }
    if (a === b) throw new AppError(400, `Partida ${n}: no puede haber empate.`);
    if (Math.max(a, b) < WIN_SCORE) {
      throw new AppError(400, `Partida ${n}: la pareja ganadora debe tener al menos ${WIN_SCORE} puntos.`);
    }
    return { a, b };
  });

  let winsA = 0;
  let winsB = 0;
  games.forEach((g, i) => {
    if (winsA === 2 || winsB === 2) {
      throw new AppError(400, `La serie ya estaba decidida: sobra la partida ${i + 1}.`);
    }
    if (g.a > g.b) winsA++;
    else winsB++;
  });
  if (winsA < 2 && winsB < 2) {
    throw new AppError(400, 'Falta una partida: alguna pareja debe ganar 2.');
  }

  m.games = games;
  m.scoreA = winsA;
  m.scoreB = winsB;
  m.winner = winsA > winsB ? m.a : m.b;
  state.status = 'finalizado';
  return state;
}

export function resetTournament(state: State, keepPlayers: boolean): State {
  const players = keepPlayers ? state.players : [];
  delete state.groups;
  Object.assign(state, emptyState(), { players });
  return state;
}
