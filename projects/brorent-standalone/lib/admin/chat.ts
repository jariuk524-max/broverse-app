// SERVER-ONLY: единое хранилище чатов (Supabase Storage, JSON).
// Треды: сотрудник (emp:) / клиент (client:) / мастер (master:) / поддержка (support:).
// История живёт вечно: при удалении кабинета тред помечается account_deleted, но не удаляется.

import { createClient } from '@supabase/supabase-js';

export type ChatThreadKind = 'employee' | 'client' | 'master' | 'support';

export type ChatMessage = {
  id: string;
  from: 'admin' | 'staff' | 'client' | 'master';
  author: string; // отображаемое имя автора
  text: string;
  created_at: string;
};

export type ChatThread = {
  id: string; // 'emp:<login>' | 'client:<digits>' | 'master:<id>' | 'support:<slug>'
  title: string; // имя собеседника: «Алина Смирнова», «Игорь · клиент»
  kind: ChatThreadKind;
  login?: string | null; // для employee (сохраняется и после удаления кабинета)
  phone?: string | null;
  master_id?: string | null;
  role?: string | null; // должность (бейдж в списке)
  account_deleted?: boolean;
  /** Статус из старой системы support_chats (импорт истории) */
  legacy_status?: 'open' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

/** Сводка для списка чатов */
export type ChatThreadSummary = {
  id: string;
  title: string;
  kind: ChatThreadKind;
  role?: string | null;
  account_deleted?: boolean;
  legacy_status?: string | null;
  count: number;
  last: ChatMessage | null;
  fresh?: boolean; // ещё нет треда — виртуальная строка из заявки
};

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_chats.json';
const MAX_MSGS_PER_THREAD = 300;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Нормализованный телефон: только цифры («+7 (495) 444-55-66» → «74954445566») */
export function normPhone(s: string): string {
  return (s || '').replace(/\D/g, '');
}

export function newMsgId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

/** Чтение всех тредов (совместимо со старым форматом Record<login, msgs[]>) */
export async function readThreads(): Promise<ChatThread[]> {
  const s = db();
  if (!s) return [];
  const { data, error } = await s.storage.from(BUCKET).download(FILE);
  if (error || !data) return [];
  let json: unknown;
  try {
    json = JSON.parse(await data.text());
  } catch {
    return [];
  }
  // Старый формат: { <login>: ChatMessage[] } → employee-треды
  if (json && !Array.isArray(json) && typeof json === 'object') {
    const legacy = json as Record<string, unknown[]>;
    const ts = now();
    return Object.entries(legacy)
      .filter(([, msgs]) => Array.isArray(msgs))
      .map(([login, msgs]) => ({
        id: `emp:${login}`,
        title: login,
        kind: 'employee' as const,
        login,
        created_at: ts,
        updated_at: ts,
        messages: msgs as ChatMessage[],
      }));
  }
  return Array.isArray(json) ? (json as ChatThread[]) : [];
}

export async function writeThreads(threads: ChatThread[]): Promise<void> {
  const s = db();
  if (!s) throw new Error('Storage не настроен');
  await s.storage.from(BUCKET).upload(FILE, JSON.stringify(threads, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
}

export function findThread(threads: ChatThread[], id: string): ChatThread | null {
  return threads.find((t) => t.id === id) || null;
}

/** Найти или создать тред. `patch` заполняет поля при создании. */
export function ensureThread(
  threads: ChatThread[],
  id: string,
  patch: Partial<Omit<ChatThread, 'id' | 'messages' | 'created_at' | 'updated_at'>> & { title: string; kind: ChatThreadKind }
): ChatThread {
  let t = threads.find((x) => x.id === id);
  if (!t) {
    t = {
      id,
      title: patch.title,
      kind: patch.kind,
      login: patch.login ?? null,
      phone: patch.phone ?? null,
      master_id: patch.master_id ?? null,
      role: patch.role ?? null,
      account_deleted: false,
      created_at: now(),
      updated_at: now(),
      messages: [],
    };
    threads.push(t);
  } else {
    // Обновляем метаданные из свежих источников (имя/должность), но title не затираем пустым
    if (patch.title && patch.title.trim()) t.title = patch.title;
    if (patch.role !== undefined && patch.role !== null) t.role = patch.role;
    if (patch.master_id) t.master_id = patch.master_id;
    if (patch.phone) t.phone = patch.phone;
  }
  return t;
}

export function appendMessage(t: ChatThread, msg: ChatMessage): void {
  t.messages.push(msg);
  if (t.messages.length > MAX_MSGS_PER_THREAD) t.messages = t.messages.slice(-MAX_MSGS_PER_THREAD);
  t.updated_at = now();
}

/** Кабинет удалён — тред остаётся с историей и именем */
export async function markAccountDeleted(login: string): Promise<void> {
  const threads = await readThreads();
  const t = threads.find((x) => x.kind === 'employee' && x.login === login);
  if (!t || t.account_deleted) return;
  t.account_deleted = true;
  t.updated_at = now();
  await writeThreads(threads);
}

/* ─────────────── Профиль по телефону (клиент / мастер из заявок) ─────────────── */

export type PhoneProfile = {
  kind: 'client' | 'master';
  title: string;
  phone: string;
  master_id?: string | null;
};

type OrderRow = {
  client_name: string | null;
  client_phone: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Кто звонит по телефону:
 * 1) мастер — телефон в metadata.master_phone (заявка направлена мастеру)
 *    или анкета мастера (metadata.domain='master', сам мастер подавал заявку);
 * 2) клиент — client_phone в обычной заявке;
 * 3) иначе гость → считаем клиентом (канал в поддержку).
 */
export async function resolvePhoneProfile(phoneRaw: string): Promise<PhoneProfile> {
  const digits = normPhone(phoneRaw);
  const pretty = phoneRaw.trim();
  const s = db();
  if (!s || digits.length < 10) return { kind: 'client', title: pretty || digits, phone: digits };

  const { data } = await s
    .from('orders')
    .select('client_name, client_phone, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  const rows = (data || []) as OrderRow[];

  // Мастер: заявка направлена мастеру с этим телефоном
  for (const r of rows) {
    const md = (r.metadata || {}) as { master_phone?: string; master_name?: string; master_id?: string };
    if (md.master_phone && normPhone(md.master_phone) === digits) {
      return {
        kind: 'master',
        title: (md.master_name || '').trim() || pretty,
        phone: digits,
        master_id: md.master_id || null,
      };
    }
  }
  // Мастер: собственная анкета мастера по этому телефону
  for (const r of rows) {
    const md = (r.metadata || {}) as { domain?: string; master_id?: string };
    if (md.domain === 'master' && r.client_phone && normPhone(r.client_phone) === digits) {
      return {
        kind: 'master',
        title: (r.client_name || '').trim() || pretty,
        phone: digits,
        master_id: md.master_id || null,
      };
    }
  }
  // Клиент: обычная заявка
  for (const r of rows) {
    if (r.client_phone && normPhone(r.client_phone) === digits) {
      return { kind: 'client', title: (r.client_name || '').trim() || pretty, phone: digits };
    }
  }
  return { kind: 'client', title: pretty || digits, phone: digits };
}

/** Виртуальные треды из заявок (ещё не переписывались) — для списка чатов руководителя */
export async function listVirtualThreads(threads: ChatThread[]): Promise<ChatThreadSummary[]> {
  const s = db();
  if (!s) return [];
  const { data } = await s
    .from('orders')
    .select('client_name, client_phone, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  const rows = (data || []) as OrderRow[];
  const known = new Set(threads.map((t) => t.id));
  const out: ChatThreadSummary[] = [];
  const seen = new Set<string>();
  const LIMIT_PER_KIND = 25;

  let masters = 0;
  let clients = 0;

  for (const r of rows) {
    const md = (r.metadata || {}) as { domain?: string; master_id?: string; master_name?: string; master_phone?: string };

    // Мастера
    if (masters < LIMIT_PER_KIND && (md.master_id || md.master_phone || md.domain === 'master')) {
      const id = md.master_id
        ? `master:${md.master_id}`
        : md.master_phone
          ? `master:${normPhone(md.master_phone)}`
          : null;
      if (id && !seen.has(id) && !known.has(id)) {
        seen.add(id);
        masters++;
        const title = md.domain === 'master'
          ? (r.client_name || 'Мастер').trim()
          : (md.master_name || 'Мастер').trim();
        out.push({ id, title: title || 'Мастер', kind: 'master', count: 0, last: null, fresh: true });
      }
    }

    // Клиенты (анкеты мастеров клиентами не считаем)
    if (clients < LIMIT_PER_KIND && md.domain !== 'master' && r.client_phone) {
      const digits = normPhone(r.client_phone);
      if (digits.length >= 10) {
        const id = `client:${digits}`;
        if (!seen.has(id) && !known.has(id)) {
          seen.add(id);
          clients++;
          out.push({ id, title: (r.client_name || '').trim() || r.client_phone || 'Клиент', kind: 'client', count: 0, last: null, fresh: true });
        }
      }
    }
  }
  return out;
}
