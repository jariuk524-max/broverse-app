'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { Chip } from '@/lib/search-types';

const uid = () => Math.random().toString(36).slice(2, 8);
const MAX_CHIPS = 30;

type ChipRow = Chip & { key: string };

const withKeys = (list: Chip[]): ChipRow[] => list.map((c) => ({ ...c, key: uid() }));

/**
 * Вкладка «Подсказки» кабинета руководителя: карусель под поиском на сайте —
 * подпись, запрос, фото. Порядок строк = порядок карусели.
 */
export default function HintsTab() {
  const [chips, setChips] = useState<ChipRow[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/admin/chips')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setChips(Array.isArray(d?.chips) ? withKeys(d.chips) : []))
      .catch(() => setChips([]));
  }, []);

  const patch = (key: string, p: Partial<Chip>) => {
    setChips((prev) => (prev ? prev.map((c) => (c.key === key ? { ...c, ...p } : c)) : prev));
    setDirty(true);
  };

  const move = (key: string, dir: -1 | 1) => {
    setChips((prev) => {
      if (!prev) return prev;
      const i = prev.findIndex((c) => c.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  };

  const add = () => {
    setChips((prev) => (prev && prev.length < MAX_CHIPS ? [...prev, { key: uid(), text: 'Новая подсказка', query: '', img: '' }] : prev));
    setDirty(true);
  };

  const remove = (key: string) => {
    setChips((prev) => (prev ? prev.filter((c) => c.key !== key) : prev));
    setDirty(true);
  };

  const upload = async (key: string, file: File) => {
    setUploading(key);
    setMsg(null);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
      });
      const name = chips?.find((c) => c.key === key)?.text || 'chip';
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chip', name, data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.path) throw new Error(json?.error || 'Ошибка загрузки');
      patch(key, { img: json.path });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    const list = (chips || []).filter((c) => c.text.trim() && c.query.trim());
    if (list.length === 0) {
      setMsg('Оставьте хотя бы одну подсказку с подписью и запросом');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chips: list.map(({ text, query, img }) => ({ text, query, img })) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Не удалось сохранить');
      setChips(withKeys(json.chips));
      setDirty(false);
      setMsg('Сохранено — карусель на сайте обновилась');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!chips) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[16px] p-4 shadow-sm">
        <p className="text-[13px] font-bold text-zinc-900">Карусель подсказок под поиском</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Подпись — что видит клиент, запрос — что уходит в поиск, фото — картинка на чипе
          (без фото чип оформится тёмным градиентом). Порядок строк = порядок карусели.
        </p>
      </div>

      <div className="space-y-3">
        {chips.map((c, i) => (
          <div key={c.key} className="bg-white rounded-[16px] p-3.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileRefs.current[c.key]?.click()}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors"
                  title={c.img ? 'Заменить фото' : 'Добавить фото'}
                >
                  {c.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={18} />
                  )}
                  {uploading === c.key && (
                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-white" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fileRefs.current[c.key]?.click()}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  {c.img ? 'заменить' : '+ фото'}
                </button>
                <input
                  ref={(el) => {
                    fileRefs.current[c.key] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(c.key, f);
                    e.target.value = '';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={c.text}
                  onChange={(e) => patch(c.key, { text: e.target.value })}
                  placeholder="Подпись на чипе"
                  className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
                <input
                  value={c.query}
                  onChange={(e) => patch(c.key, { query: e.target.value })}
                  placeholder="Запрос для поиска (напр. «химчистка мебели»)"
                  className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[13px] text-zinc-700 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(c.key, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-200 transition-colors"
                  title="Выше"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(c.key, 1)}
                  disabled={i === chips.length - 1}
                  className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-200 transition-colors"
                  title="Ниже"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.key)}
                  className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={chips.length >= MAX_CHIPS}
        className="w-full py-3 rounded-full bg-white border-2 border-dashed border-zinc-300 text-[13px] font-bold text-zinc-600 flex items-center justify-center gap-1.5 hover:border-zinc-400 transition-colors disabled:opacity-50"
      >
        <Plus size={15} /> Добавить подсказку
      </button>

      {msg && (
        <button type="button" onClick={() => setMsg(null)} className="text-[12px] text-center text-zinc-600 hover:text-zinc-900 transition-colors">
          {msg}
        </button>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="w-full py-3.5 rounded-full bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-black/10 active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {dirty ? 'Сохранить изменения' : 'Сохранено'}
      </button>
    </div>
  );
}
