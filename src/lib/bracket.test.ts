import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from './errors';
import {
  addPlayer,
  drawTournament,
  emptyState,
  nextPow2,
  recordResult,
  recordSeries,
  removePlayer,
  resetTournament,
} from './bracket';
import { readyMatches, roundCount, roundTitle } from './labels';
import { standings } from './standings';
import type { State } from './types';

function withPlayers(n: number): State {
  const s = emptyState();
  for (let i = 1; i <= n; i++) addPlayer(s, `Jugador ${i}`);
  return s;
}

function playAll(s: State): void {
  let guard = 0;
  while (s.status !== 'finalizado') {
    const m = readyMatches(s)[0];
    assert.ok(m, 'siempre debe haber un partido listo mientras no termine');
    recordResult(s, m.id, 40, 20);
    assert.ok(++guard < 200);
  }
}

test('el sorteo arma equipos y cuadro válidos con cantidad par de jugadores, de 4 a 64', () => {
  for (let n = 4; n <= 64; n += 2) {
    const s = drawTournament(withPlayers(n));
    const teamCount = Math.floor(n / 2);
    const size = nextPow2(teamCount);

    assert.equal(s.teams.length, teamCount, `equipos con ${n} jugadores`);
    assert.ok(s.teams.every((t) => t.playerIds.length === 2), 'todos los equipos son de 2');
    const seen = s.teams.flatMap((t) => t.playerIds);
    assert.equal(new Set(seen).size, n, 'cada jugador está en un solo equipo');

    assert.equal(s.matches.length, size - 1);
    const byes = s.matches.filter((m) => m.bye);
    assert.equal(byes.length, size - teamCount, `pases directos con ${n} jugadores`);
    assert.ok(byes.every((m) => m.round === 1 && m.winner && !(m.a && m.b)), 'pases solo en la ronda previa');

    const round1 = s.matches.filter((m) => m.round === 1).flatMap((m) => [m.a, m.b]).filter(Boolean);
    assert.equal(new Set(round1).size, teamCount, 'cada equipo aparece una vez en la ronda 1');
  }
});

test('con 10 equipos juegan 4 en la ronda previa y 6 pasan directo', () => {
  const s = drawTournament(withPlayers(20));
  assert.equal(roundCount(s), 4);
  const round1 = s.matches.filter((m) => m.round === 1);
  assert.equal(round1.filter((m) => !m.bye).length, 2, 'dos partidos reales');
  assert.equal(round1.filter((m) => m.bye).length, 6, 'seis pases directos');

  // Los 6 que pasan directo ya están en la ronda 2 antes de jugar la previa.
  const round2 = s.matches.filter((m) => m.round === 2).flatMap((m) => [m.a, m.b]).filter(Boolean);
  assert.equal(round2.length, 6);
  assert.equal(roundTitle(s, 1), 'Ronda previa');
  assert.equal(roundTitle(s, 2), 'Cuartos de final');
  assert.equal(roundTitle(s, 3), 'Semifinal');
  assert.equal(roundTitle(s, 4), 'Final');

  for (const m of readyMatches(s).filter((x) => x.round === 1)) recordResult(s, m.id, 40, 10);
  const full = s.matches.filter((m) => m.round === 2).flatMap((m) => [m.a, m.b]).filter(Boolean);
  assert.equal(full.length, 8, 'al terminar la previa quedan 8 equipos');
});

test('sin pases directos no hay ronda previa', () => {
  const s = drawTournament(withPlayers(32)); // 16 equipos
  assert.equal(s.matches.filter((m) => m.bye).length, 0);
  assert.equal(roundTitle(s, 1), 'Octavos de final');
});

test('un torneo completo termina con campeón para cualquier tamaño', () => {
  for (let n = 4; n <= 64; n += 2) {
    const s = drawTournament(withPlayers(n));
    playAll(s);
    assert.equal(s.status, 'finalizado');
    const real = s.matches.filter((m) => !m.bye);
    assert.equal(real.length, s.teams.length - 1, 'partidos reales = equipos - 1');
    const final = s.matches.find((m) => m.round === roundCount(s));
    assert.ok(final?.winner, `campeón con ${n} jugadores`);
  }
});

test('posiciones: antes de jugar todos siguen en juego y sin partidos', () => {
  const rows = standings(drawTournament(withPlayers(20)));
  assert.equal(rows.length, 10);
  assert.ok(rows.every((r) => r.status === 'En juego' && r.played === 0 && r.alive));
});

