import { NextRequest, NextResponse } from 'next/server';

const MASTERS_API = 'https://broverse-masters.vercel.app/api/master-services';

function isAuthorized(req: NextRequest): boolean {
  const pin = process.env.NEXT_PUBLIC_ADMIN_PIN;
  if (!pin) return false;
  return req.headers.get('x-admin-pin') === pin;
}

/** GET /api/admin/master-services?status=pending&master_id=... — список услуг мастеров (proxy) */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

/** PATCH /api/admin/master-services — одобрить/отклонить услугу мастера (proxy) */
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const res = await fetch(MASTERS_API, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: body.id, status: body.status }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
