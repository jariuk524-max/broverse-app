import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type RequestStatus =
  | 'new'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'accepted'
  /** работа завершена мастером (фото до/после загружены) — клиенту к оплате */
  | 'awaiting_payment'
  | 'completed';

export type OrderFeedback = {
  resolved: boolean;
  comment: string;
  rating?: number;
  created_at: string;
};

export type ServiceRequest = {
  id: string;
  created_at: string;
  service_name: string;
  client_name: string;
  client_phone: string;
  address: string;
  status: RequestStatus;
  metadata: {
    photo?: string | null;
    description?: string;
    proposed_price?: string;
    domain?: string;
    price?: number | string;
    comment?: string;
    feedback?: OrderFeedback;
    master_id?: string;
    master_name?: string;
    master_phone?: string;
    master_ad_id?: string;
    master_service?: string;
    /** рейтинг анкеты мастера (для карточки в /admin) */
    master_rating?: number;
    /** заявка на открытие направления (навыка) */
    unlock_direction?: string;
    unlock_type?: 'manual' | 'brocare';
    unlock_equipment?: string;
    unlock_score?: number;
    /** причина отклонения заявки (видна мастеру/админу) */
    decline_reason?: string;
    /** 152-ФЗ: факт и время согласия на обработку ПДн при отправке формы */
    consent?: { personal_data?: boolean; cookies?: boolean; at?: string };
    /** финансы: итоговая сумма к оплате (мастер может увеличить после работы) */
    final_price?: number;
    /** финансы: фото до/после (dataURL), загруженные мастером при завершении */
    photo_before?: string;
    photo_after?: string;
    /** финансы: сумма изменялась мастером после согласования (выполнено больше работ) */
    price_adjusted?: boolean;
    /** финансы: способ оплаты из чека (cash/card) */
    payment_method?: string;
    /** финансы: снимок реквизитов мастера из его профиля на момент завершения */
    master_requisites?: { card?: string; account?: string; sbp?: string };
    /** финансы: работа завершена мастером — заявка ждёт оплаты от клиента */
    waiting_payment_at?: string;
    /** финансы: время нажатия мастером «Оплату получил» — от него идут 30 минут до отзыва */
    payment_confirmed_at?: string;
  } | null;
};

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase URL/key not configured');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Создаёт заявку клиента на услугу (статус «на рассмотрении») */
export async function createServiceRequest(input: {
  serviceName: string;
  clientName?: string;
  clientPhone: string;
  address?: string;
  photo?: string | null;
  description?: string;
  proposedPrice?: string;
  domain?: string;
}): Promise<ServiceRequest | null> {
  const { data, error } = await getSupabase()
    .from('orders')
    .insert({
      service_name: input.serviceName,
      client_name: input.clientName || '',
      client_phone: input.clientPhone,
      address: input.address || '',
      status: 'review',
      metadata: {
        photo: input.photo ?? null,
        description: input.description || '',
        proposed_price: input.proposedPrice || '',
        domain: input.domain || 'wash',
        // 152-ФЗ: согласие получено чекбоксом до отправки формы
        consent: { personal_data: true, cookies: true, at: new Date().toISOString() },
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[Requests] Supabase insert error:', error);
    return null;
  }
  return data as ServiceRequest;
}

/** Забирает все заявки (для админки), новые — сверху.
 * Основной источник — админский GET (service role), fallback — анонимный select. */
export async function listServiceRequests(): Promise<ServiceRequest[]> {
  try {
    const res = await fetch('/api/admin/requests', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (Array.isArray(json?.requests)) return json.requests as ServiceRequest[];
    }
  } catch {
    // нет сессии/роли или вызов не из браузера — идём в анонимный select
  }
  try {
    const { data, error } = await getSupabase()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Requests] Supabase select error:', error);
      return [];
    }
    return (data || []) as ServiceRequest[];
  } catch (e) {
    console.error('[Requests] Supabase not configured:', e);
    return [];
  }
}

/** Меняет статус заявки (одобрить / отклонить) */
export async function setRequestStatus(id: string, status: RequestStatus): Promise<boolean> {
  const { error } = await getSupabase()
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[Requests] Supabase update error:', error);
    return false;
  }
  return true;
}

/** Удаляет заявку */
export async function deleteRequest(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('orders').delete().eq('id', id);
  if (error) {
    console.error('[Requests] Supabase delete error:', error);
    return false;
  }
  return true;
}

