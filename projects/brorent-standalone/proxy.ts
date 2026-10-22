import { NextResponse, type NextRequest } from 'next/server';

/**
 * ЗАКРЫТИЕ ПУБЛИЧНОГО САЙТА НА ВРЕМЯ РАЗРАБОТКИ.
 * Владелец входит один раз по личной ссылке ?access=<CODE> — ставится
 * cookie bv_access (httpOnly, 1 год), дальше сайт открыт.
 * Всегда открыты: /privacy (152-ФЗ), /coming-soon (сама заглушка),
 * /admin и /chief (свои аутентификации), /api/admin/*,
 * вход клиента и его точки: /api/client-* (в т.ч. Telegram-webhook бота),
  * /api/chat, /api/telegram-notify, /api/order-status, /api/order-chat,
  * /api/browash (галерея «Мои фото» BroWash на лендинге).
  */
const ACCESS_CODE = process.env.SITE_ACCESS_CODE || '0021';
const ACCESS_COOKIE = 'bv_access';

const PUBLIC_ALWAYS = ['/privacy', '/coming-soon'];

/** Публичные API, без которых не работают вход клиента и формы (бот шлёт webhook снаружи) */
const OPEN_API = [
  '/api/client-auth',
  '/api/client-webhook',
  '/api/client-setup',
  '/api/chat',
  '/api/telegram-notify',
  '/api/order-status',
  '/api/order-chat',
  '/api/order-notify',
  '/api/browash',
];

function isAlwaysOpen(pathname: string): boolean {
  if (PUBLIC_ALWAYS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  if (pathname === '/chief' || pathname.startsWith('/chief/')) return true;
  if (pathname.startsWith('/api/admin')) return true;
  if (OPEN_API.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAlwaysOpen(pathname)) return NextResponse.next();

  if (req.cookies.get(ACCESS_COOKIE)?.value === ACCESS_CODE) {
    return NextResponse.next();
  }

  const given = req.nextUrl.searchParams.get('access');
  if (given && given === ACCESS_CODE) {
    const url = req.nextUrl.clone();
    url.searchParams.delete('access');
    const res = NextResponse.redirect(url);
    res.cookies.set(ACCESS_COOKIE, ACCESS_CODE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  return NextResponse.redirect(new URL('/coming-soon', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\..*).*)'],
};
