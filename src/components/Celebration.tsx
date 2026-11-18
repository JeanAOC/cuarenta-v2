'use client';

import { useEffect, useRef, useState } from 'react';
import { champion, teamIndex, teamLabel, teamNames } from '@/lib/labels';
import type { State } from '@/lib/types';
import { Confetti } from './Confetti';
import { Naipe } from './Naipe';

/**
 * Ventana con confeti mientras el torneo tenga campeón. Sale cada vez que se abre la página
 * y también en el momento en que se carga la final con la página abierta. Cerrarla solo la
 * oculta hasta la próxima vez; desaparece del todo cuando se reinicia el torneo.
 */
export function Celebration({ state }: { state: State }) {
  const champId = state.status === 'finalizado' ? champion(state) : null;
  const key = champId ? `${state.drawnAt}:${champId}` : null;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [withConfetti, setWithConfetti] = useState(false);

  useEffect(() => {
    if (!key) return;
    setWithConfetti(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setOpen(true);
  }, [key]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open, key]);

  if (!champId) return null;

  return (
    <dialog
      ref={dialog}
      className="celebration"
      aria-labelledby="celebration-title"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {open && withConfetti && <Confetti />}
      <div className="celebration-body">
        <h2 id="celebration-title">¡Campeones!</h2>
        <Naipe index={teamIndex(champId)} names={teamNames(state, champId)} champion />
        <p className="lead">{teamLabel(state, champId)} ganaron el torneo.</p>
        <button type="button" className="btn" autoFocus onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
