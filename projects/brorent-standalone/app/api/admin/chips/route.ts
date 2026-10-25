import { NextRequest, NextResponse } from 'next/server';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { readChips, writeChips } from '@/lib/admin/chips';
import type { Chip } from '@/lib/search-types';

export const dynamic = 'force-dynamic';

/** Редактирование списков в кабинете руководителя: сам руководитель, «chief» и «team» */
async function requireEditor() {
  const sess = await requireSession();
  if ('error' in sess) return sess;
  const a = sess.admin;
  if (a.login !== 'admin' && !a.roles.includes('chief') && !a.roles.includes('team')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return sess;
}

/** Полный список подсказок (вместе с фолбэком) — для вкладки «Подсказки» */
export async function GET() {
  const sess = await requireEditor();
  if ('error' in sess) return sess.error;
  return NextResponse.json({ chips: await readChips() });
}

/** Полная замена списка подсказок: порядок массива = порядок карусели */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireEditor();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const raw = Array.isArray(body?.chips) ? body.chips : null;
  if (!raw) return NextResponse.json({ error: 'Ожидается массив chips' }, { status: 400 });

  const chips: Chip[] = raw
    .map((x: Chip) => ({
      text: String(x?.text || '').trim().slice(0, 60),
      query: String(x?.query || '').trim().slice(0, 80),
      img: String(x?.img || '').trim().slice(0, 300),
    }))
    .filter((c: Chip) => c.text && c.query)
    .slice(0, 30);
  if (chips.length === 0) return NextResponse.json({ error: 'Оставьте хотя бы одну подсказку' }, { status: 400 });

  const ok = await writeChips(chips);
  if (!ok) return NextResponse.json({ error: 'Не удалось сохранить в Storage' }, { status: 500 });

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'search_chips_save',
    entity_type: 'search_chips',
    entity_id: 'carousel',
    entity_label: `${chips.length} подсказок`,
    details: { count: chips.length },
  });

  return NextResponse.json({ ok: true, chips });
}
