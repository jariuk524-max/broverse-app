// SERVER-ONLY: города/регионы, где работает BroVerse — редактируются в
// кабинете руководителя (вкладка «Города»), хранятся в Storage,
// публичное чтение — GET /api/regions. По умолчанию запущены только
// Москва и Московская область.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Region = {
  id: string;
  name: string;
  enabled: boolean;
  lat: number;
  lng: number;
};

const BUCKET = 'catalog-photos';
const FILE = 'admin/regions.json';
const MAX_REGIONS = 100;

/** Стартовый список: включены Москва и МО, остальные — кандидаты на запуск */
export const DEFAULT_REGIONS: Region[] = [
  { id: 'moscow', name: 'Москва', enabled: true, lat: 55.7558, lng: 37.6173 },
  { id: 'moscow-oblast', name: 'Московская область', enabled: true, lat: 55.7558, lng: 37.6173 },
  { id: 'spb', name: 'Санкт-Петербург', enabled: false, lat: 59.9343, lng: 30.3351 },
  { id: 'kazan', name: 'Казань', enabled: false, lat: 55.7887, lng: 49.1221 },
  { id: 'ufa', name: 'Уфа', enabled: false, lat: 54.7388, lng: 55.9721 },
  { id: 'ekb', name: 'Екатеринбург', enabled: false, lat: 56.8389, lng: 60.6057 },
  { id: 'nn', name: 'Нижний Новгород', enabled: false, lat: 56.2965, lng: 43.9361 },
  { id: 'krasnodar', name: 'Краснодар', enabled: false, lat: 45.0355, lng: 38.9753 },
  { id: 'samara', name: 'Самара', enabled: false, lat: 53.1959, lng: 50.1002 },
  { id: 'novosibirsk', name: 'Новосибирск', enabled: false, lat: 55.0084, lng: 82.9357 },
];

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function slugRegion(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `r${Date.now().toString(36)}`
  );
}

function clean(raw: unknown): Region[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const r = x as Partial<Region>;
      return {
        id: String(r?.id || slugRegion(String(r?.name || ''))).slice(0, 40),
        name: String(r?.name || '').trim().slice(0, 60),
        enabled: Boolean(r?.enabled),
        lat: Number(r?.lat) || 55.7558,
        lng: Number(r?.lng) || 37.6173,
      };
    })
    .filter((r) => r.name)
    .slice(0, MAX_REGIONS);
}

/** Все регионы (вкл. выключенные); пусто/нет Supabase — стартовый список */
export async function readRegions(): Promise<Region[]> {
  const db = client();
  if (db) {
    const { data } = await db.storage.from(BUCKET).download(FILE);
    if (data) {
      try {
        const json = JSON.parse(await data.text());
        const regions = clean(json?.regions);
        if (regions.length > 0) return regions;
      } catch {
        /* повреждённый JSON — фолбэк ниже */
      }
    }
  }
  return DEFAULT_REGIONS;
}

/** Полная замена списка (порядок = порядок в списке выбора) */
export async function writeRegions(regions: Region[]): Promise<boolean> {
  const db = client();
  if (!db) return false;
  const body = JSON.stringify({ regions: clean(regions) }, null, 2);
  const { error } = await db.storage.from(BUCKET).upload(FILE, body, {
    contentType: 'application/json',
    upsert: true,
  });
  return !error;
}
