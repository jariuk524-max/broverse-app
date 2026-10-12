import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type RequestStatus = 'review' | 'approved' | 'rejected';

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

export const STATUS_LABEL: Record<RequestStatus, string> = {
  review: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

export const STATUS_COLOR: Record<RequestStatus, string> = {
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
