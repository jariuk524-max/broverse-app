import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession } from '@/lib/admin/guard';
import { saveAvatarDataUrl } from '@/lib/admin/avatars';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

/** base64 → буфер с проверкой mime/размера. null → готовый ответ-ошибка */
function imageBuffer(data: string): { buffer: Buffer; mime: string } | { error: NextResponse } {
  const m = data.match(/^data:([a-z0-9/+.-]+);base64,/i);
  const mime = (m?.[1] || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return { error: NextResponse.json({ error: 'Поддерживаются только png/jpeg/webp/gif/avif' }, { status: 415 }) };
  }
  const b64 = data.slice(m![0].length);
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return { error: NextResponse.json({ error: 'Фото больше 5 МБ' }, { status: 413 }) };
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return { error: NextResponse.json({ error: 'Не удалось прочитать файл' }, { status: 400 }) };
  }
  if (buffer.length > MAX_BYTES) {
    return { error: NextResponse.json({ error: 'Фото больше 5 МБ' }, { status: 413 }) };
  }
  return { buffer, mime };
}

async function uploadToStorage(path: string, buffer: Buffer, mime: string): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.storage.from('catalog-photos').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('[upload] storage error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить фото' }, { status: 500 });
  }
  return NextResponse.json({ path: `${url}/storage/v1/object/public/catalog-photos/${path}`, ok: true });
}

/**
 * Загрузка фото в Storage (каталог/зеркало/аватар профиля).
 * POST { type: 'avatar', data } — любой вошедший, путь avatars/<login>.
 * POST { type: 'chip' | 'lesson', name, data } — списки руководителя, пути chips/ lessons/.
 * POST { domainId, type, serviceName, data } — роли catalog/mirror.
 * → { path: publicUrl }. Валидация: mime/размер, только изображения.
 */
export async function POST(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const type = String(body?.type || '');

  if (type === 'avatar') {
    const r = await saveAvatarDataUrl(sess.admin.login, String(body?.data || ''));
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status || 400 });
    return NextResponse.json({ path: r.url, ok: true });
  }

  // Фото для списков руководителя: чипы подсказок и уроки обучения
  if (type === 'chip' || type === 'lesson') {
    const a = sess.admin;
    const isEditor = a.login === 'admin' || a.roles.some((r) => r === 'chief' || r === 'team');
    if (!isEditor) return NextResponse.json({ error: 'Forbidden', needs: 'chief/team' }, { status: 403 });
    const name = String(body?.name || '').slice(0, 120);
    const data = String(body?.data || '');
    if (!name || !data) return NextResponse.json({ error: 'Не все поля переданы' }, { status: 400 });
    const parsed = imageBuffer(data);
    if ('error' in parsed) return parsed.error;
    const ext = ALLOWED_MIME[parsed.mime];
    const path = `${type === 'chip' ? 'chips' : 'lessons'}/${slug(name)}-${Date.now().toString(36)}.${ext}`;
    return uploadToStorage(path, parsed.buffer, parsed.mime);
  }

  if (!sess.admin.roles.some((r) => r === 'catalog' || r === 'mirror')) {
    return NextResponse.json({ error: 'Forbidden', needs: 'catalog/mirror' }, { status: 403 });
  }

  const domain = String(body?.domainId || '').slice(0, 32);
  const serviceName = String(body?.serviceName || '').slice(0, 200);
  const data = String(body?.data || '');
  if (!domain || !serviceName || !data) {
    return NextResponse.json({ error: 'Не все поля переданы' }, { status: 400 });
  }

  const parsed = imageBuffer(data);
  if ('error' in parsed) return parsed.error;

  const ext = ALLOWED_MIME[parsed.mime];
  const path = `edits/${slug(domain)}/${slug(serviceName)}-${Date.now().toString(36)}.${ext}`;
  return uploadToStorage(path, parsed.buffer, parsed.mime);
}
