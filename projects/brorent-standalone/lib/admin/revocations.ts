import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY: отзыв сессий при смене/сбросе пароля.
// Хранится как JSON в Storage (тот же бакет, что и чаты) — без SQL-миграций.

const BUCKET = 'catalog-photos';
const FILE = 'admin/session_revocations.json';

type Revocations = Record<string, number>; // login -> ms момента отзыва

let _sb: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_sb) _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

async function read(): Promise<Revocations> {
  const db = client();
  if (!db) return {};
  try {
    const { data, error } = await db.storage.from(BUCKET).download(FILE);
    if (error || !data) return {};
    const json = JSON.parse(await data.text());
    return json && typeof json === 'object' ? (json as Revocations) : {};
  } catch {
    return {};
  }
}

async function write(map: Revocations): Promise<void> {
  const db = client();
  if (!db) return;
  await db.storage.from(BUCKET).upload(FILE, JSON.stringify(map, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
}

/** Момент (ms) последнего отзыва сессий этого логина, либо 0 */
export async function getRevocation(login: string): Promise<number> {
  const map = await read();
  const v = map[login];
  return typeof v === 'number' ? v : 0;
}

/** Отозвать все действующие сессии логина (вызывать ДО выпуска новой куки) */
export async function revokeSessions(login: string): Promise<void> {
  try {
    const map = await read();
    map[login] = Date.now();
    await write(map);
  } catch (e) {
    console.error('[revocation] write failed:', e);
  }
}
