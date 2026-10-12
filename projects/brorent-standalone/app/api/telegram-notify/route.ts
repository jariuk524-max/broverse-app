import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type NotifyOrder = {
  service_name?: string;
  title?: string;
  client_name?: string;
  client_phone?: string;
  address?: string;
  created_at?: string;
  metadata?: {
    description?: string;
    proposed_price?: string;
    price?: number | string;
    comment?: string;
    domain?: string;
    photo?: string | null;
  } | null;
};

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildText(order: NotifyOrder): string {
  const meta = order.metadata || {};
  const service = order.service_name || order.title || '—';
  const price = meta.proposed_price || meta.price;
  const note = meta.description || meta.comment;

  const lines = [
    '📦 <b>Новая заявка!</b>',
    '',
    `🔧 Услуга: <b>${esc(service)}</b>`,
    order.client_name ? `👤 Клиент: ${esc(order.client_name)}` : '',
    `📞 Телефон: <b>${esc(order.client_phone || '—')}</b>`,
    order.address ? `📍 Адрес: ${esc(order.address)}` : '',
    price ? `💰 Цена: ${esc(price)} ₽` : '',
    note ? `📝 ${esc(note)}` : '',
    '',
    `🕐 ${new Date(order.created_at || Date.now()).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
  ];
  return lines.filter(Boolean).join('\n');
}

async function sendTelegram(token: string, chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      console.error('[Telegram] API error:', data?.description || res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] fetch failed:', err);
    return false;
  }
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  }

  let order: NotifyOrder | null = null;
  try {
    const body = await req.json();
    order = body?.order ?? null;
  } catch {
    order = null;
  }
  if (!order || !(order.service_name || order.title)) {
    return NextResponse.json({ ok: false, error: 'Invalid order data' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const { data: masters, error } = await supabase
    .from('masters')
    .select('telegram_id')
    .not('telegram_id', 'is', null);

  if (error) {
    console.error('[Telegram] masters select error:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const chatIds = (masters || [])
    .map((m) => String(m.telegram_id || '').trim())
    .filter(Boolean);

  if (chatIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: 'no masters with telegram_id' });
  }

  const text = buildText(order);
  const results = await Promise.all(chatIds.map((id) => sendTelegram(token, id, text)));
  const sent = results.filter(Boolean).length;

  return NextResponse.json({ ok: sent > 0, sent, total: chatIds.length });
}
