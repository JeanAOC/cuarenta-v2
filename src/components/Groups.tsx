import { MatchBox } from '@/components/Bracket';
import { dayLabel } from '@/lib/dates';
import { groupMatches, groupName, groupTable, qualifiedTeams, tiebreakMatches } from '@/lib/groups';
import { matchTitle, readyMatches, teamLabel } from '@/lib/labels';
import type { State } from '@/lib/types';

function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

/** Fase de grupos: la tabla o los partidos de cada grupo, según `view`. */
export function Groups({ state, view }: { state: State; view: 'tablas' | 'partidos' }) {
  const groups = state.groups ?? [];
  const qualified = qualifiedTeams(state);
  const ready = new Set(readyMatches(state).map((m) => m.id));

  return (
    <div className="groups">
      {groups.map((_, g) => (
        <section key={g} className="group" aria-label={groupName(g)}>
          <h3>{groupName(g)}</h3>
          {view === 'tablas' && (
          <div className="table-wrap">
            <table className="standings">
              <caption className="sr-only">{groupName(g)}</caption>
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Equipo</th>
                  <th scope="col" className="num" title="Partidos jugados">
                    PJ
                  </th>
                  <th scope="col" className="num" title="Partidos ganados">
                    G
                  </th>
                  <th scope="col" className="num" title="Diferencia de puntos">
                    Dif.
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupTable(state, g).map((r, i) => (
                  <tr key={r.teamId} data-alive={!qualified || qualified.includes(r.teamId)}>
                    <td className="num">{i + 1}</td>
                    <th scope="row" className="team">
                      {teamLabel(state, r.teamId)}
                      {qualified?.includes(r.teamId) && <span className="muted"> · clasifica</span>}
                    </th>
                    <td className="num">{r.played}</td>
                    <td className="num">{r.wins}</td>
                    <td className="num">{signed(r.pointsFor - r.pointsAgainst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {view === 'partidos' && (
            <div className="ready-grid">
              {groupMatches(state, g).map((m, i) => (
                <div key={m.id} className="fixture">
                  <p className="muted">
                    Partido {i + 1}
                    {m.date ? `, ${dayLabel(m.date)}` : ''}
                  </p>
                  <MatchBox state={state} match={m} ready={ready.has(m.id)} vs />
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      {view === 'partidos' && tiebreakMatches(state).length > 0 && (
        <section className="group" aria-label="Desempate">
          <h3>Desempate</h3>
          <div className="ready-grid">
            {tiebreakMatches(state).map((m, i) => (
              <div key={m.id} className="fixture">
                <p className="muted">
                  {matchTitle(state, m)} · Partido {i + 1}
                </p>
                <MatchBox state={state} match={m} ready={ready.has(m.id)} vs />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
