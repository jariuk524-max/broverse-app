import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { WASH_SERVICES } from '@/data/wash-services';
import { BUILD_CATEGORIES } from '@/data/build-services';
import { BRO_DOMAINS } from '@/lib/domains';

export const dynamic = 'force-dynamic';

const EDITS_FILE = path.join(process.cwd(), 'data', 'catalog-edits.json');

type ServiceEdit = { desc?: string; price?: string; time?: string; image?: string };

async function readEdits(): Promise<Record<string, Record<string, ServiceEdit>>> {
  try {
    return JSON.parse(await readFile(EDITS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function servicesFromCode(domain: string): { name: string; desc: string; price: string; time: string; image: string }[] {
  if (domain === 'build') return BUILD_CATEGORIES.flatMap((c) => c.services);
  if (domain === 'wash') return WASH_SERVICES;
  const d = BRO_DOMAINS.find((x) => x.id === domain);
  if (!d) return [];
  return d.categories.flatMap((c) =>
    c.items.map((i) => ({ name: i.name, desc: i.description, price: '', time: '', image: '' }))
  );
}

/** Публичный merged-каталог: код + правки из админки (все сайты) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const edits = await readEdits();

  const services = servicesFromCode(domain);
  if (services.length === 0) return NextResponse.json({ error: 'Unknown domain' }, { status: 404 });

  const domainEdits = edits[domain] || {};
  const merged = services.map((s) => ({ ...s, ...(domainEdits[s.name] || {}) }));

  return NextResponse.json({ services: merged });
}
