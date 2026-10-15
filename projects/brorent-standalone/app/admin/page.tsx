'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, XCircle, Trash2, Pencil, Save, RotateCcw, Loader2, Upload,
  ShieldCheck, Package, ImageIcon, Lock, Star, MessageSquare,
} from 'lucide-react';
import {
  listServiceRequests, setRequestStatus, deleteRequest,
  STATUS_LABEL, STATUS_COLOR, type ServiceRequest, type RequestStatus,
} from '@/lib/requests';

const PIN_KEY = 'broverse-admin-pin';

type CatalogService = { category: string; name: string; desc: string; price: string; time: string; image: string };
type ServiceEdit = { desc?: string; price?: string; time?: string; image?: string };
type CatalogData = {
  domains: Record<string, CatalogService[]>;
  edits: Record<string, Record<string, ServiceEdit>>;
};

const INPUT =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#EA4335] focus:ring-2 focus:ring-[#EA4335]/20 transition-all';

const DOMAIN_LABEL: Record<string, string> = {
  build: 'BroBuild', wash: 'BroWash', frame: 'BroFrame', move: 'BroMove',
  care: 'BroCare', verse: 'BroVerse', rent: 'BroRent',
};
const DOMAIN_ORDER = ['build', 'wash', 'frame', 'move', 'rent', 'care', 'verse'];

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<'orders' | 'catalog' | 'feedback'>('orders');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(PIN_KEY) : null;
    if (saved) setPin(saved);
  }, []);

  const tryAuth = useCallback(async (value: string) => {
    const res = await fetch('/api/admin/catalog', { headers: { 'x-admin-pin': value } });
    if (res.ok) {
      localStorage.setItem(PIN_KEY, value);
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }, []);

  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-[#F2F2F7] flex items-center justify-center px-4">
        <form
          onSubmit={(e) => { e.preventDefault(); tryAuth(pin); }}
          className="w-full max-w-[360px] bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 mb-1">BroVerse Админ</h1>
          <p className="text-[12px] text-zinc-400 mb-4">Введите PIN-код для входа в мини-ап</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN-код"
            className={INPUT}
            autoFocus
          />
          {pinError && <p className="text-[11px] text-rose-500 font-semibold mt-2">Неверный PIN-код</p>}
          <button type="submit" className="w-full mt-4 py-3 rounded-2xl bg-zinc-900 text-white text-sm font-bold active:scale-[0.98] transition-transform">
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold text-zinc-900 leading-tight">BroVerse Админ</h1>
              <p className="text-[10px] text-zinc-400">Модерация и каталог · @Broverse_Admin_bot</p>
            </div>
          </div>
          <div className="flex gap-1 bg-zinc-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${tab === 'orders' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              Заявки
            </button>
            <button
              type="button"
              onClick={() => setTab('feedback')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${tab === 'feedback' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              Отзывы
            </button>
            <button
              type="button"
              onClick={() => setTab('catalog')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${tab === 'catalog' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              Каталог
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-16">
        {tab === 'orders' ? <OrdersTab /> : tab === 'feedback' ? <FeedbackTab /> : <CatalogTab />}
      </main>
    </div>
  );
}

/* ────────────────────────── ЗАЯВКИ (модерация) ────────────────────────── */

function OrdersTab() {
  const [orders, setOrders] = useState<ServiceRequest[] | null>(null);
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(await listServiceRequests());
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approved' | 'rejected' | 'delete') => {
    setBusyId(id);
    if (action === 'delete') await deleteRequest(id);
    else await setRequestStatus(id, action);
    await load();
    setBusyId(null);
  };

  const orderDomain = (o: ServiceRequest): string => o.metadata?.domain || '—';

  const visible = useMemo(() => {
    if (!orders) return [];
    let list = orders;
    if (filter !== 'all') list = list.filter((o) => o.status === filter);
    if (domainFilter !== 'all') list = list.filter((o) => orderDomain(o) === domainFilter);
    return list;
  }, [orders, filter, domainFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length || 0 };
    (orders || []).forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    (orders || []).forEach((o) => set.add(orderDomain(o)));
    return Array.from(set).sort();
  }, [orders]);

  if (!orders) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  const filters: { id: 'all' | RequestStatus; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'new', label: 'Новые' },
    { id: 'review', label: 'На рассмотрении' },
    { id: 'approved', label: 'Одобрены' },
    { id: 'rejected', label: 'Отклонены' },
  ];

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${filter === f.id ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 shadow-sm'}`}
          >
            {f.label} {counts[f.id] ? `· ${counts[f.id]}` : ''}
          </button>
        ))}
      </div>

      {domains.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setDomainFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${domainFilter === 'all' ? 'bg-[#EA4335] text-white' : 'bg-white text-zinc-400 shadow-sm'}`}
          >
            Все сайты
          </button>
          {domains.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomainFilter(d)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${domainFilter === d ? 'bg-[#EA4335] text-white' : 'bg-white text-zinc-400 shadow-sm'}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
          <Package size={28} className="text-zinc-300 mx-auto mb-2" />
          <p className="text-[13px] text-zinc-400">Заявок пока нет</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((o) => {
          const meta = o.metadata || {};
          const price = meta.proposed_price || (meta.price ? String(meta.price) : '');
          return (
            <div key={o.id} className="bg-white rounded-[20px] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 leading-tight">{o.service_name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {new Date(o.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                    {meta.domain ? ` · ${meta.domain}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_COLOR[o.status] || 'bg-zinc-100 text-zinc-500'}`}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                <Row label="📞 Телефон" value={o.client_phone || '—'} />
                {o.client_name && <Row label="👤 Имя" value={o.client_name} />}
                {o.address && <Row label="📍 Адрес" value={o.address} />}
                {price && <Row label="💰 Цена" value={`${price} ₽`} />}
                {meta.description && <Row label="📝 Описание" value={meta.description} />}
                {meta.comment && <Row label="💬 Комментарий" value={meta.comment} />}
                {meta.photo && (
                  <div className="pt-1">
                    <img src={meta.photo} alt="Фото заявки" className="w-full max-h-48 object-cover rounded-xl" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {o.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    {busyId === o.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Одобрить
                  </button>
                )}
                {o.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 text-rose-500 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    <XCircle size={13} /> Отклонить
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => act(o.id, 'delete')}
                  className="w-11 flex items-center justify-center py-2.5 rounded-xl bg-zinc-50 text-zinc-400 active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-zinc-600">
      <span className="text-zinc-400">{label}: </span>
      <span className="font-semibold text-zinc-800">{value}</span>
    </p>
  );
}

/* ────────────────────────── ОТЗЫВЫ ────────────────────────── */

function FeedbackTab() {
  const [orders, setOrders] = useState<ServiceRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(await listServiceRequests());
  }, []);

  useEffect(() => { load(); }, [load]);

  const withFeedback = useMemo(
    () => (orders || []).filter((o) => o.metadata?.feedback),
    [orders]
  );

  const remove = async (id: string) => {
    setBusyId(id);
    await deleteRequest(id);
    await load();
    setBusyId(null);
  };

  if (!orders) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  if (withFeedback.length === 0) {
    return (
      <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
        <MessageSquare size={28} className="text-zinc-300 mx-auto mb-2" />
        <p className="text-[13px] text-zinc-400">Отзывов пока нет</p>
        <p className="text-[11px] text-zinc-300 mt-1">Клиенты оставляют их после связи со специалистом</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {withFeedback.map((o) => {
        const fb = o.metadata!.feedback!;
        return (
          <div key={o.id} className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-zinc-900 leading-tight">{o.service_name}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {new Date(fb.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                  {o.metadata?.domain ? ` · ${o.metadata.domain}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === o.id}
                onClick={() => remove(o.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 active:scale-95 transition-transform disabled:opacity-40 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${fb.resolved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                {fb.resolved ? '✓ Вопрос решён' : '✗ Вопрос не решён'}
              </span>
            </div>

            {fb.rating ? (
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= fb.rating! ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'} />
                ))}
              </div>
            ) : null}

            {fb.comment && (
              <p className="text-[12px] text-zinc-600 bg-zinc-50 rounded-xl p-3 leading-relaxed">{fb.comment}</p>
            )}

            <p className="text-[11px] text-zinc-400 mt-2">
              📞 {o.client_phone || '—'}{o.client_name ? ` · ${o.client_name}` : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────── КАТАЛОГ (редактирование) ────────────────────────── */

function CatalogTab() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [domain, setDomain] = useState<string>('build');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ServiceEdit>({});

  const pin = typeof window !== 'undefined' ? localStorage.getItem(PIN_KEY) || '' : '';

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/catalog', { headers: { 'x-admin-pin': pin } });
    if (res.ok) setData(await res.json());
  }, [pin]);

  useEffect(() => { load(); }, [load]);

  const services = data?.domains?.[domain] || [];
  const edits = data?.edits?.[domain] || {};

  const startEdit = (s: CatalogService) => {
    setEditing(s.name);
    setForm({ ...(edits[s.name] || {}) });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await fetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ domain, service: editing, fields: form }),
    });
    await load();
    setBusy(false);
    setEditing(null);
  };

  const revert = async (name: string) => {
    setBusy(true);
    await fetch('/api/admin/catalog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ domain, service: name }),
    });
    await load();
    setBusy(false);
  };

  const uploadPhoto = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: domain, type: 'service-photo', serviceName: editing, data: dataUrl }),
      });
      const json = await res.json();
      if (json.path) setForm((f) => ({ ...f, image: json.path }));
    } finally {
      setUploading(false);
    }
  };

  if (!data) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  let lastCategory = '';

  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-1 px-1">
        {DOMAIN_ORDER.filter((d) => data?.domains?.[d]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => { setDomain(d); setEditing(null); }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${domain === d ? 'bg-[#EA4335] text-white shadow-sm' : 'bg-white text-zinc-500 shadow-sm'}`}
          >
            {DOMAIN_LABEL[d] || d} · {(data?.domains?.[d] || []).length}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-zinc-400 mb-3 px-1">
        Правки сохраняются и сразу отображаются на страницах сервисов. Кнопка ↻ возвращает оригинал из кода.
      </p>

      <div className="space-y-2.5">
        {services.map((s) => {
          const isEdited = !!edits[s.name];
          const isEditing = editing === s.name;
          const current = { ...s, ...(edits[s.name] || {}) };

          const header = s.category !== lastCategory ? (
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 pt-2">{s.category}</p>
          ) : null;
          lastCategory = s.category;

          return (
            <div key={s.name}>
              {header}
              <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.image} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-zinc-900 truncate">{s.name}</p>
                      {isEdited && <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[9px] font-bold">изменено</span>}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">{current.desc}</p>
                    <p className="text-[11px] font-bold text-zinc-700 mt-0.5">{current.price} ₽ · {current.time}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditing(null) : startEdit(s))}
                      className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform"
                    >
                      {isEditing ? <XCircle size={15} /> : <Pencil size={15} />}
                    </button>
                    {isEdited && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => revert(s.name)}
                        className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 active:scale-95 transition-transform"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-zinc-100 p-3 space-y-2.5 bg-zinc-50/50">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Описание</label>
                      <textarea value={form.desc ?? s.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={2} className={`${INPUT} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Цена, ₽</label>
                        <input value={form.price ?? s.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={INPUT} inputMode="numeric" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Время</label>
                        <input value={form.time ?? s.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Фото (путь/URL)</label>
                      <input value={form.image ?? s.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className={INPUT} />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-600 active:scale-95 transition-transform disabled:opacity-40"
                        >
                          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Загрузить фото
                        </button>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.image ?? s.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={save}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Сохранить
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-zinc-300">
        <ImageIcon size={11} /> Фото загружаются в /hero и попадают на страницы сервисов
      </div>
    </div>
  );
}
