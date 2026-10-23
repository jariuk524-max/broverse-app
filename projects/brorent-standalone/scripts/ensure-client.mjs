/**
 * Деплой: webhook и меню @Broverse_ru_bot → broverse-client.vercel.app.
 * Меню — с версионной ссылкой (?v=<sha>): Telegram WebView не кэширует
 * кабинет между деплоями, заглушка /coming-soon видна сразу.
 * Идемпотентно; без токена или без сети — тихий пропуск (сборка не падает).
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.log('[ensure-client] TELEGRAM_BOT_TOKEN не задан — пропуск');
  process.exit(0);
}

const sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
const menuUrl = `https://broverse-client.vercel.app${sha ? `?v=${sha.slice(0, 8)}` : ''}`;

try {
  const hook = await fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://broverse-client.vercel.app/api/client-webhook',
      allowed_updates: ['message'],
    }),
  });
  const hookData = await hook.json();
  console.log('[ensure-client] setWebhook:', hookData.ok ? 'ok' : JSON.stringify(hookData));

  const menu = await fetch('https://api.telegram.org/bot' + token + '/setChatMenuButton', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: { type: 'web_app', text: '🛍 BroVerse', web_app: { url: menuUrl } },
    }),
  });
  const menuData = await menu.json();
  console.log('[ensure-client] setChatMenuButton:', menuData.ok ? 'ok' : JSON.stringify(menuData));
} catch (e) {
  console.log('[ensure-client] Telegram API недоступен —', (e && e.message) || e);
}
process.exit(0);
