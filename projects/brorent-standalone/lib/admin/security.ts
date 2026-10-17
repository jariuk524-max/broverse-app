// SERVER-ONLY: защита админ-API от перебора, CSRF и перегрузки.

/** IP клиента (Vercel кладёт цепочку в X-Forwarded-For) */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * CSRF/Origin: изменяющие запросы (POST/PATCH/DELETE) обязаны приходить
 * из браузера на том же origin. Кросс-сайтовый fetch всегда несёт Origin
 * (или Sec-Fetch-Site: cross-site) — отклоняем.
 */
export function originError(req: Request): string | null {
  const site = req.headers.get('sec-fetch-site');
  if (site === 'cross-site') return 'Запрос отклонён (cross-site)';
  const origin = req.headers.get('origin');
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { return 'Запрос отклонён (некорректный Origin)'; }
    const reqHost = req.headers.get('host') || '';
    if (host !== reqHost) return 'Запрос отклонён (чужой Origin)';
    return null;
  }
  if (site === 'same-origin' || site === 'same-site') return null;
  // Ни Origin, ни Sec-Fetch-Site — не браузер: админ-API с кукой извне не нужно
  return 'Запрос отклонён (нет Origin)';
}

/** Лимит тела запроса админ-ручек (base64-фото до ~6 МБ) */
const MAX_BODY_BYTES = 8 * 1024 * 1024;

/**
 * Общая защита изменяющих админ-ручек:
 * Origin/CSRF → размер тела → rate limit по IP (90 записей/мин).
 * null = ок, иначе — готовый ответ с ошибкой.
 */
export function guardWrite(req: Request): Response | null {
  const origin = originError(req);
  if (origin) return Response.json({ error: origin }, { status: 403 });

  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) {
    return Response.json({ error: 'Слишком большой запрос' }, { status: 413 });
  }

  const ip = clientIp(req);
  const rl = hit(`admin:write:${ip}`, 90, 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: 'Слишком много запросов — попробуйте чуть позже' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }
  return null;
}

// ── In-memory rate limit (живёт в одном инстансе функции; достаточно для MVP) ──

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key) || { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    const oldest = b.hits[0];
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  b.hits.push(now);
  buckets.set(key, b);
  // периодическая уборка, чтобы карта не росла
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.hits.length || now - v.hits[v.hits.length - 1] > windowMs) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

// ── Блокировка входа: 5 неудач / 15 мин → 429 на 15 мин ──

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

type LoginState = { fails: number; first: number; blockedUntil: number };
const loginStates = new Map<string, LoginState>();

function loginKeys(req: Request, login: string): string[] {
  return [`login:ip:${clientIp(req)}`, `login:acct:${login}`];
}

/** Проверка, не заблокирован ли вход. null = можно пытаться */
export function loginLocked(req: Request, login: string): Response | null {
  for (const key of loginKeys(req, login)) {
    const st = loginStates.get(key);
    if (st?.blockedUntil && st.blockedUntil > Date.now()) {
      const sec = Math.ceil((st.blockedUntil - Date.now()) / 1000);
      return Response.json(
        { error: `Слишком много неудачных попыток. Повторите через ${Math.ceil(sec / 60)} мин` },
        { status: 429, headers: { 'Retry-After': String(sec) } },
      );
    }
  }
  return null;
}

/** Учёт неудачной попытки (входа нет — возвращаем) */
export function loginFail(req: Request, login: string): void {
  const now = Date.now();
  for (const key of loginKeys(req, login)) {
    const st = loginStates.get(key);
    if (!st || now - st.first > LOGIN_WINDOW_MS) {
      loginStates.set(key, { fails: 1, first: now, blockedUntil: 0 });
      continue;
    }
    st.fails += 1;
    if (st.fails >= LOGIN_MAX_FAILS) st.blockedUntil = now + LOGIN_BLOCK_MS;
  }
}

/** Успех — сбрасываем счётчики */
export function loginReset(req: Request, login: string): void {
  for (const key of loginKeys(req, login)) loginStates.delete(key);
}
