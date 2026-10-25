import { NextResponse } from 'next/server';
import { readChips } from '@/lib/admin/chips';

export const dynamic = 'force-dynamic';

/** Карусель подсказок для поисковой строки (публично: нужна сайту) */
export async function GET() {
  try {
    return NextResponse.json({ chips: await readChips() });
  } catch {
    return NextResponse.json({ chips: [] }, { status: 500 });
  }
}
