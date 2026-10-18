import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const BUCKET = 'catalog-photos';
const FILE = 'admin/home_order.json';
const FS_FILE = path.join(process.cwd(), 'data', 'home-order.json');

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseOrder(json: unknown): string[] {
  if (Array.isArray(json)) return json.filter((x): x is string => typeof x === 'string');
  if (json && typeof json === 'object' && Array.isArray((json as { order?: unknown }).order)) {
    return ((json as { order: unknown[] }).order).filter((x): x is string => typeof x === 'string');
  }
  return [];
}

/** Порядок услуг на главной клиентской страницы (как видит клиент) */
export async function getHomeOrder(): Promise<string[]> {
  const db = client();
  if (db) {
    const { data } = await db.storage.from(BUCKET).download(FILE);
    if (!data) return [];
    try {
      return parseOrder(JSON.parse(await data.text()));
    } catch {
      return [];
    }
  }
  // Локальная разработка без Supabase — файл рядом с проектом
  try {
    return parseOrder(JSON.parse(await readFile(FS_FILE, 'utf-8')));
  } catch {
    return [];
  }
}

export async function setHomeOrder(order: string[]): Promise<boolean> {
  const clean = order.filter((x): x is string => typeof x === 'string').slice(0, 500);
  const db = client();
  if (db) {
    const { error } = await db.storage
      .from(BUCKET)
      .upload(FILE, JSON.stringify({ order: clean }, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    return !error;
  }
  try {
    await writeFile(FS_FILE, JSON.stringify({ order: clean }, null, 2));
    return true;
  } catch {
    return false;
  }
}
