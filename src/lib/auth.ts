import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { AppError } from './errors';

export const ADMIN_COOKIE = 'cuarenta_admin';

function configuredPin(): string | null {
  const pin = process.env.ADMIN_PIN;
  return pin && pin.length > 0 ? pin : null;
}

function sessionDigest(pin: string): string {
  return createHmac('sha256', pin).update('cuarenta-b-tech:admin').digest('hex');
}

export function checkPin(input: string): boolean {
  const pin = configuredPin();
  if (!pin) throw new AppError(500, 'Falta configurar ADMIN_PIN en el servidor.');
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(pin).digest();
  return timingSafeEqual(a, b);
}

export function sessionToken(): string {
  const pin = configuredPin();
  if (!pin) throw new AppError(500, 'Falta configurar ADMIN_PIN en el servidor.');
  return sessionDigest(pin);
}

export function isAdmin(req: NextRequest): boolean {
  const pin = configuredPin();
  const value = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!pin || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(sessionDigest(pin));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin(req: NextRequest): void {
  if (!isAdmin(req)) throw new AppError(401, 'Entra con el PIN de organizador.');
}
