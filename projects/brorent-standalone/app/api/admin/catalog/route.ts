import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { WASH_SERVICES, WASH_HERO, WASH_GALLERY, WASH_WORKS, WASH_BANNERS } from '@/data/wash-services';
import { BUILD_CATEGORIES, BUILD_HERO, BUILD_GALLERY, BUILD_BANNERS } from '@/data/build-services';
import { FRAME_CATEGORIES } from '@/data/frame-services';
import { MOVE_CATEGORIES } from '@/data/move-services';
import { GARDEN_CATEGORIES } from '@/data/garden-services';
import { BRO_DOMAINS } from '@/lib/domains';

export const dynamic = 'force-dynamic';

const EDITS_FILE = path.join(process.cwd(), 'data', 'catalog-edits.json');

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || 'broverse2026';

type ServiceEdit = { desc?: string; price?: string; time?: string; image?: string };
type CatalogEdits = Record<string, Record<string, ServiceEdit>>;
type CatalogService = { category: string; name: string; desc: string; price: string; time: string; image: string };

async function readEdits(): Promise<CatalogEdits> {
  try {
    return JSON.parse(await readFile(EDITS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeEdits(edits: CatalogEdits) {
  await writeFile(EDITS_FILE, JSON.stringify(edits, null, 2));
}

function pinOk(req: NextRequest): boolean {
  return req.headers.get('x-admin-pin') === ADMIN_PIN;
}

/** Услуги из lib/domains.ts для сайтов без отдельного data-модуля */
function domainsFromCode(): Record<string, CatalogService[]> {
  const out: Record<string, CatalogService[]> = {};
  for (const d of BRO_DOMAINS) {
    if (d.id === 'build' || d.id === 'wash' || d.id === 'frame' || d.id === 'move' || d.id === 'garden') continue;
    out[d.id] = d.categories.flatMap((c) =>
      c.items.map((i) => ({ category: c.name, name: i.name, desc: i.description, price: '', time: '', image: '' }))
    );
  }
  out.frame = FRAME_CATEGORIES.flatMap((c) =>
    c.services.map((s) => ({ category: c.name, name: s.name, desc: s.desc, price: s.price, time: s.time, image: s.image }))
  );
  out.move = MOVE_CATEGORIES.flatMap((c) =>
    c.services.map((s) => ({ category: c.name, name: s.name, desc: s.desc, price: s.price, time: s.time, image: s.image }))
  );
  out.garden = GARDEN_CATEGORIES.flatMap((c) =>
    c.services.map((s) => ({ category: c.name, name: s.name, desc: s.desc, price: s.price, time: s.time, image: s.image }))
  );
  return out;
}

/** Каталог из кода + текущие правки из админки (все 6+ сайтов) */
export async function GET(req: NextRequest) {
  if (!pinOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const edits = await readEdits();

  const build = BUILD_CATEGORIES.flatMap((c) =>
    c.services.map((s) => ({ category: c.name, name: s.name, desc: s.desc, price: s.price, time: s.time, image: s.image }))
  );
  const wash = WASH_SERVICES.map((s) => ({ category: 'Услуги', name: s.name, desc: s.desc, price: s.price, time: s.time, image: s.image }));

  const domains: Record<string, CatalogService[]> = { build, wash, ...domainsFromCode() };

  return NextResponse.json({
    domains,
    extras: {
      wash: { hero: WASH_HERO, gallery: WASH_GALLERY, works: WASH_WORKS, banners: WASH_BANNERS },
      build: { hero: BUILD_HERO, gallery: BUILD_GALLERY, banners: BUILD_BANNERS },
    },
    edits,
  });
}

/** Сохранить/обновить правку услуги */
export async function POST(req: NextRequest) {
  if (!pinOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { domain, service, fields } = body || {};
  if (!domain || !service || !fields) {
    return NextResponse.json({ error: 'Missing domain/service/fields' }, { status: 400 });
  }

  const edits = await readEdits();
  if (!edits[domain]) edits[domain] = {};
  edits[domain][service] = { ...(edits[domain][service] || {}), ...fields };
  await writeEdits(edits);

  return NextResponse.json({ ok: true, edit: edits[domain][service] });
}

/** Удалить правку (вернуть оригинал из кода) */
export async function DELETE(req: NextRequest) {
  if (!pinOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { domain, service } = body || {};
  if (!domain || !service) {
    return NextResponse.json({ error: 'Missing domain/service' }, { status: 400 });
  }

  const edits = await readEdits();
  if (edits[domain]) {
    delete edits[domain][service];
    if (Object.keys(edits[domain]).length === 0) delete edits[domain];
  }
  await writeEdits(edits);

  return NextResponse.json({ ok: true });
}
