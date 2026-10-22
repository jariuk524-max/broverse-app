import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_promos.json';
const MAX_PROMOS = 200;

/** Карьерная акция для ленты мастеров: показывается в срок и исчезает после просмотра */
export type AdminPromo = {
  id: string;
  title: string;
  body: string;
  cta: string;
  /** '' — всем мастерам; иначе master_id */
  audience: string;
  start_at: string;
  end_at: string;
  author: string;
  created_at: string;
  seen_by: string[];
};

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readPromos(db: NonNullable<ReturnType<typeof client>>): Promise<AdminPromo[]> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return [];
  try {
    const json = JSON.parse(await data.text());
    return Array.isArray(json?.promos) ? json.promos : [];
  } catch {
    return [];
  }
}

async function writePromos(db: NonNullable<ReturnType<typeof client>>, promos: AdminPromo[]) {
  const body = JSON.stringify({ promos: promos.slice(0, MAX_PROMOS) }, null, 2);
  await db.storage.from(BUCKET).upload(FILE, body, {
    contentType: 'application/json',
    upsert: true,
  });
}

function isLive(p: AdminPromo, now = Date.now()): boolean {
  const s = Date.parse(p.start_at);
  const e = Date.parse(p.end_at);
  return (!Number.isFinite(s) || now >= s) && (!Number.isFinite(e) || now <= e);
}

/** Список акций */
export async function GET() {
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;
  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  const promos = await readPromos(db);
  const now = Date.now();
  return NextResponse.json({
    promos,
    live: promos.filter((p) => isLive(p, now)).length,
  });
}

/** Новая акция */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const title = String(body?.title || '').trim().slice(0, 200);
  const text = String(body?.body || '').trim().slice(0, 1000);
  const cta = String(body?.cta || '').trim().slice(0, 60);
  const audience = String(body?.audience || '').trim().slice(0, 64);
  const startAt = String(body?.start_at || '').trim();
  const endAt = String(body?.end_at || '').trim();
  if (!title || !startAt || !endAt || Number.isNaN(Date.parse(startAt)) || Number.isNaN(Date.parse(endAt))) {
    return NextResponse.json({ error: 'Укажите заголовок и срок действия (начало/конец)' }, { status: 400 });
  }
  if (Date.parse(endAt) <= Date.parse(startAt)) {
    return NextResponse.json({ error: 'Окончание должно быть позже начала' }, { status: 400 });
  }

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const promo: AdminPromo = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    body: text,
    cta: cta || 'Забрать уровень',
    audience,
    start_at: startAt,
    end_at: endAt,
    author: sess.admin.login,
    created_at: new Date().toISOString(),
    seen_by: [],
  };
  const promos = await readPromos(db);
  await writePromos(db, [promo, ...promos]);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'promo_create',
    entity_type: 'master_promo',
    entity_id: promo.id,
    entity_label: title,
    details: { audience: audience || 'all', start_at: startAt, end_at: endAt },
  });

  return NextResponse.json({ ok: true, promo });
}

/** Удалить акцию */
export async function DELETE(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '').slice(0, 64);
  if (!id) return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const promos = await readPromos(db);
  const promo = promos.find((p) => p.id === id);
  if (!promo) return NextResponse.json({ error: 'Акция не найдена' }, { status: 404 });
  await writePromos(db, promos.filter((p) => p.id !== id));

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'promo_delete',
    entity_type: 'master_promo',
    entity_id: id,
    entity_label: promo.title,
    details: {},
  });

  return NextResponse.json({ ok: true });
}
