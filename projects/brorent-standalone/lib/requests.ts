import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type RequestStatus = 'new' | 'review' | 'approved' | 'rejected';

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

/** Забирает все заявки (для админки), новые — сверху */
export async function listServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Requests] Supabase select error:', error);
    return [];
  }
  return (data || []) as ServiceRequest[];
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

export const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Новая',
  review: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

export const STATUS_COLOR: Record<RequestStatus, string> = {
  new: 'bg-sky-100 text-sky-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
