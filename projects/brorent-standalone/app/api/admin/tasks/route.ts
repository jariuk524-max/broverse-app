import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole, writeAudit } from '@/lib/admin/guard';
import { guardWrite } from '@/lib/admin/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'catalog-photos';
const FILE = 'admin/admin_tasks.json';
const MAX_TASKS = 500;

export type AdminTask = {
  id: string;
  master_id: string;
  master_name: string;
  title: string;
  body: string;
  status: 'open' | 'done';
  author: string;
  created_at: string;
  done_at: string | null;
};

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readTasks(db: NonNullable<ReturnType<typeof client>>): Promise<AdminTask[]> {
  const { data, error } = await db.storage.from(BUCKET).download(FILE);
  if (error || !data) return [];
  try {
    const json = JSON.parse(await data.text());
    return Array.isArray(json?.tasks) ? json.tasks : [];
  } catch {
    return [];
  }
}

async function writeTasks(db: NonNullable<ReturnType<typeof client>>, tasks: AdminTask[]) {
  const body = JSON.stringify({ tasks: tasks.slice(0, MAX_TASKS) }, null, 2);
  await db.storage.from(BUCKET).upload(FILE, body, {
    contentType: 'application/json',
    upsert: true,
  });
}

/** Список задач мастерам */
export async function GET() {
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;
  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });
  return NextResponse.json({ tasks: await readTasks(db) });
}

/** Новая задача мастеру */
export async function POST(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const masterId = String(body?.master_id || '').slice(0, 64);
  const masterName = String(body?.master_name || '').slice(0, 120);
  const title = String(body?.title || '').trim().slice(0, 200);
  const text = String(body?.body || '').trim().slice(0, 1000);
  if (!masterId || !title) {
    return NextResponse.json({ error: 'Укажите мастера и заголовок' }, { status: 400 });
  }

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const task: AdminTask = {
    id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    master_id: masterId,
    master_name: masterName,
    title,
    body: text,
    status: 'open',
    author: sess.admin.login,
    created_at: new Date().toISOString(),
    done_at: null,
  };
  const tasks = await readTasks(db);
  await writeTasks(db, [task, ...tasks]);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'task_create',
    entity_type: 'master_task',
    entity_id: task.id,
    entity_label: `${masterName || masterId}: ${title}`,
    details: { master_id: masterId },
  });

  return NextResponse.json({ ok: true, task });
}

/** Статус задачи (open ↔ done) */
export async function PATCH(req: NextRequest) {
  const blocked = guardWrite(req);
  if (blocked) return blocked;
  const sess = await requireRole('tasks');
  if ('error' in sess) return sess.error;

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '').slice(0, 64);
  const status = String(body?.status || '');
  if (!id || (status !== 'open' && status !== 'done')) {
    return NextResponse.json({ error: 'Некорректные параметры' }, { status: 400 });
  }

  const db = client();
  if (!db) return NextResponse.json({ error: 'Storage не настроен' }, { status: 500 });

  const tasks = await readTasks(db);
  const task = tasks.find((t) => t.id === id);
  if (!task) return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });

  task.status = status;
  task.done_at = status === 'done' ? new Date().toISOString() : null;
  await writeTasks(db, tasks);

  await writeAudit({
    actor_login: sess.admin.login,
    actor_name: sess.admin.display_name,
    action: 'task_status',
    entity_type: 'master_task',
    entity_id: id,
    entity_label: task.title,
    details: { from: status === 'done' ? 'open' : 'done', to: status },
  });

  return NextResponse.json({ ok: true, task });
}
