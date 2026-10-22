import { NextRequest, NextResponse } from 'next/server';
import { readThreads, writeThreads, ensureThread, appendMessage, newMsgId, type ChatMessage } from '@/lib/admin/chat';
import { writeAudit } from '@/lib/admin/store';

export const dynamic = 'force-dynamic';

/**
 * Гостевое сообщение руководителю проекта — с закрытого экрана /chief.
 * Без сессии: пишется в отдельный тред поддержки, руководитель видит
 * во вкладке «Чат» (фильтр «Поддержка»).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name || '').trim().slice(0, 80);
  const contact = String(body?.contact || '').trim().slice(0, 80);
  const text = String(body?.text || '').trim().slice(0, 1000);

  if (!name || !text) {
    return NextResponse.json({ error: 'Укажите имя и сообщение' }, { status: 400 });
  }

  const threads = await readThreads();
  const threadId = `support:chief-${Date.now().toString(36)}`;
  const t = ensureThread(threads, threadId, {
    title: `Руководителю: ${name}`,
    kind: 'support',
    role: 'обращение с /chief',
  });

  const msg: ChatMessage = {
    id: newMsgId(),
    from: 'client',
    author: contact ? `${name} · ${contact}` : name,
    text,
    created_at: new Date().toISOString(),
  };
  appendMessage(t, msg);
  threads.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  await writeThreads(threads);

  await writeAudit({
    actor_login: 'guest',
    actor_name: name,
    action: 'chief_message',
    entity_type: 'chat',
    entity_id: threadId,
    entity_label: text.slice(0, 80),
    details: { source: '/chief', contact },
  });

  return NextResponse.json({ ok: true });
}
