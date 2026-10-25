// SERVER-ONLY: карусель подсказок под поиском — редактируется в кабинете
// руководителя (вкладка «Подсказки»), хранится в Storage, фолбэк — статический
// список из lib/popular-queries.ts (пока Storage пуст).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { POPULAR_QUERIES } from '@/lib/popular-queries';
import type { Chip } from '@/lib/search-types';

const BUCKET = 'catalog-photos';
const FILE = 'admin/search_chips.json';
const MAX_CHIPS = 30;

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function clean(raw: unknown): Chip[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({
      text: String((x as Chip)?.text || '').trim().slice(0, 60),
      query: String((x as Chip)?.query || '').trim().slice(0, 80),
      img: String((x as Chip)?.img || '').trim().slice(0, 300),
    }))
    .filter((c) => c.text && c.query)
    .slice(0, MAX_CHIPS);
}

/** Подсказки из Storage; пусто/нет Supabase — статический список */
export async function readChips(): Promise<Chip[]> {
  const db = client();
  if (db) {
    const { data } = await db.storage.from(BUCKET).download(FILE);
    if (data) {
      try {
        const json = JSON.parse(await data.text());
        const chips = clean(json?.chips);
        if (chips.length > 0) return chips;
      } catch {
        /* повреждённый JSON — фолбэк ниже */
      }
    }
  }
  return POPULAR_QUERIES.map((c) => ({ text: c.text, query: c.query, img: c.img }));
}

/** Полная замена списка (порядок = порядок карусели) */
export async function writeChips(chips: Chip[]): Promise<boolean> {
  const db = client();
  if (!db) return false;
  const body = JSON.stringify({ chips: clean(chips) }, null, 2);
  const { error } = await db.storage.from(BUCKET).upload(FILE, body, {
    contentType: 'application/json',
    upsert: true,
  });
  return !error;
}
