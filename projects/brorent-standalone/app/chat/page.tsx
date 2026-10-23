'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessageCircle, Send, Home, Paperclip } from 'lucide-react';
import ConsentCheckbox from '@/components/ConsentCheckbox';
import DevStub from '@/components/DevStub';
import { DATA_COLLECTION_LOCKED } from '@/lib/site-config';
import { useDataUnlocked } from '@/lib/data-lock';
import { useClientAuth } from '@/lib/use-client-auth';

type ChatMsg = {
  id: string;
  from: 'admin' | 'staff' | 'client' | 'master';
  author?: string;
  login?: string;
  text: string;
  created_at: string;
  file?: { url: string; name: string; mime: string } | null;
};

type Profile = {
  threadId: string;
  kind: 'client' | 'master';
  title: string;
};

const PHONE_KEY = 'broverse_chat_phone';

/** «74954445566» → «+7 (495) 444-55-66» */
function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  const core = d.replace(/^[78]/, '');
  if (!core) return d ? `+${d[0]}` : '';
  let out = '+7';
  if (core.length) out += ` (${core.slice(0, 3)}`;
  if (core.length >= 3) out += ')';
  if (core.length > 3) out += ` ${core.slice(3, 6)}`;
  if (core.length > 6) out += `-${core.slice(6, 8)}`;
  if (core.length > 8) out += `-${core.slice(8, 10)}`;
  return out;
}

function digitsOf(s: string): string {
  return s.replace(/\D/g, '');
}

/** «8999…» / «999…» → канон «7999…» для сравнения с сессией */
function canon(d: string): string {
  if (d.length === 11 && d[0] === '8') return '7' + d.slice(1);
  if (d.length === 10 && d[0] === '9') return '7' + d;
  return d;
}

