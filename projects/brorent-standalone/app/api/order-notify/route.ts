import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normClientPhone } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const AUTH_FILE = 'client_auth.json';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function loadBindings(db: SupabaseClient): Promise<Record<string, number>> {
  const { data } = await db.storage.from(BUCKET).download(AUTH_FILE);
  if (!data) return {};
  try {
    const parsed = JSON.parse(await data.text());
    return parsed.bindings && typeof parsed.bindings === 'object' ? parsed.bindings : {};
  } catch {
    return {};
  }
}

async function sendTelegram(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('[order-notify] sendMessage:', await res.text());
  } catch (err) {
    console.error('[order-notify] send failed:', err);
  }
}

/**
 * Уведомления клиента о событии его заявки в кабинете мастера:
 * - declined: мастер отменил заявку → «ищем другого мастера» (однократно)
 * - accepted: мастер принял заявку → «мастер X принял заявку» (на каждого мастера)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || '');
  const event = body.event === 'declined' || body.event === 'accepted' ? body.event : '';
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId) || !event) {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  try {
    const db = getSupabase();
    const { data: order } = await db
      .from('orders')
      .select('service_name, client_phone, metadata')
      .eq('id', orderId)
      .single();
    if (!order) return NextResponse.json({ ok: true, skipped: 'not_found' });

    const meta = (order.metadata || {}) as Record<string, any>;
    let text = '';
    const patch: Record<string, unknown> = {};

    if (event === 'declined') {
      if (!meta.declined_by) return NextResponse.json({ ok: true, skipped: 'not_declined' });
      if (meta.declined_notified_at) return NextResponse.json({ ok: true, skipped: 'already' });
      const master = meta.declined_name ? `Мастер ${esc(meta.declined_name)}` : 'Мастер';
      text =
        `😔 <b>${master}</b>, к сожалению, сейчас занят${order.service_name ? `\n🔧 Услуга: <b>${esc(order.service_name)}</b>` : ''}\n\n` +
        'Заявка вернулась в общий пул — мы уже ищем Вам другого мастера.\n' +
        'Как только свободный мастер примет заявку, сообщим здесь.';
      patch.declined_notified_at = new Date().toISOString();
    } else {
      if (!meta.master_id) return NextResponse.json({ ok: true, skipped: 'no_master' });
      if (meta.accepted_notified_for === meta.master_id) return NextResponse.json({ ok: true, skipped: 'already' });
      const master = meta.master_name ? `Мастер <b>${esc(meta.master_name)}</b>` : 'Мастер';
      text =
        `✅ <b>${master}</b> принял Вашу заявку${order.service_name ? `\n🔧 Услуга: <b>${esc(order.service_name)}</b>` : ''}\n\n` +
        'Откройте заявку в кабинете — с мастером можно написать в чате.';
      patch.accepted_notified_for = meta.master_id;
    }

    const phone = normClientPhone(order.client_phone);
    const bindings = phone ? await loadBindings(db) : {};
    const chatId = phone ? bindings[phone] : null;

    if (chatId) {
      await sendTelegram(chatId, text);
      // Флаг — только при успешной отправке (чтобы не терять уведомление из-за отсутствия бота)
      await db
        .from('orders')
        .update({ metadata: { ...meta, ...patch } })
        .eq('id', orderId);
    }

    return NextResponse.json({ ok: true, notified: !!chatId });
  } catch (err) {
    console.error('[order-notify] error:', err);
    return NextResponse.json({ error: 'Ошибка обработки' }, { status: 500 });
  }
}
