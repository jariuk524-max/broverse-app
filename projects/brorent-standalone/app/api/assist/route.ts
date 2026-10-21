import { NextResponse, type NextRequest } from 'next/server';
import { aiEnabled, buildMessages, streamAssist } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_QUESTION = 800;
const COOLDOWN_MS = 1500;

/** Простой троттлинг по IP, чтобы не сжигать лимиты провайдера */
const lastHit = new Map<string, number>();
function rateOk(ip: string): boolean {
  if (lastHit.size > 1000) lastHit.clear();
  const now = Date.now();
  if (now - (lastHit.get(ip) || 0) < COOLDOWN_MS) return false;
  lastHit.set(ip, now);
  return true;
}

/**
 * Потоковый ответ «Помощника BroVerse».
 * POST { question, history? } → text/plain (дельты ответа по мере генерации).
 * Ошибки — JSON: 503 ai_disabled (нет ключа), 429 rate, 400 bad_request, 502 upstream.
 */
export async function POST(req: NextRequest) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: 'ai_disabled', message: 'Помощник временно недоступен' },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local';
  if (!rateOk(ip)) {
    return NextResponse.json({ error: 'rate', message: 'Слишком часто — секунду и снова' }, { status: 429 });
  }

  let body: { question?: unknown; history?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const question = String(body?.question || '').trim().slice(0, MAX_QUESTION);
  if (!question) {
    return NextResponse.json({ error: 'bad_request', message: 'Пустой вопрос' }, { status: 400 });
  }

  try {
    const upstream = await streamAssist(buildMessages(question, body?.history), req.signal);
    const encoder = new TextEncoder();
    const bytes = upstream.pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      })
    );
    return new Response(bytes, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[assist]', err);
    const message = err instanceof Error ? err.message : 'Провайдер недоступен';
    return NextResponse.json({ error: 'upstream', message }, { status: 502 });
  }
}
