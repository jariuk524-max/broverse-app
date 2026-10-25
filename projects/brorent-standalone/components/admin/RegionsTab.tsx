'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Plus, Power, Save, Trash2 } from 'lucide-react';

type RegionRow = { id: string; name: string; enabled: boolean; lat: string; lng: string };

const uid = () => Math.random().toString(36).slice(2, 8);

/**
 * Вкладка «Города» кабинета руководителя: где работает BroVerse.
 * Выключенные регионы не видны в формах заказа и в регистрации мастеров.
 */
export default function RegionsTab() {
  const [rows, setRows] = useState<RegionRow[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/regions')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!Array.isArray(d?.regions)) {
          setRows([]);
          return;
        }
        setRows(
          d.regions.map((x: { id: string; name: string; enabled: boolean; lat: number; lng: number }) => ({
            id: x.id || uid(),
            name: x.name || '',
            enabled: Boolean(x.enabled),
            lat: String(x.lat ?? ''),
            lng: String(x.lng ?? ''),
          }))
        );
      })
      .catch(() => setRows([]));
  }, []);

  const patch = (id: string, p: Partial<RegionRow>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...p } : r)) : prev));
    setDirty(true);
  };

  const remove = (id: string) => {
    setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    setDirty(true);
  };

  const add = () => {
    setRows((prev) =>
      prev ? [...prev, { id: uid(), name: '', enabled: false, lat: '55.7558', lng: '37.6173' }] : prev
    );
    setDirty(true);
  };

  const save = async () => {
    const list = (rows || []).filter((r) => r.name.trim());
    if (list.length === 0) {
      setMsg('Оставьте хотя бы один регион');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions: list.map((r) => ({
            id: r.id,
            name: r.name.trim(),
            enabled: r.enabled,
            lat: Number(r.lat) || 0,
            lng: Number(r.lng) || 0,
          })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Не удалось сохранить');
      setRows(
        json.regions.map((x: { id: string; name: string; enabled: boolean; lat: number; lng: number }) => ({
          id: x.id,
          name: x.name,
          enabled: x.enabled,
          lat: String(x.lat),
          lng: String(x.lng),
        }))
      );
      setDirty(false);
      setMsg('Сохранено — города обновились во всех формах и у мастеров');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!rows) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  const activeCount = rows.filter((r) => r.enabled && r.name.trim()).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[16px] p-4 shadow-sm">
        <p className="text-[13px] font-bold text-zinc-900">Города и регионы работы BroVerse</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Включённые регионы видны в форме заказа у клиента и в выборе города у мастера. Заявка клиента
          попадает на карту только мастерам, включившим её регион. Выключенные города предлагаем мастерам
          как «скоро запуск». Сейчас активно: <b>{activeCount}</b>
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`bg-white rounded-[16px] p-3.5 shadow-sm flex items-center gap-3 ${
              r.enabled ? '' : 'opacity-70'
            }`}
          >
            <button
              type="button"
              onClick={() => patch(r.id, { enabled: !r.enabled })}
              title={r.enabled ? 'Выключить регион' : 'Включить регион'}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                r.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              <Power size={16} />
            </button>

            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input
                value={r.name}
                onChange={(e) => patch(r.id, { name: e.target.value })}
                placeholder="Название региона (напр. Республика Татарстан)"
                className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
              />
              <input
                value={r.lat}
                onChange={(e) => patch(r.id, { lat: e.target.value })}
                title="Широта центра региона"
                inputMode="decimal"
                className="w-full sm:w-24 rounded-xl bg-zinc-50 border border-zinc-200 px-2.5 py-2 text-[12px] text-zinc-600 focus:outline-none focus:border-zinc-400"
              />
              <input
                value={r.lng}
                onChange={(e) => patch(r.id, { lng: e.target.value })}
                title="Долгота центра региона"
                inputMode="decimal"
                className="w-full sm:w-24 rounded-xl bg-zinc-50 border border-zinc-200 px-2.5 py-2 text-[12px] text-zinc-600 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <button
              type="button"
              onClick={() => remove(r.id)}
              className="shrink-0 w-9 h-9 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Удалить регион"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-full bg-white border-2 border-dashed border-zinc-300 text-[13px] font-bold text-zinc-600 flex items-center justify-center gap-1.5 hover:border-zinc-400 transition-colors"
      >
        <Plus size={15} /> Добавить регион
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
        {dirty ? 'Сохранить города' : 'Сохранено'}
      </button>
    </div>
  );
}
