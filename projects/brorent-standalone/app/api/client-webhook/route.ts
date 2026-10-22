import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bindClientChat, findClientAttempt } from '@/lib/client-auth';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function send(chatId: number, text: string) {
  if (!TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) console.error('[client-webhook] sendMessage:', await res.text());
  } catch (err) {
    console.error('[client-webhook] send failed:', err);
  }
}

async function tg(method: string, payload: Record<string, unknown>) {
  if (!TOKEN) return null;
  try {
    return await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error(`[client-webhook] ${method} failed:`, err);
    return null;
  }
}

/** «Согласен — ищем другого мастера» после отмены мастером: заявка уходит в общий пул */
async function handleRematch(orderId: string, callbackQueryId: string, messageId?: number, chatId?: number) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    await tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text: 'Некорректная заявка.' });
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text: 'Сервис временно недоступен.' });
    return;
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: order } = await db
    .from('orders')
    .select('metadata')
    .eq('id', orderId)
    .single();
  if (!order) {
    await tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text: 'Заявка не найдена.' });
    return;
  }
  const meta = (order.metadata || {}) as Record<string, unknown>;
  if (!meta.rematch_agreed) {
    await db
      .from('orders')
      .update({ metadata: { ...meta, rematch_agreed: true, rematch_agreed_at: new Date().toISOString() } })
      .eq('id', orderId);
  }
  await tg('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: '✅ Хорошо — ищем Вам другого мастера.',
  });
  // Убираем кнопку из сообщения
  if (messageId && chatId) {
    await tg('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
    });
  }
}

/**
 * Webhook @Broverse_ru_bot: deep link /start att_<id> из формы входа —
 * привязка чата и отправка кода. Обычный /start — приветствие.
 * Кнопка «Согласен — ищем другого мастера» (rematch:<id>) — после отмены заявки мастером.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const cb = body?.callback_query;
    const cbData = String(cb?.data || '');
    if (cbData.startsWith('rematch:') && cb?.id) {
      await handleRematch(
        cbData.slice('rematch:'.length),
        String(cb.id),
        Number(cb.message?.message_id) || undefined,
        Number(cb.message?.chat?.id) || undefined,
      );
      return NextResponse.json({ ok: true });
    }

    const text = String(body?.message?.text || '');
    const chatId = Number(body?.message?.chat?.id || 0);
    if (!chatId) return NextResponse.json({ ok: true });

    const attMatch = text.match(/^\/start\s+(att_[a-f0-9]+)\s*$/);
    if (attMatch) {
      const bound = await bindClientChat(attMatch[1], chatId);
      if (bound.ok) {
        await send(chatId, '✅ Номер привязан к этому чату.\n\nКод входа отправлен выше 👆 Вернитесь на сайт и введите его.');
      } else {
        await send(chatId, '⌛ Ссылка для входа устарела.\n\nВернитесь на сайт и запросите код заново.');
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/start') {
      await send(chatId,
        '👋 BroVerse\n\nВойдите на сайте по номеру телефона — код входа придёт в этот чат.\n\nЗдесь же будут уведомления о ваших заказах.');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[client-webhook] error:', error);
    return NextResponse.json({ ok: true });
  }
}
