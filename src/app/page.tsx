'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bracket, MatchBox } from '@/components/Bracket';
import { Celebration } from '@/components/Celebration';
import { Naipe } from '@/components/Naipe';
import { useFirstSight, useTournament } from '@/lib/client';
import { Groups } from '@/components/Groups';
import { groupStageDone } from '@/lib/groups';
import { champion, matchTitle, readyMatches, teamIndex, teamNames } from '@/lib/labels';
import type { Match, State } from '@/lib/types';

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

  return <Tournament state={state} dealing={dealing} />;
}

/** Partidos por jugar: cartas enfrentadas, o una cuadrícula compacta si son muchos. */
function ReadyList({
  state,
  ready,
  dealing,
  title,
  headingLevel = 'h2',
}: {
  state: State;
  ready: Match[];
  dealing: boolean;
  title: string;
  headingLevel?: 'h1' | 'h2';
}) {
  const Heading = headingLevel;
  return (
    <section aria-label={title}>
      <Heading>{title}</Heading>
      {ready.length === 0 ? (
        <p className="muted">No hay partidos por jugar en este momento.</p>
      ) : ready.length <= 4 || ready.every((m) => m.round === 0) ? (
        <ul className="faceoffs" style={{ marginTop: '1.5rem' }}>
          {ready.map((m, i) => (
            <li key={m.id} className="faceoff">
              <p className="muted">{matchTitle(state, m)}</p>
              <div className="faceoff-cards">
                <Naipe
                  index={teamIndex(m.a!)}
                  names={teamNames(state, m.a)}
                  deal={dealing}
                  dealIndex={Math.min(i, 3) * 2}
                />
                <span className="faceoff-vs">contra</span>
                <Naipe
                  index={teamIndex(m.b!)}
                  names={teamNames(state, m.b)}
                  deal={dealing}
                  dealIndex={Math.min(i, 3) * 2 + 1}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        // Con muchos partidos a la vez, una cuadrícula compacta por ronda.
        <div className="ready-groups">
          {[...new Set(ready.map((m) => matchTitle(state, m)))].map((t) => {
            const group = ready.filter((m) => matchTitle(state, m) === t);
            return (
              <div key={t}>
                <h3>
                  {t}: {group.length} {group.length === 1 ? 'partido' : 'partidos'}
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
  );
}

function Tournament({ state, dealing }: { state: State; dealing: boolean }) {
  // Con grupos, quien entra ve primero la fase que se está jugando.
  const [tab, setTab] = useState<'grupos' | 'tablas' | 'eliminatoria'>(
    state.groups && !groupStageDone(state) ? 'grupos' : 'eliminatoria',
  );
  const champId = champion(state);
  const ready = readyMatches(state);

  return (
    <div className="page">
      <Celebration state={state} />
      {champId && (
        <section className="section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h1>Campeones</h1>
          <Naipe index={teamIndex(champId)} names={teamNames(state, champId)} champion deal={dealing} />
        </section>
      )}

      {state.groups ? (
        <>
          <div className="bracket-tabs" role="group" aria-label="Elegir fase" style={{ marginTop: champId ? '1.5rem' : 0 }}>
            <button type="button" className="tab" aria-pressed={tab === 'grupos'} onClick={() => setTab('grupos')}>
              Partidos de grupos
            </button>
            <button type="button" className="tab" aria-pressed={tab === 'tablas'} onClick={() => setTab('tablas')}>
              Tablas de grupos
            </button>
            <button
              type="button"
              className="tab"
              aria-pressed={tab === 'eliminatoria'}
              onClick={() => setTab('eliminatoria')}
            >
              Eliminatoria
            </button>
          </div>

          {tab === 'grupos' ? (
            <>
              {!champId && (
                <ReadyList
                  state={state}
                  ready={ready.filter((m) => m.round === 0)}
                  dealing={dealing}
                  title="Por jugar"
                  headingLevel="h1"
                />
              )}
              <section className="section" aria-labelledby="grupos">
                <h2 id="grupos">Partidos de la fase de grupos</h2>
                <p className="muted">Todos contra todos dentro de cada grupo.</p>
                {state.matches.some((m) => m.tb) && (
                  <p className="muted">
                    Hubo un empate exacto, así que se juega un partido de desempate. Solo decide quién
                    pasa: no suma puntos a las tablas.
                  </p>
                )}
                <Groups state={state} view="partidos" />
              </section>
            </>
          ) : tab === 'tablas' ? (
            <section aria-labelledby="tablas">
              <h1 id="tablas">Tablas de grupos</h1>
              <p className="muted">
                Pasan los primeros de cada grupo y, si hace falta, los mejores segundos. Se ordena por
                partidos ganados y luego por diferencia de puntos.
              </p>
              <Groups state={state} view="tablas" />
            </section>
          ) : (
            <>
              {!champId && (
                <ReadyList
                  state={state}
                  ready={ready.filter((m) => m.round >= 1)}
                  dealing={dealing}
                  title="Por jugar"
                  headingLevel="h1"
                />
              )}
              <section className="section" aria-labelledby="cuadro">
                <h2 id="cuadro">Eliminatoria</h2>
                {!groupStageDone(state) && (
                  <p className="muted">
                    Los equipos aparecen aquí cuando terminen todos los partidos de la fase de grupos.
                  </p>
                )}
                <Bracket state={state} />
              </section>
            </>
          )}
        </>
      ) : (
        <>
          {!champId && (
            <ReadyList state={state} ready={ready} dealing={dealing} title="Por jugar" headingLevel="h1" />
          )}
          <section className="section" aria-labelledby="cuadro">
            <h2 id="cuadro">Cuadro</h2>
            <Bracket state={state} />
          </section>
        </>
      )}
    </div>
  );
}

