'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, XCircle, Pencil, Save, RotateCcw, Loader2, Upload, ArrowLeft,
  ShieldCheck, Package, ImageIcon, Lock, Star, MessageSquare,
  LogOut, User, History, Plus, BarChart3, ListTodo, LayoutGrid,
  ChevronUp, ChevronDown, ChevronRight, Send, Search, Square, CheckSquare, X,
  Eye, RefreshCw, KeyRound, Users, GripVertical, Trash2,
} from 'lucide-react';
import {
  listServiceRequests,
  STATUS_LABEL, type ServiceRequest, type RequestStatus,
} from '@/lib/requests';
import { unlockDirectionForMaster } from '@/lib/admin/unlock';

type Session = {
  login: string;
  display_name: string;
  roles: string[];
  password_set_at: string | null;
  last_login_at: string | null;
};

type TabId = 'overview' | 'orders' | 'chat' | 'tasks' | 'finance' | 'masters' | 'feedback' | 'catalog' | 'mirror' | 'audit' | 'team';

const TABS: { id: TabId; label: string; role: string | null }[] = [
  { id: 'overview', label: 'Обзор', role: 'overview' },
  { id: 'orders', label: 'Заявки', role: 'requests' },
  { id: 'chat', label: 'Чат', role: null },
  { id: 'tasks', label: 'Задачи', role: 'tasks' },
  { id: 'finance', label: 'Финансы', role: 'finance' },
  { id: 'masters', label: 'Мастера', role: 'masters' },
  { id: 'feedback', label: 'Отзывы', role: 'feedback' },
  { id: 'catalog', label: 'Каталог', role: 'catalog' },
  { id: 'mirror', label: 'Зеркало', role: 'mirror' },
  { id: 'audit', label: 'Аудит', role: 'team' },
  { id: 'team', label: 'Команда', role: 'team' },
];

/** Название вкладки: для сотрудника первый раздел — «Мой кабинет» */
const tabLabel = (id: TabId, roles: string[]): string => {
  if (id === 'overview') return roles.includes('team') ? 'Хаб' : 'Мой кабинет';
  const t = TABS.find((x) => x.id === id);
  return t ? t.label : '';
};

const ROLE_LABEL: Record<string, string> = {
  overview: 'Обзор',
  requests: 'Заявки',
  tasks: 'Задачи',
  finance: 'Финансы',
  feedback: 'Отзывы',
  catalog: 'Каталог',
  masters: 'Мастера',
  mirror: 'Зеркало',
  team: 'Команда',
};

type CatalogService = { category: string; name: string; desc: string; price: string; time: string; image: string; deleted?: boolean; isNew?: boolean };
type ServiceEdit = { desc?: string; price?: string; time?: string; image?: string; order?: string[]; new?: boolean; deleted?: boolean };
type CatalogData = {
  domains: Record<string, CatalogService[]>;
  edits: Record<string, Record<string, ServiceEdit>>;
};

const INPUT =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all';

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
  pending: 'bg-zinc-200 text-zinc-700',
  approved: 'bg-zinc-900 text-white',
  rejected: 'bg-white text-zinc-400 border border-zinc-200',
  paused: 'bg-zinc-100 text-zinc-500',
};

const ADMIN_STATUS_COLOR: Record<string, string> = {
  new: 'bg-zinc-900 text-white',
  review: 'bg-zinc-200 text-zinc-700',
  approved: 'bg-zinc-100 text-zinc-500',
  rejected: 'bg-white text-zinc-400 border border-zinc-200',
  accepted: 'bg-zinc-700 text-white',
  completed: 'bg-zinc-100 text-zinc-400',
};

