'use client';

import { useState, type FormEvent } from 'react';
import { Naipe } from '@/components/Naipe';
import { call, messageOf, useFirstSight, useTournament } from '@/lib/client';
import { teamIndex, teamNames } from '@/lib/labels';

export default function Jugadores() {
  const { data, error, refresh } = useTournament();
  const dealing = useFirstSight(data?.state.drawnAt ?? null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    setDone(null);
    try {
      await call('/api/players', 'POST', { name, acceptedRules: accepted });
      setDone(`${name.trim()} quedó anotado.`);
      setName('');
      setAccepted(false);
      await refresh();
    } catch (err) {
      setProblem(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="page">
        <p role={error ? 'alert' : 'status'} className={error ? 'message is-error' : 'muted'}>
          {error ?? 'Cargando jugadores…'}
        </p>
      </div>
    );
  }

  const { state } = data;
  const count = state.players.length;
  const teamCount = Math.floor(count / 2);

  return (
    <div className="page">
      <h1>Jugadores</h1>

      {state.status === 'registro' && (
        <section className="section" aria-labelledby="anotarse">
          <h2 id="anotarse">Anótate</h2>
          <form className="form-row" onSubmit={submit}>
            <div className="field">
              <label htmlFor="nombre">Tu nombre</label>
              <input
                id="nombre"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="check">
              <input
                id="reglas-ok"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <label htmlFor="reglas-ok">
                Leí las{' '}
                <a href="/reglas" target="_blank" rel="noopener">
                  reglas del torneo
                </a>{' '}
                y las acepto. No cambian durante el torneo.
              </label>
            </div>
            <button
              className="btn"
              type="submit"
              disabled={busy || name.trim().length < 2 || !accepted}
            >
              Anotarme
            </button>
          </form>
          {problem && (
            <p role="alert" className="message is-error">
              {problem}
            </p>
          )}
          {done && (
            <p role="status" className="message">
              {done}
            </p>
          )}
          {count >= 2 && count % 2 === 0 && (
            <p className="muted">
              Con {count} jugadores hay {teamCount} equipos.
            </p>
          )}
        </section>
      )}

      {state.teams.length > 0 ? (
        <section className="section" aria-labelledby="equipos">
          <h2 id="equipos">Equipos sorteados</h2>
          <div className="naipe-grid">
            {state.teams.map((t, i) => (
              <Naipe
                key={t.id}
                index={teamIndex(t.id)}
                names={teamNames(state, t.id)}
                deal={dealing}
                dealIndex={i}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="section" aria-labelledby="lista">
          <h2 id="lista">Anotados ({count})</h2>
          {count === 0 ? (
            <p className="muted">Todavía no hay nadie. Sé la primera persona en anotarse.</p>
          ) : (
            <ul className="people">
              {state.players.map((p) => (
                <li key={p.id} className="person">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
