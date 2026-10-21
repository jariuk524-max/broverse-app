'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Loader2, ChevronRight, RotateCcw } from 'lucide-react';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

const GREETING =
  'Привет! Я — Помощник BroVerse. Опишите задачу: что сломалось, испачкалось или нужно сделать — подскажу, что можно сделать самому и какой сервис экосистемы подойдёт.';

const QUICK = [
  { label: 'Химчистка дивана', question: 'Загрязнился диван — нужна химчистка, что делать?' },
  { label: 'Не включается холодильник', question: 'Холодильник не включается — нужен ли мастер?' },
  { label: 'Нужен переезд', question: 'Планирую переезд в Москве — как это работает?' },
];

const OFFLINE =
  'Помощник временно недоступен — но каталог открыть несложно: выберите сервис на главной или оставьте заявку, и мастер ответит в течение 5 минут.';

let uid = 0;
const nextId = () => `m${++uid}`;

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Sparkles size={13} className="text-white" />
        </span>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-zinc-900 text-white rounded-[18px] rounded-br-[6px]'
            : 'bg-white text-zinc-700 rounded-[18px] rounded-bl-[6px] border border-zinc-100'
        }`}
      >
        {m.text || '…'}
      </div>
    </div>
  );
}

/**
 * Плавающий «Помощник BroVerse»: стриминговые ответы ИИ (OpenRouter),
 * быстрые подсказки, кнопка «Оставить заявку».
 */
export default function AssistWidget({ onRequest }: { onRequest?: () => void }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: nextId(), role: 'assistant', text: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, open]);

  // Фон не скроллится, пока открыт чат
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);

    const userMsg: Msg = { id: nextId(), role: 'user', text: q };
    const replyId = nextId();
    setMsgs((prev) => [...prev, userMsg, { id: replyId, role: 'assistant', text: '' }]);

    const history = [...msgs, userMsg].slice(-6).map((m) => ({ role: m.role, content: m.text }));
    const ac = new AbortController();
    abortRef.current = ac;

    const setText = (fn: (t: string) => string) =>
      setMsgs((prev) => prev.map((m) => (m.id === replyId ? { ...m, text: fn(m.text) } : m)));

    try {
      const r = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history }),
        signal: ac.signal,
      });
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !r.body || type.includes('application/json')) {
        setText(() => OFFLINE);
        return;
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((t) => t + chunk);
      }
    } catch {
      if (!ac.signal.aborted) setText((t) => t || OFFLINE);
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMsgs([{ id: nextId(), role: 'assistant', text: GREETING }]);
    setBusy(false);
  }

  return (
    <>
      {/* Кнопка-призрак */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть Помощника BroVerse"
        className="fixed bottom-5 right-4 z-[90] inline-flex items-center gap-2 h-12 px-4 rounded-full bg-zinc-900 text-white text-[13px] font-bold shadow-xl shadow-black/25 hover:bg-zinc-800 active:scale-95 transition-all"
      >
        <Sparkles size={16} /> Помощник
      </button>

      {open && (
        <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-[420px] mx-4 bg-[#F2F2F7] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden flex flex-col anim-sheet sm:anim-pop h-[82vh] sm:h-[560px]">
            {/* Шапка */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center">
                  <Sparkles size={15} className="text-white" />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-zinc-900 leading-tight">Помощник BroVerse</p>
                  <p className="text-[11px] text-zinc-400">Подскажу услугу и что сделать самому</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={reset} aria-label="Начать заново" className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                  <RotateCcw size={15} className="text-zinc-400" />
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
                  <X size={18} className="text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Лента */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
              {msgs.map((m) => (
                <Bubble key={m.id} m={m} />
              ))}
              {busy && (
                <div className="flex justify-start">
                  <span className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mr-2">
                    <Loader2 size={13} className="text-white animate-spin" />
                  </span>
                  <div className="bg-white border border-zinc-100 rounded-[18px] rounded-bl-[6px] px-3.5 py-2.5 text-[13px] text-zinc-400">
                    Думаю…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Подсказки */}
            {!busy && (
              <div className="px-3.5 pb-1 shrink-0">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none' }}>
                  {QUICK.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => ask(q.question)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-[12px] font-semibold text-zinc-600 active:scale-95 transition-transform"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Поле ввода */}
            <div className="px-3.5 pb-3 pt-1 shrink-0 bg-[#F2F2F7]">
              {onRequest && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onRequest(); }}
                  className="w-full mb-2 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 text-white text-[13px] font-bold py-2.5 hover:bg-zinc-800 transition-colors"
                >
                  Оставить заявку <ChevronRight size={14} />
                </button>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); ask(input); }}
                className="flex items-center gap-2 bg-white rounded-[18px] border border-zinc-200 px-3 py-1.5 focus-within:border-zinc-400 transition-colors"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Опишите задачу…"
                  className="flex-1 bg-transparent text-[14px] outline-none py-2 text-zinc-800 placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Отправить"
                  className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
