import type { NextRequest } from 'next/server';
import { handle, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { setSchedule } from '@/lib/bracket';
import { mutate } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return handle(async () => {
    requireAdmin(req);
    const body = await readJson(req);
    await mutate((s) => setSchedule(s, body.dates));
    return { ok: true };
  });
}
