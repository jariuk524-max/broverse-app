import { NextResponse } from 'next/server';
import { readRegions } from '@/lib/admin/regions';

export const dynamic = 'force-dynamic';

/**
 * Города/регионы работы BroVerse (публично): формы заказа, регистрация
 * мастера в кабинете. CORS: моно-порт тянет список напрямую из браузера.
 */
export async function GET() {
  try {
    const regions = await readRegions();
    const res = NextResponse.json({ regions });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  } catch {
    return NextResponse.json({ regions: [] }, { status: 500 });
  }
}
