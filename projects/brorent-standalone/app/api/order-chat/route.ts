import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'catalog-photos';
const FILE = 'order_chats.json';
const MAX_MSGS = 100;

type ChatMsg = { id: string; from: 'client' | 'master'; text: string; at: string };
type Chats = Record<string, { messages: ChatMsg[] }>;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function loadChats(db: ReturnType<typeof getSupabase>): Promise<Chats> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text());
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Chats) : {};
  } catch {
    return {};
  }
}

async function saveChats(db: ReturnType<typeof getSupabase>, chats: Chats) {
  const blob = new Blob([JSON.stringify(chats)], { type: 'application/json' });
  const { error } = await db.storage.from(BUCKET).upload(FILE, blob, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) throw new Error(error.message);
}

/** Сообщения чата клиент↔мастер по заявке */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get('order_id');
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ messages: [] }, { status: 400 });
  }
  try {
    const chats = await loadChats(getSupabase());
    return NextResponse.json({ messages: chats[orderId]?.messages || [] });
  } catch {
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}

/** Отправка сообщения (from: client | master) */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || '');
  const from = body.from === 'client' || body.from === 'master' ? body.from : '';
  const text = String(body.text || '').trim().slice(0, 500);
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId) || !from || !text) {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  try {
    const db = getSupabase();
    const { data: order } = await db.from('orders').select('id').eq('id', orderId).single();
    if (!order) return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });

    const chats = await loadChats(db);
    const thread = chats[orderId]?.messages || [];
    if (thread.length >= MAX_MSGS) {
      return NextResponse.json({ error: 'Достигнут лимит сообщений по заявке' }, { status: 429 });
    }
    const msg: ChatMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from,
      text,
      at: new Date().toISOString(),
    };
    chats[orderId] = { messages: [...thread, msg] };
    await saveChats(db, chats);
    return NextResponse.json({ ok: true, messages: chats[orderId].messages });
  } catch {
    return NextResponse.json({ error: 'Ошибка хранилища' }, { status: 500 });
  }
}
