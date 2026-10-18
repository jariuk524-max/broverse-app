import { NextRequest, NextResponse } from 'next/server';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { getHomeOrder, setHomeOrder } from '@/lib/admin/home-order';

export const dynamic = 'force-dynamic';

/**
 * GET /api/home-order — публичный порядок услуг на главной клиентской страницы
 * (применяется в DomainGrid). Хранение: Supabase Storage admin/home_order.json.
 */
export async function GET() {
  try {
    const order = await getHomeOrder();
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ order: [] });
  }
}

/**
 * POST /api/home-order { order: string[] } — сохранить порядок главной.
 * Из админки: «Зеркало» → «Как видит клиент» → ↑↓. Роли: catalog/mirror.
 */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;
  if (!sess.admin.roles.some((r) => r === 'catalog' || r === 'mirror')) {
    return NextResponse.json({ error: 'Forbidden', needs: 'catalog/mirror' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.order)) {
    return NextResponse.json({ error: 'order required' }, { status: 400 });
  }
  const order = body.order
    .filter((x: unknown): x is string => typeof x === 'string')
    .slice(0, 500);

  const ok = await setHomeOrder(order);
  if (!ok) {
    return NextResponse.json({ error: 'Не удалось сохранить порядок' }, { status: 500 });
  }

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'home_order',
    entity_type: 'page',
    entity_id: 'home',
    entity_label: 'Порядок услуг на главной',
    details: { count: order.length },
  });

  return NextResponse.json({ ok: true, order });
}
