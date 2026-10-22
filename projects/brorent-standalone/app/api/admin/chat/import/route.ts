import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import {
  readThreads, writeThreads, ensureThread, findThread, newMsgId,
  type ChatMessage, type ChatThread,
} from '@/lib/admin/chat';

export const dynamic = 'force-dynamic';

/** Обращения из старой админки (Supabase support_chats) — одна запись = тред с одним ответом */
type OldSupportChat = {
  id: string;
  chat_type?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_role?: string | null;
  subject?: string | null;
  message?: string | null;
  admin_reply?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readOldChats(): Promise<OldSupportChat[]> {
  const s = db();
  if (!s) return [];
  const { data, error } = await s
    .from('support_chats')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as OldSupportChat[];
}

function normalizeStatus(v: unknown): 'open' | 'answered' | 'closed' {
  return v === 'answered' || v === 'closed' ? v : 'open';
}

function toMessages(c: OldSupportChat): ChatMessage[] {
  const ts = c.created_at || new Date().toISOString();
  const author = (c.user_name || '').trim() || (c.user_role === 'master' ? 'Мастер' : 'Клиент');
  const out: ChatMessage[] = [];
  const text = (c.message || '').trim().slice(0, 1000);
  if (text) {
    out.push({
      id: newMsgId(),
      from: c.user_role === 'master' ? 'master' : 'client',
      author,
      text,
      created_at: ts,
    });
  }
  const reply = (c.admin_reply || '').trim().slice(0, 1000);
  if (reply) {
    out.push({
      id: newMsgId(),
      from: 'admin',
      author: 'Поддержка',
      text: reply,
      created_at: c.updated_at || ts,
    });
  }
  return out;
}

/** Статус переноса: сколько старых обращений уже в новых чатах, сколько ждут импорта */
export async function GET() {
  const sess = await requireRole('team');
  if ('error' in sess) return sess.error;

  const [old, threads] = await Promise.all([readOldChats(), readThreads()]);
  const have = new Set(
    threads.filter((t) => t.kind === 'support').map((t) => t.id.slice('support:'.length))
  );
  const pending = old.filter((c) => !have.has(c.id));
  return NextResponse.json({
    total: old.length,
    imported: old.length - pending.length,
    pending: pending.length,
    items: pending.slice(0, 50).map((c) => ({
      id: c.id,
      user_name: c.user_name,
      user_role: c.user_role,
      subject: c.subject,
      status: normalizeStatus(c.status),
      created_at: c.created_at,
    })),
  });
}

/** Перенос старой истории обращений поддержки в новые треды (без дублей) */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireRole('team');
  if ('error' in sess) return sess.error;

  const [old, threads] = await Promise.all([readOldChats(), readThreads()]);
  let imported = 0;

  for (const c of old) {
    if (!c.id) continue;
    const threadId = `support:${c.id}`;
    if (findThread(threads, threadId)) continue;

    const title = ((c.user_name || '').trim() || (c.subject || '').trim() || 'Обращение').slice(0, 120);
    const t: ChatThread = ensureThread(threads, threadId, {
      title,
      kind: 'support',
      role: c.user_role || null,
    });
    t.legacy_status = normalizeStatus(c.status);
    for (const m of toMessages(c)) t.messages.push(m);
    t.updated_at = t.messages.length
      ? t.messages[t.messages.length - 1].created_at
      : (c.created_at || new Date().toISOString());
    imported++;
  }

  if (imported > 0) {
    threads.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    await writeThreads(threads);
    await writeAudit({
      actor_login: sess.admin.login,
      actor_name: sess.admin.display_name,
      action: 'support_import',
      entity_type: 'chat',
      entity_id: 'support:legacy',
      entity_label: `Перенесено обращений поддержки: ${imported}`,
      details: { imported, total: old.length },
    });
  }

  return NextResponse.json({ ok: true, imported, total: old.length });
}
