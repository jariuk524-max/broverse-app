'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, History, X, ArrowLeft, Phone, MessageCircle, ShieldCheck, Star, CreditCard, Building2, Smartphone } from 'lucide-react';
import OrderModal, { type OrderServiceItem } from '@/components/OrderModal';
import FeedbackModal from '@/components/FeedbackModal';
import { getRequestSnapshot } from '@/lib/requests';

export interface StoredOrder {
  id: string;
  /** Supabase id заявки — для живого статуса (к оплате / оплачено) */
  requestId?: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  delivery: string;
  returnType: string;
  payment: string;
  days: number;
  total: number;
  status: 'new' | 'confirmed' | 'awaiting_payment' | 'rejected' | 'completed';
  createdAt: string;
}

type OrderSnapshot = NonNullable<Awaited<ReturnType<typeof getRequestSnapshot>>>;

function getOrders(): StoredOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('brorent_orders') || '[]');
  } catch { return []; }
}

function saveOrder(order: StoredOrder) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem('brorent_orders', JSON.stringify(orders));
}

const STATUS_MAP: Record<StoredOrder['status'], { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Подтверждён', color: 'bg-amber-100 text-amber-700' },
  awaiting_payment: { label: 'К оплате', color: 'bg-orange-100 text-orange-700' },
  rejected: { label: 'Отклонён', color: 'bg-rose-100 text-rose-700' },
  completed: { label: 'Выполнен', color: 'bg-emerald-100 text-emerald-700' },
};

/** Статус из Supabase → ключ бейджа истории */
function statusKeyFromSnapshot(s: string): StoredOrder['status'] {
  switch (s) {
    case 'awaiting_payment': return 'awaiting_payment';
    case 'completed': return 'completed';
    case 'accepted':
    case 'approved': return 'confirmed';
    case 'rejected': return 'rejected';
    default: return 'new';
  }
}

export { saveOrder };

