-- 002: админы (вход по паролю, роли по разделам) + неудаляемый аудит
-- Выполнить в Supabase Dashboard → SQL Editor

create table if not exists admin_users (
  id uuid default gen_random_uuid() primary key,
  login text not null unique,
  display_name text not null default '',
  password_hash text,                     -- null = при первом входе сотрудник задаст пароль
  roles text[] not null default '{}',     -- requests | feedback | catalog | masters | team
  created_at timestamptz not null default now(),
  password_set_at timestamptz,
  last_login_at timestamptz
);

create table if not exists admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  actor_login text not null,
  actor_name text not null default '',
  action text not null,                   -- login | order_status | catalog_edit | master_review | user_add | ...
  entity_type text not null default '',
  entity_id text not null default '',
  entity_label text not null default '',
  details jsonb,                          -- { from, to, comment, ... }
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on admin_audit_log (created_at desc);

alter table admin_users enable row level security;
alter table admin_audit_log enable row level security;

-- admin_users: анону НЕЛЬЗЯ читать (вход идут через серверные ручьи с service_role).
-- Политик select/insert/update/delete для anon нет → всё запрещено.

-- admin_audit_log: append-only для анона.
-- select + insert разрешены, UPDATE/DELETE политик НЕТ → удалить/изменить невозможно
-- (даже service_role из приложения такой API не получит).
create policy "audit_anon_read" on admin_audit_log
  for select using (true);

create policy "audit_anon_insert" on admin_audit_log
  for insert with check (true);

-- Первый администратор (все разделы, пароль задаётся при первом входе)
insert into admin_users (login, display_name, roles)
values ('admin', 'Администратор', array['requests','feedback','catalog','masters','team'])
on conflict (login) do nothing;
