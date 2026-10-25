import { NextRequest, NextResponse } from 'next/server';
import { mergedServices } from '@/lib/live-catalog';

export const dynamic = 'force-dynamic';

/** Публичный merged-каталог: код + правки из админки (все сайты) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const services = await mergedServices(domain);
  if (!services) return NextResponse.json({ error: 'Unknown domain' }, { status: 404 });
  return NextResponse.json({ services });
}
