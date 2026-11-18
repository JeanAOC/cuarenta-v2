import { NextResponse, type NextRequest } from 'next/server';
import { handle, readJson } from '@/lib/api';
import { ADMIN_COOKIE, checkPin, sessionToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export function POST(req: NextRequest) {
  return handle(async () => {
    const body = await readJson(req);
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!checkPin(pin)) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      throw new AppError(401, 'PIN incorrecto.');
    }
    const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    res.cookies.set(ADMIN_COOKIE, sessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return res;
  });
}
