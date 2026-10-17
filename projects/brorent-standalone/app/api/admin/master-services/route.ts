import { NextRequest, NextResponse } from 'next/server';
import { requireRole, writeAudit } from '@/lib/admin/guard';

const MASTERS_API = 'https://broverse-masters.vercel.app/api/master-services';

/** GET /api/admin/master-services?status=pending&master_id=... — список услуг мастеров (proxy) */
export async function GET(req: NextRequest) {
  const sess = await requireRole('masters');
  if ('error' in sess) return sess.error;

  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  const status = searchParams.get('status');
  const masterId = searchParams.get('master_id');
  if (status) qs.set('status', status);
  if (masterId) qs.set('master_id', masterId);

  const url = qs.toString() ? `${MASTERS_API}?${qs.toString()}` : MASTERS_API;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}

/** PATCH /api/admin/master-services — одобрить/отклонить услугу мастера (proxy + аудит) */
export async function PATCH(req: NextRequest) {
  const sess = await requireRole('masters');
  if ('error' in sess) return sess.error;

  const body = await req.json();
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const res = await fetch(MASTERS_API, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: body.id, status: body.status, ...(body.comment ? { comment: body.comment } : {}) }),
  });
  const data = await res.json().catch(() => null);

  if (res.ok) {
    await writeAudit({
      actor_login: sess.admin.login,
      actor_name: sess.admin.display_name,
      action: 'master_service_review',
      entity_type: 'master_service',
      entity_id: String(body.id),
      entity_label: body.title ? String(body.title) : String(body.id),
      details: {
        to: body.status,
        ...(body.comment ? { reason: body.comment } : {}),
      },
    });
  }

  return NextResponse.json(data, { status: res.status });
}
