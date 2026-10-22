'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, X } from 'lucide-react';

type ChatMsg = { id: string; from: 'client' | 'master'; text: string; at: string };

function formatAt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Чат клиент↔мастер по заявке (клиент — участник, from: 'client') */
export default function OrderChat({ orderId }: { orderId?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Загрузка + опрос, пока чат открыт
  useEffect(() => {
    if (!open || !orderId) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/order-chat?order_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (alive && Array.isArray(data.messages)) setMsgs(data.messages);
      } catch { /* сеть недоступна — попробуем на следующем тике */ }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [open, orderId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, open]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending || !orderId) return;
    setSending(true);
    try {
      const res = await fetch('/api/order-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, from: 'client', text: value }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMsgs(data.messages);
        setText('');
      }
    } catch { /* текст оставляем — отправите повторно */ }
    setSending(false);
    inputRef.current?.focus();
  };

  if (!orderId) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 text-zinc-700 rounded-2xl text-[12px] font-bold hover:bg-zinc-200 transition-colors"
      >
        <MessageCircle size={14} /> Написать мастеру
      </button>
    );
  }

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <MessageCircle size={13} className="text-[#00BCD4]" />
          <p className="text-[11px] font-bold text-zinc-700">Чат с мастером</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="p-1 text-zinc-400 active:scale-90">
          <X size={14} />
        </button>
      </div>

      <div className="max-h-44 overflow-y-auto px-3 py-2 space-y-1.5">
        {msgs.length === 0 && (
          <p className="text-[10px] text-zinc-400 text-center py-2">
            Напишите мастеру — сообщение появится в его кабинете по заявке
          </p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-[11px] leading-snug ${
                m.from === 'client' ? 'bg-[#00BCD4] text-white' : 'bg-white border border-zinc-200 text-zinc-700'
              }`}
            >
              <p className="break-words">{m.text}</p>
              <p className={`text-[8px] mt-0.5 text-right ${m.from === 'client' ? 'text-white/70' : 'text-zinc-400'}`}>
                {formatAt(m.at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
          placeholder="Сообщение мастеру…"
          className="flex-1 min-w-0 bg-white border border-zinc-200 rounded-xl px-2.5 py-2 text-[11px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#00BCD4]"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          className="shrink-0 w-8 h-8 rounded-xl bg-[#00BCD4] text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
