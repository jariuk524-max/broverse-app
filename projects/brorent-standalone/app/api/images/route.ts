import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

const DATA_FILE = path.join(process.cwd(), 'data', 'images.json');

export async function GET(req: NextRequest) {
  try {
    const domainId = req.nextUrl.searchParams.get('domainId');
    const raw = await readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    if (domainId) {
      return NextResponse.json(data[domainId] || { hero: null, slider: [] });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read images' }, { status: 500 });
  }
}

/**
 * POST { domainId, serviceName, photos: string[] } — сохранить галерею
 * мультимодального фото услуги (карусель/до-после). Только роли catalog/mirror.
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
  const domainId = String(body?.domainId || '').slice(0, 32);
  const serviceName = String(body?.serviceName || '').slice(0, 200);
  if (!domainId || !serviceName || !Array.isArray(body?.photos)) {
    return NextResponse.json({ error: 'domainId/serviceName/photos required' }, { status: 400 });
  }

  const photos: string[] = body.photos
    .filter((p: unknown): p is string => typeof p === 'string' && p.startsWith('https://') && p.length < 2000)
    .slice(0, 12);

  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data[domainId]) data[domainId] = { hero: null, slider: [], services: {} };
    if (!data[domainId].services) data[domainId].services = {};
    const before = data[domainId].services[serviceName] || [];
    data[domainId].services[serviceName] = photos;
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    await writeAudit({
      actor_login: sess.admin.login,
      actor_name: sess.admin.display_name,
      action: 'photos_edit',
      entity_type: 'service',
      entity_id: `${domainId}/${serviceName}`,
      entity_label: serviceName,
      details: { domain: domainId, count_before: before.length, count_after: photos.length },
    });

    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить галерею' }, { status: 500 });
  }
}
