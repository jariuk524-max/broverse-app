'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, XCircle, Pencil, Save, RotateCcw, Loader2, Upload,
  ShieldCheck, Package, ImageIcon, Lock, Star, MessageSquare,
  LogOut, User, History, Plus,
} from 'lucide-react';
import {
  listServiceRequests,
  STATUS_LABEL, STATUS_COLOR, type ServiceRequest, type RequestStatus,
} from '@/lib/requests';
import { unlockDirectionForMaster } from '@/lib/admin/unlock';

type Session = {
  login: string;
  display_name: string;
  roles: string[];
  password_set_at: string | null;
  last_login_at: string | null;
};

type TabId = 'orders' | 'masters' | 'feedback' | 'catalog' | 'audit' | 'team';

const TABS: { id: TabId; label: string; role: string | null }[] = [
  { id: 'orders', label: 'Заявки', role: 'requests' },
  { id: 'masters', label: 'Мастера', role: 'masters' },
  { id: 'feedback', label: 'Отзывы', role: 'feedback' },
  { id: 'catalog', label: 'Каталог', role: 'catalog' },
  { id: 'audit', label: 'Аудит', role: null },
  { id: 'team', label: 'Команда', role: 'team' },
];

const ROLE_LABEL: Record<string, string> = {
  requests: 'Заявки',
  feedback: 'Отзывы',
  catalog: 'Каталог',
  masters: 'Мастера',
  team: 'Команда',
};

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
  garden: 'BroGarden', verse: 'BroVerse', rent: 'BroRent',
};
const DOMAIN_ORDER = ['build', 'wash', 'frame', 'move', 'rent', 'garden', 'verse'];
const DOMAIN_BADGE: Record<string, string> = { master: 'Анкета мастера' };

const UNLOCK_DIR_LABEL: Record<string, string> = {
  cleaning: 'Химчистка', plumbing: 'Сантехника', electric: 'Электрика',
  repair: 'Стройка и ремонт', appliance: 'Ремонт техники', electronics: 'Гаджеты',
  moving: 'Переезды', rental: 'Аренда оборудования', garden: 'Сад и участок',
};

type MasterService = {
  id: string;
  created_at: string;
  master_id: string;
  master_name: string;
  title: string;
  description: string;
  price: number;
  price_variants?: string;
  work_types?: string[];
  photos?: string[];
  phone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paused' | string;
};

