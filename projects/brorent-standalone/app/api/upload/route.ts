import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole } from '@/lib/admin/guard';
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

/**
 * Загрузка фото в Storage (каталог/зеркало главной).
 * POST { domainId, type, serviceName, data: dataURL }
 * → { path: publicUrl }. Валидация: mime/размер, только изображения.
 */
export async function POST(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireAnyRole(['catalog', 'mirror']);
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const domain = String(body?.domainId || '').slice(0, 32);
  const serviceName = String(body?.serviceName || '').slice(0, 200);
  const data = String(body?.data || '');
  if (!domain || !serviceName || !data) {
    return NextResponse.json({ error: 'Не все поля переданы' }, { status: 400 });
  }

  const m = data.match(/^data:([a-z0-9/+.-]+);base64,/i);
  const mime = (m?.[1] || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return NextResponse.json({ error: 'Поддерживаются только png/jpeg/webp/gif/avif' }, { status: 415 });
  }

  const b64 = data.slice(m![0].length);
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json({ error: 'Фото больше 5 МБ' }, { status: 413 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return NextResponse.json({ error: 'Не удалось прочитать файл' }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Фото больше 5 МБ' }, { status: 413 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const path = `edits/${slug(domain)}/${slug(serviceName)}-${Date.now().toString(36)}.${ext}`;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.storage.from('catalog-photos').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('[upload] storage error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить фото' }, { status: 500 });
  }

  const publicUrl = `${url}/storage/v1/object/public/catalog-photos/${path}`;
  return NextResponse.json({ path: publicUrl, ok: true });
}
