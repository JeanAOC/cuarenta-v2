import { standings } from '@/lib/standings';
import type { State } from '@/lib/types';

function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

export function Standings({ state }: { state: State }) {
  const rows = standings(state);
  return (
    <div>
      <div className="table-wrap">
        <table className="standings">
          <caption className="sr-only">Posiciones del torneo</caption>
          <thead>
            <tr>
              <th scope="col">Pos.</th>
              <th scope="col">Equipo</th>
              <th scope="col" className="num col-extra" title="Partidos jugados">
                PJ
              </th>
              <th scope="col" className="num" title="Partidos ganados">
                G
              </th>
              <th scope="col" className="num" title="Partidos perdidos">
                P
              </th>
              <th scope="col" className="num col-extra" title="Puntos a favor">
                PF
              </th>
              <th scope="col" className="num col-extra" title="Puntos en contra">
                PC
              </th>
              <th scope="col" className="num" title="Diferencia de puntos">
                Dif.
              </th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.teamId} data-champion={r.champion} data-alive={r.alive}>
                <td className="num">{i + 1}</td>
                <th scope="row" className="team">
                  {r.label}
                </th>
                <td className="num col-extra">{r.played}</td>
                <td className="num">{r.wins}</td>
                <td className="num">{r.losses}</td>
                <td className="num col-extra">{r.pointsFor}</td>
                <td className="num col-extra">{r.pointsAgainst}</td>
                <td className="num">{signed(r.pointsFor - r.pointsAgainst)}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