const MASTER_STATUS_LABEL: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  paused: 'Приостановлено',
};
const MASTER_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-500',
  paused: 'bg-zinc-100 text-zinc-500',
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [needSetup, setNeedSetup] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState<TabId>('orders');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(async (r) => {
        if (r.ok) {
          const d = await r.json().catch(() => null);
          if (d?.admin) {
            setSession(d.admin);
            const first = TABS.find((t) => !t.role || d.admin.roles.includes(t.role));
            if (first) setTab(first.id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || authBusy) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          needSetup ? { login, new_password: newPassword } : { login, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.need_setup) setNeedSetup(true);
        else setAuthError(data?.error || 'Ошибка входа');
        return;
      }
      const s = await fetch('/api/admin/session');
      if (s.ok) {
        const d = await s.json().catch(() => null);
        if (d?.admin) {
          setSession(d.admin);
          const first = TABS.find((t) => !t.role || d.admin.roles.includes(t.role));
          if (first) setTab(first.id);
        }
      }
      setPassword('');
      setNewPassword('');
      setNeedSetup(false);
    } catch {
      setAuthError('Нет связи с сервером');
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {});
    setSession(null);
    setLogin('');
    setPassword('');
    setNeedSetup(false);
    setShowProfile(false);
  };

  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 size={26} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] bg-[#F2F2F7] flex items-center justify-center px-4">
        <form
          onSubmit={submitAuth}
          className="w-full max-w-[360px] bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 mb-1">BroVerse Админ</h1>
          <p className="text-[12px] text-zinc-400 mb-4">
            {needSetup
              ? 'Пароль ещё не задан — придумайте свой (от 6 символов)'
              : 'Вход для сотрудников. Пароль создаётся при первом входе.'}
          </p>
          <input
            type="text"
            autoCapitalize="none"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Логин"
            className={INPUT}
            autoFocus
          />
          <input
            type="password"
            value={needSetup ? newPassword : password}
            onChange={(e) => (needSetup ? setNewPassword(e.target.value) : setPassword(e.target.value))}
            placeholder={needSetup ? 'Новый пароль' : 'Пароль'}
            className={`${INPUT} mt-2`}
          />
          {authError && <p className="text-[11px] text-rose-500 font-semibold mt-2">{authError}</p>}
          <button
            type="submit"
            disabled={authBusy}
            className="w-full mt-4 py-3 rounded-2xl bg-zinc-900 text-white text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {authBusy ? '…' : needSetup ? 'Создать пароль и войти' : 'Войти'}
          </button>
        </form>
      </div>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.role || session.roles.includes(t.role));

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
              <p className="text-[10px] text-zinc-400">{session.display_name || session.login}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full pl-3 pr-2 py-1.5 transition-colors"
          >
            <span className="text-[11px] font-bold text-zinc-700 max-w-[110px] truncate">
              {session.display_name || session.login}
            </span>
            <span className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
              <User size={12} className="text-white" />
            </span>
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-1 bg-zinc-100 rounded-none">
          <div className="flex gap-1 bg-zinc-100 rounded-full p-1 overflow-x-auto">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {tab === 'orders' ? <OrdersTab /> : tab === 'masters' ? <MastersTab /> : tab === 'feedback' ? <FeedbackTab /> : tab === 'catalog' ? <CatalogTab /> : tab === 'team' ? <TeamTab session={session} /> : <AuditTab />}
      </main>

      {showProfile && (
        <ProfilePanel session={session} onClose={() => setShowProfile(false)} onLogout={logout} />
      )}
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

  const act = async (o: ServiceRequest, action: 'approved' | 'rejected') => {
    let comment = '';
    if (action === 'rejected') {
      const reason = window.prompt('Причина отклонения (видна мастеру):');
      if (reason === null) return;
      comment = reason.trim();
      if (!comment) return;
    }
    setBusyId(o.id);
    await fetch('/api/admin/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, status: action, section: 'orders', ...(comment ? { comment } : {}) }),
    }).catch(() => {});
    const meta = o.metadata;
    if (action === 'approved' && meta?.unlock_direction && meta.master_id) {
      await unlockDirectionForMaster(meta.master_id, meta.unlock_direction, meta.master_name);
    }
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
                    {meta.domain ? ` · ${DOMAIN_BADGE[meta.domain] || meta.domain}` : ''}
                  </p>
                  {meta.unlock_direction && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                      <Lock size={10} />
                      {meta.unlock_type === 'brocare' ? 'BroCare-сертификация' : 'Открытие направления'}
                      · {UNLOCK_DIR_LABEL[meta.unlock_direction] || meta.unlock_direction}
                    </span>
                  )}
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_COLOR[o.status] || 'bg-zinc-100 text-zinc-500'}`}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                <Row label="📞 Телефон" value={o.client_phone || '—'} />
                {meta.master_id && (
                  <Row label="🎯 Направлено мастеру" value={`${meta.master_name || '—'}${meta.master_phone ? ` · ${meta.master_phone}` : ''}`} />
                )}
                {o.client_name && <Row label="👤 Имя" value={o.client_name} />}
                {o.address && <Row label="📍 Адрес" value={o.address} />}
                {price && <Row label="💰 Цена" value={`${price} ₽`} />}
                {meta.master_rating !== undefined && meta.master_rating !== null && (
                  <Row label="⭐ Рейтинг мастера" value={`${meta.master_rating} / 5`} />
                )}
                {meta.unlock_equipment && <Row label="🧰 Оборудование" value={meta.unlock_equipment} />}
                {meta.unlock_score !== undefined && <Row label="📝 Тест BroCare" value={`${meta.unlock_score} / 5`} />}
                {meta.description && <Row label="📝 Описание" value={meta.description} />}
                {meta.comment && <Row label="💬 Комментарий" value={meta.comment} />}
                {meta.decline_reason && <Row label="🚫 Причина отклонения" value={meta.decline_reason} />}
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
                    onClick={() => act(o, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    {busyId === o.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Одобрить
                  </button>
                )}
                {o.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => act(o, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 text-rose-500 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    <XCircle size={13} /> Отклонить
                  </button>
                )}
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

/* ────────────────────────── МАСТЕРЫ (модерация услуг) ────────────────────────── */

function MastersTab() {
  const [list, setList] = useState<MasterService[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/master-services');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setList(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, status: 'approved' | 'rejected') => {
    let comment = '';
    if (status === 'rejected') {
      const reason = window.prompt('Причина отклонения (видна мастеру):');
      if (reason === null) return;
      comment = reason.trim();
      if (!comment) return;
    }
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/master-services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...(comment ? { comment } : {}) }),
      });
      if (res.ok) {
        setList(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      }
    } catch {}
    setBusyId(null);
  };

  const visible = filter === 'all' ? list : list.filter(s => s.status === 'pending');

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-zinc-100 rounded-full p-1 w-fit">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${filter === f ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            {f === 'pending' ? `На модерации (${list.filter(s => s.status === 'pending').length})` : `Все (${list.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
          <Loader2 size={22} className="text-zinc-300 mx-auto animate-spin" />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
          <WrenchIcon />
          <p className="text-[13px] text-zinc-400 mt-2">Услуг мастеров на модерации нет</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((s) => (
          <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-zinc-900 leading-tight">{s.title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {s.master_name || s.master_id}
                  {s.created_at ? ` · ${new Date(s.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}` : ''}
                </p>
              </div>
              <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${MASTER_STATUS_COLOR[s.status] || 'bg-zinc-100 text-zinc-500'}`}>
                {MASTER_STATUS_LABEL[s.status] || s.status}
              </span>
            </div>

            <div className="space-y-1 mb-3">
              {s.price ? <Row label="💰 Цена" value={`${s.price.toLocaleString('ru-RU')} ₽`} /> : null}
              {s.price_variants && <Row label="📊 Варианты цен" value={s.price_variants} />}
              {s.phone && <Row label="📞 Телефон" value={s.phone} />}
              {s.description && <Row label="📝 Описание" value={s.description} />}
              {Array.isArray(s.photos) && s.photos[0] && (
                <div className="pt-1">
                  <img src={s.photos[0]} alt="Фото услуги" className="w-full max-h-48 object-cover rounded-xl" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {s.status !== 'approved' && (
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => act(s.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {busyId === s.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Одобрить
                </button>
              )}
              {s.status !== 'rejected' && (
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => act(s.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 text-rose-500 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <XCircle size={13} /> Отклонить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WrenchIcon() {
  return <Package size={28} className="text-zinc-300 mx-auto" />;
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

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/catalog');
    if (res.ok) setData(await res.json());
  }, []);

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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

/* ────────────────────────── АУДИТ (не удаляется) ────────────────────────── */

const AUDIT_ACTION_LABEL: Record<string, string> = {
  login: 'Вход в систему',
  logout: 'Выход',
  password_setup: 'Создал пароль',
  password_change: 'Сменил пароль',
  order_status: 'Изменил статус заявки',
  catalog_edit: 'Правка каталога',
  catalog_revert: 'Сброс правки каталога',
  master_service_review: 'Модерация услуги мастера',
  user_add: 'Добавил сотрудника',
  user_roles: 'Изменил роли сотрудника',
};

type AuditEntry = {
  id: string;
  actor_login: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

function auditDiff(e: AuditEntry): string {
  const d = e.details || {};
  const bits: string[] = [];
  if (typeof d.from === 'string' && typeof d.to === 'string') bits.push(`${d.from} → ${d.to}`);
  else if (typeof d.to === 'string') bits.push(`→ ${d.to}`);
  if (typeof d.comment === 'string' && d.comment) bits.push(`«${d.comment}»`);
  if (typeof d.reason === 'string' && d.reason) bits.push(`причина: «${d.reason}»`);
  if (Array.isArray(d.roles)) bits.push(`роли: ${(d.roles as string[]).join(', ')}`);
  if (d.from && d.to && typeof d.from === 'object' && typeof d.to === 'object') {
    const a = d.from as Record<string, unknown>;
    const b = d.to as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    for (const k of keys) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) bits.push(`${k}: ${a[k] ?? '—'} → ${b[k] ?? '—'}`);
    }
  }
  if (typeof d.note === 'string' && d.note) bits.push(d.note);
  return bits.join(' · ');
}

function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/audit')
      .then(async (r) => { if (r.ok) { const d = await r.json(); setEntries(d.entries || []); } })
      .catch(() => setEntries([]));
  }, []);

  if (!entries) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
        <History size={28} className="text-zinc-300 mx-auto mb-2" />
        <p className="text-[13px] text-zinc-400">Пока нет записей</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] text-zinc-400 mb-3 px-1">
        Журнал действий — кто и когда принял решение. Записи хранятся без возможности удаления.
      </p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="bg-white rounded-[16px] p-3.5 shadow-sm flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-black text-white">
                {(e.actor_name || e.actor_login || '?').slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[12px] font-bold text-zinc-900">{e.actor_name || e.actor_login}</span>
                <span className="text-[10px] text-zinc-400">
                  {new Date(e.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                </span>
              </div>
              <p className="text-[12px] text-zinc-700 mt-0.5">
                {AUDIT_ACTION_LABEL[e.action] || e.action}
                {e.entity_label ? <span className="text-zinc-500"> · {e.entity_label}</span> : null}
              </p>
              {auditDiff(e) && (
                <p className="text-[11px] text-[#EA4335] mt-1 break-words">{auditDiff(e)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── КОМАНДА ────────────────────────── */

function TeamTab({ session }: { session: Session }) {
  const canManage = session.roles.includes('team');
  const [admins, setAdmins] = useState<{ login: string; display_name: string; roles: string[]; password_set_at: string | null; last_login_at: string | null }[] | null>(null);
  const [newLogin, setNewLogin] = useState('');
  const [newName, setNewName] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>(['requests']);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/users');
    if (r.ok) {
      const d = await r.json();
      setAdmins(d.admins || []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: newLogin, display_name: newName, roles: newRoles }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setFormError(d.error || 'Не удалось добавить');
      } else {
        setNewLogin('');
        setNewName('');
        setNewRoles(['requests']);
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = async (login: string, role: string) => {
    const target = admins?.find((a) => a.login === login);
    if (!target) return;
    const roles = target.roles.includes(role)
      ? target.roles.filter((r) => r !== role)
      : [...target.roles, role];
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, roles }),
    }).catch(() => {});
    await load();
  };

  if (!admins) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-400 px-1">
        Сотрудник входит по логину — пароль он создаёт сам при первом входе.
      </p>

      {admins.map((a) => (
        <div key={a.login} className="bg-white rounded-[18px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-bold text-zinc-900">{a.display_name || a.login}</span>
            <span className="text-[11px] text-zinc-400">@{a.login}</span>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${a.password_set_at ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {a.password_set_at ? 'пароль задан' : 'ждёт первый вход'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mb-2">
            {a.last_login_at
              ? `Входил: ${new Date(a.last_login_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
              : 'Ещё не входил'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ROLE_LABEL).map((r) => {
              const on = a.roles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  disabled={!canManage || a.login === session.login && r === 'team' && on && a.roles.filter(x => x !== 'team').length === 0}
                  onClick={() => toggleRole(a.login, r)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${on ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'} disabled:opacity-40`}
                >
                  {ROLE_LABEL[r]}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {canManage && (
        <form onSubmit={add} className="bg-white rounded-[18px] p-4 shadow-sm space-y-2">
          <p className="text-[12px] font-bold text-zinc-900">Новый сотрудник</p>
          <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} placeholder="Логин" className={INPUT} autoCapitalize="none" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя и фамилия" className={INPUT} />
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ROLE_LABEL).map((r) => {
              const on = newRoles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${on ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}
                >
                  {ROLE_LABEL[r]}
                </button>
              );
            })}
          </div>
          {formError && <p className="text-[11px] text-rose-500 font-semibold">{formError}</p>}
          <button
            type="submit"
            disabled={busy || !newLogin.trim() || !newName.trim()}
            className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            <Plus size={13} /> Пригласить
          </button>
        </form>
      )}
    </div>
  );
}

/* ────────────────────────── ПРОФИЛЬ (пароль) ────────────────────────── */

function ProfilePanel({ session, onClose, onLogout }: { session: Session; onClose: () => void; onLogout: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setMsg({ type: 'ok', text: 'Пароль обновлён' });
        setOldPassword('');
        setNewPassword('');
      } else {
        setMsg({ type: 'err', text: d.error || 'Не удалось сменить пароль' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full sm:max-w-[380px] mx-4 mb-0 sm:mb-0 bg-white rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto anim-sheet">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black">
            {(session.display_name || session.login).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-zinc-900 truncate">{session.display_name || session.login}</p>
            <p className="text-[11px] text-zinc-400">@{session.login}</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto text-[11px] font-bold text-zinc-400 px-2 py-1">Закрыть</button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {session.roles.map((r) => (
            <span key={r} className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold">
              {ROLE_LABEL[r] || r}
            </span>
          ))}
        </div>
        {session.last_login_at && (
          <p className="text-[10px] text-zinc-400 mb-4">
            Последний вход: {new Date(session.last_login_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
          </p>
        )}

        <form onSubmit={change} className="space-y-2 border-t border-zinc-100 pt-4">
          <p className="text-[12px] font-bold text-zinc-900">Смена пароля</p>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Текущий пароль" className={INPUT} />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Новый пароль (от 6)" className={INPUT} />
          {msg && (
            <p className={`text-[11px] font-semibold ${msg.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</p>
          )}
          <button type="submit" disabled={busy || !oldPassword || newPassword.length < 6} className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold disabled:opacity-40">
            {busy ? '…' : 'Сменить пароль'}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-[12px] font-bold flex items-center justify-center gap-1.5"
        >
          <LogOut size={13} /> Выйти
        </button>
      </div>
    </div>
  );
}
