import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'browash-data.json';
const MAX_PHOTOS = 10;

type BrowashData = Record<string, unknown> & { photos?: string[] };

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readData(db: NonNullable<ReturnType<typeof client>>): Promise<BrowashData> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return { photos: [] };
  try {
    const json = JSON.parse(await data.text());
    return json && typeof json === 'object' ? json : { photos: [] };
  } catch {
    return { photos: [] };
  }
}

async function writeData(db: NonNullable<ReturnType<typeof client>>, json: BrowashData) {
  await db.storage.from(BUCKET).upload(FILE, JSON.stringify(json, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
}

/** Только https-URL из нашего Storage, без «сырых» вставок */
function sanitizePhoto(v: unknown): string | null {
  const s = String(v || '');
  if (!s || s.length > 2048) return null;
  if (!/^https:\/\/[^\s"'<>\\]+$/i.test(s)) return null;
  return s;
}

/** Галерея «Мои фото» BroWash (до 10) */
export async function GET() {
  const sess = await requireAnyRole(['catalog', 'mirror']);
  if ('error' in sess) return sess.error;
  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  const data = await readData(db);
  return NextResponse.json({ photos: Array.isArray(data.photos) ? data.photos : [] });
}

/** Сохранить список фото (замена целиком); остальные поля файла не трогаем */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireAnyRole(['catalog', 'mirror']);
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const raw = Array.isArray(body?.photos) ? body.photos : null;
  if (!raw) return NextResponse.json({ error: 'Ожидается массив photos' }, { status: 400 });
  if (raw.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Максимум ${MAX_PHOTOS} фото` }, { status: 400 });
  }
  const photos: string[] = [];
  for (const p of raw) {
    const s = sanitizePhoto(p);
    if (!s) return NextResponse.json({ error: 'Фото должно быть ссылкой https:// — загрузите его кнопкой' }, { status: 400 });
    photos.push(s);
  }

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const data = await readData(db);
  const before = Array.isArray(data.photos) ? data.photos : [];
  data.photos = photos;
  await writeData(db, data);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'browash_edit',
    entity_type: 'gallery',
    entity_id: 'browash/photos',
    entity_label: 'BroWash · Мои фото',
    details: { from: before.length, to: photos.length },
  });

  return NextResponse.json({ ok: true, photos });
}
