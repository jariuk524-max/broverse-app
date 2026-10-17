import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/admin/crypto';
import { getAdminByLogin, setAdminPassword, touchLastLogin, writeAudit } from '@/lib/admin/store';
import { currentAdmin } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

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
  return NextResponse.json({ admin });
}

/** Вход: логин + пароль. Если пароль не задан — new_password создаёт его (invite-модель) */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const login = String(body.login || '').trim().toLowerCase();
    const password = String(body.password || '');
    const newPassword = String(body.new_password || '');

    if (!login) return NextResponse.json({ error: 'Укажите логин' }, { status: 400 });

    const admin = await getAdminByLogin(login);
    if (!admin) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

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
      const res = NextResponse.json({ ok: true });
      const c = sessionCookie(login);
      res.cookies.set(c.name, c.value, c.options);
      return res;
    }

    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });

    await touchLastLogin(login);
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
