import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_avatars.json';

const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const MAX_BYTES = 5 * 1024 * 1024;

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'user';

/** Все аватары: login → public URL */
export async function getAvatars(): Promise<Record<string, string>> {
  const db = client();
  if (!db) return {};
  const { data } = await db.storage.from(BUCKET).download(FILE);
  if (!data) return {};
  try {
    const json = JSON.parse(await data.text());
    return json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

/** Установить/удалить аватар (url = '' — удалить) */
export async function setAvatar(login: string, url: string): Promise<boolean> {
  const db = client();
  if (!db) return false;
  const avatars = await getAvatars();
  if (url) avatars[login] = url;
  else delete avatars[login];
  const { error } = await db.storage.from(BUCKET).upload(FILE, JSON.stringify(avatars, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
  return !error;
}

/** dataURL → Storage (avatars/<login>.ext, перезапись) → public URL */
export async function saveAvatarDataUrl(
  login: string,
  data: string
): Promise<{ url: string } | { error: string; status?: number }> {
  const m = data.match(/^data:([a-z0-9/+.-]+);base64,/i);
  const mime = (m?.[1] || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) return { error: 'Поддерживаются png/jpeg/webp/gif/avif', status: 415 };

  const b64 = data.slice(m![0].length);
  const approx = Math.floor((b64.length * 3) / 4);
  if (approx > MAX_BYTES) return { error: 'Фото больше 5 МБ', status: 413 };

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return { error: 'Не удалось прочитать файл', status: 400 };
  }
  if (buffer.length > MAX_BYTES) return { error: 'Фото больше 5 МБ', status: 413 };

  const db = client();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!db || !url) return { error: 'Storage не настроен', status: 500 };

  const path = `avatars/${slug(login)}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) {
    console.error('[avatars] storage error:', error);
    return { error: 'Не удалось загрузить фото', status: 500 };
  }
  return { url: `${url}/storage/v1/object/public/${BUCKET}/${path}` };
}