test('posiciones: campeón, subcampeón y eliminados por ronda', () => {
  const s = drawTournament(withPlayers(8)); // 4 equipos: semifinales y final
  playAll(s); // el equipo A gana 40-20 en cada partido
  const rows = standings(s);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].status, 'Campeón');
  assert.ok(rows[0].champion);
  assert.equal(rows[1].status, 'Subcampeón');
  assert.ok(rows.slice(2).every((r) => r.status === 'Eliminado en semifinal'));
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0);
  assert.equal(sum((r) => r.wins), 3);
  assert.equal(sum((r) => r.losses), 3);
  assert.equal(sum((r) => r.pointsFor), sum((r) => r.pointsAgainst));
  assert.equal(rows[0].pointsFor - rows[0].pointsAgainst, rows[0].wins * 20 - rows[0].losses * 20);
});

test('posiciones: quien llegó más lejos va primero y el pase directo no cuenta como partido', () => {
  const s = drawTournament(withPlayers(20)); // 10 equipos, 6 pasan directo
  playAll(s);
  const rows = standings(s);
  const order = rows.map((r) => r.outRound);
  assert.ok(order.slice(2).every((v, i, a) => i === 0 || a[i - 1] >= v), 'eliminados de mayor a menor ronda');
  const total = rows.reduce((a, r) => a + r.played, 0);
  assert.equal(total, 9 * 2, 'cada partido real suma 2 partidos jugados');
});

test('no permite sortear con menos de 4 jugadores ni dos veces', () => {
  assert.throws(() => drawTournament(withPlayers(3)), AppError);
  const s = drawTournament(withPlayers(4));
  assert.throws(() => drawTournament(s), AppError);
});

test('valida el marcador', () => {
  const s = drawTournament(withPlayers(8));
  const m = readyMatches(s)[0];
  assert.throws(() => recordResult(s, m.id, 40, 40), /empate/);
  assert.throws(() => recordResult(s, m.id, 39, 20), /al menos 40/);
  assert.throws(() => recordResult(s, m.id, -1, 40), /enteros/);
  assert.throws(() => recordResult(s, m.id, 40.5, 20), /enteros/);
  assert.throws(() => recordResult(s, 'nope', 40, 20), /no existe/);
  recordResult(s, m.id, 44, 38); // el cartón puede pasar de 40
  assert.equal(s.matches.find((x) => x.id === m.id)?.winner, m.a);
});

test('no se puede cargar resultado a un pase directo ni a un partido sin rival', () => {
  const s = drawTournament(withPlayers(10)); // 5 equipos: 3 pases directos
  const bye = s.matches.find((m) => m.bye)!;
  assert.throws(() => recordResult(s, bye.id, 40, 0), /los dos equipos/);
  const later = s.matches.find((m) => m.round === 2 && !(m.a && m.b))!;
  assert.throws(() => recordResult(s, later.id, 40, 0), /los dos equipos/);
});

test('se puede corregir un resultado hasta que se juegue el siguiente partido', () => {
  const s = drawTournament(withPlayers(8)); // 4 equipos, sin pases directos
  const [first, second] = readyMatches(s);
  recordResult(s, first.id, 40, 10);
  recordResult(s, first.id, 10, 40); // corrección: cambia el ganador
  assert.equal(s.matches.find((x) => x.id === first.id)?.winner, first.b);
  recordResult(s, second.id, 40, 10);
  const final = s.matches.find((x) => x.round === 2)!;
  assert.equal(final.a, first.b);
  recordResult(s, final.id, 40, 30);
  assert.throws(() => recordResult(s, first.id, 40, 10), /siguiente partido/);
  recordResult(s, first.id, 10, 41); // mismo ganador (B): sí se puede corregir el marcador
});

test('se puede cambiar el ganador de la final', () => {
  const s = drawTournament(withPlayers(4));
  const final = s.matches[0];
  recordResult(s, final.id, 40, 10);
  assert.equal(s.status, 'finalizado');
  recordResult(s, final.id, 10, 40);
  assert.equal(s.matches[0].winner, final.b);
  assert.equal(s.status, 'finalizado');
});

function readyFinal(): State {
  const s = drawTournament(withPlayers(8)); // 4 equipos: semifinales y final
  for (const m of readyMatches(s)) recordResult(s, m.id, 40, 20);
  return s;
}

test('final al mejor de 3: gana quien gane 2 partidas', () => {
  const s = readyFinal();
  const final = s.matches.find((m) => m.round === 2)!;
  const g = (a: number, b: number) => ({ a, b });

  recordSeries(s, final.id, [g(40, 32), g(28, 40), g(40, 36)]);
  assert.equal(s.status, 'finalizado');
  assert.equal(final.scoreA, 2);
  assert.equal(final.scoreB, 1);
  assert.equal(final.winner, final.a);
  assert.equal(final.games?.length, 3);

  recordSeries(s, final.id, [g(30, 40), g(32, 44)]); // corrección: 2-0 para B
  assert.equal(final.winner, final.b);
  assert.equal(final.games?.length, 2);

  recordResult(s, final.id, 40, 12); // vuelve a una sola partida: se borra la serie
  assert.equal(final.games, undefined);
  assert.equal(final.winner, final.a);
});

