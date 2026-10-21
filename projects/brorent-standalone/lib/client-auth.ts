import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Вход клиента: телефон + код из Telegram-бота @Broverse_ru_bot (WB-стиль).
 * Без паролей и отдельной регистрации: verify кода = сессия на 1 год.
 * Коды и привязки чатов — в Storage (client_auth.json).
 */

const BUCKET = 'catalog-photos';
const AUTH_FILE = 'client_auth.json';

export const CLIENT_SESSION_COOKIE = 'bv_client';
export const CLIENT_SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_TRIES = 5;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;

const SECRET = process.env.CLIENT_SESSION_SECRET || 'broverse-client-dev-secret';

export type ClientSession = {
  phone: string;
};

type Attempt = {
  phone: string;
  code: string;
  created: number;
  expires: number;
  tries: number;
  chat_id?: number | null;
};

type AuthStore = {
  attempts: Record<string, Attempt>;
  /** телефон → chat_id: возвратный клиент получает код сразу */
  bindings: Record<string, number>;
};

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Нормализация: 7XXXXXXXXXX; иначе null */
export function normClientPhone(raw: unknown): string | null {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
  if (d.length === 10 && d.startsWith('9')) d = '7' + d;
  if (d.length !== 11 || !d.startsWith('7')) return null;
  return d;
}

async function loadStore(supabase: SupabaseClient): Promise<AuthStore> {
  const { data } = await supabase.storage.from(BUCKET).download(AUTH_FILE);
  if (!data) return { attempts: {}, bindings: {} };
  try {
    const parsed = JSON.parse(await data.text());
    return { attempts: parsed.attempts || {}, bindings: parsed.bindings || {} };
  } catch {
    return { attempts: {}, bindings: {} };
  }
}

async function saveStore(supabase: SupabaseClient, store: AuthStore) {
  const now = Date.now();
  for (const [id, a] of Object.entries(store.attempts)) {
    if (a.expires + 60 * 60 * 1000 < now) delete store.attempts[id];
  }
  const blob = new Blob([JSON.stringify(store)], { type: 'application/json' });
  await supabase.storage.from(BUCKET).upload(AUTH_FILE, blob, {
    upsert: true,
    contentType: 'application/json',
  });
}

type CreateAttemptResult =
  | { ok: true; att: string; sent: 'direct' }
  | { ok: true; att: string; sent: 'link' }
  | { ok: false; error: string };

/** Код входа: привязанный чат получает его сразу, иначе — deep link в бота */
export async function createClientAttempt(rawPhone: unknown): Promise<CreateAttemptResult> {
  const phone = normClientPhone(rawPhone);
  if (!phone) return { ok: false, error: 'Введите номер телефона' };

  const supabase = getSupabase();
  const store = await loadStore(supabase);

  const now = Date.now();
  const recent = Object.values(store.attempts).filter(
    (a) => a.phone === phone && now - a.created < 60 * 60 * 1000
  );
  if (recent.some((a) => now - a.created < SEND_COOLDOWN_MS)) {
    return { ok: false, error: 'Код уже отправлен — подождите минуту' };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: 'Слишком много попыток — попробуйте позже' };
  }

  const att = 'att_' + randomBytes(8).toString('hex');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const boundChat = store.bindings[phone] ?? null;
  store.attempts[att] = { phone, code, created: now, expires: now + CODE_TTL_MS, tries: 0, chat_id: boundChat };
  await saveStore(supabase, store);

  if (boundChat) {
    await sendClientCode(boundChat, code);
    return { ok: true, att, sent: 'direct' };
  }
  return { ok: true, att, sent: 'link' };
}

/** Бот: /start att_<id> → привязка чата → код в чат */
export async function bindClientChat(attId: string, chatId: number): Promise<{ ok: boolean; code?: string }> {
  const supabase = getSupabase();
  const store = await loadStore(supabase);
  const attempt = store.attempts[attId];
  if (!attempt || attempt.expires < Date.now()) return { ok: false };

  attempt.chat_id = chatId;
  store.bindings[attempt.phone] = chatId;
  await saveStore(supabase, store);

  await sendClientCode(chatId, attempt.code);
  return { ok: true, code: attempt.code };
}

export async function findClientAttempt(attId: string): Promise<{ phone: string } | null> {
  const supabase = getSupabase();
  const store = await loadStore(supabase);
  const a = store.attempts[attId];
  return a ? { phone: a.phone } : null;
}

type ClientVerifyResult =
  | { ok: true; session: ClientSession }
  | { ok: false; error: string };

/** Проверка кода → сессия (вход = регистрация, WB-стиль) */
export async function verifyClientAttempt(attId: string, rawCode: unknown): Promise<ClientVerifyResult> {
  const code = String(rawCode || '').replace(/\D/g, '');
  if (code.length !== 6) return { ok: false, error: 'Введите 6 цифр' };

  const supabase = getSupabase();
  const store = await loadStore(supabase);
  const attempt = store.attempts[attId];
  if (!attempt) return { ok: false, error: 'Код устарел — запросите новый' };
  if (attempt.expires < Date.now()) {
    delete store.attempts[attId];
    await saveStore(supabase, store);
    return { ok: false, error: 'Код устарел — запросите новый' };
  }
  attempt.tries += 1;
  if (attempt.tries > MAX_TRIES) {
    delete store.attempts[attId];
    await saveStore(supabase, store);
    return { ok: false, error: 'Слишком много попыток — запросите новый код' };
  }

  const a = Buffer.from(attempt.code);
  const b = Buffer.from(code);
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    await saveStore(supabase, store);
    return { ok: false, error: 'Неверный код' };
  }

  if (attempt.chat_id) store.bindings[attempt.phone] = attempt.chat_id;
  delete store.attempts[attId];
  await saveStore(supabase, store);

  return { ok: true, session: { phone: attempt.phone } };
}

// ── HMAC-cookie (1 год) ────────────────────────────────────────────────

function hmac(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function signClientSession(s: ClientSession): string {
  const payload = Buffer.from(
    JSON.stringify({ p: s.phone, exp: Date.now() + CLIENT_SESSION_TTL_MS })
  ).toString('base64url');
  return `${payload}.${hmac(payload)}`;
}

export function readClientSession(value: string | undefined | null): ClientSession | null {
  if (!value) return null;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const phone = normClientPhone(data.p);
    if (!phone || !data.exp || data.exp < Date.now()) return null;
    return { phone };
  } catch {
    return null;
  }
}

export const CLIENT_SESSION_TTL_S = Math.floor(CLIENT_SESSION_TTL_MS / 1000);

/** Код в чат клиента (@Broverse_ru_bot) */
async function sendClientCode(chatId: number, code: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[client-auth] TELEGRAM_BOT_TOKEN not set — code:', code);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          `🔐 Код входа в BroVerse: ${code}\n\n` +
          `Действует 5 минут. Не сообщайте его никому — сотрудники BroVerse никогда не спрашивают код.`,
      }),
    });
    if (!res.ok) console.error('[client-auth] sendMessage:', await res.text());
  } catch (err) {
    console.error('[client-auth] sendClientCode failed:', err);
  }
}
