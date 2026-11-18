import type { NextRequest } from 'next/server';
import { handle, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { recordResult, recordSeries } from '@/lib/bracket';
import { mutate } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return handle(async () => {
    requireAdmin(req);
    const body = await readJson(req);
    // Con "games" es una final al mejor de 3; sin "games", una sola partida.
    if (body.games !== undefined) {
      await mutate((s) => recordSeries(s, body.matchId, body.games));
    } else {
      await mutate((s) => recordResult(s, body.matchId, body.scoreA, body.scoreB));
    }
    return { ok: true };
  });
}
