import type { NextRequest } from 'next/server';
import { handle, readJson } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { addPlayer } from '@/lib/bracket';
import { AppError } from '@/lib/errors';
import { mutate } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return handle(async () => {
    const body = await readJson(req);
    const accepted = body.acceptedRules === true;
    // El organizador puede agregar jugadores sin este paso; el resto debe aceptar las reglas.
    if (!accepted && !isAdmin(req)) {
      throw new AppError(400, 'Para anotarte debes leer y aceptar las reglas.');
    }
    const when = accepted ? new Date().toISOString() : undefined;
    await mutate((s) => addPlayer(s, body.name, when));
    return { ok: true };
  });
}
