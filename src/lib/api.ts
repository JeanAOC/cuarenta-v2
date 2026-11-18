import { NextResponse } from 'next/server';
import { AppError } from './errors';

export async function handle(fn: () => Promise<unknown>): Promise<NextResponse> {
  try {
    const out = await fn();
    if (out instanceof NextResponse) return out;
    return NextResponse.json(out ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Error del servidor. Intenta de nuevo.' }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
