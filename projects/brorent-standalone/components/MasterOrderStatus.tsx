'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Star, Clock, Users, CreditCard, Building2, Smartphone, Wallet } from 'lucide-react';
import { getRequestSnapshot, forwardRequestToMaster } from '@/lib/requests';
import type { MasterAd } from '@/lib/master-ads';

/** Прямая заявка ждёт ответа мастера, затем клиенту предлагают альтернативы */
const DIRECT_TIMEOUT_MS = 3 * 60 * 1000;

type Phase = 'waiting' | 'accepted' | 'to_pay' | 'paid' | 'prompt' | 'picking' | 'no';
type Reason = 'timeout' | 'declined' | 'admin';

const REASON_TEXT: Record<Reason, string> = {
  timeout: 'Мастер сейчас занят и не ответил за 3 минуты.',
  declined: 'Мастер отказался от заявки.',
  admin: 'Заявку не подтвердили.',
};

export default function MasterOrderStatus({
  orderId,
  masterId,
  masterName,
  serviceName,
  onClose,
}: {
  orderId: string;
  masterId: string;
  masterName: string;
  serviceName: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reason, setReason] = useState<Reason>('timeout');
  const [deadline, setDeadline] = useState(() => Date.now() + DIRECT_TIMEOUT_MS);
  const [currentId, setCurrentId] = useState(masterId);
  const [currentName, setCurrentName] = useState(masterName);
  const [alts, setAlts] = useState<MasterAd[] | null>(null);
  const [tried, setTried] = useState<string[]>([masterId]);
  const [forwarding, setForwarding] = useState(false);
  // Счёт к оплате (из снимка заявки): сумма + реквизиты мастера
  const [payPrice, setPayPrice] = useState<number | null>(null);
  const [requisites, setRequisites] = useState<{ card?: string; account?: string; sbp?: string } | null>(null);

  // Живой статус: принят → работа завершена (к оплате) → оплачено; иначе отказ/истекло
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'accepted' && phase !== 'to_pay') return;
    let alive = true;
    const tick = async () => {
      const snap = await getRequestSnapshot(orderId);
      if (!alive || !snap) return;
      if (snap.status === 'awaiting_payment') {
        setPayPrice(snap.finalPrice);
        setRequisites(snap.masterRequisites);
        setPhase('to_pay');
        return;
      }
      if (snap.status === 'completed') { setPhase('paid'); return; }
      if (phase === 'waiting') {
        if (snap.status === 'accepted') { setPhase('accepted'); return; }
        if (snap.status === 'rejected') { setReason('admin'); setPhase('prompt'); return; }
        if (snap.declinedBy) { setReason('declined'); setPhase('prompt'); return; }
        if (Date.now() >= deadline) { setReason('timeout'); setPhase('prompt'); }
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [phase, deadline, orderId]);

  const loadAlternatives = async () => {
    if (alts) return;
    try {
      const res = await fetch('/api/masters/ads');
      const ads: MasterAd[] = await res.json();
      const pool = (Array.isArray(ads) ? ads : []).filter(
        (a) => a.master?.id && a.master.id !== currentId && !tried.includes(a.master.id)
      );
      const sameDomain = pool.filter((a) => a.domain);
      const rest = pool.filter((a) => !a.domain);
      const sorted = [...sameDomain, ...rest].sort(
        (a, b) => (b.master.rating ?? 5) - (a.master.rating ?? 5)
      );
      setAlts(sorted.slice(0, 6));
    } catch {
      setAlts([]);
    }
  };

  const showAlternatives = () => {
    setPhase('picking');
    void loadAlternatives();
  };

  const pick = async (ad: MasterAd) => {
    if (forwarding) return;
    setForwarding(true);
    const ok = await forwardRequestToMaster(orderId, {
      id: ad.master.id,
      name: ad.master.name,
      phone: ad.master.phone,
    });
    setForwarding(false);
    if (!ok) return;
    setTried((p) => [...p, ad.master.id]);
    setCurrentId(ad.master.id);
    setCurrentName(ad.master.name);
    setAlts(null);
    setDeadline(Date.now() + DIRECT_TIMEOUT_MS);
    setPhase('waiting');
  };

  /* ── Работа завершена — клиенту счёт ── */
  if (phase === 'to_pay') {
    const hasReq = !!(requisites?.card || requisites?.account || requisites?.sbp);
    return (
      <div className="py-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
          <Wallet size={32} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Работа завершена — к оплате</h3>
        <p className="text-sm text-zinc-500 mb-1">{currentName ? `Мастер ${currentName} · ` : ''}{serviceName}</p>
        <div className="mx-auto max-w-[300px] mb-4 p-3.5 bg-zinc-50 rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Сумма к оплате</span>
          </div>
          <p className="text-center text-2xl font-black text-zinc-900">{payPrice !== null ? `${payPrice.toLocaleString('ru-RU')} ₽` : '—'}</p>
          {hasReq && (
            <div className="mt-3 pt-3 border-t border-zinc-200 space-y-1.5 text-left">
              {requisites?.card && (
                <div className="flex items-center gap-2 text-[12px]">
                  <CreditCard size={12} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-700 font-semibold">{requisites.card}</span>
                </div>
              )}
              {requisites?.account && (
                <div className="flex items-center gap-2 text-[12px]">
                  <Building2 size={12} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-700 font-semibold">{requisites.account}</span>
                </div>
              )}
              {requisites?.sbp && (
                <div className="flex items-center gap-2 text-[12px]">
                  <Smartphone size={12} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-700 font-semibold">СБП: {requisites.sbp}</span>
                </div>
              )}
            </div>
          )}
          {!hasReq && <p className="text-[11px] text-zinc-500 text-center mt-2">Реквизиты уточните у мастера</p>}
        </div>
        <p className="text-xs text-zinc-400 mb-4">Счёт также виден в разделе «История».<br />Мастер подтвердит получение оплаты.</p>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors">
          Понятно
        </button>
      </div>
    );
  }

  /* ── Оплата получена ── */
  if (phase === 'paid') {
    return (
      <div className="py-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Оплата получена</h3>
        <p className="text-sm text-zinc-500 mb-1">{currentName ? `Мастер ${currentName} · ` : ''}{serviceName}</p>
        <p className="text-xs text-zinc-400 mb-6">Спасибо! Через 30 минут в разделе «Отзыв» вы сможете оценить работу.</p>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors">
          Отлично
        </button>
      </div>
    );
  }

  if (phase === 'accepted') {
    return (
      <div className="py-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Мастер принял заявку</h3>
        <p className="text-sm text-zinc-500 mb-1">{currentName ? `Мастер ${currentName} · ` : ''}{serviceName}</p>
        <p className="text-xs text-zinc-400 mb-6">Свяжется с вами для подтверждения деталей визита</p>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors">
          Отлично
        </button>
      </div>
    );
  }

  if (phase === 'prompt') {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Clock size={30} className="text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Мастер занят</h3>
        <p className="text-sm text-zinc-500 mb-1">{currentName ? `Мастер ${currentName} · ` : ''}{serviceName}</p>
        <p className="text-sm text-zinc-600 mb-6">{REASON_TEXT[reason]}</p>
        <p className="text-sm font-semibold text-zinc-900 mb-4">Показать других мастеров с рейтингом?</p>
        <button type="button" onClick={showAlternatives} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors mb-2">
          Да, показать
        </button>
        <button type="button" onClick={() => setPhase('no')} className="w-full py-3 rounded-2xl bg-zinc-100 text-zinc-600 text-sm font-bold hover:bg-zinc-200 transition-colors">
          Нет, спасибо
        </button>
      </div>
    );
  }

  if (phase === 'picking') {
    return (
      <div className="py-2 text-left">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-[#00BCD4]" />
          <h3 className="text-base font-bold text-zinc-900">Свободные мастера</h3>
        </div>
        {alts === null && (
          <div className="flex items-center justify-center gap-2 py-8 text-zinc-400 text-sm">
            <Loader2 size={18} className="animate-spin" /> Ищем мастеров…
          </div>
        )}
        {alts !== null && alts.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-500 mb-4">Свободных мастеров сейчас нет — заявка остаётся в общей ленте, её возьмёт первый свободный.</p>
            <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-zinc-100 text-zinc-700 text-sm font-bold">
              Закрыть
            </button>
          </div>
        )}
        {alts !== null && alts.length > 0 && (
          <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
            {alts.map((ad) => (
              <div key={`${ad.id}-${ad.master.id}`} className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-3">
                <div className="w-11 h-11 rounded-full bg-[#E0F7FA] overflow-hidden shrink-0 flex items-center justify-center">
                  {ad.master.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.master.photo} alt={ad.master.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-[#00BCD4]">{(ad.master.name || 'М')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-zinc-900 truncate">{ad.master.name}</p>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500 shrink-0">
                      <Star size={11} fill="currentColor" /> {(ad.master.rating ?? 5).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {ad.directionLabel || ad.master.specialization || ad.title}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={forwarding}
                  onClick={() => pick(ad)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#00BCD4] text-white text-[11px] font-bold hover:bg-[#0097A7] transition-colors disabled:opacity-50"
                >
                  {forwarding ? '…' : 'Выбрать'}
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setPhase('no')} className="w-full mt-4 py-2.5 rounded-2xl bg-zinc-100 text-zinc-500 text-[11px] font-bold">
          Нет, оставить в общей ленте
        </button>
      </div>
    );
  }

  if (phase === 'no') {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <Users size={30} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Заявка в общей ленте</h3>
        <p className="text-sm text-zinc-500 mb-6">Любой свободный мастер возьмёт её первым. Заявка сохранена.</p>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-[#00BCD4] text-white text-sm font-bold hover:bg-[#0097A7] transition-colors">
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-[#E0F7FA] flex items-center justify-center mb-4">
        <Loader2 size={30} className="text-[#00BCD4] animate-spin" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 mb-2">Ждём ответа мастера</h3>
      <p className="text-sm text-zinc-500 mb-1">{currentName ? `Мастер ${currentName} · ` : ''}{serviceName}</p>
      <p className="text-xs text-zinc-400 mb-6">Мастер обязан ответить в течение 3 минут.<br />Если занят — предложим других мастеров.</p>
      <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-zinc-100 text-zinc-600 text-sm font-bold hover:bg-zinc-200 transition-colors">
        Закрыть
      </button>
    </div>
  );
}
