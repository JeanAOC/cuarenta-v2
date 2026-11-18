import type { NextRequest } from 'next/server';
import { handle } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { drawTournament } from '@/lib/bracket';
import { mutate } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return handle(async () => {
    requireAdmin(req);
    await mutate((s) => drawTournament(s));
    return { ok: true };
  });
}
