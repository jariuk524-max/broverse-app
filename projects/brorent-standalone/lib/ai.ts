// SERVER-ONLY: ИИ-путеводитель BroVerse (OpenRouter, потоковая генерация).
// Ключ: LLM_API_KEY в .env.local (https://openrouter.ai/keys).
// Модель: LLM_MODEL (по умолчанию openrouter/auto — OpenRouter сам выберет подходящую).

import { catalogContextText } from '@/lib/live-catalog';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function aiEnabled(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

/** Краткий контекст живого каталога (код + правки из админки) для системного промпта */
async function catalogContext(): Promise<string> {
  try {
    const text = await catalogContextText();
    if (text.trim()) return text;
  } catch {
    /* живой каталог недоступен — помощник отвечает без перечня услуг */
  }
  return '(каталог временно недоступен — порекомендуй оставить заявку через форму)';
}

async function baseRules(): Promise<string> {
  return `Ты — «Помощник BroVerse», виртуальный консультант сервиса бытовых услуг BroVerse.
Клиент описывает проблему (что сломалось, испачкалось, нужно сделать) и ждёт от тебя практичного совета.

Что делать:
1. Коротко ответь на вопрос и дай пошаговый совет, что можно сделать самому (безопасно).
2. Оцени, нужен ли мастер, и порекомендуй подходящий сервис экосистемы из каталога:
${await catalogContext()}
3. В конце — одна строка: какую услугу BroVerse стоит заказать (если применимо) и куда нажать («Оставить заявку»).

Правила:
- Язык: только русский. Ответ: 80–150 слов, живо и по-человечески, без канцелярита.
- Формат: обычный текст. Пустая строка — новый абзац. Список — строки, начинающиеся с «— ». Без markdown-символов (решётка, звёздочка, пайп, обратные кавычки).
- Цены и сроки не выдумывай: «точную стоимость назовём в заявке».
- Если вопрос не про услуги/быт/ремонт — вежливо верни к теме BroVerse в одном предложении и предложи помощь с бытовой задачей.
- Опасное (газ, проводка под напряжением, химия без защиты) — не инструктируй, а сразу рекомендуй мастера.
- Не выдавай себя за человека; не обещай гарантированного результата.`;
}

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

/** Системный промпт (с живым каталогом) + безопасная валидация истории клиента */
export async function buildMessages(question: string, history?: unknown): Promise<ChatMsg[]> {
  const msgs: ChatMsg[] = [{ role: 'user' as const, content: await baseRules() }];
  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      const role = h?.role === 'assistant' ? 'assistant' : 'user';
      const content = String(h?.content || '').slice(0, 500);
      if (content.trim()) msgs.push({ role, content });
    }
  }
  msgs.push({ role: 'user', content: question });
  return msgs;
}

/**
 * Потоковая генерация ответа: возвращает ReadableStream<string> дельт.
 * Бросает Error с человекочитаемым сообщением при ошибке провайдера.
 */
export async function streamAssist(messages: ChatMsg[], signal?: AbortSignal): Promise<ReadableStream<string>> {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error('AI-ключ не настроен');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://broverse-client.vercel.app',
      'X-Title': 'BroVerse Assistant',
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'openrouter/auto',
      messages,
      stream: true,
      max_tokens: 700,
      temperature: 0.6,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Провайдер ответил ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const upstream = res.body;
  const decoder = new TextDecoder();
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let buffer = '';

  return new ReadableStream<string>({
    start(controller) {
      reader = upstream.getReader();
      const pump = async (): Promise<void> => {
        if (!reader) return;
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) controller.enqueue(delta);
          } catch { /* неполная строка / служебный кадр */ }
        }
        await pump();
      };
      pump().catch((err) => {
        try { controller.error(err); } catch { /* уже закрыт */ }
      });
    },
    cancel() {
      // клиент нажал «Стоп»/закрыл вкладку — рвём соединение с провайдером
      reader?.cancel().catch(() => {});
    },
  });
}
