import type { NextRequest } from 'next/server';
import { handle } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import { loadState } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return handle(async () => {
    const { state } = await loadState();
    return { state, admin: isAdmin(req) };
  });
}