export default function ChatPage() {
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdConsent, setPdConsent] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Вход клиента: телефон + код из бота (cookie bv_client)
  const auth = useClientAuth();

  const load = useCallback(async (p: string) => {
    const r = await fetch(`/api/chat?phone=${encodeURIComponent(p)}`).catch(() => null);
    if (r && r.ok) {
      const d = await r.json().catch(() => null);
      if (d) {
        setProfile({ threadId: d.threadId, kind: d.kind, title: d.title });
        setMsgs(Array.isArray(d.messages) ? d.messages : []);
        setErr('');
        try { localStorage.setItem(PHONE_KEY, p); } catch { /* приватный режим */ }
        return;
      }
    }
    if (r?.status === 401) {
      setProfile(null);
      setMsgs(null);
      setErr('Требуется вход: подтвердите номер кодом из бота.');
      return;
    }
    setErr('Не удалось открыть чат. Проверьте номер и попробуйте ещё раз.');
  }, []);

  // Автовход: ранее сохранённый номер — только при валидной сессии на этот же телефон
  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem(PHONE_KEY) || ''; } catch { /* нет доступа */ }
    if (digitsOf(saved).length < 10) return;
    setPhone(formatPhone(digitsOf(saved)));
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/client-auth', { cache: 'no-store' });
        const d = await r.json().catch(() => ({ session: null }));
        const s = d.session || null;
        if (alive && s && canon(digitsOf(saved)) === String(s.phone || '')) {
          setLoading(true);
          await load(saved);
          setLoading(false);
        }
      } catch { /* без сессии — вводим номер вручную */ }
    })();
    return () => { alive = false; };
  }, [load]);

  // Подтягивание новых сообщений
  useEffect(() => {
    if (!profile || digitsOf(phone).length < 10) return;
    const t = setInterval(() => { load(phone); }, 5000);
    return () => clearInterval(t);
  }, [profile, phone, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const open = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = digitsOf(phone);
    if (digits.length < 10 || busy || !pdConsent) return; // 152-ФЗ
    setBusy(true);
    setErr('');
    // Чужая активная сессия → выходим и входим под введённым номером
    if (auth.session && canon(digits) !== String(auth.session.phone || '')) {
      await auth.logout();
    }
    const s = await auth.ensure(phone);
    if (!s) { setBusy(false); return; }
    setLoading(true);
    await load(phone);
    setLoading(false);
    setBusy(false);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy || !profile || !pdConsent) return; // 152-ФЗ
    setBusy(true);
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text: t }),
    }).catch(() => null);
    if (r && r.ok) {
      setText('');
      await load(phone);
    } else if (r?.status === 401) {
      setErr('Сессия истекла — откройте чат заново и подтвердите номер кодом из бота.');
      setProfile(null);
      setMsgs(null);
    } else {
      const d = await r?.json().catch(() => null);
      setErr(d?.error || 'Не удалось отправить сообщение');
    }
    setBusy(false);
  };

  const logout = () => {
    try { localStorage.removeItem(PHONE_KEY); } catch { /* нет доступа */ }
    auth.logout();
    setProfile(null);
    setMsgs(null);
    setPhone('');
    setText('');
    setErr('');
  };

  // 152-ФЗ: на время разработки вход закрыт заглушкой — данные не собираются
  const dataUnlocked = useDataUnlocked();
  if (DATA_COLLECTION_LOCKED && !dataUnlocked) return <DevStub variant="page" title="Чат временно закрыт" />;

  /* ── Вход по номеру ── */
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F2F2F7]">
        <HeaderBar />
        <main className="max-w-xl mx-auto px-4 pt-6 pb-16">
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
              <MessageCircle size={22} className="text-white" />
            </div>
            <h1 className="text-[22px] font-black text-zinc-900 leading-tight">Чат BroVerse</h1>
            <p className="text-[14px] text-zinc-500 mt-2 leading-relaxed">
              Переписка с поддержкой BroVerse: клиенты и мастера — по номеру телефона.
              История сохраняется всегда.
            </p>

            <form onSubmit={open} className="mt-5 space-y-3">
              <div>
                <label htmlFor="chat-phone" className="block text-[13px] font-bold text-zinc-700 mb-1.5">
                  Номер телефона
                </label>
                <input
                  id="chat-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(digitsOf(e.target.value)))}
                  placeholder="+7 (___) ___-__-__"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                />
              </div>
              {err && <p className="text-[13px] text-red-500">{err}</p>}
              <div className="pt-1">
                <ConsentCheckbox checked={pdConsent} onChange={setPdConsent} />
              </div>
              <button
                type="submit"
                disabled={busy || loading || digitsOf(phone).length < 10 || !pdConsent}
                className="w-full px-5 py-3.5 rounded-2xl bg-zinc-900 text-white text-[15px] font-bold active:scale-[0.99] transition-transform disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                Открыть чат
              </button>
            </form>

            <p className="text-[12px] text-zinc-400 mt-4 leading-relaxed">
              Первый вход — по номеру и коду из бота (без пароля). Дальше чат откроется сразу:
              история сохраняется всегда. У мастеров — чат их кабинета, у клиентов — чат по заявкам.
            </p>
          </div>

          <div className="flex justify-center mt-5">
            <Link href="/" className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-500 hover:text-zinc-700">
              <Home size={14} /> На главную
            </Link>
          </div>
        </main>
        {auth.sheet}
      </div>
    );
  }

  /* ── Лента переписки ── */
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      <HeaderBar
        title={profile.title}
        subtitle={profile.kind === 'master' ? 'Вы входите как мастер' : 'Вы входите как клиент'}
        action={
          <button type="button" onClick={logout} className="text-[12px] font-bold text-zinc-500 hover:text-zinc-800">
            Сменить номер
          </button>
        }
      />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 pb-5 flex flex-col min-h-0">
        <div className="flex-1 bg-white rounded-[24px] shadow-sm p-4 flex flex-col min-h-[60vh] max-h-[calc(100vh-190px)]">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {msgs === null && (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-500" /></div>
            )}
            {msgs && msgs.length === 0 && (
              <div className="text-center py-16">
                <MessageCircle size={36} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-[14px] text-zinc-500 font-bold">Напишите первое сообщение</p>
                <p className="text-[13px] text-zinc-400 mt-1">Поддержка BroVerse ответит здесь</p>
              </div>
            )}
            {(msgs || []).map((m) => {
              const own = m.from === profile.kind;
              return (
                <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${own ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                    {!own && <p className="text-[12px] font-bold text-zinc-500 mb-1">{m.author || 'Поддержка BroVerse'}</p>}
                    {m.file && (m.file.mime.startsWith('image/') ? (
                      <a href={m.file.url} target="_blank" rel="noreferrer" className="block mb-1">
                        <img src={m.file.url} alt={m.file.name} className="rounded-xl max-w-[240px] max-h-[240px] object-cover" />
                      </a>
                    ) : (
                      <a href={m.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 mb-1 text-[13px] font-semibold bg-white text-zinc-700 max-w-[240px]">
                        <Paperclip size={14} className="shrink-0" />
                        <span className="truncate">{m.file.name}</span>
                      </a>
                    ))}
                    {m.text && <p className="text-[15px] leading-snug break-words">{m.text}</p>}
                    <p className={`text-[10px] mt-1 ${own ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {new Date(m.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Сообщение…"
              maxLength={1000}
              className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="shrink-0 w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
          {err && <p className="text-[13px] text-red-500 mt-2">{err}</p>}
        </div>

        <div className="flex justify-center mt-4">
          <Link href="/" className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-500 hover:text-zinc-700">
            <Home size={14} /> На главную
          </Link>
        </div>
      </main>
      {auth.sheet}
    </div>
  );
}

function HeaderBar({ title, subtitle, action }: { title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="max-w-xl mx-auto w-full px-4 pt-5 pb-3 flex items-center gap-3">
      <Link href="/" aria-label="На главную" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-600 active:scale-95 transition-transform">
        <ArrowLeft size={17} />
      </Link>
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <p className="text-[16px] font-black text-zinc-900 truncate">{title}</p>
            {subtitle && <p className="text-[12px] text-zinc-500">{subtitle}</p>}
          </>
        ) : (
          <p className="text-[16px] font-black text-zinc-900">Чат BroVerse</p>
        )}
      </div>
      {action}
    </header>
  );
}
