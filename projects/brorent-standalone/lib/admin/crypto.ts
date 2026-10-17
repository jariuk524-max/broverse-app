import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ── Пароли: PBKDF2-SHA256, 600k итераций (без внешних зависимостей) ──
const ITERATIONS = 600_000;

async function pbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256
  );
  return Buffer.from(bits).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algo, iterStr, salt, expected] = stored.split('$');
  if (algo !== 'pbkdf2-sha256' || !salt || !expected) return false;
  const calc = await pbkdf2(password, salt, Number(iterStr) || ITERATIONS);
  try {
    return timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ── Сессия: подписанная HMAC-SHA256 строка в httpOnly-куке ──
export const SESSION_COOKIE = 'broverse_admin';
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type SessionPayload = { login: string; exp: number };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET не задан на сервере');
  return s;
}

export function signSession(login: string): string {
  const payload: SessionPayload = { login, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.login !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
