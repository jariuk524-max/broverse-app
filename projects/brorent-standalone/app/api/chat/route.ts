import { NextRequest, NextResponse } from 'next/server';
import { guardWrite } from '@/lib/admin/security';
import { writeAudit } from '@/lib/admin/guard';
import {
  readThreads, writeThreads, ensureThread, appendMessage, findThread, newMsgId,
  resolvePhoneProfile, normPhone,
  type ChatMessage,
} from '@/lib/admin/chat';

export const dynamic = 'force-dynamic';

/**
 * Публичный чат «клиент/мастер ↔ руководитель». Вход — по номеру телефона.
 * GET  ?phone=+7…   — профиль (кто ты: клиент/мастер) + история треда
 * POST { phone, text } — отправить сообщение (тред создаётся при первом)
 */
export async function GET(req: NextRequest) {
  const phoneRaw = req.nextUrl.searchParams.get('phone') || '';
  const digits = normPhone(phoneRaw);
  if (digits.length < 10) {
    return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
  }

  const profile = await resolvePhoneProfile(digits);
  const threadId = profile.kind === 'master'
    ? `master:${profile.master_id || digits}`
    : `client:${digits}`;

  const threads = await readThreads();
  const t = findThread(threads, threadId);
  return NextResponse.json({
    threadId,
    kind: profile.kind,
    title: t?.title || profile.title,
    messages: t ? t.messages : [],
  });
}

export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const phoneRaw = String(body?.phone || '');
  const text = String(body?.text || '').trim().slice(0, 1000);
  const digits = normPhone(phoneRaw);
  if (digits.length < 10) return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
  if (!text) return NextResponse.json({ error: 'Пустое сообщение' }, { status: 400 });

  const profile = await resolvePhoneProfile(digits);
  const threadId = profile.kind === 'master'
    ? `master:${profile.master_id || digits}`
    : `client:${digits}`;

  const threads = await readThreads();
  const t = ensureThread(threads, threadId, {
    title: profile.title,
    kind: profile.kind,
    phone: digits,
    master_id: profile.master_id || null,
  });

  const msg: ChatMessage = {
    id: newMsgId(),
    from: profile.kind === 'master' ? 'master' : 'client',
    author: t.title,
    text,
    created_at: new Date().toISOString(),
  };
  appendMessage(t, msg);
  await writeThreads(threads);

  await writeAudit({
    actor_login: 'public',
    actor_name: t.title,
    action: 'chat_message',
    entity_type: 'chat',
    entity_id: threadId,
    entity_label: text.slice(0, 80),
    details: { kind: profile.kind, via: 'public_chat' },
  });

  return NextResponse.json({ ok: true, message: msg, threadId, kind: profile.kind });
}