/** Ищет заявки клиента по номеру телефона (для формы отзыва) */
export async function findRequestsByPhone(phone: string): Promise<ServiceRequest[]> {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return [];
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .ilike('client_phone', `%${digits}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.error('[Requests] Supabase search error:', error);
    return [];
  }
  return (data || []) as ServiceRequest[];
}

/** Клиент оставляет отзыв: решён ли вопрос + комментарий (+ оценка) */
export async function submitFeedback(
  id: string,
  input: { resolved: boolean; comment: string; rating?: number }
): Promise<boolean> {
  const { data: row, error: readErr } = await getSupabase()
    .from('orders')
    .select('metadata')
    .eq('id', id)
    .single();
  if (readErr) {
    console.error('[Requests] Supabase read error:', readErr);
    return false;
  }
  const metadata = {
    ...(row?.metadata || {}),
    feedback: {
      resolved: input.resolved,
      comment: input.comment,
      ...(input.rating ? { rating: input.rating } : {}),
      created_at: new Date().toISOString(),
    },
  };
  const { error } = await getSupabase().from('orders').update({ metadata }).eq('id', id);
  if (error) {
    console.error('[Requests] Supabase feedback error:', error);
    return false;
  }
  return true;
}

/** Живой снимок заявки — для ожидания ответа мастера и истории клиента.
 *  Ходит через свой API (same-origin, service role) — не зависит от RLS anon в браузере. */
export async function getRequestSnapshot(id: string): Promise<{
  status: string;
  masterId: string | null;
  masterName: string | null;
  declinedBy: string | null;
  finalPrice: number | null;
  masterRequisites: { card?: string; account?: string; sbp?: string } | null;
  paymentConfirmedAt: string | null;
} | null> {
  try {
    const res = await fetch(`/api/order-status?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.order ?? null;
  } catch {
    return null;
  }
}

/** Отзыв открывается через 30 минут после «Оплату получил» (по payment_confirmed_at) */
export const FEEDBACK_DELAY_MS = 30 * 60 * 1000;

export type FeedbackAccess =
  | { ready: true }
  | { ready: false; reason: string };

export function feedbackAccess(meta: ServiceRequest['metadata']): FeedbackAccess {
  if (meta?.feedback) return { ready: true }; // можно обновить ранее оставленный отзыв
  // Заявка прошла финансовую цепочку — отзыв только после оплаты + 30 мин
  if (meta?.waiting_payment_at) {
    if (!meta.payment_confirmed_at) {
      return { ready: false, reason: 'Отзыв откроется после подтверждения оплаты мастером' };
    }
    const unlockAt = new Date(meta.payment_confirmed_at).getTime() + FEEDBACK_DELAY_MS;
    const wait = unlockAt - Date.now();
    if (wait > 0) {
      const mins = Math.max(1, Math.ceil(wait / 60000));
      return { ready: false, reason: `Отзыв откроется через ${mins} мин после оплаты` };
    }
    return { ready: true };
  }
  return { ready: true }; // не проходила цепочку — прежнее поведение
}

/** Перенаправляет прямую заявку другому мастеру (сбрасывает отметку об отказе) */
export async function forwardRequestToMaster(
  id: string,
  master: { id: string; name: string; phone?: string }
): Promise<boolean> {
  const { data: row, error: readErr } = await getSupabase()
    .from('orders')
    .select('metadata')
    .eq('id', id)
    .single();
  if (readErr || !row) return false;
  const metadata = {
    ...(row.metadata || {}),
    master_id: master.id,
    master_name: master.name,
    master_phone: master.phone || '',
    declined_by: null,
    forwarded_at: new Date().toISOString(),
  };
  const { error } = await getSupabase().from('orders').update({ metadata }).eq('id', id);
  if (error) {
    console.error('[Requests] forward error:', error);
    return false;
  }
  // Уведомляем клиента: заявку передали новому мастеру (он ещё не принимал)
  try {
    await fetch('/api/order-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: id, event: 'forwarded' }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error('[Requests] order-notify failed:', err);
  }
  return true;
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Новая',
  review: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  accepted: 'В работе',
  awaiting_payment: 'К оплате',
  completed: 'Выполнен',
};

export const STATUS_COLOR: Record<RequestStatus, string> = {
  new: 'bg-sky-100 text-sky-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  accepted: 'bg-violet-100 text-violet-700',
  awaiting_payment: 'bg-orange-100 text-orange-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

/** Итоговая сумма к оплате (финальная после работы, иначе согласованная/предложенная) */
export function orderPayPrice(o: ServiceRequest): number | null {
  const m = o.metadata;
  const raw = m?.final_price ?? m?.price ?? m?.proposed_price;
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}
