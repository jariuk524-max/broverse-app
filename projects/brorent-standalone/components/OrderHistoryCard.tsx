'use client';

import { CreditCard, Building2, Smartphone } from 'lucide-react';
import OrderChat from '@/components/OrderChat';
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

export type OrderSnapshot = NonNullable<Awaited<ReturnType<typeof getRequestSnapshot>>>;

export const STATUS_MAP: Record<StoredOrder['status'], { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Подтверждён', color: 'bg-amber-100 text-amber-700' },
  awaiting_payment: { label: 'К оплате', color: 'bg-orange-100 text-orange-700' },
  rejected: { label: 'Отклонён', color: 'bg-rose-100 text-rose-700' },
  completed: { label: 'Выполнен', color: 'bg-emerald-100 text-emerald-700' },
};

/** Статус из Supabase → ключ бейджа истории */
export function statusKeyFromSnapshot(s: string): StoredOrder['status'] {
  switch (s) {
    case 'awaiting_payment': return 'awaiting_payment';
    case 'completed': return 'completed';
    case 'accepted':
    case 'approved': return 'confirmed';
    case 'rejected': return 'rejected';
    default: return 'new';
  }
}

/** Карточка заказа — ровно так, как её видит клиент в «Истории заказов».
 *  preview: показ без поля ввода (чат с мастером — только чтение, например в админке). */
export default function OrderHistoryCard({
  order,
  snap,
  preview,
}: {
  order: StoredOrder;
  snap?: OrderSnapshot;
  preview?: boolean;
}) {
  const statusKey = snap ? statusKeyFromSnapshot(snap.status) : order.status;
  const st = STATUS_MAP[statusKey] ?? STATUS_MAP.new;
  const payPrice = snap?.finalPrice ?? null;
  const priceChanged = payPrice !== null && Math.round(payPrice) !== Math.round(order.total);
  const req = snap?.masterRequisites;
  const hasReq = !!(req?.card || req?.account || req?.sbp);
  const isMasterReq = !!(snap && (snap.masterId || snap.declinedBy));
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
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

      {/* Мастерская заявка: чат с мастером + пометка, если мастер занят */}
      {isMasterReq && snap?.declinedBy && statusKey === 'new' && (
        <p className="mt-2 text-[10px] font-semibold text-amber-600">Мастер занят — ищем для Вас другого мастера</p>
      )}
      {isMasterReq && order.requestId && (
        <div className="mt-2">
          <OrderChat orderId={order.requestId} preview={preview} />
        </div>
      )}

      <p className="text-[9px] text-zinc-300 mt-2">{new Date(order.createdAt).toLocaleString('ru')}</p>
    </div>
  );
}
