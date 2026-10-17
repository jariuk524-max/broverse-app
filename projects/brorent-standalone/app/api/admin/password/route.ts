import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/admin/crypto';
import { setAdminPassword, writeAudit, getAdminByLogin } from '@/lib/admin/store';
import { requireSession } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { revokeSessions } from '@/lib/admin/revocations';

export const dynamic = 'force-dynamic';

/** Смена пароля в профиле админа */
export async function POST(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const res = await requireSession();
  if ('error' in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const oldPassword = String(body.old_password || '');
  const newPassword = String(body.new_password || '');

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Новый пароль должен быть не короче 6 символов' }, { status: 400 });
  }

  const admin = await getAdminByLogin(res.admin.login);
  if (!admin?.password_hash || !(await verifyPassword(oldPassword, admin.password_hash))) {
    return NextResponse.json({ error: 'Текущий пароль неверен' }, { status: 401 });
  }

  // Отзываем старые сессии (в т.ч. другие устройства) и выдаём свежую куку
  await revokeSessions(res.admin.login);
  await setAdminPassword(res.admin.login, await hashPassword(newPassword));
  await writeAudit({
    actor_login: res.admin.login,
    actor_name: res.admin.display_name,
    action: 'password_change',
    entity_type: 'admin',
    entity_id: res.admin.login,
    entity_label: res.admin.display_name,
  });

  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, signSession(res.admin.login), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return out;
}
