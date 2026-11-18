'use client';

import { useCallback, useEffect, useState } from 'react';
import type { State } from './types';

export type Payload = { state: State; admin: boolean };

export async function call(path: string, method: 'POST' | 'DELETE', body?: unknown): Promise<void> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo completar la acción. Intenta de nuevo.');
  }
}

export function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.';
}

/** Carga el torneo y lo refresca cada 4 segundos mientras la pestaña está visible. */
export function useTournament() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      const json = (await res.json()) as Payload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el torneo.');
      setData(json);
      setError(null);
    } catch (e) {
      setError(messageOf(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const id = setInterval(tick, 4000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  return { data, error, refresh };
}

/** true solo la primera vez que este navegador ve un sorteo nuevo. */
export function useFirstSight(key: string | null): boolean {
  const [first, setFirst] = useState(false);
  useEffect(() => {
    if (!key) return;
    try {
      if (localStorage.getItem('cuarenta:dealt') !== key) {
        localStorage.setItem('cuarenta:dealt', key);
        setFirst(true);
      }
    } catch {
      /* sin almacenamiento: no hay animación, y no pasa nada */
    }
  }, [key]);
  return first;
}
