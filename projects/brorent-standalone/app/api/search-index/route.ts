import { NextResponse } from 'next/server';
import { liveCatalog } from '@/lib/live-catalog';
import { readChips } from '@/lib/admin/chips';

export const dynamic = 'force-dynamic';

/**
 * Живой поисковый индекс: все услуги 6 сайтов (код + правки из админки,
 * включая новые) и карусель подсказок из Storage (fallback — статический
 * список POPULAR_QUERIES). Открыт для всех — нужен поисковой строке на сайте.
 */
export async function GET() {
  try {
    const [services, chips] = await Promise.all([liveCatalog(), readChips()]);
    return NextResponse.json({ services, chips });
  } catch {
    return NextResponse.json({ services: [], chips: [] }, { status: 500 });
  }
}