export default function AdminPage({ cabinet }: { cabinet?: string } = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [needSetup, setNeedSetup] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState<TabId>('orders');
  const [lockedTab, setLockedTab] = useState<TabId | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [cabinetLink, setCabinetLink] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('c')?.trim().toLowerCase() || '';
    const c = cabinet || (/^[a-z0-9][a-z0-9-]{1,38}$/.test(fromUrl) ? fromUrl : '');
    if (c) {
      setCabinetLink(c);
      setLogin(c);
    }
  }, [cabinet]);

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
          {cabinetLink && (
            <div className="flex items-center gap-3 mb-4 bg-zinc-50 rounded-2xl p-3">
              <span className="w-10 h-10 rounded-xl bg-zinc-900 text-white text-[15px] font-black flex items-center justify-center shrink-0">
                {cabinetLink.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-400">Кабинет сотрудника</p>
                <p className="text-[13px] font-bold text-zinc-900 truncate">@{cabinetLink}</p>
              </div>
            </div>
          )}
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
            autoFocus={!cabinetLink}
          />
          <input
            type="password"
            value={needSetup ? newPassword : password}
            onChange={(e) => (needSetup ? setNewPassword(e.target.value) : setPassword(e.target.value))}
            placeholder={needSetup ? 'Новый пароль' : 'Пароль'}
            className={`${INPUT} mt-2`}
            autoFocus={!!cabinetLink}
          />
          {authError && <p className="text-[11px] text-zinc-800 font-semibold mt-2">{authError}</p>}
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

  const canSee = (t: (typeof TABS)[number]) => !t.role || session.roles.includes(t.role);
  const visibleTabs = TABS; // все разделы видимы; закрытые — с замком

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tab !== 'overview' && (
              <button
                type="button"
                onClick={() => { setLockedTab(null); setTab('overview'); }}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors active:scale-95 shrink-0"
                title="Назад — к кабинету"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold text-zinc-900 leading-tight">BroVerse Админ</h1>
              <p className="text-[10px] text-zinc-400">{session.display_name || session.login}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setTab('chat'); setLockedTab(null); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${tab === 'chat' && !lockedTab ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              title={session.roles.includes('team') ? 'Чаты сотрудников' : 'Чат с руководителем'}
            >
              <MessageSquare size={15} />
            </button>
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
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-1 bg-zinc-100 rounded-none">
          <div className="flex gap-1 bg-zinc-100 rounded-full p-1 overflow-x-auto">
            {visibleTabs.map((t) => {
              const locked = !canSee(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (locked) { setLockedTab(t.id); }
                    else { setLockedTab(null); setTab(t.id); }
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1 ${!locked && tab === t.id && !lockedTab ? 'bg-white shadow-sm text-zinc-900' : locked ? 'text-zinc-300' : 'text-zinc-500'}`}
                >
                  {locked && <Lock size={10} />}
                  {tabLabel(t.id, session.roles)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {lockedTab ? (
          <LockedSection
            label={tabLabel(lockedTab, session.roles)}
            onBack={() => setLockedTab(null)}
            onAsk={async () => {
              const label = tabLabel(lockedTab, session.roles);
              await fetch('/api/admin/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: `Прошу открыть раздел «${label}» 🙏` }),
              }).catch(() => {});
              setLockedTab(null);
              setTab('chat');
            }}
          />
        ) : tab === 'overview' ? (session.roles.includes('team') ? <OverviewTab session={session} onOpenTab={setTab} /> : <MyCabinetTab session={session} onOpenTab={setTab} onAskLocked={setLockedTab} />) : tab === 'orders' ? <OrdersTab /> : tab === 'chat' ? <ChatTab session={session} /> : tab === 'tasks' ? <TasksTab /> : tab === 'finance' ? <FinanceTab /> : tab === 'masters' ? <MastersTab /> : tab === 'feedback' ? <FeedbackTab /> : tab === 'catalog' ? <CatalogTab /> : tab === 'mirror' ? <MirrorTab /> : tab === 'team' ? <TeamTab session={session} /> : <AuditTab />}
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
  const [period, setPeriod] = useState<'all' | 'today' | '7' | '30'>('all');
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(await listServiceRequests());
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load(); }, 30000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

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

  const actBulk = async (action: 'approved' | 'rejected') => {
    const targets = (orders || []).filter((o) => selected.has(o.id));
    if (targets.length === 0 || bulkBusy) return;
    let comment = '';
    if (action === 'rejected') {
      const reason = window.prompt(`Причина отклонения (видна мастерам, ${targets.length} шт.):`);
      if (reason === null) return;
      comment = reason.trim();
      if (!comment) return;
    }
    setBulkBusy(true);
    for (const o of targets) {
      await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, status: action, section: 'orders', ...(comment ? { comment } : {}) }),
      }).catch(() => {});
      const meta = o.metadata;
      if (action === 'approved' && meta?.unlock_direction && meta.master_id) {
        await unlockDirectionForMaster(meta.master_id, meta.unlock_direction, meta.master_name);
      }
    }
    setSelected(new Set());
    setSelectMode(false);
    await load();
    setBulkBusy(false);
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const orderDomain = (o: ServiceRequest): string => o.metadata?.domain || '—';

  const visible = useMemo(() => {
    if (!orders) return [];
    let list = orders;
    if (filter !== 'all') list = list.filter((o) => o.status === filter);
    if (domainFilter !== 'all') list = list.filter((o) => orderDomain(o) === domainFilter);
    if (period !== 'all') {
      const now = new Date();
      const start = new Date(
        period === 'today'
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
          : now.getTime() - Number(period) * 24 * 3600 * 1000
      );
      list = list.filter((o) => new Date(o.created_at).getTime() >= start.getTime());
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const m = o.metadata || {};
        const hay = [o.service_name, o.client_phone, o.client_name, o.address, m.master_name, m.master_phone, m.description]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [orders, filter, domainFilter, period, query]);

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
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${domainFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 shadow-sm'}`}
          >
            Все сайты
          </button>
          {domains.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomainFilter(d)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${domainFilter === d ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 shadow-sm'}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Поиск + период + массовый выбор */}
      <div className="flex gap-1.5 mb-2">
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: телефон, имя, услуга, адрес"
            className={`${INPUT} pl-8`}
          />
        </div>
        <button
          type="button"
          onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
          className={`shrink-0 px-3 rounded-xl text-[11px] font-bold transition-colors ${selectMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 shadow-sm'}`}
        >
          {selectMode ? 'Отмена' : 'Выбрать'}
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1">
        {([['all', 'Весь период'], ['today', 'Сегодня'], ['7', '7 дней'], ['30', '30 дней']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${period === id ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 shadow-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>

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
            <div
              key={o.id}
              onClick={selectMode ? () => toggleSelected(o.id) : undefined}
              className={`bg-white rounded-[20px] p-4 shadow-sm transition-shadow ${selectMode ? 'cursor-pointer' : ''} ${selected.has(o.id) ? 'ring-2 ring-zinc-900' : ''}`}
            >
              {selectMode && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100">
                  {selected.has(o.id) ? <CheckSquare size={16} className="text-zinc-900" /> : <Square size={16} className="text-zinc-300" />}
                  <span className="text-[11px] font-bold text-zinc-500">{selected.has(o.id) ? 'Выбрано' : 'Отметить заявку'}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 leading-tight">{o.service_name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {new Date(o.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                    {meta.domain ? ` · ${DOMAIN_BADGE[meta.domain] || meta.domain}` : ''}
                  </p>
                  {meta.unlock_direction && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Lock size={10} />
                      {meta.unlock_type === 'brocare' ? 'BroCare-сертификация' : 'Открытие направления'}
                      · {UNLOCK_DIR_LABEL[meta.unlock_direction] || meta.unlock_direction}
                    </span>
                  )}
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${ADMIN_STATUS_COLOR[o.status] || 'bg-zinc-100 text-zinc-500'}`}>
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

              {!selectMode && (
              <div className="flex gap-2">
                {o.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => act(o, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    {busyId === o.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Одобрить
                  </button>
                )}
                {o.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => act(o, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-zinc-500 border border-zinc-200 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    <XCircle size={13} /> Отклонить
                  </button>
                )}
              </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Панель массовых действий */}
      {selectMode && (
        <div className="fixed bottom-0 inset-x-0 z-20 px-4 pb-4 pt-3 bg-white/95 backdrop-blur-xl border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 shrink-0">Выбрано: {selected.size}</span>
            <div className="flex-1" />
            <button
              type="button"
              disabled={bulkBusy || selected.size === 0}
              onClick={() => actBulk('rejected')}
              className="px-3.5 py-2.5 rounded-xl bg-white text-zinc-500 border border-zinc-200 text-[12px] font-bold active:scale-95 transition-transform disabled:opacity-40"
            >
              <XCircle size={13} className="inline mr-1" />Отклонить
            </button>
            <button
              type="button"
              disabled={bulkBusy || selected.size === 0}
              onClick={() => actBulk('approved')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 size={13} className="inline animate-spin mr-1" /> : <CheckCircle2 size={13} className="inline mr-1" />}
              Одобрить
            </button>
          </div>
        </div>
      )}
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {busyId === s.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Одобрить
                </button>
              )}
              {s.status !== 'rejected' && (
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => act(s.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-zinc-500 border border-zinc-200 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
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
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${fb.resolved ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'}`}>
                {fb.resolved ? '✓ Вопрос решён' : '✗ Вопрос не решён'}
              </span>
            </div>

            {fb.rating ? (
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= fb.rating! ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-200'} />
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
            className={`shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${domain === d ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500 shadow-sm'}`}
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
                      {isEdited && <span className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[9px] font-bold">изменено</span>}
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
                        className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white active:scale-95 transition-transform"
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
  task_create: 'Поставил задачу мастеру',
  task_status: 'Изменил статус задачи',
  mirror_order: 'Поменял порядок услуг (зеркало)',
  chat_message: 'Написал сообщение в чат',
  user_delete: 'Удалил кабинет сотрудника',
  password_set_by_admin: 'Задал пароль сотруднику',
  password_reset_by_admin: 'Сбросил пароль сотруднику',
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
                <p className="text-[11px] text-zinc-900 font-semibold mt-1 break-words">{auditDiff(e)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── МОЙ КАБИНЕТ (сотрудник) ────────────────────────── */

const TAB_ICONS: Record<TabId, React.ComponentType<{ size?: number; className?: string }>> = {
  overview: BarChart3, orders: Package, chat: MessageSquare, tasks: ListTodo,
  finance: History, masters: Star, feedback: Star, catalog: ImageIcon,
  mirror: LayoutGrid, audit: History, team: Users,
};

function MyCabinetTab({ session, onOpenTab, onAskLocked }: {
  session: Session;
  onOpenTab: (id: TabId) => void;
  onAskLocked: (id: TabId) => void;
}) {
  const sections = TABS.filter((t) => t.id !== 'overview');
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[24px] p-5 shadow-sm flex items-center gap-3.5">
        <span className="w-14 h-14 rounded-2xl bg-zinc-900 text-white text-[20px] font-black flex items-center justify-center shrink-0">
          {(session.display_name || session.login).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Мой кабинет</p>
          <p className="text-[16px] font-black text-zinc-900 truncate">{session.display_name || session.login}</p>
          <p className="text-[11px] text-zinc-400">@{session.login}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1">Разделы</p>
        <div className="grid grid-cols-2 gap-2.5">
          {sections.map((t) => {
            const locked = !!t.role && !session.roles.includes(t.role);
            const Icon = TAB_ICONS[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => (locked ? onAskLocked(t.id) : onOpenTab(t.id))}
                className={`rounded-[18px] p-4 text-left shadow-sm active:scale-[0.97] transition-transform ${locked ? 'bg-zinc-100' : 'bg-white'}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${locked ? 'bg-zinc-200' : 'bg-zinc-900'}`}>
                  {locked ? <Lock size={15} className="text-zinc-400" /> : <Icon size={15} className="text-white" />}
                </span>
                <p className={`text-[13px] font-bold ${locked ? 'text-zinc-400' : 'text-zinc-900'}`}>{t.label}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{locked ? 'закрыт — попросить' : 'открыт'}</p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-zinc-300 px-1">
        Видны только разделы, которые выдал руководитель. Ссылка на кабинет постоянная.
      </p>
    </div>
  );
}

/* ────────────────────────── ОБЗОР РУКОВОДИТЕЛЯ ────────────────────────── */

function Stat({ label, value, sub, onClick }: { label: string; value: string | number; sub?: string; onClick?: () => void }) {
  const inner = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="text-[22px] font-black text-zinc-900 leading-tight mt-1">{value}</p>
      {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      {onClick && <p className="text-[9.5px] text-zinc-900 font-bold mt-1.5">Показать →</p>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="bg-white rounded-[18px] p-4 shadow-sm text-left w-full active:scale-[0.97] transition-transform">
        {inner}
      </button>
    );
  }
  return <div className="bg-white rounded-[18px] p-4 shadow-sm">{inner}</div>;
}

function OrderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="text-zinc-400 w-[104px] shrink-0">{label}</span>
      <span className="text-zinc-800 font-semibold break-words flex-1">{value}</span>
    </div>
  );
}

function OverviewTab({ session, onOpenTab }: { session: Session; onOpenTab: (id: TabId) => void }) {
  const [orders, setOrders] = useState<ServiceRequest[] | null>(null);
  const [admins, setAdmins] = useState<{ login: string; display_name: string; roles: string[]; password_set_at: string | null; last_login_at: string | null }[] | null>(null);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [ads, setAds] = useState<unknown[] | null>(null);
  const [cabOrder, setCabOrder] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDone, setCreateDone] = useState('');
  const [createName, setCreateName] = useState('');
  const [createLogin, setCreateLogin] = useState('');
  const [loginTouched, setLoginTouched] = useState(false);
  const [createRoles, setCreateRoles] = useState<string[]>(['requests']);
  const [createErr, setCreateErr] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragLogin = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const orderRef = useRef<string[]>([]);
  const [statusList, setStatusList] = useState<'queue' | 'all' | RequestStatus | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [openCabinet, setOpenCabinet] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [o, a, au, ad, lay] = await Promise.all([
      listServiceRequests().catch(() => [] as ServiceRequest[]),
      fetch('/api/admin/users').then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null),
      fetch('/api/admin/audit').then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null),
      fetch('/api/masters/ads').then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null),
      fetch('/api/admin/layout').then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null),
    ]);
    setOrders(o);
    setAdmins(Array.isArray(a?.admins) ? a.admins : []);
    setEntries(Array.isArray(au?.entries) ? au.entries : []);
    setAds(Array.isArray(ad) ? ad : []);
    setCabOrder(Array.isArray(lay?.order) ? lay.order.map(String) : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const refreshLive = async () => {
      try {
        const [o, au] = await Promise.all([
          listServiceRequests(),
          fetch('/api/admin/audit').then((r) => (r.ok ? r.json().catch(() => null) : null)),
        ]);
        setOrders(o);
        if (Array.isArray(au?.entries)) setEntries(au.entries);
      } catch {
        /* тихий пропуск — покажем старые данные */
      }
    };
    const id = setInterval(() => { if (!document.hidden) refreshLive(); }, 30000);
    const onVis = () => { if (!document.hidden) refreshLive(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  if (!orders || !admins || !entries || !ads) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  const todayKey = new Date().toDateString();
  const todayCount = orders.filter((o) => new Date(o.created_at).toDateString() === todayKey).length;

  const statusCounts: Record<string, number> = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

  const ankety = orders.filter((o) => o.metadata?.domain === 'master');
  const anketyPending = ankety.filter((o) => o.status === 'review' || o.status === 'new').length;

  const feedbacks = orders
    .map((o) => o.metadata?.feedback)
    .filter((f): f is NonNullable<typeof f> => !!f);
  const rated = feedbacks.filter((f) => typeof f.rating === 'number');
  const avgRating = rated.length
    ? (rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length).toFixed(1)
    : '—';
  const unresolvedFb = feedbacks.filter((f) => !f.resolved).length;

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const workByLogin = new Map<string, { count: number; last: string; name: string }>();
  for (const e of entries) {
    if (new Date(e.created_at).getTime() < weekAgo) continue;
    const cur = workByLogin.get(e.actor_login) || { count: 0, last: e.created_at, name: e.actor_name || e.actor_login };
    cur.count += 1;
    if (new Date(e.created_at).getTime() > new Date(cur.last).getTime()) cur.last = e.created_at;
    workByLogin.set(e.actor_login, cur);
  }

  const decisions = entries.filter(
    (e) =>
      e.action === 'order_status' &&
      e.entity_type === 'orders' &&
      ['approved', 'rejected'].includes(String(e.details?.to))
  );
  const feed = decisions.slice(0, 10);
  const queueCount = (statusCounts.new || 0) + (statusCounts.review || 0);
  const approvedCount = (statusCounts.approved || 0) + (statusCounts.accepted || 0) + (statusCounts.completed || 0);

  const activityMap: Record<string, { action: string; created_at: string }[]> = {};
  for (const e of entries) {
    if (e.action === 'login' || e.action === 'logout') continue;
    const arr = activityMap[e.actor_login] || (activityMap[e.actor_login] = []);
    if (arr.length < 2) arr.push({ action: AUDIT_ACTION_LABEL[e.action] || e.action, created_at: e.created_at });
  }

  const orderedAdmins = [...admins].sort((a, b) => {
    const i = cabOrder.indexOf(a.login);
    const j = cabOrder.indexOf(b.login);
    if (i === -1 && j === -1) return 0;
    if (i === -1) return 1;
    if (j === -1) return -1;
    return i - j;
  });

  const saveLayout = (list: string[]) => {
    fetch('/api/admin/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: list }),
    }).catch(() => {});
  };

  const startDrag = (e: React.PointerEvent, login: string) => {
    dragLogin.current = login;
    setDragId(login);
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const moveDrag = (e: React.PointerEvent) => {
    const from = dragLogin.current;
    if (!from) return;
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cabinet]')?.getAttribute('data-cabinet');
    if (!under || under === from) return;
    const logins = orderedAdmins.map((a) => a.login);
    const i = logins.indexOf(from);
    const j = logins.indexOf(under);
    if (i < 0 || j < 0) return;
    logins.splice(j, 0, logins.splice(i, 1)[0]);
    dragMoved.current = true;
    orderRef.current = logins;
    setCabOrder(logins);
  };

  const endDrag = () => {
    if (!dragLogin.current) return;
    dragLogin.current = null;
    setDragId(null);
    if (orderRef.current.length) saveLayout(orderRef.current);
    setTimeout(() => { dragMoved.current = false; }, 0);
  };

  const effLogin = loginTouched ? createLogin.trim() : toLogin(createName);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createBusy) return;
    setCreateBusy(true);
    setCreateErr('');
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: effLogin, display_name: createName.trim(), roles: createRoles }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setCreateErr(d.error || 'Не удалось создать кабинет');
      } else {
        setCreateDone(effLogin);
        setCreateName('');
        setCreateLogin('');
        setLoginTouched(false);
        setCreateRoles(['requests']);
        await load();
      }
    } finally {
      setCreateBusy(false);
    }
  };

  const copyAccess = async (a: { login: string; display_name: string; roles: string[] }) => {
    try {
      await navigator.clipboard.writeText(accessMessage(a.login, a.display_name, a.roles));
      setCopiedFor(a.login);
      setTimeout(() => setCopiedFor(null), 1500);
    } catch { /* clipboard недоступен */ }
  };

  const removeCabinet = async (login: string) => {
    if (!window.confirm(`Удалить кабинет @${login}? Доступ пропадёт сразу.`)) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    }).catch(() => {});
    await load();
  };

  const shareTg = (text: string, cabinet?: string) => {
    const target = `https://broverse-client.vercel.app/admin${cabinet ? `/${cabinet}` : ''}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(target)}&text=${encodeURIComponent(text)}`;
    const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } }).Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank');
  };

  const changePassword = async (login: string, mode: 'set' | 'reset') => {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'set'
            ? { login, action: 'set_password', new_password: pwValue }
            : { login, action: 'reset_password' }
        ),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setPwMsg({
          type: 'ok',
          text: mode === 'set' ? 'Пароль задан. Старые входы отключены.' : 'Сброшен. Сотрудник задаст новый при входе.',
        });
        setPwValue('');
        await load();
      } else {
        setPwMsg({ type: 'err', text: d.error || 'Не удалось изменить пароль' });
      }
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[24px] p-5 shadow-sm">
        <p className="text-[17px] font-black text-zinc-900">Кабинет руководителя проекта</p>
        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
          Все процессы и кабинеты сотрудников — здесь.
          {session.display_name ? ` Руководитель: ${session.display_name}.` : ''}
        </p>
        <button
          type="button"
          onClick={() => { setCreateOpen(true); setCreateDone(''); setCreateErr(''); }}
          className="w-full mt-4 py-3 rounded-2xl bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Plus size={15} /> Создать кабинет
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="В очереди" value={queueCount} sub="ждут решения" onClick={() => setStatusList('queue')} />
        <Stat label="Одобрено" value={approvedCount} sub="прошли модерацию" onClick={() => setStatusList('approved')} />
        <Stat label="Отклонено" value={statusCounts.rejected || 0} sub="с причинами" onClick={() => setStatusList('rejected')} />
        <Stat label="Сегодня / всего" value={`${todayCount} / ${orders.length}`} sub="новые заявки" onClick={() => setStatusList('all')} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1 px-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Кабинеты сотрудников · {orderedAdmins.length}</p>
        </div>
        <p className="text-[10px] text-zinc-300 mb-2.5 px-1">Потяните блок за ⠿ — порядок сохранится</p>
        {orderedAdmins.length === 0 ? (
          <div className="bg-white rounded-[18px] py-8 text-center shadow-sm">
            <Users size={24} className="text-zinc-300 mx-auto mb-2" />
            <p className="text-[12px] text-zinc-400">Кабинетов пока нет</p>
            <button
              type="button"
              onClick={() => { setCreateOpen(true); setCreateDone(''); setCreateErr(''); }}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[11px] font-bold active:scale-95 transition-transform"
            >
              Создать первый
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orderedAdmins.map((a) => (
              <div
                key={a.login}
                data-cabinet={a.login}
                onClick={(e) => {
                  if (dragMoved.current) return;
                  if ((e.target as HTMLElement).closest('button')) return;
                  setPwMsg(null);
                  setPwValue('');
                  setOpenCabinet(a.login);
                }}
                className={`bg-white rounded-[18px] p-3.5 shadow-sm transition-all cursor-pointer ${dragId === a.login ? 'ring-2 ring-zinc-900 opacity-80 scale-[1.01]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={(e) => startDrag(e, a.login)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="w-7 h-9 -ml-1 flex items-center justify-center text-zinc-300 touch-none select-none cursor-grab active:cursor-grabbing shrink-0"
                    title="Перетащить блок"
                  >
                    <GripVertical size={16} />
                  </button>
                  <span className="w-9 h-9 rounded-xl bg-zinc-900 text-white text-[13px] font-black flex items-center justify-center shrink-0">
                    {(a.display_name || a.login).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-zinc-900 truncate">{a.display_name || a.login}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      @{a.login} · {a.password_set_at ? 'пароль задан' : 'ждёт первый вход'}
                      {a.last_login_at ? ` · вход ${new Date(a.last_login_at).toLocaleDateString('ru-RU')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.roles.length === 0 && <span className="text-[10px] text-zinc-400">без разделов</span>}
                  {a.roles.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[9.5px] font-bold">
                      {ROLE_LABEL[r] || r}
                    </span>
                  ))}
                </div>
                {activityMap[a.login]?.length ? (
                  <p className="text-[10px] text-zinc-400 mt-1.5 truncate">
                    {activityMap[a.login].map((x) => x.action).join(' · ')}
                  </p>
                ) : null}
                <div className="flex gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setChatWith(a.login)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-900 text-white text-[10.5px] font-bold active:scale-95 transition-transform"
                  >
                    Чат
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenTab('team')}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-[10.5px] font-bold active:scale-95 transition-transform"
                  >
                    Навыки
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAccess(a)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-[10.5px] font-bold active:scale-95 transition-transform"
                  >
                    {copiedFor === a.login ? '✓ Скопировано' : 'Доступ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCabinet(a.login)}
                    className="py-1.5 px-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 text-[10.5px] font-bold active:scale-95 transition-transform"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[18px] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Последние решения</p>
          <span className="text-[10px] text-zinc-400">всего: {decisions.length}</span>
        </div>
        {feed.length === 0 ? (
          <p className="text-[12px] text-zinc-400 py-1">
            Решений пока нет — сотрудники разберут очередь во вкладке «Заявки».
          </p>
        ) : (
          <div>
            {feed.map((e) => {
              const ok = String(e.details?.to) === 'approved';
              const comment = typeof e.details?.comment === 'string' ? e.details.comment : '';
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setOpenOrder(e.entity_id)}
                  className="w-full flex gap-2.5 items-start py-2 border-b border-zinc-50 last:border-0 text-left active:bg-zinc-50 transition-colors"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? 'bg-zinc-900' : 'bg-white border border-zinc-300'}`}>
                    {ok ? <CheckCircle2 size={13} className="text-white" /> : <XCircle size={13} className="text-zinc-500" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-zinc-900 truncate">{e.entity_label}</p>
                    <p className="text-[10.5px] text-zinc-400">
                      {ok ? 'Одобрена' : 'Отклонена'} · {e.actor_name || e.actor_login} ·{' '}
                      {new Date(e.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {comment && <p className="text-[10.5px] text-zinc-600 mt-0.5 break-words">«{comment}»</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[18px] p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Заявки по статусам</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(STATUS_LABEL).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusList(s as RequestStatus)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 active:scale-95 transition-transform"
            >
              {STATUS_LABEL[s as RequestStatus]}: <span className="text-zinc-900">{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Мастеров (услуги)" value={ads.length} sub={`анкет на модерации: ${anketyPending}`} />
        <Stat label="Сотрудников" value={admins.length} sub={`активны за 7 дней: ${workByLogin.size}`} />
        <Stat label="Отзывов" value={feedbacks.length} sub={`средняя оценка: ${avgRating}`} />
        <Stat label="Не закрытых отзывов" value={unresolvedFb} sub={unresolvedFb ? 'нужна реакция' : 'всё в порядке'} />
      </div>

      {statusList && (() => {
        const rows = orders.filter((o) =>
          statusList === 'all'
            ? true
            : statusList === 'queue'
              ? o.status === 'new' || o.status === 'review'
              : o.status === statusList
        );
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setStatusList(null)}>
            <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 sticky top-0 bg-white">
                <p className="text-[13px] font-bold text-zinc-900">
                  {statusList === 'all' ? 'Все заявки' : statusList === 'queue' ? 'В очереди' : STATUS_LABEL[statusList]}
                  <span className="text-zinc-400 font-normal"> · {rows.length}</span>
                </p>
                <button type="button" onClick={() => setStatusList(null)} className="p-1.5 rounded-full bg-zinc-100 active:scale-90 transition-transform">
                  <X size={13} />
                </button>
              </div>
              <div className="p-4 space-y-1.5">
                {rows.length === 0 && <p className="text-[12px] text-zinc-400 py-6 text-center">Заявок нет</p>}
                {rows.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { setStatusList(null); setOpenOrder(o.id); }}
                    className="w-full text-left bg-zinc-50 rounded-[14px] px-3.5 py-3 active:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-zinc-900 truncate">{o.service_name}</span>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white text-zinc-500 shrink-0">
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">{o.client_name} · {o.address}</p>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      {new Date(o.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {openOrder && (() => {
        const o = orders.find((x) => x.id === openOrder);
        if (!o) {
          setOpenOrder(null);
          return null;
        }
        const md = o.metadata;
        const fb = md?.feedback;
        const decision = entries.find((e) => e.entity_id === o.id && e.action === 'order_status');
        const comment = typeof decision?.details?.comment === 'string' ? decision.details.comment : '';
        const decline = md?.decline_reason;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpenOrder(null)}>
            <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 sticky top-0 bg-white">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 truncate">{o.service_name}</p>
                  <p className="text-[10px] text-zinc-400">{STATUS_LABEL[o.status]}</p>
                </div>
                <button type="button" onClick={() => setOpenOrder(null)} className="p-1.5 rounded-full bg-zinc-100 active:scale-90 transition-transform shrink-0">
                  <X size={13} />
                </button>
              </div>
              <div className="p-4 space-y-2.5">
                <OrderRow label="Клиент" value={o.client_name} />
                <OrderRow label="Телефон" value={o.client_phone} />
                <OrderRow label="Адрес" value={o.address} />
                <OrderRow label="Создана" value={new Date(o.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} />
                {md?.domain && <OrderRow label="Сайт" value={md.domain} />}
                {md?.description && <OrderRow label="Описание" value={md.description} />}
                {md?.price != null && <OrderRow label="Цена" value={String(md.price)} />}
                {md?.master_name && <OrderRow label="Мастер" value={`${md.master_name}${md.master_phone ? ` · ${md.master_phone}` : ''}`} />}
                {fb && <OrderRow label="Отзыв" value={`${fb.rating ?? '—'}★ · ${fb.comment || 'без комментария'}${fb.resolved ? ' · решён' : ' · не решён'}`} />}
                {decline && <OrderRow label="Причина отказа" value={decline} />}
                {comment && <OrderRow label="Комментарий" value={comment} />}
                {decision && (
                  <OrderRow
                    label="Решение"
                    value={`${String(decision.details?.to) === 'approved' ? '✓ Одобрена' : '✕ Отклонена'} · ${decision.actor_name || decision.actor_login}`}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {openCabinet && (() => {
        const a = admins.find((x) => x.login === openCabinet);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpenCabinet(null)}>
            <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 sticky top-0 bg-white">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 truncate">Кабинет @{a.login}</p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {a.display_name}
                    {a.password_set_at ? ' · пароль задан' : ' · ждёт первый вход'}
                    {a.last_login_at ? ` · вход ${new Date(a.last_login_at).toLocaleDateString('ru-RU')}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setOpenCabinet(null)} className="p-1.5 rounded-full bg-zinc-100 active:scale-90 transition-transform shrink-0">
                  <X size={13} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {a.roles.length === 0 && <span className="text-[10px] text-zinc-400">без разделов</span>}
                  {a.roles.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[9.5px] font-bold">
                      {ROLE_LABEL[r] || r}
                    </span>
                  ))}
                </div>
                {activityMap[a.login]?.length ? (
                  <p className="text-[10px] text-zinc-400">{activityMap[a.login].map((x) => `${x.action} · ${new Date(x.created_at).toLocaleDateString('ru-RU')}`).join(' · ')}</p>
                ) : null}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setOpenCabinet(null); setChatWith(a.login); }}
                    className="py-2 rounded-xl bg-zinc-900 text-white text-[11px] font-bold active:scale-95 transition-transform"
                  >
                    Чат
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpenCabinet(null); onOpenTab('team'); }}
                    className="py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-bold active:scale-95 transition-transform"
                  >
                    Навыки
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAccess(a)}
                    className="py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-bold active:scale-95 transition-transform"
                  >
                    {copiedFor === a.login ? '✓ Скопировано' : 'Доступ'}
                  </button>
                </div>

                <div className="bg-zinc-50 rounded-[14px] p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Пароль</p>
                  <input
                    type="text"
                    value={pwValue}
                    onChange={(e) => setPwValue(e.target.value)}
                    placeholder="Новый пароль (мин. 6 символов)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-[12.5px] outline-none focus:border-zinc-400"
                  />
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <button
                      type="button"
                      disabled={pwBusy || pwValue.trim().length < 6}
                      onClick={() => changePassword(a.login, 'set')}
                      className="py-2 rounded-xl bg-zinc-900 text-white text-[11px] font-bold active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {pwBusy ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />} Задать
                    </button>
                    <button
                      type="button"
                      disabled={pwBusy}
                      onClick={() => changePassword(a.login, 'reset')}
                      className="py-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 text-[11px] font-bold active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Сбросить
                    </button>
                  </div>
                  {pwMsg && (
                    <p className={`text-[10.5px] mt-2 ${pwMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{pwMsg.text}</p>
                  )}
                  <p className="text-[9.5px] text-zinc-400 mt-2 leading-relaxed">
                    Смена пароля отключает все текущие входы сотрудника.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setOpenCabinet(null); removeCabinet(a.login); }}
                  className="w-full py-2 rounded-xl bg-white border border-zinc-200 text-red-500 text-[11px] font-bold active:scale-95 transition-transform"
                >
                  Удалить кабинет
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {(createOpen || createDone) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => { setCreateOpen(false); setCreateDone(''); }}>
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-5 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {createDone ? (
              <div>
                <p className="text-[14px] font-bold text-zinc-900">Кабинет @{createDone} создан</p>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Персональная ссылка кабинета — отправьте её сотруднику, он задаст пароль при первом входе.
                </p>
                <div className="mt-2 px-3 py-2 rounded-xl bg-zinc-50 text-[11.5px] font-semibold text-zinc-700 break-all">
                  broverse-client.vercel.app/admin/{createDone}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const a = admins.find((x) => x.login === createDone);
                    shareTg(accessMessage(createDone, a?.display_name || createDone, a?.roles || []), createDone);
                  }}
                  className="w-full mt-4 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Send size={13} /> Отправить в Telegram
                </button>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const a = admins.find((x) => x.login === createDone);
                      try {
                        await navigator.clipboard.writeText(accessMessage(createDone, a?.display_name || createDone, a?.roles || []));
                        setCopiedFor('created');
                        setTimeout(() => setCopiedFor(null), 1500);
                      } catch { /* ignore */ }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform"
                  >
                    {copiedFor === 'created' ? 'Скопировано ✓' : 'Скопировать доступ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreateDone(''); setCreateOpen(true); }}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-[12px] font-bold active:scale-95 transition-transform"
                  >
                    Ещё
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setCreateOpen(false); setCreateDone(''); }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-500 text-[12px] font-bold active:scale-95 transition-transform"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <form onSubmit={submitCreate} className="space-y-2.5">
                <p className="text-[14px] font-bold text-zinc-900">Новый кабинет</p>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Имя сотрудника"
                  className={INPUT}
                  autoFocus
                />
                <input
                  value={effLogin}
                  onChange={(e) => { setLoginTouched(true); setCreateLogin(e.target.value); }}
                  placeholder="Логин (получится из имени)"
                  className={INPUT}
                  autoCapitalize="none"
                />
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Шаблон доступа</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_TEMPLATES.map((tp) => (
                      <button
                        key={tp.label}
                        type="button"
                        onClick={() => setCreateRoles(tp.roles)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${JSON.stringify(createRoles) === JSON.stringify(tp.roles) ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Разделы</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ROLE_LABEL).map((r) => {
                      const on = createRoles.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCreateRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${on ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}
                        >
                          {ROLE_LABEL[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {createErr && <p className="text-[11px] text-zinc-800 font-semibold">{createErr}</p>}
                <button
                  type="submit"
                  disabled={createBusy || !createName.trim() || !effLogin}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <Plus size={13} /> {createBusy ? '…' : 'Создать кабинет'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-500 text-[12px] font-bold active:scale-95 transition-transform"
                >
                  Закрыть
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {chatWith && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setChatWith(null)}>
          <div className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-[24px] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-zinc-900">Чат: @{chatWith}</p>
              <button type="button" onClick={() => setChatWith(null)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                <X size={15} />
              </button>
            </div>
            <ChatPanel withLogin={chatWith} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── ЗАДАЧИ МАСТЕРАМ ────────────────────────── */

type AdminTask = {
  id: string;
  master_id: string;
  master_name: string;
  title: string;
  body: string;
  status: 'open' | 'done';
  author: string;
  created_at: string;
  done_at: string | null;
};

function TasksTab() {
  const [tasks, setTasks] = useState<AdminTask[] | null>(null);
  const [ads, setAds] = useState<{ master: { id: string; name: string } }[]>([]);
  const [masterId, setMasterId] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const [t, a] = await Promise.all([
      fetch('/api/admin/tasks').then((r) => (r.ok ? r.json().catch(() => ({ tasks: [] })) : { tasks: [] })).catch(() => ({ tasks: [] })),
      fetch('/api/masters/ads').then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null),
    ]);
    setTasks(Array.isArray(t.tasks) ? t.tasks : []);
    const masters = new Map<string, string>();
    for (const ad of Array.isArray(a) ? a : []) {
      const m = (ad as { master?: { id: string; name: string } }).master;
      if (m?.id) masters.set(m.id, m.name || m.id);
    }
    setAds([...masters.entries()].map(([id, name]) => ({ master: { id, name } })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !masterId || !title.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const ad = ads.find((x) => x.master.id === masterId);
      const r = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_id: masterId, master_name: ad?.master.name || '', title, body: text }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || 'Не удалось создать задачу');
      } else {
        setTitle('');
        setText('');
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: 'open' | 'done') => {
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    await load();
  };

  if (!tasks) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  const open = tasks.filter((t) => t.status === 'open');
  const done = tasks.filter((t) => t.status === 'done');

  const renderTask = (t: AdminTask) => (
    <div key={t.id} className="bg-white rounded-[16px] p-3.5 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-zinc-900">{t.title}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 break-words">{t.body}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {t.master_name || t.master_id} · {new Date(t.created_at).toLocaleDateString('ru-RU')} · @{t.author}
            {t.done_at ? ` · выполнено ${new Date(t.done_at).toLocaleDateString('ru-RU')}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus(t.id, t.status === 'open' ? 'done' : 'open')}
          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform ${t.status === 'open' ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-white'}`}
          title={t.status === 'open' ? 'Отметить выполненной' : 'Вернуть в работу'}
        >
          <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-white rounded-[18px] p-4 shadow-sm space-y-2">
        <p className="text-[12px] font-bold text-zinc-900">Новая задача мастеру</p>
        <select value={masterId} onChange={(e) => setMasterId(e.target.value)} className={INPUT}>
          <option value="">— выберите мастера —</option>
          {ads.map((a) => (
            <option key={a.master.id} value={a.master.id}>{a.master.name}</option>
          ))}
          {ads.length === 0 && <option value="master-1">Евгений (демо)</option>}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок задачи" className={INPUT} maxLength={200} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Что нужно сделать (необязательно)" rows={2} className={`${INPUT} resize-none`} maxLength={1000} />
        {err && <p className="text-[11px] text-zinc-800 font-semibold">{err}</p>}
        <button
          type="submit"
          disabled={busy || !masterId || !title.trim()}
          className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Отправить мастеру
        </button>
      </form>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">В работе ({open.length})</p>
        {open.length === 0 ? <p className="text-[12px] text-zinc-400 px-1">Нет открытых задач.</p> : <div className="space-y-2">{open.map(renderTask)}</div>}
      </div>

      {done.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">Выполнены ({done.length})</p>
          <div className="space-y-2 opacity-70">{done.map(renderTask)}</div>
        </div>
      )}

      <p className="text-[10px] text-zinc-300 px-1">
        Задачи появляются мастеру в кабинете (Заказы) и исчезают после отметки «выполнено».
      </p>
    </div>
  );
}

/* ────────────────────────── ЗЕРКАЛО ГЛАВНОЙ ────────────────────────── */

function applyServiceOrder<T extends { name: string }>(list: T[], order?: string[]): T[] {
  if (!order || order.length === 0) return list;
  const pos = new Map(order.map((n, i) => [n, i]));
  return [...list]
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const pa = pos.has(a.s.name) ? pos.get(a.s.name)! : order.length + a.i;
      const pb = pos.has(b.s.name) ? pos.get(b.s.name)! : order.length + b.i;
      return pa - pb;
    })
    .map((x) => x.s);
}

