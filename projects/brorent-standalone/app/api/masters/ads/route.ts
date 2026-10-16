import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectMasterAdDomain, masterBrandFor, parseMasterProfileDescription, MASTER_DIRECTIONS, type MasterAd } from '@/lib/master-ads';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// MASTER_SERVICES_JSON_URL — override для локального тестирования
const ADS_URL =
  process.env.MASTER_SERVICES_JSON_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/catalog-photos/master_services.json` : '');

type StoredAd = {
  id: string;
  created_at?: string;
  master_id?: string;
  master_name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  price_variants?: string;
  work_types?: string[];
  direction?: string;
  photos?: string[];
  phone?: string;
  status?: string;
};

type Profile = {
  name: string;
  phone?: string;
  photo?: string;
  specialization?: string;
  experience?: string;
  city?: string;
  about?: string;
};

async function loadApprovedAds(): Promise<StoredAd[]> {
  if (!ADS_URL) return [];
  try {
    const res = await fetch(ADS_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((ad) => ad && ad.status === 'approved' && ad.title);
  } catch {
    return [];
  }
}

/** Анкеты мастеров из orders (песочница): client_name → профиль */
async function loadProfiles(): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>();
  if (!SUPABASE_URL || !ANON_KEY) return map;
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await supabase
      .from('orders')
      .select('client_name, client_phone, metadata, created_at')
      .eq('service_name', 'Анкета мастера')
      .order('created_at', { ascending: false });
    if (error || !data) return map;
    for (const row of data as { client_name?: string; client_phone?: string; metadata?: { photo?: string; description?: string } | null }[]) {
      const name = (row.client_name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (map.has(key)) continue;
      const parsed = parseMasterProfileDescription(row.metadata?.description);
      map.set(key, {
        name,
        phone: row.client_phone || '',
        photo: row.metadata?.photo || '',
        ...parsed,
      });
    }
    return map;
  } catch {
    return map;
  }
}

/** GET /api/masters/ads — одобренные услуги мастеров для клиентского хаба (без авторизации) */
export async function GET() {
  const [ads, profiles] = await Promise.all([loadApprovedAds(), loadProfiles()]);

  const result: MasterAd[] = ads.map((ad) => {
    const domain = detectMasterAdDomain(ad);
    const brand = masterBrandFor(domain);
    const masterName = (ad.master_name || '').trim();
    const profile = masterName ? profiles.get(masterName.toLowerCase()) : undefined;
    const photos = Array.isArray(ad.photos) ? ad.photos.filter(Boolean) : [];
    const price = Number(String(ad.price || '').replace(/\s/g, '')) || 0;

    return {
      id: ad.id,
      created_at: ad.created_at,
      title: ad.title || '',
      description: ad.description || '',
      price,
      price_variants: ad.price_variants,
      photos,
      phone: ad.phone || profile?.phone,
      status: ad.status,
      master: {
        id: ad.master_id || 'master',
        name: masterName || profile?.name || 'Мастер BroVerse',
        phone: ad.phone || profile?.phone,
        photo: profile?.photo || '',
        specialization: profile?.specialization,
        experience: profile?.experience,
        city: profile?.city,
        about: profile?.about,
        rating: 5,
      },
      domain,
      brand: brand.brand,
      color: brand.color,
      direction: ad.direction || undefined,
      directionLabel: ad.direction ? MASTER_DIRECTIONS[ad.direction]?.label : undefined,
    } satisfies MasterAd;
  });

  return NextResponse.json(result);
}
