'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { MASTER_DIRECTIONS } from '@/lib/master-ads';

const INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-[13px] text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-zinc-400 transition-colors';

/** datetime-local значение из даты (локальное время) */
const toLocalInput = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const PROMO_TEMPLATES = [
  {
    id: 'direction',
    label: 'Новое направление',
    title: 'Откройте новое направление',
    body: 'Для увеличения дохода предлагаем открыть для себя новое направление — это займёт 1 минуту, а ваш доход вырастет существенно.',
    cta: 'Открыть направление',
    action: 'brocare' as const,
    url: '',
  },
  {
    id: 'services',
    label: 'Создать свои услуги',
    title: 'Создайте свои услуги',
    body: 'Напоминаем: вы можете создать свои услуги в профиле — после одобрения клиенты смогут писать вам напрямую и отправлять заявки.',
    cta: 'Создать услугу',
    action: 'services' as const,
    url: '',
  },
  {
    id: 'custom',
    label: 'Свой текст',
    title: '',
    body: '',
    cta: 'Забрать уровень',
    action: '' as const,
    url: '',
  },
] as const;

export type PromoTemplateId = (typeof PROMO_TEMPLATES)[number]['id'];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  masters: { id: string; name: string }[];
  /** Акция создаётся для конкретного мастера (карточка в карусели) */
  presetMaster?: { id: string; name: string } | null;
};

export default function PromoEditor({ open, onClose, onCreated, masters, presetMaster }: Props) {
  const [templateId, setTemplateId] = useState<PromoTemplateId>(presetMaster ? 'custom' : 'direction');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [cta, setCta] = useState('');
  const [url, setUrl] = useState('');
  const [action, setAction] = useState<'' | 'brocare' | 'services'>('');
  const [audience, setAudience] = useState('');
  const [audKind, setAudKind] = useState<'all' | 'group' | 'master'>(presetMaster ? 'master' : 'all');
  const [group, setGroup] = useState(Object.keys(MASTER_DIRECTIONS)[0] || 'cleaning');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    const t = PROMO_TEMPLATES.find((x) => x.id === (presetMaster ? 'custom' : 'direction'))!;
    setTemplateId(presetMaster ? 'custom' : 'direction');
    setTitle(t.title);
    setText(t.body);
    setCta(t.cta);
    setUrl(t.url);
    setAction(t.action);
    setAudKind(presetMaster ? 'master' : 'all');
    setAudience(presetMaster?.id || '');
    setGroup(Object.keys(MASTER_DIRECTIONS)[0] || 'cleaning');
    setStartAt(toLocalInput(new Date()));
    setEndAt(toLocalInput(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
    setErr('');
  }, [open, presetMaster]);

  if (!open) return null;

  const applyTemplate = (id: PromoTemplateId) => {
    const t = PROMO_TEMPLATES.find((x) => x.id === id)!;
    setTemplateId(id);
    setTitle(t.title);
    setText(t.body);
    setCta(t.cta);
    setUrl(t.url);
    setAction(t.action);
  };

  const effAudience = audKind === 'all' ? '' : audKind === 'group' ? `direction:${group}` : audience;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: text,
          cta,
          audience: effAudience,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          url,
          action,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({} as { error?: string }));
        setErr(d.error || 'Не удалось создать акцию');
        return;
      }
      onCreated?.();
      onClose();
    } catch {
      setErr('Сеть недоступна — попробуйте позже');
    } finally {
      setBusy(false);
    }
  };

  const masterName = presetMaster
    ? presetMaster.name
    : audKind === 'master'
      ? masters.find((m) => m.id === audience)?.name || audience
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 sticky top-0 bg-white">
          <p className="text-[13px] font-bold text-zinc-900">
            Новая акция{presetMaster ? ` · ${presetMaster.name}` : ''}
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-zinc-100 active:scale-90 transition-transform">
            <X size={13} />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-3">
          {!presetMaster && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Шаблон</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMO_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold active:scale-95 transition-transform ${
                      templateId === t.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Кому показать</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(
                [
                  ['all', 'Все мастера'],
                  ['group', 'Группа по направлению'],
                  ['master', 'Конкретный мастер'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  disabled={!!presetMaster && k !== 'master'}
                  onClick={() => {
                    setAudKind(k);
                    if (k === 'master' && !presetMaster && !audience && masters[0]) setAudience(masters[0].id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold active:scale-95 transition-transform disabled:opacity-40 ${
                    audKind === k ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {audKind === 'group' && (
              <select value={group} onChange={(e) => setGroup(e.target.value)} className={INPUT}>
                {Object.entries(MASTER_DIRECTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
            )}
            {audKind === 'master' && !presetMaster && (
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className={INPUT}>
                {masters.length === 0 && <option value="master-1">Евгений (демо)</option>}
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок*" className={INPUT} maxLength={200} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст акции для мастера (необязательно)"
            rows={3}
            className={`${INPUT} resize-none`}
            maxLength={1000}
          />
          <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Кнопка: Забрать уровень" className={INPUT} maxLength={60} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Ссылка по кнопке (необязательно): https://..."
            className={INPUT}
            maxLength={300}
            disabled={action === 'brocare' || action === 'services'}
          />
          {action && (
            <p className="text-[10.5px] text-zinc-600 -mt-1">
              Кнопка откроет мастера:{' '}
              {action === 'brocare' ? 'профиль с шагом открытия нового направления' : 'профиль с разделом создания услуг'}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Показывать с</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">до</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={INPUT} />
            </div>
          </div>
          {err && <p className="text-[11px] font-semibold text-red-500">{err}</p>}
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="w-full py-3 rounded-full bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Запустить акцию{masterName ? ` · ${masterName}` : effAudience.startsWith('direction:') ? ' · группа' : ''}
          </button>
        </form>
      </div>
    </div>
  );
}
