// SERVER-ONLY: живой каталог всех 6 сайтов — код (data-модули) + правки из
// data/catalog-edits.json. Единый источник для /api/search-index, /api/catalog/*
// и контекста «Помощника» (lib/ai.ts): услуга, добавленная из админки или
// появившаяся после модерации, сразу видна в поиске и в ИИ-промпте.

import { readFile } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { WASH_SERVICES } from '@/data/wash-services';
import { BUILD_CATEGORIES } from '@/data/build-services';
import { FRAME_CATEGORIES } from '@/data/frame-services';
import { MOVE_CATEGORIES } from '@/data/move-services';
import { GARDEN_CATEGORIES } from '@/data/garden-services';
import { BRO_DOMAINS } from '@/lib/domains';
import type { LiveService } from '@/lib/search-types';

export type ServiceEdit = {
  desc?: string;
  price?: string;
  time?: string;
  image?: string;
  order?: string[];
  new?: boolean;
  deleted?: boolean;
};

export const ORDER_KEY = '__order__';
const EDITS_FILE = path.join(process.cwd(), 'data', 'catalog-edits.json');

export async function readEdits(): Promise<Record<string, Record<string, ServiceEdit>>> {
  try {
    return JSON.parse(await readFile(EDITS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

type RawService = { category?: string; name: string; desc: string; price: string; time: string; image: string };

function servicesFromCode(domain: string): RawService[] {
  if (domain === 'build') return BUILD_CATEGORIES.flatMap((c) => c.services.map((s) => ({ category: c.name, ...s })));
  if (domain === 'wash') return WASH_SERVICES.map((s) => ({ ...s }));
  if (domain === 'frame') return FRAME_CATEGORIES.flatMap((c) => c.services.map((s) => ({ category: c.name, ...s })));
  if (domain === 'move') return MOVE_CATEGORIES.flatMap((c) => c.services.map((s) => ({ category: c.name, ...s })));
  if (domain === 'garden') return GARDEN_CATEGORIES.flatMap((c) => c.services.map((s) => ({ category: c.name, ...s })));
  const d = BRO_DOMAINS.find((x) => x.id === domain);
  if (!d) return [];
  return d.categories.flatMap((c) =>
    c.items.map((i) => ({ category: c.name, name: i.name, desc: i.description, price: '', time: '', image: '' }))
  );
}

/** Идентификаторы всех клиентских сайтов (по BRO_DOMAINS, без хаба) */
export function catalogDomains(): string[] {
  return BRO_DOMAINS.filter((d) => !d.isHub).map((d) => d.id);
}

/**
 * Merged-каталог одного сайта: код + правки (описание/цена/фото), минус скрытые,
 * плюс услуги, добавленные из админки. null — неизвестный домен.
 */
export async function mergedServices(domain: string, edits?: Record<string, Record<string, ServiceEdit>>): Promise<LiveService[] | null> {
  const code = servicesFromCode(domain);
  if (code.length === 0 && !BRO_DOMAINS.some((d) => d.id === domain)) return null;

  const e = edits ?? (await readEdits());
  const domainEdits = e[domain] || {};

  let merged: LiveService[] = code
    .filter((s) => !domainEdits[s.name]?.deleted)
    .map((s) => {
      const edit = domainEdits[s.name] || {};
      return {
        domain,
        category: s.category,
        name: s.name,
        desc: edit.desc ?? s.desc,
        price: edit.price ?? s.price,
        time: edit.time ?? s.time,
        image: edit.image ?? s.image,
      };
    });

  // Услуги, добавленные из админки (new:true)
  for (const [name, ed] of Object.entries(domainEdits)) {
    if (name === ORDER_KEY || !ed.new || ed.deleted) continue;
    merged.push({ domain, name, desc: ed.desc || '', price: ed.price || '', time: ed.time || '', image: ed.image || '', isNew: true });
  }

  const order = domainEdits[ORDER_KEY]?.order;
  if (Array.isArray(order) && order.length > 0) {
    const pos = new Map(order.map((n, i) => [n, i]));
    merged = merged
      .map((s, i) => ({ s, i }))
      .sort((a, b) => {
        const pa = pos.has(a.s.name) ? pos.get(a.s.name)! : order.length + a.i;
        const pb = pos.has(b.s.name) ? pos.get(b.s.name)! : order.length + b.i;
        return pa - pb;
      })
      .map((x) => x.s);
  }

  return merged;
}

/** Живой каталог всех сайтов одним списком (для поискового индекса) */
export async function liveCatalog(): Promise<LiveService[]> {
  const edits = await readEdits();
  const out: LiveService[] = [];
  for (const domain of catalogDomains()) {
    const list = await mergedServices(domain, edits);
    if (list) out.push(...list);
  }
  return out;
}

/** Контекст каталога для системного промпта помощника: бренды, категории, услуги */
export async function catalogContextText(): Promise<string> {
  const edits = await readEdits();
  const lines: string[] = [];
  for (const d of BRO_DOMAINS) {
    if (d.isHub) continue;
    const list = await mergedServices(d.id, edits);
    if (!list || list.length === 0) continue;
    const byCat = new Map<string, string[]>();
    for (const s of list) {
      const cat = s.category || 'Услуги';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(s.name);
    }
    const services = [...byCat.entries()]
      .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
      .join(' | ');
    lines.push(`- ${d.brand} (${d.id}) — ${d.tagline}. ${services}`);
    if (lines.join('\n').length > 3500) break;
  }

  const masters = await masterServicesText();
  if (masters) lines.push(masters);
  return lines.join('\n');
}

/** Одобренные услуги мастеров — короткая строка для промпта помощника */
async function masterServicesText(): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return '';
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await db.storage.from('catalog-photos').download('master_services.json');
    if (!data) return '';
    const json = JSON.parse(await data.text());
    if (!Array.isArray(json)) return '';
    const titles = json
      .filter((a: { status?: string; title?: string }) => a?.status === 'approved' && a.title)
      .map((a: { title: string }) => String(a.title).trim())
      .slice(0, 40);
    if (titles.length === 0) return '';
    return `- Услуги мастеров (прошли модерацию, можно заказать): ${titles.join('; ')}`;
  } catch {
    return '';
  }
}