test('final al mejor de 3: validaciones', () => {
  const s = readyFinal();
  const final = s.matches.find((m) => m.round === 2)!;
  const g = (a: number, b: number) => ({ a, b });
  assert.throws(() => recordSeries(s, final.id, [g(40, 10)]), /2 o 3/);
  assert.throws(() => recordSeries(s, final.id, [g(40, 10), g(40, 12), g(40, 8), g(40, 8)]), /2 o 3/);
  assert.throws(() => recordSeries(s, final.id, [g(40, 10), g(10, 40)]), /Falta una partida/);
  assert.throws(() => recordSeries(s, final.id, [g(40, 10), g(40, 12), g(40, 8)]), /sobra la partida 3/);
  assert.throws(() => recordSeries(s, final.id, [g(40, 40), g(40, 12)]), /Partida 1: no puede haber empate/);
  assert.throws(() => recordSeries(s, final.id, [g(39, 10), g(40, 12)]), /Partida 1: .*al menos 40/);
  assert.throws(() => recordSeries(s, final.id, [g(40, 10), { a: 'x', b: 1 }]), /Partida 2: .*enteros/);
  assert.throws(() => recordSeries(s, final.id, 'nada'), /2 o 3/);
  const semi = s.matches.find((m) => m.round === 1)!;
  assert.throws(() => recordSeries(s, semi.id, [g(40, 10), g(40, 12)]), /solo se puede jugar en la final/);
  assert.equal(final.winner, null, 'ningún intento inválido dejó rastro');
});

test('posiciones: en una final al mejor de 3 los puntos suman todas las partidas', () => {
  const s = readyFinal();
  const final = s.matches.find((m) => m.round === 2)!;
  recordSeries(s, final.id, [
    { a: 40, b: 32 },
    { a: 28, b: 40 },
    { a: 40, b: 36 },
  ]);
  const rows = standings(s);
  const champ = rows[0];
  assert.equal(champ.status, 'Campeón');
  assert.equal(champ.wins, 2, 'semifinal + final, la serie cuenta como un partido');
  // semifinal 40-20 más la serie 40+28+40 contra 32+40+36
  assert.equal(champ.pointsFor, 40 + 108);
  assert.equal(champ.pointsAgainst, 20 + 108);
});

test('no permite registrar jugadores repetidos ni cambios tras el sorteo', () => {
  const s = withPlayers(4);
  assert.throws(() => addPlayer(s, ' jugador 1 '), /ya está/);
  assert.throws(() => addPlayer(s, 'x'), /2 a 30/);
  assert.throws(() => addPlayer(s, 42), /2 a 30/);
  assert.throws(() => addPlayer(s, 'Sof�a'), /no se pudieron leer/);
  addPlayer(s, 'Sofía León'); // las tildes sí se aceptan
  s.players.pop();
  removePlayer(s, s.players[0].id);
  assert.equal(s.players.length, 3);
  addPlayer(s, 'Nuevo');
  drawTournament(s);
  assert.throws(() => addPlayer(s, 'Tarde'), AppError);
  assert.throws(() => removePlayer(s, s.players[0].id), AppError);
});

test('guarda cuándo aceptó las reglas quien se anota solo', () => {
  const s = emptyState();
  addPlayer(s, 'Con reglas', '2026-11-18T00:00:00.000Z');
  addPlayer(s, 'Agregado por el organizador');
  assert.equal(s.players[0].rulesAcceptedAt, '2026-11-18T00:00:00.000Z');
  assert.equal(s.players[1].rulesAcceptedAt, undefined);
});

test('con cantidad impar de jugadores no se puede iniciar y no queda nada a medias', () => {
  for (const n of [5, 7, 9, 21, 63]) {
    const s = withPlayers(n);
    assert.throws(() => drawTournament(s), /un jugador no puede quedar fuera/);
    assert.equal(s.status, 'registro');
    assert.equal(s.teams.length, 0);
    assert.equal(s.matches.length, 0);
    assert.equal(s.drawnAt, null);
  }
  const s = withPlayers(7);
  addPlayer(s, 'Octavo'); // ahora son 8: par
  drawTournament(s);
  assert.equal(s.teams.length, 4);
});

test('reiniciar conserva o borra jugadores', () => {
  const s = drawTournament(withPlayers(6));
  resetTournament(s, true);
  assert.equal(s.status, 'registro');
  assert.equal(s.players.length, 6);
  assert.equal(s.matches.length, 0);
  resetTournament(s, false);
  assert.equal(s.players.length, 0);
});
