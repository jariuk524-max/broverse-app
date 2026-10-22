import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/admin/guard';
import { listAdmins } from '@/lib/admin/store';
import { getAvatars } from '@/lib/admin/avatars';
import { getProfiles } from '@/lib/admin/profiles';
import {
  readThreads, listVirtualThreads, normPhone,
  type ChatThread,
} from '@/lib/admin/chat';

export const dynamic = 'force-dynamic';

export type SupportContact = {
  id: string; // thread id: emp:<login> | master:<id|phone>
  title: string;
  subtitle?: string;
  avatar_url?: string | null;
};

type StoredAd = {
  master_id?: string;
  master_name?: string;
  phone?: string;
  photos?: string[];
  status?: string;
  title?: string;
};

function prettyPhone(digits: string): string {
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return digits;
}

/** Анкеты мастеров: имя → фото/телефон (для аватаров в чатах) */
async function loadMasterProfiles(): Promise<Map<string, { photo?: string; phone?: string }>> {
  const map = new Map<string, { photo?: string; phone?: string }>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return map;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const s = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await s
      .from('orders')
      .select('client_name, client_phone, metadata')
      .eq('service_name', 'Анкета мастера')
      .order('created_at', { ascending: false })
      .limit(200);
    for (const row of (data || []) as { client_name?: string | null; client_phone?: string | null; metadata?: Record<string, unknown> | null }[]) {
      const name = (row.client_name || '').trim().toLowerCase();
      if (!name || map.has(name)) continue;
      const md = (row.metadata || {}) as { photo?: string };
      map.set(name, { photo: md.photo || '', phone: row.client_phone || '' });
    }
  } catch { /* без фото — покажем инициалы */ }
  return map;
}

/** Одобренные анкеты услуг мастеров (источник master_id/имя/телефон/фото) */
async function loadAds(): Promise<StoredAd[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ADS_URL =
    process.env.MASTER_SERVICES_JSON_URL ||
    (url ? `${url}/storage/v1/object/public/catalog-photos/master_services.json` : '');
  if (!ADS_URL) return [];
  try {
    const res = await fetch(ADS_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((ad: StoredAd) => ad && ad.status === 'approved') : [];
  } catch {
    return [];
  }
}

/**
 * GET /api/admin/chat/contacts — адресная книга «Поддержки»:
 * руководитель проекта, созданные руководителем кабинеты, мастера.
 * Имя, фото и телефон/должность — для списка чатов.
 */
export async function GET() {
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const me = sess.admin;
  const [admins, avatars, profiles, threads] = await Promise.all([
    listAdmins(),
    getAvatars(),
    getProfiles(),
    readThreads(),
  ]);

  const isLead = (roles: string[]) => roles.includes('chief') || roles.includes('team');
  const others = admins.filter((a) => a.login !== me.login);

  const chief: SupportContact[] = others
    .filter((a) => isLead(a.roles))
    .map((a) => ({
      id: `emp:${a.login}`,
      title: a.display_name || a.login,
      subtitle: profiles[a.login]?.title || 'Руководитель проекта',
      avatar_url: avatars[a.login] || null,
    }));

  const employees: SupportContact[] = others
    .filter((a) => !isLead(a.roles))
    .map((a) => ({
      id: `emp:${a.login}`,
      title: a.display_name || a.login,
      subtitle: profiles[a.login]?.title || 'Кабинет сотрудника',
      avatar_url: avatars[a.login] || null,
    }));

  /* ── Мастера: существующие треды + виртуальные из заявок + анкеты (фото) ── */
  type MC = { id: string; title: string; subtitle?: string; avatar_url?: string | null; digits?: string };
  const map = new Map<string, MC>();
  const byPhone = new Map<string, MC>();

  const masterThreads = threads.filter((t: ChatThread) => t.kind === 'master');
  for (const t of masterThreads) {
    const digits = t.phone ? normPhone(t.phone) : '';
    const c: MC = { id: t.id, title: t.title, subtitle: digits ? prettyPhone(digits) : 'Мастер', avatar_url: null, digits };
    map.set(t.id, c);
    if (digits) byPhone.set(digits, c);
  }
  const virtual = await listVirtualThreads(threads);
  for (const v of virtual) {
    if (v.kind !== 'master' || map.has(v.id)) continue;
    const digits = v.id.startsWith('master:') ? v.id.slice(7) : '';
    const c: MC = { id: v.id, title: v.title, subtitle: /^\d{10,}$/.test(digits) ? prettyPhone(digits) : 'Мастер', avatar_url: null, digits: /^\d{10,}$/.test(digits) ? digits : '' };
    map.set(v.id, c);
    if (c.digits) byPhone.set(c.digits, c);
  }

  const [ads, mProfiles] = await Promise.all([loadAds(), loadMasterProfiles()]);
  for (const ad of ads) {
    const name = (ad.master_name || '').trim();
    const prof = name ? mProfiles.get(name.toLowerCase()) : undefined;
    const phone = ad.phone || prof?.phone || '';
    const digits = normPhone(phone);
    const photo = prof?.photo || ad.photos?.[0] || '';

    let target: MC | undefined;
    if (ad.master_id && ad.master_id !== 'master') target = map.get(`master:${ad.master_id}`);
    if (!target && digits) target = byPhone.get(digits);
    if (target) {
      if (!target.avatar_url && photo) target.avatar_url = photo;
      if (target.title === 'Мастер' && name) target.title = name;
      continue;
    }
    const id = ad.master_id && ad.master_id !== 'master'
      ? `master:${ad.master_id}`
      : digits
        ? `master:${digits}`
        : null;
    if (!id) continue;
    const c: MC = {
      id,
      title: name || 'Мастер BroVerse',
      subtitle: digits ? prettyPhone(digits) : 'Мастер',
      avatar_url: photo || null,
      digits,
    };
    map.set(id, c);
    if (digits) byPhone.set(digits, c);
  }

  const masters = [...map.values()]
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    .map(({ digits: _, ...c }) => c);

  return NextResponse.json({
    me: {
      login: me.login,
      name: me.display_name || me.login,
      avatar_url: avatars[me.login] || null,
    },
    chief,
    employees,
    masters,
  });
}
