'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Ventana de aviso. Se cierra con el botón, con Esc o tocando fuera. */
export function AlertDialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="celebration alert"
      aria-labelledby="alert-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="celebration-body">
        <h2 id="alert-title">{title}</h2>
        <p className="lead">{children}</p>
        <button type="button" className="btn" autoFocus onClick={onClose}>
          Entendido
        </button>
      </div>
    </dialog>
  );
}