function MirrorTab() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [domain, setDomain] = useState<string>('build');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ServiceEdit>({});
  const [view, setView] = useState<'list' | 'client'>('list');
  const [cardEdit, setCardEdit] = useState<CatalogService | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [mf, setMf] = useState<ServiceEdit>({});
  const [mfName, setMfName] = useState('');
  const [mfErr, setMfErr] = useState('');
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [cardUploading, setCardUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/catalog');
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const services = data?.domains?.[domain] || [];
  const edits = data?.edits?.[domain] || {};
  const order = edits['__order__']?.order;
  const ordered = applyServiceOrder(services, order);

  const saveOrder = async (names: string[]) => {
    setBusy(true);
    await fetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, service: '__order__', fields: { order: names } }),
    });
    await load();
    setBusy(false);
  };

  const move = (index: number, dir: -1 | 1) => {
    const names = ordered.map((s) => s.name);
    const j = index + dir;
    if (j < 0 || j >= names.length) return;
    [names[index], names[j]] = [names[j], names[index]];
    void saveOrder(names);
  };

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

  const openEdit = (sv: CatalogService) => {
    setCardEdit(sv);
    setAddOpen(false);
    setMfErr('');
    setMf({ desc: sv.desc, price: sv.price, time: sv.time, image: sv.image });
    setMfName(sv.name);
  };

  const openAdd = () => {
    setCardEdit(null);
    setAddOpen(true);
    setMfErr('');
    setMf({ desc: '', price: '', time: '', image: '' });
    setMfName('');
  };

  const closeCard = () => {
    setCardEdit(null);
    setAddOpen(false);
    setMfErr('');
  };

  const saveCard = async () => {
    const name = addOpen ? mfName.trim() : cardEdit?.name || '';
    if (!name) { setMfErr('Укажите название услуги'); return; }
    setBusy(true);
    setMfErr('');
    try {
      const fields: ServiceEdit = {
        desc: mf.desc || '',
        price: mf.price || '',
        time: mf.time || '',
        image: mf.image || '',
      };
      if (addOpen || cardEdit?.isNew) fields.new = true;
      const r = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, service: name, fields }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMfErr(d.error || 'Не удалось сохранить');
        return;
      }
      await load();
      closeCard();
    } finally {
      setBusy(false);
    }
  };

  const deleteCard = async (sv: CatalogService) => {
    if (!window.confirm(`Удалить услугу «${sv.name}»? Она исчезнет со всех страниц сайта.`)) return;
    setBusy(true);
    const fields: ServiceEdit = { deleted: true };
    if (sv.isNew) fields.new = true;
    await fetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, service: sv.name, fields }),
    }).catch(() => {});
    await load();
    closeCard();
    setBusy(false);
  };

  const restoreCard = async (sv: CatalogService) => {
    setBusy(true);
    await fetch('/api/admin/catalog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, service: sv.name }),
    }).catch(() => {});
    await load();
    closeCard();
    setBusy(false);
  };

  const uploadCardPhoto = async (file: File) => {
    setCardUploading(true);
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
        body: JSON.stringify({
          domainId: domain,
          type: 'service-photo',
          serviceName: addOpen ? mfName.trim() || 'new' : cardEdit?.name || '',
          data: dataUrl,
        }),
      });
      const json = await res.json();
      if (json.path) setMf((f) => ({ ...f, image: json.path }));
    } finally {
      setCardUploading(false);
    }
  };

  const dragMove = (from: number, to: number) => {
    if (from === to || to < 0 || to >= ordered.length) return;
    const names = ordered.map((x) => x.name);
    const [item] = names.splice(from, 1);
    names.splice(to, 0, item);
    void saveOrder(names);
  };

  if (!data) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-1 px-1">
        {DOMAIN_ORDER.filter((d) => data?.domains?.[d]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => { setDomain(d); setEditing(null); }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${domain === d ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500 shadow-sm'}`}
          >
            {DOMAIN_LABEL[d] || d}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 bg-zinc-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${view === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Список
          </button>
          <button
            type="button"
            onClick={() => setView('client')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${view === 'client' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500'}`}
          >
            Как видит клиент
          </button>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="ml-auto px-3 py-2 rounded-xl bg-zinc-900 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus size={12} /> Добавить
        </button>
      </div>

      {view === 'list' && (
      <div className="space-y-2.5">
        {ordered.map((s, idx) => {
          const isEdited = !!edits[s.name] || (!!order && order.includes(s.name));
          const isEditing = editing === s.name;
          const current = { ...s, ...(edits[s.name] || {}) };

          return (
            <div key={s.name} className="bg-white rounded-[20px] shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={busy || idx === 0}
                    onClick={() => move(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx === ordered.length - 1}
                    onClick={() => move(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.image} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-zinc-900 truncate">{s.name}</p>
                    {isEdited && <span className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[9px] font-bold">изменено</span>}
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
                  {edits[s.name] && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => revert(s.name)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white active:scale-95 transition-transform"
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
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Фото</label>
                    <div className="flex gap-2 items-center">
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
          );
        })}
      </div>
      )}

      <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-zinc-300">
        <LayoutGrid size={11} /> Порядок и правки применяются сразу ко всем страницам сайта
      </div>

      {(cardEdit || addOpen) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={closeCard}>
          <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 sticky top-0 bg-white">
              <p className="text-[13px] font-bold text-zinc-900">
                {addOpen ? 'Новая услуга' : cardEdit?.deleted ? 'Услуга удалена' : 'Редактировать услугу'}
              </p>
              <button type="button" onClick={closeCard} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {cardEdit?.deleted ? (
                <div className="space-y-3">
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    «{cardEdit.name}» скрыта со всех страниц сайта. Восстановить — и она вернётся с исходными данными.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => restoreCard(cardEdit)}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    <RotateCcw size={13} /> Восстановить услугу
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Фото</label>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => cardFileRef.current?.click()}
                        disabled={cardUploading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-600 active:scale-95 transition-transform disabled:opacity-40"
                      >
                        {cardUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Загрузить фото
                      </button>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mf.image || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <input
                      ref={cardFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCardPhoto(f); e.target.value = ''; }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Название</label>
                    <input
                      value={mfName}
                      onChange={(e) => setMfName(e.target.value)}
                      disabled={!!cardEdit && !cardEdit.isNew}
                      className={`${INPUT} disabled:opacity-50`}
                      placeholder="Название услуги"
                    />
                    {!!cardEdit && !cardEdit.isNew && (
                      <p className="text-[9.5px] text-zinc-300 mt-1">Название нельзя менять — оно «привязано» к сайту</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Описание</label>
                    <textarea value={mf.desc || ''} onChange={(e) => setMf((f) => ({ ...f, desc: e.target.value }))} rows={2} className={`${INPUT} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Цена, ₽</label>
                      <input value={mf.price || ''} onChange={(e) => setMf((f) => ({ ...f, price: e.target.value }))} className={INPUT} inputMode="numeric" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Время</label>
                      <input value={mf.time || ''} onChange={(e) => setMf((f) => ({ ...f, time: e.target.value }))} className={INPUT} />
                    </div>
                  </div>
                  {mfErr && <p className="text-[11px] text-zinc-800 font-semibold">{mfErr}</p>}
                  <button
                    type="button"
                    disabled={busy || !mfName.trim()}
                    onClick={saveCard}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Сохранить
                  </button>
                  {cardEdit && !cardEdit.isNew && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteCard(cardEdit)}
                      className="w-full py-2.5 rounded-xl bg-zinc-50 text-zinc-500 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Удалить услугу
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── ФИНАНСЫ (бухгалтер) ────────────────────────── */

function orderPrice(o: ServiceRequest): number {
  const m = o.metadata || {};
  const raw = m.proposed_price ?? m.price;
  const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function FinanceTab() {
  const [orders, setOrders] = useState<ServiceRequest[] | null>(null);

  useEffect(() => {
    listServiceRequests().then(setOrders).catch(() => setOrders([]));
  }, []);

  const csv = () => {
    if (!orders) return;
    const rows = [['Дата', 'Услуга', 'Сайт', 'Статус', 'Цена', 'Телефон', 'Имя', 'Адрес']];
    for (const o of orders) {
      rows.push([
        new Date(o.created_at).toLocaleString('ru-RU'),
        o.service_name,
        String(o.metadata?.domain || ''),
        STATUS_LABEL[o.status] || o.status,
        String(orderPrice(o) || ''),
        o.client_phone || '',
        o.client_name || '',
        o.address || '',
      ]);
    }
    const csvText = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `broverse-zayavki-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!orders) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  const withPrice = orders.filter((o) => orderPrice(o) > 0);
  const total = withPrice.reduce((s, o) => s + orderPrice(o), 0);
  const doneList = withPrice.filter((o) => ['approved', 'accepted', 'completed'].includes(o.status));
  const doneSum = doneList.reduce((s, o) => s + orderPrice(o), 0);
  const avg = withPrice.length ? Math.round(total / withPrice.length) : 0;

  const byDomain = new Map<string, { count: number; sum: number }>();
  for (const o of withPrice) {
    const d = String(o.metadata?.domain || '—');
    const cur = byDomain.get(d) || { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += orderPrice(o);
    byDomain.set(d, cur);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Сумма по заявкам" value={`${total.toLocaleString('ru-RU')} ₽`} sub={`${withPrice.length} шт. с ценой`} />
        <Stat label="Средний чек" value={`${avg.toLocaleString('ru-RU')} ₽`} />
        <Stat label="Принято к оплате" value={`${doneSum.toLocaleString('ru-RU')} ₽`} sub={`${doneList.length} одобрено/выполнено`} />
        <Stat label="Всего заявок" value={orders.length} sub={`без цены: ${orders.length - withPrice.length}`} />
      </div>

      <div className="bg-white rounded-[18px] p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">По сайтам</p>
        <div className="space-y-1.5">
          {[...byDomain.entries()].sort((a, b) => b[1].sum - a[1].sum).map(([d, v]) => (
            <div key={d} className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-zinc-700">{DOMAIN_LABEL[d] || d}</span>
              <span className="text-zinc-500">{v.count} шт.</span>
              <span className="font-bold text-zinc-900">{v.sum.toLocaleString('ru-RU')} ₽</span>
            </div>
          ))}
          {byDomain.size === 0 && <p className="text-[12px] text-zinc-400">Пока нет заявок с ценой</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={csv}
        className="w-full py-3 rounded-2xl bg-white text-zinc-800 text-[13px] font-bold shadow-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
      >
        <History size={14} /> Выгрузить все заявки в CSV
      </button>

      <p className="text-[10px] text-zinc-300 px-1">
        Цены берутся из заявок клиентов. Итоговые суммы по факту работы считает руководитель.
      </p>
    </div>
  );
}

/* ────────────────────────── ЗАКРЫТЫЙ РАЗДЕЛ + ЧАТ ────────────────────────── */

function LockedSection({ label, onAsk, onBack }: { label: string; onAsk: () => void; onBack: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-white rounded-[24px] p-8 text-center shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[12px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors active:scale-95 mb-4"
      >
        <ArrowLeft size={14} /> Назад
      </button>
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
        <Lock size={22} className="text-zinc-400" />
      </div>
      <p className="text-[15px] font-bold text-zinc-900">Раздел «{label}» закрыт</p>
      <p className="text-[12px] text-zinc-400 mt-2 leading-relaxed max-w-[280px] mx-auto">
        Руководитель открывает разделы по мере необходимости. Можно сразу попросить — сообщение уйдёт в чат.
      </p>
      <button
        type="button"
        disabled={sent}
        onClick={() => { onAsk(); setSent(true); }}
        className="mt-5 px-5 py-3 rounded-2xl bg-zinc-900 text-white text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        <Send size={14} /> {sent ? 'Отправлено руководителю' : 'Попросить открыть раздел'}
      </button>
    </div>
  );
}

type ChatMsg = { id: string; from: 'staff' | 'admin'; login: string; text: string; created_at: string };

function ChatPanel({ withLogin }: { withLogin?: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const url = withLogin ? `/api/admin/chat?with=${encodeURIComponent(withLogin)}` : '/api/admin/chat';
    const r = await fetch(url).catch(() => null);
    if (r && r.ok) {
      const d = await r.json().catch(() => null);
      setMsgs(Array.isArray(d?.messages) ? d.messages : []);
    } else setMsgs([]);
  }, [withLogin]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(withLogin ? { to: withLogin } : {}), text: t }),
    }).catch(() => {});
    setText('');
    await load();
    setBusy(false);
  };

  if (!msgs) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div>
      <div className="space-y-2 py-1 min-h-[200px]">
        {msgs.length === 0 && (
          <p className="text-center text-[12px] text-zinc-400 py-8">
            Сообщений пока нет. Напишите первым — собеседник увидит сообщение в кабинете.
          </p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'staff' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${m.from === 'staff' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-800 shadow-sm'}`}>
              <p className="text-[13px] leading-snug break-words">{m.text}</p>
              <p className={`text-[9px] mt-1 ${m.from === 'staff' ? 'text-zinc-400' : 'text-zinc-400'}`}>
                {m.from === 'admin' ? `${m.login} · ` : ''}{new Date(m.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 mt-3 sticky bottom-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={withLogin ? `Сообщение: ${withLogin}…` : 'Сообщение руководителю…'}
          className={INPUT}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="shrink-0 px-4 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

function ChatTab({ session }: { session: Session }) {
  const isChief = session.roles.includes('team');
  const [list, setList] = useState<{ login: string; count: number; last: ChatMsg | null }[] | null>(null);
  const [withLogin, setWithLogin] = useState<string | null>(null);

  useEffect(() => {
    if (!isChief) return;
    fetch('/api/admin/chat?list=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setList(Array.isArray(d?.chats) ? d.chats : []))
      .catch(() => setList([]));
  }, [isChief]);

  if (!isChief) {
    return (
      <div className="bg-white rounded-[24px] p-4 shadow-sm">
        <p className="text-[12px] font-bold text-zinc-900 mb-3">Чат с руководителем</p>
        <ChatPanel />
      </div>
    );
  }

  if (withLogin) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setWithLogin(null)}
          className="mb-3 px-3 py-1.5 rounded-full bg-white text-[11px] font-bold text-zinc-500 shadow-sm"
        >
          ← Все чаты
        </button>
        <p className="text-[12px] font-bold text-zinc-900 mb-2 px-1">Чат: {withLogin}</p>
        <ChatPanel withLogin={withLogin} />
      </div>
    );
  }

  if (list === null) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-zinc-400 px-1">Сообщения сотрудников. Ответы видит только этот сотрудник.</p>
      {list.length === 0 && (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
          <MessageSquare size={26} className="text-zinc-300 mx-auto mb-2" />
          <p className="text-[13px] text-zinc-400">Сотрудники ещё не писали</p>
        </div>
      )}
      {list.map((c) => (
        <button
          key={c.login}
          type="button"
          onClick={() => setWithLogin(c.login)}
          className="w-full text-left bg-white rounded-[16px] p-3.5 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <span className="w-9 h-9 rounded-full bg-zinc-900 text-white text-[12px] font-black flex items-center justify-center shrink-0">
            {c.login.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-zinc-900">@{c.login}</p>
            <p className="text-[11px] text-zinc-400 truncate">
              {c.last ? `${c.last.from === 'admin' ? 'Вы: ' : ''}${c.last.text}` : ''}
            </p>
          </div>
          <ChevronRight size={15} className="text-zinc-300 shrink-0" />
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────── КОМАНДА / ИНВАЙТЫ ────────────────────────── */

const ROLE_TEMPLATES: { label: string; roles: string[] }[] = [
  { label: 'Руководитель', roles: ['overview', 'requests', 'tasks', 'feedback', 'catalog', 'mirror', 'masters', 'team'] },
  { label: 'Администратор', roles: ['overview', 'requests', 'feedback', 'tasks'] },
  { label: 'Бухгалтер', roles: ['overview', 'finance'] },
  { label: 'Дизайнер/контент', roles: ['overview', 'catalog', 'mirror'] },
  { label: 'Менеджер мастеров', roles: ['overview', 'masters', 'tasks'] },
  { label: 'Модератор заявок', roles: ['overview', 'requests', 'feedback'] },
  { label: 'Наблюдатель', roles: ['overview'] },
];

/** Готовое сообщение-доступ для сотрудника (копируется в буфер) */
const accessMessage = (login: string, name: string, roles: string[]) =>
  `Доступ в кабинет BroVerse\n\n` +
  `Ссылка: https://broverse-client.vercel.app/admin/${login}\n` +
  `Логин: ${login}\n` +
  `Имя: ${name}\n\n` +
  `При первом входе зададите свой пароль.\n` +
  `Разделы: ${roles.map((r) => ROLE_LABEL[r]).filter(Boolean).join(', ') || '—'}`;

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Логин из имени: «Алина Смирнова» → «alina-smirnova» */
const toLogin = (s: string): string =>
  s
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

function TeamTab({ session }: { session: Session }) {
  const canManage = session.roles.includes('team');
  const [admins, setAdmins] = useState<{ login: string; display_name: string; roles: string[]; password_set_at: string | null; last_login_at: string | null }[] | null>(null);
  const [newLogin, setNewLogin] = useState('');
  const [newName, setNewName] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>(['requests']);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<Record<string, { action: string; created_at: string }[]>>({});
  const [accessFor, setAccessFor] = useState<string | null>(null);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [r, au] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/audit').catch(() => null),
    ]);
    if (r.ok) {
      const d = await r.json();
      setAdmins(d.admins || []);
    }
    if (au && au.ok) {
      const d = await au.json().catch(() => null);
      const map: Record<string, { action: string; created_at: string }[]> = {};
      for (const e of (d?.entries || []) as AuditEntry[]) {
        if (e.action === 'login' || e.action === 'logout') continue;
        if ((map[e.actor_login] || []).length < 3) {
          (map[e.actor_login] = map[e.actor_login] || []).push({ action: AUDIT_ACTION_LABEL[e.action] || e.action, created_at: e.created_at });
        }
      }
      setActivity(map);
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

  const removeCabinet = async (login: string) => {
    if (!window.confirm(`Удалить кабинет @${login}? Сотрудник потеряет доступ немедленно.`)) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    }).catch(() => {});
    await load();
  };

  const changePassword = async (login: string, mode: 'set' | 'reset') => {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'set'
            ? { login, action: 'set_password', new_password: pwValue }
            : { login, action: 'reset_password' }
        ),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setPwMsg({
          type: 'ok',
          text: mode === 'set'
            ? 'Пароль задан. Старые входы отключены — отправьте его сотруднику.'
            : 'Пароль сброшен. Сотрудник задаст новый при следующем входе.',
        });
        setPwValue('');
        await load();
      } else {
        setPwMsg({ type: 'err', text: d.error || 'Не удалось изменить пароль' });
      }
    } finally {
      setPwBusy(false);
    }
  };

  if (!admins) {
    return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-400 px-1">
        У каждого кабинета своя ссылка: broverse-client.vercel.app/admin/логин. Сотрудник входит по логину;
        пароль создаёт сам при первом входе, а при смене человека — «Сменить пароль» здесь.
      </p>

      {admins.map((a) => (
        <div key={a.login} className="bg-white rounded-[18px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-bold text-zinc-900">{a.display_name || a.login}</span>
            <span className="text-[11px] text-zinc-400">@{a.login}</span>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${a.password_set_at ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-900 text-white'}`}>
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
          {activity[a.login]?.length > 0 && (
            <p className="text-[10px] text-zinc-400 mt-2">
              Действия: {activity[a.login].map((x) => `${x.action} · ${new Date(x.created_at).toLocaleDateString('ru-RU')}`).join(' | ')}
            </p>
          )}
          {canManage && a.login !== session.login && (
            <>
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => { setAccessFor(a.login); setCopied(false); }}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 text-white text-[11px] font-bold active:scale-95 transition-transform"
                >
                  Отправить доступ
                </button>
                <button
                  type="button"
                  onClick={() => setChatWith(a.login)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-bold active:scale-95 transition-transform"
                >
                  Чат
                </button>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => { setPwFor(a.login); setPwValue(''); setPwMsg(null); }}
                  className="flex-1 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <KeyRound size={12} /> Сменить пароль
                </button>
                <button
                  type="button"
                  onClick={() => removeCabinet(a.login)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-400 text-[11px] font-bold active:scale-95 transition-transform"
                >
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {canManage && (
        <form onSubmit={add} className="bg-white rounded-[18px] p-4 shadow-sm space-y-2">
          <p className="text-[12px] font-bold text-zinc-900">Новый сотрудник</p>
          <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} placeholder="Логин" className={INPUT} autoCapitalize="none" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя и фамилия" className={INPUT} />
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Шаблон доступа</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TEMPLATES.map((tp) => (
                <button
                  key={tp.label}
                  type="button"
                  onClick={() => setNewRoles(tp.roles)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-zinc-700 border border-zinc-300 active:scale-95 transition-transform"
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Роли</p>
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
          </div>
          {formError && <p className="text-[11px] text-zinc-800 font-semibold">{formError}</p>}
          <button
            type="submit"
            disabled={busy || !newLogin.trim() || !newName.trim()}
            className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            <Plus size={13} /> Пригласить
          </button>
        </form>
      )}

      {accessFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setAccessFor(null)}>
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-zinc-900 mb-1">Доступ для @{accessFor}</p>
            <p className="text-[11px] text-zinc-400 mb-3">Скопируйте и отправьте сотруднику в Telegram или мессенджер.</p>
            <textarea
              readOnly
              value={accessMessage(accessFor, admins?.find((x) => x.login === accessFor)?.display_name || accessFor, admins?.find((x) => x.login === accessFor)?.roles || [])}
              rows={7}
              className={`${INPUT} resize-none font-mono text-[11px]`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={async () => {
                  const text = accessMessage(accessFor, admins?.find((x) => x.login === accessFor)?.display_name || accessFor, admins?.find((x) => x.login === accessFor)?.roles || []);
                  try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-95 transition-transform"
              >
                {copied ? 'Скопировано ✓' : 'Скопировать'}
              </button>
              <button
                type="button"
                onClick={() => setAccessFor(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-600 text-[12px] font-bold active:scale-95 transition-transform"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {pwFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => { setPwFor(null); setPwMsg(null); }}>
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-zinc-900 mb-1">Пароль: @{pwFor}</p>
            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
              Кабинет постоянный: меняется только пароль — ссылка и логин те же.
              Все старые входы сотрудника отключаются сразу.
            </p>
            <input
              type="password"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              placeholder="Новый пароль (от 6 символов)"
              className={INPUT}
            />
            {pwMsg && (
              <p className={`text-[11px] font-semibold mt-2 ${pwMsg.type === 'ok' ? 'text-zinc-900' : 'text-zinc-700'}`}>
                {pwMsg.text}
              </p>
            )}
            <button
              type="button"
              disabled={pwBusy || pwValue.length < 6}
              onClick={() => changePassword(pwFor, 'set')}
              className="w-full mt-3 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {pwBusy ? '…' : 'Задать новый пароль'}
            </button>
            <div className="flex items-center gap-2 my-3">
              <span className="flex-1 h-px bg-zinc-100" />
              <span className="text-[10px] text-zinc-300 font-bold">ИЛИ</span>
              <span className="flex-1 h-px bg-zinc-100" />
            </div>
            <button
              type="button"
              disabled={pwBusy}
              onClick={() => changePassword(pwFor, 'reset')}
              className="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-[12px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              Сбросить — сотрудник задаст при входе
            </button>
            <button
              type="button"
              onClick={() => { setPwFor(null); setPwMsg(null); }}
              className="w-full mt-2 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-500 text-[12px] font-bold active:scale-[0.98] transition-transform"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {chatWith && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setChatWith(null)}>
          <div className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-[24px] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-zinc-900">Чат: @{chatWith}</p>
              <button type="button" onClick={() => setChatWith(null)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                <X size={15} />
              </button>
            </div>
            <ChatPanel withLogin={chatWith} />
          </div>
        </div>
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
            <p className={`text-[11px] font-semibold ${msg.type === 'ok' ? 'text-zinc-900' : 'text-zinc-700'}`}>{msg.text}</p>
          )}
          <button type="submit" disabled={busy || !oldPassword || newPassword.length < 6} className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold disabled:opacity-40">
            {busy ? '…' : 'Сменить пароль'}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-4 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
        >
          <LogOut size={13} /> Выйти
        </button>
      </div>
    </div>
  );
}
