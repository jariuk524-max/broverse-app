import { NextResponse } from 'next/server';
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

/**
 * Webhook @Broverse_ru_bot: deep link /start att_<id> из формы входа —
 * привязка чата и отправка кода. Обычный /start — приветствие.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
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
