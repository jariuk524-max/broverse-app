import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_chats.json';
const MAX_MSGS_PER_CHAT = 200;

export type ChatMessage = {
  id: string;
  from: 'staff' | 'admin';
  login: string;      // автор
  text: string;
  created_at: string;
};

type ChatsFile = Record<string, ChatMessage[]>; // ключ — login сотрудника

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readChats(db: NonNullable<ReturnType<typeof client>>): Promise<ChatsFile> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return {};
  try {
    const json = JSON.parse(await data.text());
    return json && typeof json === 'object' ? (json as ChatsFile) : {};
  } catch {
    return {};
  }
}

async function writeChats(db: NonNullable<ReturnType<typeof client>>, chats: ChatsFile) {
  await db.storage.from(BUCKET).upload(FILE, JSON.stringify(chats, null, 2), {
    contentType: 'application/json',
    upsert: true,
  });
}

/**
 * Чат «сотрудник ↔ руководитель».
 * GET /api/admin/chat            — сотрудник: свой чат; руководитель (team): ?with=login или ?list=1
 * POST { to?, text }             — сотрудник пишет руководителю; руководитель (team) пишет в ?to
 */
export async function GET(req: NextRequest) {
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  const chats = await readChats(db);
  const isChief = sess.admin.roles.includes('team');
  const q = req.nextUrl.searchParams;

  if (q.get('list') === '1') {
    if (!isChief) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const list = Object.entries(chats).map(([login, msgs]) => ({
      login,
      count: msgs.length,
      last: msgs.length ? msgs[msgs.length - 1] : null,
    }));
    return NextResponse.json({ chats: list });
  }

  const withLogin = q.get('with');
  const key = withLogin && isChief ? withLogin : sess.admin.login;
  return NextResponse.json({ messages: chats[key] || [], key });
}

export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const text = String(body?.text || '').trim().slice(0, 1000);
  if (!text) return NextResponse.json({ error: 'Пустое сообщение' }, { status: 400 });

  const isChief = sess.admin.roles.includes('team');
  const target = isChief ? String(body?.to || '').slice(0, 64) : sess.admin.login;
  if (isChief && !target) return NextResponse.json({ error: 'Укажите сотрудника' }, { status: 400 });

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const chats = await readChats(db);
  const msg: ChatMessage = {
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    from: isChief ? 'admin' : 'staff',
    login: sess.admin.login,
    text,
    created_at: new Date().toISOString(),
  };
  chats[target] = [...(chats[target] || []), msg].slice(-MAX_MSGS_PER_CHAT);
  await writeChats(db, chats);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'chat_message',
    entity_type: 'chat',
    entity_id: target,
    entity_label: text.slice(0, 80),
    details: { to: target },
  });

  return NextResponse.json({ ok: true, message: msg });
}
