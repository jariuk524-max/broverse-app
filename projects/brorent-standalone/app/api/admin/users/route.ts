import { NextResponse } from 'next/server';
import { createAdmin, updateAdminRoles, deleteAdmin, listAdmins, writeAudit, ADMIN_ROLES } from '@/lib/admin/store';
import { requireRole, requireSession } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

/** Команда админов (без хэшей паролей) */
export async function GET() {
  const res = await requireSession();
  if ('error' in res) return res.error;
  const admins = await listAdmins();
  return NextResponse.json({
    admins: admins.map(({ password_hash: _, ...rest }) => rest),
  });
}

/** Пригласить сотрудника: аккаунт без пароля — он создаст его при первом входе */
export async function POST(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const res = await requireRole('team');
  if ('error' in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const login = String(body.login || '').trim().toLowerCase();
  const displayName = String(body.display_name || '').trim();
  const roles: string[] = Array.isArray(body.roles) ? body.roles.map(String) : [];

  if (!login || !displayName) {
    return NextResponse.json({ error: 'Укажите логин и имя' }, { status: 400 });
  }
  if (!roles.every((r) => ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]))) {
    return NextResponse.json({ error: 'Неизвестная роль' }, { status: 400 });
  }

  const ok = await createAdmin({ login, display_name: displayName, roles });
  if (!ok) return NextResponse.json({ error: 'Такой логин уже есть' }, { status: 409 });

  await writeAudit({
    actor_login: res.admin.login,
    actor_name: res.admin.display_name,
    action: 'user_add',
    entity_type: 'admin',
    entity_id: login,
    entity_label: displayName,
    details: { roles },
  });
  return NextResponse.json({ ok: true });
}

/** Изменить роли сотрудника */
export async function PATCH(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const res = await requireRole('team');
  if ('error' in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const login = String(body.login || '').trim().toLowerCase();
  const roles: string[] = Array.isArray(body.roles) ? body.roles.map(String) : [];
  if (!login) return NextResponse.json({ error: 'Укажите логин' }, { status: 400 });
  if (!roles.every((r) => ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]))) {
    return NextResponse.json({ error: 'Неизвестная роль' }, { status: 400 });
  }

  const ok = await updateAdminRoles(login, roles);
  if (!ok) return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 });

  await writeAudit({
    actor_login: res.admin.login,
    actor_name: res.admin.display_name,
    action: 'user_roles',
    entity_type: 'admin',
    entity_id: login,
    entity_label: login,
    details: { roles },
  });
  return NextResponse.json({ ok: true });
}

/** Удалить кабинет сотрудника (нельзя удалить себя) */
export async function DELETE(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const res = await requireRole('team');
  if ('error' in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const login = String(body.login || '').trim().toLowerCase();
  if (!login) return NextResponse.json({ error: 'Укажите логин' }, { status: 400 });
  if (login === res.admin.login) {
    return NextResponse.json({ error: 'Нельзя удалить собственный кабинет' }, { status: 400 });
  }

  const ok = await deleteAdmin(login);
  if (!ok) return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 });

  await writeAudit({
    actor_login: res.admin.login,
    actor_name: res.admin.display_name,
    action: 'user_delete',
    entity_type: 'admin',
    entity_id: login,
    entity_label: login,
    details: null,
  });
  return NextResponse.json({ ok: true });
}
