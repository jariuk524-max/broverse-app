import { NextRequest, NextResponse } from 'next/server';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { getAdminByLogin } from '@/lib/admin/store';
import {
  readThreads, writeThreads, ensureThread, appendMessage, findThread, newMsgId,
  listVirtualThreads, resolvePhoneProfile,
  type ChatMessage, type ChatThreadKind, type ChatThreadSummary,
} from '@/lib/admin/chat';

export const dynamic = 'force-dynamic';

/** emp:login | client:7495… | master:id | support:slug */
function inferKind(id: string): ChatThreadKind {
  if (id.startsWith('client:')) return 'client';
  if (id.startsWith('master:')) return 'master';
  if (id.startsWith('support:')) return 'support';
  return 'employee';
}

/** Старый вызов ?with=<login> / to=<login> → emp:<login> */
function toThreadId(s: string): string {
  return s.includes(':') ? s : `emp:${s}`;
}

function prettyPhone(digits: string): string {
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return digits;
}

/** Свежие метаданные треда из источников (кабинет / заявки); null — данных нет (историю не трогаем) */
async function resolveThreadPatch(id: string): Promise<{
  title: string; kind: ChatThreadKind;
  login?: string | null; phone?: string | null; master_id?: string | null; role?: string | null;
} | null> {
  const kind = inferKind(id);
  const raw = id.slice(id.indexOf(':') + 1);

  if (kind === 'employee') {
    const admin = await getAdminByLogin(raw);
    if (admin) return { title: admin.display_name || raw, kind, login: raw, role: null };
    // Кабинет удалён — имя берём из сохранённого треда (в route), здесь данных нет
    return null;
  }
  if (kind === 'client') {
    const p = await resolvePhoneProfile(raw);
    return { title: p.title || prettyPhone(raw), kind, phone: raw };
  }
  if (kind === 'master') {
    // raw: master_id (master-4) или телефон (7495…)
    if (/^\d{10,}$/.test(raw)) {
      const p = await resolvePhoneProfile(raw);
      return { title: p.title || prettyPhone(raw), kind, phone: raw, master_id: p.master_id || null };
    }
    // Имя мастера — из заявки с этим master_id
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const s = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await s.from('orders').select('client_name, metadata').order('created_at', { ascending: false }).limit(500);
      const rows = (data || []) as { client_name: string | null; metadata: Record<string, unknown> | null }[];
      for (const r of rows) {
        const md = (r.metadata || {}) as { master_id?: string; master_name?: string; domain?: string };
        if (md.master_id === raw) {
          const title = md.domain === 'master' ? (r.client_name || '').trim() : (md.master_name || '').trim();
          return { title: title || 'Мастер', kind, master_id: raw };
        }
      }
    }
    return null;
  }
  return { title: 'Служба поддержки', kind: 'support' };
}

/**
 * Чаты единой системы: сотрудник ↔ руководитель, клиент ↔ руководитель, мастер ↔ руководитель.
 * GET  ?list=1              — руководитель (team): все треды + виртуальные из заявок
 * GET  ?with=<threadId>     — история треда (сотрудник: только свой)
 * GET                       — сотрудник: своя история
 * POST { to?, text }        — сотрудник пишет в свой тред; руководитель — в to
 */
export async function GET(req: NextRequest) {
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

  const isChief = sess.admin.roles.includes('team');
  const threads = await readThreads();
  const q = req.nextUrl.searchParams;

  if (q.get('list') === '1') {
    if (!isChief) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const saved: ChatThreadSummary[] = threads
      .map((t) => ({
        id: t.id,
        title: t.title,
        kind: t.kind,
        role: t.role || null,
        account_deleted: t.account_deleted || false,
        count: t.messages.length,
        last: t.messages.length ? t.messages[t.messages.length - 1] : null,
      }))
      .sort((a, b) => (b.last?.created_at || '').localeCompare(a.last?.created_at || ''));
    const virtual = await listVirtualThreads(threads);
    return NextResponse.json({ chats: [...saved, ...virtual] });
  }

  const withParam = q.get('with');
  const key = withParam && isChief ? toThreadId(withParam) : `emp:${sess.admin.login}`;
  const t = findThread(threads, key);
  return NextResponse.json({ messages: t ? t.messages : [], key });
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
  const rawTo = String(body?.to || '').trim();
  // Сотрудник всегда пишет в свой тред; руководитель — в указанный
  const target = isChief && rawTo ? toThreadId(rawTo) : `emp:${sess.admin.login}`;
  if (isChief && !rawTo) return NextResponse.json({ error: 'Укажите чат' }, { status: 400 });

  const threads = await readThreads();
  let t = findThread(threads, target);

  if (!t) {
    const patch = await resolveThreadPatch(target);
    const kind = inferKind(target);
    const rawId = target.slice(target.indexOf(':') + 1);
    t = ensureThread(threads, target, {
      title: patch?.title || (kind === 'client' ? prettyPhone(rawId) : rawId),
      kind: patch?.kind || kind,
      login: patch?.login ?? (kind === 'employee' ? rawId : null),
      phone: patch?.phone ?? (kind === 'client' || kind === 'master' ? rawId : null),
      master_id: patch?.master_id ?? null,
      role: patch?.role ?? null,
    });
  } else {
    // Свежее имя/должность из источника; для удалённого кабинета patch = null — история не трогается
    const patch = await resolveThreadPatch(target);
    if (patch) {
      t = ensureThread(threads, target, patch);
    }
  }

  const msg: ChatMessage = {
    id: newMsgId(),
    from: isChief ? 'admin' : 'staff',
    author: isChief ? sess.admin.display_name || sess.admin.login : sess.admin.display_name || sess.admin.login,
    text,
    created_at: new Date().toISOString(),
  };
  appendMessage(t, msg);
  await writeThreads(threads);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'chat_message',
    entity_type: 'chat',
    entity_id: target,
    entity_label: text.slice(0, 80),
    details: { to: target, kind: t.kind },
  });

  return NextResponse.json({ ok: true, message: msg, key: target });
}
