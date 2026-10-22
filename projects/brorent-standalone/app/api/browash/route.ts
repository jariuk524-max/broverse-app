import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'browash-data.json';

/** Публичная галерея «Мои фото» BroWash (до 10) — для лендинга /services/wash */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ photos: [] });
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.storage.from(BUCKET).download(FILE);
    if (error || !data) return NextResponse.json({ photos: [] });
    const json = JSON.parse(await data.text());
    const photos = Array.isArray(json?.photos) ? json.photos.filter((p: unknown) => typeof p === 'string').slice(0, 10) : [];
    return NextResponse.json({ photos }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
