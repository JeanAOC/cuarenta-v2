import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { emptyState } from './bracket';
import { AppError } from './errors';
import type { State } from './types';

export type Snapshot = { state: State; version: number };

interface Backend {
  load(): Promise<Snapshot>;
  /** Guarda solo si nadie guardó antes. Devuelve false si hubo conflicto. */
  save(state: State, expectedVersion: number): Promise<boolean>;
}

/** Desarrollo local sin Supabase: un archivo JSON. */
function fileBackend(): Backend {
  const file = path.join(process.cwd(), '.data', 'state.json');
  const read = async (): Promise<Snapshot> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Snapshot;
    } catch {
      return { state: emptyState(), version: 0 };
    }
  };
  return {
    load: read,
    async save(state, expectedVersion) {
      const current = await read();
      if (current.version !== expectedVersion) return false;
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify({ state, version: expectedVersion + 1 }));
      await fs.rename(tmp, file);
      return true;
    },
  };
}

function supabaseBackend(url: string, key: string): Backend {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const fail = (what: string, message: string): never => {
    console.error(`[supabase] ${what}: ${message}`);
    throw new AppError(500, 'No se pudo hablar con la base de datos. Revisa la configuración de Supabase.');
  };
  return {
    async load() {
      const { data, error } = await sb
        .from('tournament_state')
        .select('state,version')
        .eq('id', 1)
        .maybeSingle();
      if (error) fail('load', error.message);
      if (!data) {
        const init = await sb
          .from('tournament_state')
          .upsert({ id: 1, state: emptyState(), version: 0 }, { onConflict: 'id', ignoreDuplicates: true });
        if (init.error) fail('init', init.error.message);
        return { state: emptyState(), version: 0 };
      }
      return { state: data.state as State, version: data.version as number };
    },
    async save(state, expectedVersion) {
      const { data, error } = await sb
        .from('tournament_state')
        .update({ state, version: expectedVersion + 1, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .eq('version', expectedVersion)
        .select('version');
      if (error) fail('save', error.message);
      return Boolean(data && data.length > 0);
    },
  };
}

let backend: Backend | undefined;

function getBackend(): Backend {
  if (backend) return backend;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    backend = supabaseBackend(url, key);
  } else if (process.env.VERCEL) {
    throw new AppError(500, 'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.');
  } else {
    backend = fileBackend();
  }
  return backend;
}

export function loadState(): Promise<Snapshot> {
  return getBackend().load();
}

/** Lee, aplica el cambio y guarda; reintenta si alguien guardó en medio. */
export async function mutate(change: (draft: State) => unknown): Promise<State> {
  const b = getBackend();
  for (let attempt = 0; attempt < 6; attempt++) {
    const snap = await b.load();
    const draft = structuredClone(snap.state);
    change(draft);
    if (await b.save(draft, snap.version)) return draft;
  }
  throw new AppError(409, 'Otra persona guardó al mismo tiempo. Intenta de nuevo.');
}
