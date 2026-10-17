import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { WASH_SERVICES, WASH_HERO, WASH_GALLERY, WASH_WORKS, WASH_BANNERS } from '@/data/wash-services';
import { BUILD_CATEGORIES, BUILD_HERO, BUILD_GALLERY, BUILD_BANNERS } from '@/data/build-services';
import { FRAME_CATEGORIES } from '@/data/frame-services';
import { MOVE_CATEGORIES } from '@/data/move-services';
import { GARDEN_CATEGORIES } from '@/data/garden-services';
import { BRO_DOMAINS } from '@/lib/domains';
import { requireSession, requireAnyRole, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const EDITS_FILE = path.join(process.cwd(), 'data', 'catalog-edits.json');

type ServiceEdit = { desc?: string; price?: string; time?: string; image?: string; order?: string[] };
type CatalogEdits = Record<string, Record<string, ServiceEdit>>;
type CatalogService = { category: string; name: string; desc: string; price: string; time: string; image: string };

/** Допустимые поля правки: только известные ключи, без «сырых» вставок */
const EDIT_CAPS: Record<string, number> = { desc: 800, price: 80, time: 80, image: 2048 };

function sanitizeImage(v: unknown): string | null {
  const s = String(v || '');
  if (s.length === 0) return '';
  // Только https-URL (фото грузится через /api/upload в Storage); data:/javascript: — отбраковываем
  if (!/^https:\/\/[^\s"'<>\\]+$/i.test(s)) return null;
  return s;
}

function sanitizeFields(raw: unknown): ServiceEdit | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Некорректные поля' };
  const out: ServiceEdit = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === 'image') {
      const img = sanitizeImage(v);
      if (img === null) return { error: 'Фото должно быть ссылкой https:// — загрузите его кнопкой загрузки' };
      out.image = img;
      continue;
    }
    if (k === 'order') {
      if (Array.isArray(v)) out.order = v.map(String).slice(0, 300);
      continue;
    }
    if (k in EDIT_CAPS && typeof v === 'string') {
      out[k as 'desc' | 'price' | 'time'] = v.slice(0, EDIT_CAPS[k]);
    }
  }
  if (Object.keys(out).length === 0) return { error: 'Нет допустимых полей' };
  return out;
}

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
  void req;
  const sess = await requireSession();
  if ('error' in sess) return sess.error;

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
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireAnyRole(['catalog', 'mirror']);
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const { domain, service, fields } = body || {};
  if (!domain || !service || !fields) {
    return NextResponse.json({ error: 'Missing domain/service/fields' }, { status: 400 });
  }
  if (String(domain).length > 32 || String(service).length > 200) {
    return NextResponse.json({ error: 'Слишком длинные идентификаторы' }, { status: 400 });
  }

  const clean = sanitizeFields(fields);
  if ('error' in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

  const edits = await readEdits();
  const before = edits[domain]?.[service] || null;
  if (!edits[domain]) edits[domain] = {};
  edits[domain][service] = { ...(edits[domain][service] || {}), ...clean };
  await writeEdits(edits);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'catalog_edit',
    entity_type: 'service',
    entity_id: `${domain}/${service}`,
    entity_label: service,
    details: { domain, from: before, to: edits[domain][service] },
  });

  return NextResponse.json({ ok: true, edit: edits[domain][service] });
}

/** Удалить правку (вернуть оригинал из кода) */
export async function DELETE(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireAnyRole(['catalog', 'mirror']);
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const { domain, service } = body || {};
  if (!domain || !service) {
    return NextResponse.json({ error: 'Missing domain/service' }, { status: 400 });
  }

  const edits = await readEdits();
  const before = edits[domain]?.[service] || null;
  if (edits[domain]) {
    delete edits[domain][service];
    if (Object.keys(edits[domain]).length === 0) delete edits[domain];
  }
  await writeEdits(edits);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'catalog_revert',
    entity_type: 'service',
    entity_id: `${domain}/${service}`,
    entity_label: service,
    details: { domain, from: before, to: null },
  });

  return NextResponse.json({ ok: true });
}
