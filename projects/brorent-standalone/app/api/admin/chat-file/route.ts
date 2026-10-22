import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

/**
 * Прикрепление файла к сообщению в чате (скрепка).
 * POST { name, data } — любой вошедший; хранится в Storage, публичный URL.
 * → { url, name, mime }
 */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const data = String(body?.data || '');
  const name = String(body?.name || '').trim().slice(0, 120) || 'file';

  const m = data.match(/^data:([a-z0-9/+.-]+);base64,/i);
  const mime = (m?.[1] || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) return NextResponse.json({ error: 'Формат файла не поддерживается' }, { status: 415 });

  const b64 = data.slice(m![0].length);
  if (Math.floor((b64.length * 3) / 4) > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл больше 5 МБ' }, { status: 413 });
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return NextResponse.json({ error: 'Не удалось прочитать файл' }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл больше 5 МБ' }, { status: 413 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const path = `admin/chat-files/${Date.now().toString(36)}-${slug(name)}.${ext}`;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.storage.from('catalog-photos').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('[chat-file] storage error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить файл' }, { status: 500 });
  }

  const publicUrl = `${url}/storage/v1/object/public/catalog-photos/${path}`;
  return NextResponse.json({ url: publicUrl, name, mime, ok: true });
}
