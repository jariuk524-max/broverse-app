import { NextResponse } from 'next/server';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Настройка @Broverse_ru_bot: setWebhook на /api/client-webhook + меню mini-app.
 * Вызывается с сервера/вручную (сеть машины может не доходить до Telegram).
 * POST { action: 'set-webhook' | 'set-menu' | 'me', url? }
 */
async function tg(method: string, payload: Record<string, unknown>) {
  if (!TOKEN) return { ok: false, description: 'TELEGRAM_BOT_TOKEN not set' };
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({ ok: false, description: 'bad response' }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '');

    if (action === 'me') {
      return NextResponse.json({ me: await tg('getMe', {}) });
    }

    if (action === 'set-webhook') {
      const baseUrl = body.url || 'https://broverse-client.vercel.app';
      const data = await tg('setWebhook', {
        url: `${baseUrl}/api/client-webhook`,
        allowed_updates: ['message'],
      });
      return NextResponse.json({ webhook: data });
    }

    if (action === 'set-menu') {
      const baseUrl = body.url || 'https://broverse-client.vercel.app';
      const data = await tg('setChatMenuButton', {
        menu_button: { type: 'web_app', text: '🛍 BroVerse', web_app: { url: baseUrl } },
      });
      return NextResponse.json({ menu: data });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e) {
    console.error('[client-setup] error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
