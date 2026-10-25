import { NextResponse, type NextRequest } from 'next/server';

/**
 * ЗАКРЫТИЕ ПУБЛИЧНОГО САЙТА НА ВРЕМЯ РАЗРАБОТКИ.
 * Владелец входит один раз по личной ссылке ?access=<CODE> или паролем
 * на /coming-soon — ставится cookie bv_access (httpOnly, 1 год), дальше сайт
 * открыт; параллельно ставится bv_owner=1 — JS с ней снимает заглушки
 * публичных форм (DevStub), чтобы владелец видел реальные доработки.
 * Всегда открыты: /privacy (152-ФЗ), /coming-soon (сама заглушка),
 * /admin и /chief (свои аутентификации), /api/admin/*,
 * вход клиента и его точки: /api/client-* (в т.ч. Telegram-webhook бота),
  * /api/chat, /api/telegram-notify, /api/order-status, /api/order-chat,
  * /api/browash (галерея «Мои фото» BroWash на лендинге),
  * /api/lessons, /api/chips, /api/search-index — уроки мастеров, подсказки
  * и живой поисковый индекс (тянут кабинет мастеров и поисковая строка).
  */
const ACCESS_CODE = process.env.SITE_ACCESS_CODE || '0021';
const ACCESS_COOKIE = 'bv_access';
/** Пара bv_owner (не httpOnly) — JS на странице снимает заглушки форм (DevStub) */
const OWNER_COOKIE = 'bv_owner';

const COOKIE_OPTS = {
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

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
  '/api/assist',
  '/api/lessons',
  '/api/chips',
  '/api/search-index',
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
    // Владелец уже вошёл ранее — досылаем пару-флаг для снятия заглушек форм
    const res = NextResponse.next();
    res.cookies.set(OWNER_COOKIE, '1', { ...COOKIE_OPTS, httpOnly: false });
    return res;
  }

  const given = req.nextUrl.searchParams.get('access');
  if (given) {
    if (given !== ACCESS_CODE) {
      return NextResponse.redirect(new URL('/coming-soon?denied=1', req.url));
    }
    const url = req.nextUrl.clone();
    url.searchParams.delete('access');
    const res = NextResponse.redirect(url);
    res.cookies.set(ACCESS_COOKIE, ACCESS_CODE, { ...COOKIE_OPTS, httpOnly: true });
    res.cookies.set(OWNER_COOKIE, '1', { ...COOKIE_OPTS, httpOnly: false });
    return res;
  }

  return NextResponse.redirect(new URL('/coming-soon', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\..*).*)'],
};
