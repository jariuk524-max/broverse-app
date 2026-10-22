'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, X, Loader2, Paperclip, Users } from 'lucide-react';

type Contact = {
  id: string;
  title: string;
  subtitle?: string;
  avatar_url?: string | null;
};

type ContactsData = {
  me: { login: string; name: string; avatar_url?: string | null };
  chief: Contact[];
  employees: Contact[];
  masters: Contact[];
};

type ChatFile = { url: string; name: string; mime: string };

type Msg = {
  id: string;
  from: 'admin' | 'staff' | 'client' | 'master';
  author?: string;
  text: string;
  created_at: string;
  file?: ChatFile | null;
};

const MAX_FILE = 5 * 1024 * 1024;

function Avatar({ url, name, size = 40, dark = false }: { url?: string | null; name: string; size?: number; dark?: boolean }) {
  const style = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="rounded-full object-cover shrink-0" style={style} />;
  }
  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 font-black ${dark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600'}`}
      style={{ ...style, fontSize: size * 0.36 }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function FileView({ file, own }: { file: ChatFile; own: boolean }) {
  const isImg = file.mime.startsWith('image/');
  if (isImg) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.url} alt={file.name} className="rounded-xl max-w-[220px] max-h-[220px] object-cover" />
      </a>
    );
  }
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1 text-[12.5px] font-semibold max-w-[240px] ${
        own ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-700'
      }`}
    >
      <Paperclip size={13} className="shrink-0" />
      <span className="truncate">{file.name}</span>
    </a>
  );
}

function Group({ label, items, onPick, activeId, me }: { label: string; items: Contact[]; onPick: (c: Contact) => void; activeId?: string; me: ContactsData['me'] }) {
  if (!items.length) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 mb-1">{label}</p>
      <div className="bg-white rounded-[18px] shadow-sm overflow-hidden">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c)}
            className={`w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-zinc-50 transition-colors ${
              activeId === c.id ? 'bg-zinc-50' : ''
            }`}
          >
            <Avatar url={c.avatar_url} name={c.title} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-zinc-900 truncate">
                {c.title}
                {c.id === `emp:${me.login}` && <span className="text-zinc-400 font-semibold"> (вы)</span>}
              </p>
              {c.subtitle && <p className="text-[11px] text-zinc-500 truncate">{c.subtitle}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * «Поддержка» в админке — чаты с людьми (по принципу «Помощника» с главной):
 * руководитель проекта, созданные руководителем кабинеты, мастера.
 * Имя и фото в списке и в ленте, внизу строка ввода со скрепкой (файлы).
 */
export default function SupportChat({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: { login: string; display_name: string; roles: string[]; avatar_url?: string | null };
}) {
  const [contacts, setContacts] = useState<ContactsData | null>(null);
  const [active, setActive] = useState<Contact | null>(null);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [attach, setAttach] = useState<{ data: string; name: string; mime: string; size: number } | null>(null);
  const [err, setErr] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const mySide: 'admin' | 'staff' = session.roles.includes('team') ? 'admin' : 'staff';
  const me = contacts?.me || { login: session.login, name: session.display_name || session.login, avatar_url: session.avatar_url };

  /* Контакты — при первом открытии */
  useEffect(() => {
    if (!open || contacts) return;
    fetch('/api/admin/chat/contacts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.chief)) setContacts(d);
      })
      .catch(() => {});
  }, [open, contacts]);

  /* История треда + опрос */
  const loadMsgs = useCallback(async () => {
    if (!active) return;
    try {
      const r = await fetch(`/api/admin/chat?with=${encodeURIComponent(active.id)}`);
      if (r.ok) {
        const d = await r.json();
        setMsgs(Array.isArray(d?.messages) ? d.messages : []);
      } else setMsgs([]);
    } catch {
      setMsgs([]);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    setMsgs(null);
    loadMsgs();
    const t = setInterval(() => { if (!document.hidden) loadMsgs(); }, 5000);
    return () => clearInterval(t);
  }, [active, loadMsgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, active, open]);

  /* Фон не скроллится, пока открыта поддержка */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const pickFile = (f: File | null | undefined) => {
    setErr('');
    if (!f) return;
    if (f.size > MAX_FILE) { setErr('Файл больше 5 МБ'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setAttach({ data: String(reader.result || ''), name: f.name, mime: f.type || 'application/octet-stream', size: f.size });
    };
    reader.readAsDataURL(f);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || busy) return;
    const t = text.trim();
    if (!t && !attach) return;
    setBusy(true);
    setErr('');
    try {
      let file: ChatFile | null = null;
      if (attach) {
        const up = await fetch('/api/admin/chat-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: attach.name, data: attach.data }),
        });
        const ud = await up.json().catch(() => ({}));
        if (!up.ok) { setErr(ud.error || 'Не удалось загрузить файл'); return; }
        file = { url: ud.url, name: ud.name, mime: ud.mime };
      }
      const r = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: active.id,
          text: t,
          title: active.title,
          ...(file ? { file } : {}),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || 'Не удалось отправить');
        return;
      }
      setText('');
      setAttach(null);
      await loadMsgs();
    } catch {
      setErr('Сеть недоступна — попробуйте позже');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const groups: { label: string; items: Contact[] }[] = [
    { label: 'Руководитель проекта', items: contacts?.chief || [] },
    { label: 'Кабинеты руководителя', items: contacts?.employees || [] },
    { label: 'Мастера', items: contacts?.masters || [] },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] mx-4 bg-[#F2F2F7] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden flex flex-col anim-sheet sm:anim-pop h-[86vh] sm:h-[620px]">
        {/* Шапка */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {active && (
              <button
                type="button"
                onClick={() => { setActive(null); setMsgs(null); setAttach(null); setErr(''); }}
                aria-label="Назад"
                className="p-1.5 -ml-1.5 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <ArrowLeft size={18} className="text-zinc-500" />
              </button>
            )}
            {active ? (
              <>
                <Avatar url={active.avatar_url} name={active.title} size={36} />
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-zinc-900 leading-tight truncate">{active.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{active.subtitle || 'Поддержка BroVerse'}</p>
                </div>
              </>
            ) : (
              <>
                <span className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-zinc-900 leading-tight">Поддержка BroVerse</p>
                  <p className="text-[11px] text-zinc-400">Чаты: руководитель, кабинеты, мастера</p>
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="p-2 rounded-full hover:bg-zinc-100 transition-colors shrink-0">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {!active ? (
          /* ── Список контактов ── */
          <div className="flex-1 overflow-y-auto px-2.5 py-3">
            {!contacts ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : total === 0 ? (
              <p className="text-center text-[13px] text-zinc-500 py-16">Контактов пока нет</p>
            ) : (
              <>
                <p className="text-[12px] text-zinc-500 px-2.5 mb-3 leading-relaxed">
                  Напишите руководителю проекта, любому кабинету сотрудника или мастеру —
                  собеседник увидит сообщение в своём кабинете.
                </p>
                {groups.map((g) => (
                  <Group key={g.label} label={g.label} items={g.items} onPick={(c) => setActive(c)} me={me} />
                ))}
              </>
            )}
          </div>
        ) : (
          /* ── Лента ── */
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
            {msgs === null ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : msgs.length === 0 ? (
              <p className="text-center text-[12.5px] text-zinc-500 py-10 px-6 leading-relaxed">
                Сообщений пока нет. Напишите первым — {active.title} увидит сообщение в своём кабинете.
              </p>
            ) : (
              msgs.map((m) => {
                const own = m.from === mySide;
                const name = own ? me.name : m.author || active.title;
                const url = own ? me.avatar_url : active.avatar_url;
                const bubble = own ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-800 shadow-sm';
                return (
                  <div key={m.id} className={`flex gap-2 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar url={url} name={name} size={28} dark={own} />
                    <div className={`max-w-[78%] min-w-0 ${own ? 'items-end text-right' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
                      <p className="text-[11px] font-bold text-zinc-500 mb-0.5 px-1">{name}</p>
                      <div className={`rounded-[18px] px-3.5 py-2.5 ${bubble} ${own ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`}>
                        {m.file && <FileView file={m.file} own={own} />}
                        {m.text && <p className="text-[13.5px] leading-snug break-words whitespace-pre-wrap">{m.text}</p>}
                        <p className={`text-[9px] mt-1 ${own ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          {new Date(m.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Поле ввода со скрепкой */}
        {active && (
          <div className="px-3 pb-3 pt-1 shrink-0 bg-[#F2F2F7]">
            {err && <p className="text-[11.5px] font-semibold text-red-500 px-1 mb-1.5">{err}</p>}
            {attach && (
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-1.5 shadow-sm">
                <Paperclip size={13} className="text-zinc-500 shrink-0" />
                <span className="text-[12px] text-zinc-700 font-semibold truncate flex-1">{attach.name}</span>
                <span className="text-[10px] text-zinc-400 shrink-0">{Math.max(1, Math.round(attach.size / 1024))} КБ</span>
                <button type="button" onClick={() => setAttach(null)} aria-label="Убрать файл" className="shrink-0">
                  <X size={14} className="text-zinc-400 hover:text-zinc-700" />
                </button>
              </div>
            )}
            <form onSubmit={send} className="flex items-center gap-1.5 bg-white rounded-[18px] border border-zinc-200 pl-2 pr-1.5 py-1.5 focus-within:border-zinc-400 transition-colors">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Прикрепить файл"
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-zinc-100 transition-colors active:scale-95"
              >
                <Paperclip size={17} className="text-zinc-500" />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
              />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Сообщение: ${active.title}…`}
                className="flex-1 min-w-0 bg-transparent text-[14px] outline-none py-2 text-zinc-800 placeholder:text-zinc-400"
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={busy || (!text.trim() && !attach)}
                aria-label="Отправить"
                className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
