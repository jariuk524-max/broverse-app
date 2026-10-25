import { NextRequest, NextResponse } from 'next/server';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { readRegions, writeRegions, slugRegion, type Region } from '@/lib/admin/regions';

export const dynamic = 'force-dynamic';

/** Редактирование списков в кабинете руководителя: сам руководитель, «chief» и «team» */
async function requireEditor() {
  const sess = await requireSession();
  if ('error' in sess) return sess;
  const a = sess.admin;
  if (a.login !== 'admin' && !a.roles.includes('chief') && !a.roles.includes('team')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return sess;
}

/** Все регионы (вкл. выключенные) — для вкладки «Города» */
export async function GET() {
  const sess = await requireEditor();
  if ('error' in sess) return sess.error;
  return NextResponse.json({ regions: await readRegions() });
}

/** Полная замена списка регионов: включение городов работы BroVerse */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireEditor();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const raw: Partial<Region>[] | null = Array.isArray(body?.regions) ? body.regions : null;
  if (!raw) return NextResponse.json({ error: 'Ожидается массив regions' }, { status: 400 });

  const regions: Region[] = (raw as Partial<Region>[])
    .map((x: Partial<Region>): Region => {
      const name = String(x?.name || '').trim().slice(0, 60);
      return {
        id: String(x?.id || slugRegion(name)).slice(0, 40),
        name,
        enabled: Boolean(x?.enabled),
        lat: Number.isFinite(Number(x?.lat)) ? Number(x?.lat) : 55.7558,
        lng: Number.isFinite(Number(x?.lng)) ? Number(x?.lng) : 37.6173,
      };
    })
    .filter((r: Region) => r.name)
    .slice(0, 100);
  if (regions.length === 0) return NextResponse.json({ error: 'Оставьте хотя бы один регион' }, { status: 400 });

  const ok = await writeRegions(regions);
  if (!ok) return NextResponse.json({ error: 'Не удалось сохранить в Storage' }, { status: 500 });

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'regions_save',
    entity_type: 'regions',
    entity_id: 'all',
    entity_label: `${regions.length} регионов, включено ${regions.filter((r) => r.enabled).length}`,
    details: { enabled: regions.filter((r) => r.enabled).map((r) => r.name) },
  });

  return NextResponse.json({ ok: true, regions });
}
