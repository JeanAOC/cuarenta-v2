'use client';

import Link from 'next/link';
import { Bracket, MatchBox } from '@/components/Bracket';
import { Celebration } from '@/components/Celebration';
import { Naipe } from '@/components/Naipe';import { useFirstSight, useTournament } from '@/lib/client';
import { champion, readyMatches, roundTitle, teamIndex, teamNames } from '@/lib/labels';

export default function Home() {
  const { data, error } = useTournament();
  const dealing = useFirstSight(data?.state.drawnAt ?? null);

  if (!data) {
    return (
      <div className="page">
        <p role={error ? 'alert' : 'status'} className={error ? 'message is-error' : 'muted'}>
          {error ?? 'Cargando el torneo…'}
        </p>
      </div>
    );
  }

  const { state } = data;

  if (state.status === 'registro') {
    return (
      <div className="page">
        <h1>Todavía no hay sorteo</h1>
        <p className="lead">
          {state.players.length === 0
            ? 'Aún no hay nadie anotado.'
            : `Hay ${state.players.length} ${state.players.length === 1 ? 'jugador anotado' : 'jugadores anotados'}.`}{' '}
          Cuando el organizador haga el sorteo, aquí aparecen los equipos y el cuadro.
        </p>
        <div>
          <Link className="btn" href="/jugadores">
            Anotarme
          </Link>
        </div>
      </div>
    );
  }

  const champId = champion(state);
  const ready = readyMatches(state);

  return (
    <div className="page">
      <Celebration state={state} />
      {champId ? (
        <section className="section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h1>Campeones</h1>
          <Naipe index={teamIndex(champId)} names={teamNames(state, champId)} champion deal={dealing} />
        </section>
      ) : (
        <section aria-labelledby="por-jugar">
          <h1 id="por-jugar">Por jugar</h1>
          {ready.length <= 4 ? (
            <ul className="faceoffs" style={{ marginTop: '1.5rem' }}>
              {ready.map((m, i) => (
                <li key={m.id} className="faceoff">
                  <p className="muted">{roundTitle(state, m.round)}</p>
                  <div className="faceoff-cards">
                    <Naipe
                      index={teamIndex(m.a!)}
                      names={teamNames(state, m.a)}
                      deal={dealing}
                      dealIndex={i * 2}
                    />
                    <span className="faceoff-vs">contra</span>
                    <Naipe
                      index={teamIndex(m.b!)}
                      names={teamNames(state, m.b)}
                      deal={dealing}
                      dealIndex={i * 2 + 1}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // Con muchos partidos a la vez, una cuadrícula compacta por ronda.
            <div className="ready-groups">
              {[...new Set(ready.map((m) => m.round))].map((round) => {
                const group = ready.filter((m) => m.round === round);
                return (
                  <div key={round}>
                    <h3>
                      {roundTitle(state, round)}: {group.length} partidos
                    </h3>
                    <div className="ready-grid">
                      {group.map((m) => (
                        <MatchBox key={m.id} state={state} match={m} ready={false} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="section" aria-labelledby="cuadro">
        <h2 id="cuadro">Cuadro</h2>
        <Bracket state={state} />
      </section>
    </div>
  );
}
