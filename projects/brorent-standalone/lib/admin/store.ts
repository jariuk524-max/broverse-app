import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY: service_role (обходит RLS). Не импортировать из клиентских компонентов.

export type AdminRole =
  | 'requests'   // заявки
  | 'feedback'   // отзывы
  | 'catalog'    // каталог (правки описаний/цен/фото)
  | 'masters'    // модерация услуг мастеров
  | 'team'       // команда/инвайты
  | 'overview'   // сводка руководителя
  | 'tasks'      // задачи мастерам
  | 'mirror'     // зеркало главной (порядок/контент)
  | 'finance';   // финансы (бухгалтер)

export const ADMIN_ROLES: AdminRole[] = [
  'requests', 'feedback', 'catalog', 'masters', 'team', 'overview', 'tasks', 'mirror', 'finance',
];

export type AdminUser = {
  id: string;
  login: string;
  display_name: string;
  password_hash: string | null;
  roles: string[];
  created_at: string;
  password_set_at: string | null;
  last_login_at: string | null;
};

let _sb: SupabaseClient | null = null;

function sb(): SupabaseClient {
  if (!_sb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase service role не настроен');
    _sb = createClient(url, key, { auth: { persistSession: false } });
  }
  return _sb;
}

export async function getAdminByLogin(login: string): Promise<AdminUser | null> {
  const { data } = await sb().from('admin_users').select('*').eq('login', login).single();
  return (data as AdminUser) || null;
}

export async function listAdmins(): Promise<AdminUser[]> {
  const { data } = await sb().from('admin_users').select('*').order('created_at', { ascending: true });
  return (data as AdminUser[]) || [];
}

export async function setAdminPassword(login: string, passwordHash: string): Promise<boolean> {
  const { error } = await sb()
    .from('admin_users')
    .update({ password_hash: passwordHash, password_set_at: new Date().toISOString() })
    .eq('login', login);
  return !error;
}

/** Сброс пароля: сотрудник задаст его заново при следующем входе */
export async function clearAdminPassword(login: string): Promise<boolean> {
  const { error } = await sb()
    .from('admin_users')
    .update({ password_hash: null, password_set_at: null })
    .eq('login', login);
  return !error;
}

export async function touchLastLogin(login: string): Promise<void> {
  await sb().from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('login', login);
}

export async function createAdmin(input: {
  login: string;
  display_name: string;
  roles: string[];
}): Promise<boolean> {
  const { error } = await sb().from('admin_users').insert({
    login: input.login.trim().toLowerCase(),
    display_name: input.display_name.trim(),
    roles: input.roles.filter((r) => ADMIN_ROLES.includes(r as AdminRole)),
  });
  return !error;
}

export async function updateAdminRoles(login: string, roles: string[]): Promise<boolean> {
  const { error } = await sb()
    .from('admin_users')
    .update({ roles: roles.filter((r) => ADMIN_ROLES.includes(r as AdminRole)) })
    .eq('login', login);
  return !error;
}

export async function updateAdminDisplayName(login: string, displayName: string): Promise<boolean> {
  const { error } = await sb()
    .from('admin_users')
    .update({ display_name: displayName })
    .eq('login', login);
  return !error;
}

export async function deleteAdmin(login: string): Promise<boolean> {
  const { error } = await sb().from('admin_users').delete().eq('login', login);
  return !error;
}

export type AuditEntry = {
  actor_login: string;
  actor_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  entity_label?: string;
  details?: Record<string, unknown> | null;
};

/** Append-only запись в аудит. Ошибки не бросаем — действие важнее лога. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await sb().from('admin_audit_log').insert({
      actor_login: entry.actor_login,
      actor_name: entry.actor_name || '',
      action: entry.action,
      entity_type: entry.entity_type || '',
      entity_id: entry.entity_id || '',
      entity_label: entry.entity_label || '',
      details: entry.details ?? null,
    });
  } catch (e) {
    console.error('[audit] write failed:', e);
  }
}

export async function readAudit(limit = 200): Promise<(AuditEntry & { id: string; created_at: string })[]> {
  const { data, error } = await sb()
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[audit] read failed:', error);
    return [];
  }
  return (data as (AuditEntry & { id: string; created_at: string })[]) || [];
}
