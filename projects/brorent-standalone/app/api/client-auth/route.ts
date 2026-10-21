import { NextRequest, NextResponse } from 'next/server';
import {
  CLIENT_SESSION_COOKIE, CLIENT_SESSION_TTL_S,
  createClientAttempt, verifyClientAttempt, readClientSession, signClientSession,
} from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

/** Текущая сессия клиента */
export async function GET(req: NextRequest) {
  const session = readClientSession(req.cookies.get(CLIENT_SESSION_COOKIE)?.value);
  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    // ── Код входа ──────────────────────────────────────────────────────
    if (action === 'request-code') {
      const result = await createClientAttempt(body?.phone);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({
        ok: true,
        att: result.att,
        sent: result.sent,
        bot: 'https://t.me/Broverse_ru_bot',
        start: `https://t.me/Broverse_ru_bot?start=${result.att}`,
      });
    }

    // ── Проверка кода → сессия на год ─────────────────────────────────
    if (action === 'verify') {
      const att = String(body?.att || '').slice(0, 64);
      const result = await verifyClientAttempt(att, body?.code);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

      const res = NextResponse.json({ ok: true, session: result.session });
      res.cookies.set(CLIENT_SESSION_COOKIE, signClientSession(result.session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: CLIENT_SESSION_TTL_S,
      });
      return res;
    }

    // ── Выход ──────────────────────────────────────────────────────────
    if (action === 'logout') {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(CLIENT_SESSION_COOKIE);
      return res;
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e) {
    console.error('[client-auth] error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
