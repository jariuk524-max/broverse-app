import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_profiles.json';

function client(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type AdminProfile = { title?: string };

/** Все профили: login → { title } */
export async function getProfiles(): Promise<Record<string, AdminProfile>> {
  const db = client();
  if (!db) return {};
  const { data } = await db.storage.from(BUCKET).download(FILE);
  if (!data) return {};
  try {
    const json = JSON.parse(await data.text());
    return json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, AdminProfile>)
      : {};
  } catch {
    return {};
  }
}

/** Установить должность (title = '' — удалить) */
export async function setTitle(login: string, title: string): Promise<boolean> {
  const db = client();
  if (!db) return false;
  const profiles = await getProfiles();
  if (title) {
    profiles[login] = { ...(profiles[login] || {}), title };
  } else if (profiles[login]) {
    delete profiles[login].title;
    if (Object.keys(profiles[login]).length === 0) delete profiles[login];
  }
  const { error } = await db.storage.from(BUCKET).upload(FILE, JSON.stringify(profiles, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
  return !error;
}
