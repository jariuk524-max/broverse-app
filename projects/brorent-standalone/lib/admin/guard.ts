import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './crypto';
import { getAdminByLogin, writeAudit, type AdminUser, type AdminRole } from './store';

export type SessionAdmin = Omit<AdminUser, 'password_hash'>;

/** Текущий авторизованный админ из подписанной куки (или null) */
export async function currentAdmin(): Promise<SessionAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const admin = await getAdminByLogin(payload.login);
  if (!admin) return null;
  const { password_hash: _, ...safe } = admin;
  return safe;
}

export async function requireSession(): Promise<{ admin: SessionAdmin } | { error: NextResponse }> {
  const admin = await currentAdmin();
  if (!admin) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { admin };
}

export async function requireRole(
  role: AdminRole
): Promise<{ admin: SessionAdmin } | { error: NextResponse }> {
  const res = await requireSession();
  if ('error' in res) return res;
  if (!res.admin.roles.includes(role)) {
    return { error: NextResponse.json({ error: `Forbidden: needs role ${role}` }, { status: 403 }) };
  }
  return res;
}

export { writeAudit };
