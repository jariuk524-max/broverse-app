import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'admin/hub_layout.json';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readOrder(db: NonNullable<ReturnType<typeof client>>): Promise<string[]> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return [];
  try {
    const json = JSON.parse(await data.text());
    if (Array.isArray(json?.order)) return json.order.map(String);
    return [];
  } catch {
    return [];
  }
}

/** Порядок блоков-кабинетов в хабе руководителя */
export async function GET() {
  const sess = await requireSession();
  if ('error' in sess) return sess.error;
  const db = client();
  if (!db) return NextResponse.json({ order: [] });
  return NextResponse.json({ order: await readOrder(db) });
}

export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;
  if (!sess.admin.roles.includes('team')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const order: string[] = Array.isArray(body.order) ? body.order.map(String).slice(0, 200) : null;
  if (!order) return NextResponse.json({ error: 'Некорректный порядок' }, { status: 400 });

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  await db.storage.from(BUCKET).upload(FILE, JSON.stringify({ order }, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
  return NextResponse.json({ ok: true });
}
