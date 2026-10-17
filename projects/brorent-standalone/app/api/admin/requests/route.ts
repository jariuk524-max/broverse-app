import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeAudit } from '@/lib/admin/store';
import { requireRole, requireAnyRole } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const ALLOWED = ['new', 'review', 'approved', 'rejected', 'accepted', 'completed'];

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role не настроен');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Все заявки для админ-вкладок — service role (работает даже если anon-политики закрыты) */
export async function GET() {
  const res = await requireAnyRole(['requests', 'feedback', 'overview', 'finance', 'team', 'masters']);
  if ('error' in res) return res.error;
  const db = supabase();
  const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

/** Смена статуса заявки/отзыва с записью в аудит (кто/когда/было→стало) */
export async function PATCH(req: Request) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const body = await req.json().catch(() => ({}));
  const section = body.section === 'feedback' ? 'feedback' : 'orders';
  const res = await requireRole(section === 'feedback' ? 'feedback' : 'requests');
  if ('error' in res) return res.error;

  const id = String(body.id || '');
  const status = String(body.status || '');
  const comment = body.comment ? String(body.comment).slice(0, 500) : '';
  if (!id || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const db = supabase();
  const { data: before } = await db.from('orders').select('status, service_name, metadata').eq('id', id).single();
  if (!before) return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });

  const { error } = await db.from('orders').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Supabase error' }, { status: 500 });

  // Причина отклонения — в metadata заявки (видна админу и мастеру)
  if (comment && section === 'orders' && status === 'rejected') {
    await db
      .from('orders')
      .update({ metadata: { ...(before.metadata || {}), decline_reason: comment } })
      .eq('id', id);
  }

  await writeAudit({
    actor_login: res.admin.login,
    actor_name: res.admin.display_name,
    action: 'order_status',
    entity_type: section,
    entity_id: id,
    entity_label: before.service_name || id,
    details: { from: before.status, to: status, ...(comment ? { comment } : {}) },
  });

  return NextResponse.json({ ok: true });
}
