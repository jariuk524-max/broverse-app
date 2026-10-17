import { NextResponse } from 'next/server';
import { readAudit } from '@/lib/admin/store';
import { requireSession } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

/** Лента аудита — append-only, удаление невозможно */
export async function GET() {
  const res = await requireSession();
  if ('error' in res) return res.error;
  const entries = await readAudit(200);
  return NextResponse.json({ entries });
}
