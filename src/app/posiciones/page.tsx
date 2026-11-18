'use client';

import { Celebration } from '@/components/Celebration';
import { Standings } from '@/components/Standings';
import { useTournament } from '@/lib/client';

export default function Posiciones() {
  const { data, error } = useTournament();
  return (
    <div className="page">
      <h1>Posiciones</h1>
      {!data ? (
        <p role={error ? 'alert' : 'status'} className={error ? 'message is-error' : 'muted'}>
          {error ?? 'Cargando posiciones…'}
        </p>
      ) : data.state.status === 'registro' ? (
        <p className="lead">Las posiciones aparecen cuando se haga el sorteo.</p>
      ) : (
        <>
          <Celebration state={data.state} />
          <Standings state={data.state} />
        </>
      )}
    </div>
  );
}
