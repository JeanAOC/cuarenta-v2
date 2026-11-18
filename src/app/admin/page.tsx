'use client';

import { Fragment, useState, type FormEvent } from 'react';
import { AlertDialog } from '@/components/AlertDialog';
import { call, messageOf, useTournament } from '@/lib/client';
import { roundCount, roundTitle, teamLabel } from '@/lib/labels';
import type { Match, State } from '@/lib/types';

export default function Admin() {
  const { data, error, refresh } = useTournament();

  if (!data) {
    return (
      <div className="page">
        <p role={error ? 'alert' : 'status'} className={error ? 'message is-error' : 'muted'}>
          {error ?? 'Cargando…'}
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Organizador</h1>
      {data.admin ? (
        <Panel state={data.state} onChange={refresh} />
      ) : (
        <Login onDone={refresh} />
      )}
    </div>
  );
}

function Login({ onDone }: { onDone: () => Promise<void> }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await call('/api/admin/login', 'POST', { pin });
      setPin('');
      await onDone();
    } catch (err) {
      setProblem(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-row" onSubmit={submit}>
      <div className="field">
        <label htmlFor="pin">PIN de organizador</label>
        <input
          id="pin"
          type="password"
          className="input"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button className="btn" type="submit" disabled={busy || pin.length === 0}>
        Entrar
      </button>
      {problem && (
        <p role="alert" className="message is-error" style={{ flexBasis: '100%' }}>
          {problem}
        </p>
      )}
    </form>
  );
}

function Panel({ state, onChange }: { state: State; onChange: () => Promise<void> }) {
  const [problem, setProblem] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setProblem(null);
    try {
      await action();
      await onChange();
    } catch (err) {
      setProblem(messageOf(err));
    }
  }

  return (
    <>
      {problem && (
        <p role="alert" className="message is-error">
          {problem}
        </p>
      )}

      {state.status === 'registro' ? (
        <Registration state={state} run={run} />
      ) : (
        <Results state={state} />
      )}

      <section className="section" aria-labelledby="reiniciar">
        <h2 id="reiniciar">Reiniciar</h2>
        <div className="form-row">
          {state.status !== 'registro' && (
            <button
              className="btn btn-plain"
              type="button"
              onClick={() => {
                if (window.confirm('Se borran el sorteo y todos los resultados. Los jugadores se conservan. ¿Seguro?')) {
                  void run(() => call('/api/admin/reset', 'POST', { keepPlayers: true }));
                }
              }}
            >
              Repetir el sorteo
            </button>
          )}
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => {
              if (window.confirm('Se borra todo: jugadores, sorteo y resultados. ¿Seguro?')) {
                void run(() => call('/api/admin/reset', 'POST', { keepPlayers: false }));
              }
            }}
          >
            Borrar todo
          </button>
          <button
            className="btn btn-plain"
            type="button"
            onClick={() => void run(() => call('/api/admin/logout', 'POST'))}
          >
            Salir
          </button>
        </div>
      </section>
    </>
  );
}

