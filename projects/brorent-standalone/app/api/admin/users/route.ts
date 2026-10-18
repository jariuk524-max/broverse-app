import { NextResponse } from 'next/server';
import { createAdmin, updateAdminRoles, deleteAdmin, listAdmins, writeAudit, setAdminPassword, clearAdminPassword, getAdminByLogin, ADMIN_ROLES } from '@/lib/admin/store';
import { requireRole, requireSession } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { hashPassword } from '@/lib/admin/crypto';
import { revokeSessions } from '@/lib/admin/revocations';
import { getAvatars, setAvatar } from '@/lib/admin/avatars';

export const dynamic = 'force-dynamic';

/** Команда админов (без хэшей паролей) */
export async function GET() {
  const res = await requireSession();
  if ('error' in res) return res.error;
  const admins = await listAdmins();
  const avatars = await getAvatars();
  return NextResponse.json({
    admins: admins.map(({ password_hash: _, ...rest }) => ({
      ...rest,
      avatar_url: avatars[rest.login] || null,
    })),
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
  const avatarUrl = typeof body.avatar_url === 'string' ? body.avatar_url.trim().slice(0, 512) : '';

  if (!login || !displayName) {
    return NextResponse.json({ error: 'Укажите логин и имя' }, { status: 400 });
  }
  if (!roles.every((r) => ADMIN_ROLES.includes(r as (typeof ADMIN_ROLES)[number]))) {
    return NextResponse.json({ error: 'Неизвестная роль' }, { status: 400 });
  }

  const ok = await createAdmin({ login, display_name: displayName, roles });
  if (!ok) return NextResponse.json({ error: 'Такой логин уже есть' }, { status: 409 });
  if (avatarUrl) await setAvatar(login, avatarUrl);

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

/** Изменить роли сотрудника / задать или сбросить его пароль (action) */
export async function PATCH(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const res = await requireSession();
  if ('error' in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const login = String(body.login || '').trim().toLowerCase();
  const action = String(body.action || '');
  if (!login) return NextResponse.json({ error: 'Укажите логин' }, { status: 400 });

  if (action === 'set_avatar') {
    const url = String(body.avatar_url || '').trim().slice(0, 512);
    if (url && !/^https:\/\/.+\/storage\/v1\/object\/public\/catalog-photos\//.test(url)) {
      return NextResponse.json({ error: 'Недопустимый адрес фото' }, { status: 400 });
    }
    if (login !== res.admin.login && !res.admin.roles.includes('team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await setAvatar(login, url);
    await writeAudit({
      actor_login: res.admin.login,
      actor_name: res.admin.display_name,
      action: 'avatar_set',
      entity_type: 'admin',
      entity_id: login,
      entity_label: login,
      details: { url: url || null },
    });
    return NextResponse.json({ ok: true });
  }

  if (!res.admin.roles.includes('team')) {
    return NextResponse.json({ error: 'Forbidden: needs team' }, { status: 403 });
  }

  if (action === 'set_password' || action === 'reset_password') {
    const target = await getAdminByLogin(login);
    if (!target) return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 });
    if (target.login === res.admin.login) {
      return NextResponse.json({ error: 'Свой пароль меняется в профиле' }, { status: 400 });
    }

    if (action === 'set_password') {
      const newPassword = String(body.new_password || '').slice(0, 128);
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
      }
      await revokeSessions(login);
      await setAdminPassword(login, await hashPassword(newPassword));
      await writeAudit({
        actor_login: res.admin.login,
        actor_name: res.admin.display_name,
        action: 'password_set_by_admin',
        entity_type: 'admin',
        entity_id: login,
        entity_label: target.display_name,
        details: null,
      });
      return NextResponse.json({ ok: true, mode: 'set' });
    }

    await revokeSessions(login);
    await clearAdminPassword(login);
    await writeAudit({
      actor_login: res.admin.login,
      actor_name: res.admin.display_name,
      action: 'password_reset_by_admin',
      entity_type: 'admin',
      entity_id: login,
      entity_label: target.display_name,
      details: null,
    });
    return NextResponse.json({ ok: true, mode: 'reset' });
  }

  const roles: string[] = Array.isArray(body.roles) ? body.roles.map(String) : [];
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