export default function Header() {
  const [showAbout, setShowAbout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, OrderSnapshot>>({});

  useEffect(() => {
    if (showAbout) requestAnimationFrame(() => requestAnimationFrame(() => setAboutVisible(true)));
    else setAboutVisible(false);
  }, [showAbout]);

  useEffect(() => {
    if (showHistory) {
      const loaded = getOrders();
      setOrders(loaded);
      requestAnimationFrame(() => requestAnimationFrame(() => setHistoryVisible(true)));
    } else setHistoryVisible(false);
  }, [showHistory]);

  // Живой статус из Supabase: «к оплате», сумма, реквизиты; поллинг пока история открыта
  useEffect(() => {
    if (!showHistory) return;
    let alive = true;
    const load = async () => {
      const withId = getOrders().filter((o) => o.requestId); // напрямую: state в замыкании ещё пуст при первом открытии
      if (!withId.length) return;
      const entries = await Promise.all(
        withId.map(async (o) => [o.requestId!, await getRequestSnapshot(o.requestId!)] as const)
      );
      if (!alive) return;
      const next: Record<string, OrderSnapshot> = {};
      for (const [id, snap] of entries) if (snap) next[id] = snap;
      setSnapshots(next);
    };
    void load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [showHistory]);

  const handleCloseAbout = useCallback(() => { setAboutVisible(false); setTimeout(() => setShowAbout(false), 300); }, []);
  const handleCloseHistory = useCallback(() => { setHistoryVisible(false); setTimeout(() => setShowHistory(false), 300); }, []);

  return (
    <>
      <div className="relative mx-auto max-w-2xl px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5">
        <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-zinc-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="bg-gradient-to-br from-zinc-50 via-white to-zinc-50 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
              <span className="h-2 w-2 rounded-full bg-[#EA4335]" />
              <span className="h-2 w-2 rounded-full bg-[#FBBC05]" />
              <span className="h-2 w-2 rounded-full bg-[#34A853]" />
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-zinc-900">BroVerse</h1>
            </div>

            <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 mb-5">
              Профессиональные мастера для дома и бизнеса. Химчистка, ремонт, переезд, техника и инструменты.
            </p>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowOrder(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 active:scale-95 transition-all">
                <Sparkles size={14} /> Создать заказ
              </button>
              <button type="button" onClick={() => setShowAbout(true)}
                className="px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 active:scale-95 transition-all">
                О нас
              </button>
              <button type="button" onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 active:scale-95 transition-all">
                <History size={14} /> История {orders.length > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-[#00BCD4] text-[10px] flex items-center justify-center">{orders.length}</span>}
              </button>
              <button type="button" onClick={() => setShowFeedback(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-100 text-zinc-600 text-[13px] font-bold hover:bg-zinc-200 active:scale-95 transition-all">
                <Star size={14} /> Отзыв
              </button>
              <Link href="/chat"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-100 text-zinc-600 text-[13px] font-bold hover:bg-zinc-200 active:scale-95 transition-all">
                <MessageCircle size={14} /> Чат
              </Link>
              <Link href="/admin" aria-label="Админ-панель" title="Админ-панель"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 active:scale-95 transition-all">
                <ShieldCheck size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${aboutVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseAbout} />
          <div className={`relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[85vh] overflow-y-auto ${aboutVisible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'}`}>
            <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">О сервисе</h3>
              <button type="button" onClick={handleCloseAbout} className="p-1.5 rounded-full hover:bg-zinc-100"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-[14px] font-bold text-zinc-900 mb-2">О сервисе</h4>
                <p className="text-[13px] text-zinc-600 leading-relaxed">BroVerse — платформа профессиональных мастеров для дома и бизнеса. Мы соединяем клиентов с проверенными специалистами по химчистке, ремонту, переезду и аренде инструментов.</p>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-zinc-900 mb-2">Блог</h4>
                <div className="space-y-2">
                  {['Как выбрать мастера для химчистки', '5 советов по ремонту квартиры', 'Что нужно знать при переезде'].map((t, i) => (
                    <div key={i} className="p-3 rounded-xl bg-zinc-50">
                      <p className="text-[13px] font-semibold text-zinc-900">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-zinc-900 mb-2">Контакты</h4>
                <div className="space-y-2 text-[13px] text-zinc-600">
                  <p>Telegram: @broverse</p>
                  <p>Email: info@broverse.ru</p>
                  <p>Москва</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${historyVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseHistory} />
          <div className={`relative w-full sm:max-w-[420px] mx-4 bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden transition-all duration-300 ease-out max-h-[85vh] overflow-y-auto ${historyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'}`}>
            <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">История заказов</h3>
              <button type="button" onClick={handleCloseHistory} className="p-1.5 rounded-full hover:bg-zinc-100"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="p-4">
              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <History size={40} className="text-zinc-200 mx-auto mb-3" />
                  <p className="text-[13px] text-zinc-400">Пока нет заказов</p>
                  <p className="text-[11px] text-zinc-300 mt-1">Ваши заказы появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const snap = order.requestId ? snapshots[order.requestId] : undefined;
                    const statusKey = snap ? statusKeyFromSnapshot(snap.status) : order.status;
                    const st = STATUS_MAP[statusKey] ?? STATUS_MAP.new;
                    const payPrice = snap?.finalPrice ?? null;
                    const priceChanged = payPrice !== null && Math.round(payPrice) !== Math.round(order.total);
                    const req = snap?.masterRequisites;
                    const hasReq = !!(req?.card || req?.account || req?.sbp);
                    return (
                      <div key={order.id} className="bg-zinc-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[13px] font-bold text-zinc-900 truncate flex-1 mr-2">{order.service}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Дата</span>
                            <span className="text-zinc-600">{order.date} • {order.time}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Получение</span>
                            <span className="text-zinc-600">{order.delivery} / Возврат: {order.returnType}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Оплата</span>
                            <span className="text-zinc-600">{order.payment}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Срок</span>
                            <span className="text-zinc-600">{order.days} {order.days === 1 ? 'сутки' : order.days < 5 ? 'суток' : 'суток'}</span>
                          </div>
                          {priceChanged && (
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-400">Согласовано</span>
                              <span className="text-zinc-500 line-through">{order.total.toLocaleString('ru')} ₽</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] pt-1 border-t border-zinc-200">
                            <span className="font-bold text-zinc-800">{statusKey === 'awaiting_payment' ? 'К оплате' : 'Итого'}</span>
                            <span className="font-bold text-[#00BCD4]">{(payPrice ?? order.total).toLocaleString('ru')} ₽</span>
                          </div>
                        </div>

                        {/* Счёт мастеру: реквизиты из снимка на момент завершения */}
                        {statusKey === 'awaiting_payment' && (
                          <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-orange-200">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1.5">💳 Оплата мастеру</p>
                            {hasReq ? (
                              <div className="space-y-1">
                                {req?.card && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <CreditCard size={11} className="text-zinc-400 shrink-0" />
                                    <span className="text-zinc-700 font-semibold">{req.card}</span>
                                  </div>
                                )}
                                {req?.account && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <Building2 size={11} className="text-zinc-400 shrink-0" />
                                    <span className="text-zinc-700 font-semibold">{req.account}</span>
                                  </div>
                                )}
                                {req?.sbp && (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <Smartphone size={11} className="text-zinc-400 shrink-0" />
                                    <span className="text-zinc-700 font-semibold">СБП: {req.sbp}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500">Реквизиты уточните у мастера</p>
                            )}
                          </div>
                        )}

                        <p className="text-[9px] text-zinc-300 mt-2">{new Date(order.createdAt).toLocaleString('ru')}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {/* Order modal */}
      {showOrder && (
        <OrderModal service={{
          name: 'Новый заказ',
          desc: 'Опишите задачу',
          price: '0',
          domain: 'wash',
          brand: 'BroVerse',
          color: '#4285F4',
          icon: '📋',
          time: 'По запросу',
          image: '/hero/wash-hero.jpg',
        }} onClose={() => setShowOrder(false)} />
      )}
    </>
  );
}