function Registration({
  state,
  run,
}: {
  state: State;
  run: (action: () => Promise<void>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [oddWarning, setOddWarning] = useState(false);
  const count = state.players.length;
  const canDraw = count >= 4;

  return (
    <>
      <section className="section" aria-labelledby="jugadores-admin">
        <h2 id="jugadores-admin">Jugadores ({count})</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await call('/api/players', 'POST', { name });
              setName('');
            });
          }}
        >
          <div className="field">
            <label htmlFor="nuevo">Agregar jugador</label>
            <input
              id="nuevo"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={name.trim().length < 2}>
            Agregar
          </button>
        </form>
        {count > 0 && (
          <ul className="people">
            {state.players.map((p) => (
              <li key={p.id} className="person">
                {p.name}
                <button
                  className="btn btn-plain"
                  type="button"
                  aria-label={`Quitar a ${p.name}`}
                  onClick={() => void run(() => call('/api/admin/players', 'DELETE', { id: p.id }))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="sorteo">
        <h2 id="sorteo">Sorteo</h2>
        <p className="muted">
          {canDraw
            ? `${count % 2 === 0 ? `Se arman ${count / 2} equipos al azar. ` : ''}Después del sorteo no se pueden agregar ni quitar jugadores.`
            : 'Se necesitan al menos 4 jugadores para sortear.'}
        </p>
        <div>
          <button
            className="btn"
            type="button"
            disabled={!canDraw}
            onClick={() => {
              if (count % 2 === 1) {
                setOddWarning(true);
                return;
              }
              if (window.confirm('¿Hacer el sorteo ahora? Se cierra la lista de jugadores.')) {
                void run(() => call('/api/admin/draw', 'POST'));
              }
            }}
          >
            Hacer el sorteo
          </button>
        </div>
        <AlertDialog open={oddWarning} title="No se puede iniciar" onClose={() => setOddWarning(false)}>
          Un jugador no puede quedar fuera. Hay {count} jugadores: agrega uno o quita uno para que
          todos tengan pareja.
        </AlertDialog>
      </section>
    </>
  );
}

function Results({ state }: { state: State }) {
  const total = roundCount(state);
  const rounds = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <section className="section" aria-labelledby="resultados">
      <h2 id="resultados">Resultados</h2>
      <p className="muted">
        Anota el marcador final. Gana quien llegue a 40 o más; no hay empates. Puedes corregir un resultado
        mientras el siguiente partido no se haya jugado.
      </p>
      {rounds.map((r) => (
        <div key={r} className="result-list">
          <h3>{roundTitle(state, r)}</h3>
          {state.matches
            .filter((m) => m.round === r && !m.bye)
            .sort((x, y) => x.slot - y.slot)
            .map((m) => (
              <ResultForm
                key={`${m.id}:${m.scoreA}:${m.scoreB}:${m.a}:${m.b}:${JSON.stringify(m.games ?? null)}`}
                state={state}
                match={m}
                isFinal={r === total}
              />
            ))}
        </div>
      ))}
    </section>
  );
}

type Game = { a: string; b: string };

function ResultForm({ state, match, isFinal }: { state: State; match: Match; isFinal: boolean }) {
  const [a, setA] = useState(match.games ? '' : (match.scoreA?.toString() ?? ''));
  const [b, setB] = useState(match.games ? '' : (match.scoreB?.toString() ?? ''));
  const [series, setSeries] = useState(Boolean(match.games));
  const [games, setGames] = useState<Game[]>(() =>
    [0, 1, 2].map((i) => ({
      a: match.games?.[i]?.a.toString() ?? '',
      b: match.games?.[i]?.b.toString() ?? '',
    })),
  );
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const waiting = !match.a || !match.b;
  const teamA = teamLabel(state, match.a);
  const teamB = teamLabel(state, match.b);

  const filled = games.filter((g) => g.a !== '' && g.b !== '');
  const halfFilled = games.some((g) => (g.a === '') !== (g.b === ''));
  const canSave = series ? filled.length >= 2 && !halfFilled : a !== '' && b !== '';

  function setGame(i: number, side: 'a' | 'b', value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 2);
    setGames((prev) => prev.map((g, idx) => (idx === i ? { ...g, [side]: clean } : g)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    setSaved(false);
    try {
      await call(
        '/api/admin/result',
        'POST',
        series
          ? { matchId: match.id, games: filled.map((g) => ({ a: Number(g.a), b: Number(g.b) })) }
          : { matchId: match.id, scoreA: Number(a), scoreB: Number(b) },
      );
      setSaved(true);
    } catch (err) {
      setProblem(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="result" onSubmit={submit} aria-label={`${teamA} contra ${teamB}`}>
      {isFinal && (
        <div className="check">
          <input
            id={`${match.id}-serie`}
            type="checkbox"
            checked={series}
            disabled={waiting}
            onChange={(e) => setSeries(e.target.checked)}
          />
          <label htmlFor={`${match.id}-serie`}>La final se jugó al mejor de 3</label>
        </div>
      )}

      {series ? (
        <>
          <div className="series" role="group" aria-label="Partidas de la final">
            <span />
            <span className="series-team">{teamA}</span>
            <span className="series-team">{teamB}</span>
            {games.map((g, i) => (
              <Fragment key={i}>
                <span className="series-label">Partida {i + 1}</span>
                {(['a', 'b'] as const).map((side) => (
                  <input
                    key={side}
                    className="input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={g[side]}
                    onChange={(e) => setGame(i, side, e.target.value)}
                    disabled={waiting}
                    aria-label={`Partida ${i + 1}, puntos de ${side === 'a' ? teamA : teamB}`}
                  />
                ))}
              </Fragment>
            ))}
          </div>
          <p className="muted">Gana quien gane 2 partidas. La partida 3 se anota solo si quedan 1 a 1.</p>
        </>
      ) : (
        ([['a', a, setA], ['b', b, setB]] as const).map(([side, value, set]) => {
          const id = `${match.id}-${side}`;
          const teamId = side === 'a' ? match.a : match.b;
          return (
            <div key={side} className="result-team">
              <label htmlFor={id}>{teamLabel(state, teamId)}</label>
              <input
                id={id}
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={(e) => set(e.target.value.replace(/\D/g, '').slice(0, 2))}
                disabled={waiting}
                aria-label={`Puntos de ${teamLabel(state, teamId)}`}
              />
            </div>
          );
        })
      )}

      <div>
        <button className="btn" type="submit" disabled={waiting || busy || !canSave}>
          {match.winner ? 'Corregir resultado' : 'Guardar resultado'}
        </button>
      </div>
      {problem && (
        <p role="alert" className="message is-error">
          {problem}
        </p>
      )}
      {saved && (
        <p role="status" className="message">
          Resultado guardado.
        </p>
      )}
    </form>
  );
}
