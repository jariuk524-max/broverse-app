import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/admin/crypto';
import { getAdminByLogin, setAdminPassword, touchLastLogin, writeAudit } from '@/lib/admin/store';
import { currentAdmin } from '@/lib/admin/guard';
import { originError, loginLocked, loginFail, loginReset } from '@/lib/admin/security';
import { getAvatars, setAvatar, saveAvatarDataUrl } from '@/lib/admin/avatars';

export const dynamic = 'force-dynamic';

/**
 * ВРЕМЕННО: открытый вход руководителя без пароля (кабинет admin).
 * После создания кабинетов поставить false — вернётся обычный вход.
 */
const OPEN_CHIEF_LOGIN = true;

function sessionCookie(login: string) {
  return {
    name: SESSION_COOKIE,
    value: signSession(login),
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    },
  };
}

/** Текущая сессия админа */
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ admin: null }, { status: 401 });
  const avatars = await getAvatars();
  return NextResponse.json({ admin: { ...admin, avatar_url: avatars[admin.login] || null } });
}

/** Вход: логин + пароль. Если пароль не задан — new_password создаёт его (invite-модель) */
export async function POST(req: Request) {
  try {
    const badOrigin = originError(req);
    if (badOrigin) return NextResponse.json({ error: badOrigin }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const login = String(body.login || '').trim().toLowerCase().slice(0, 64);
    const password = String(body.password || '').slice(0, 128);
    const newPassword = String(body.new_password || '').slice(0, 128);
    const avatar = typeof body.avatar === 'string' ? body.avatar : '';

    if (!login) return NextResponse.json({ error: 'Укажите логин' }, { status: 400 });

    const locked = loginLocked(req, login);
    if (locked) return locked;

    const admin = await getAdminByLogin(login);
    if (!admin) {
      loginFail(req, login);
      await writeAudit({
        actor_login: login, action: 'login_failed', entity_type: 'admin',
        entity_id: login, entity_label: login, details: { reason: 'unknown_login' },
      });
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    if (!admin.password_hash) {
      if (!newPassword) {
        return NextResponse.json(
          { error: 'Пароль ещё не задан', need_setup: true },
          { status: 409 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
      }
      await setAdminPassword(login, await hashPassword(newPassword));
      if (avatar) {
        const up = await saveAvatarDataUrl(login, avatar);
        if ('url' in up) await setAvatar(login, up.url);
      }
      await writeAudit({
        actor_login: login,
        actor_name: admin.display_name,
        action: 'password_setup',
        entity_type: 'admin',
        entity_id: login,
        entity_label: admin.display_name,
        details: { note: 'первый вход: пароль создан сотрудником' },
      });
      await touchLastLogin(login);
      loginReset(req, login);
      const res = NextResponse.json({ ok: true });
      const c = sessionCookie(login);
      res.cookies.set(c.name, c.value, c.options);
      return res;
    }

    // ВРЕМЕННО: открытый вход руководителя — без проверки пароля (см. OPEN_CHIEF_LOGIN)
    if (OPEN_CHIEF_LOGIN && login === 'admin') {
      await touchLastLogin(login);
      loginReset(req, login);
      await writeAudit({
        actor_login: login,
        actor_name: admin.display_name,
        action: 'login',
        entity_type: 'admin', entity_id: login, entity_label: admin.display_name,
        details: { open_login: true },
      });
      const openRes = NextResponse.json({ ok: true });
      const openC = sessionCookie(login);
      openRes.cookies.set(openC.name, openC.value, openC.options);
      return openRes;
    }

    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) {
      loginFail(req, login);
      await writeAudit({
        actor_login: login, actor_name: admin.display_name, action: 'login_failed',
        entity_type: 'admin', entity_id: login, entity_label: admin.display_name,
        details: { reason: 'wrong_password' },
      });
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    await touchLastLogin(login);
    loginReset(req, login);
    await writeAudit({
      actor_login: login,
      actor_name: admin.display_name,
      action: 'login',
      entity_type: 'admin',
      entity_id: login,
      entity_label: admin.display_name,
    });
    const res = NextResponse.json({ ok: true });
    const c = sessionCookie(login);
    res.cookies.set(c.name, c.value, c.options);
    return res;
  } catch (e) {
    console.error('[admin/session] error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

/** Выход */
export async function DELETE() {
  const admin = await currentAdmin();
  if (admin) {
    await writeAudit({
      actor_login: admin.login,
      actor_name: admin.display_name,
      action: 'logout',
      entity_type: 'admin',
      entity_id: admin.login,
      entity_label: admin.display_name,
    });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
