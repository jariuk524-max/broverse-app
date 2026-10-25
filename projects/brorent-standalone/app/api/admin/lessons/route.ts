import { NextRequest, NextResponse } from 'next/server';
import { requireSession, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';
import { saveLessons, type Lessons } from '@/lib/lessons';

export const dynamic = 'force-dynamic';

/** Редактирование уроков в кабинете руководителя: сам руководитель, «chief» и «team» */
async function requireEditor() {
  const sess = await requireSession();
  if ('error' in sess) return sess;
  const a = sess.admin;
  if (a.login !== 'admin' && !a.roles.includes('chief') && !a.roles.includes('team')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return sess;
}

/** Сохранить все уроки (правила и тесты по направлениям, с фото) */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireEditor();
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const r = await saveLessons(body?.lessons);
  if (!r.ok) return NextResponse.json({ error: r.error || 'Ошибка сохранения' }, { status: 400 });

  const directions = Object.keys(r.lessons?.directions || {});
  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'lessons_save',
    entity_type: 'master_lessons',
    entity_id: 'all',
    entity_label: `${directions.length + 1} блоков обучения`,
    details: { directions },
  });

  return NextResponse.json({ ok: true, lessons: r.lessons as Lessons });
}
