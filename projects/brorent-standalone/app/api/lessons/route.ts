import { NextResponse } from 'next/server';
import { getLessons } from '@/lib/lessons';

export const dynamic = 'force-dynamic';

/** Уроки обучения мастеров (правила + тесты) — публично: их тянет кабинет мастеров */
export async function GET() {
  try {
    return NextResponse.json({ lessons: await getLessons() });
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить уроки' }, { status: 500 });
  }
}
