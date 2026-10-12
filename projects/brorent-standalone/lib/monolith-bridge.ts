import type { BroverseLeadPayload } from './domains';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const MONOLITH_ORIGIN =
  process.env.NEXT_PUBLIC_MONOLITH_URL ?? 'http://localhost:3000';

let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase URL/key not configured');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Создаёт заказ напрямую в Supabase */
export async function createOrderInSupabase(payload: {
  title: string;
  service?: string;
  address?: string;
  price?: number;
  lat?: number;
  lng?: number;
  client_name?: string;
  client_phone?: string;
  client_comment?: string;
  client_chat_id?: string;
}) {
  const { data, error } = await getSupabase()
    .from('orders')
    .insert({
      service_name: payload.title,
      address: payload.address || '',
      lat: payload.lat || 55.7558 + (Math.random() - 0.5) * 0.04,
      lng: payload.lng || 37.6173 + (Math.random() - 0.5) * 0.04,
      client_name: payload.client_name || '',
      client_phone: payload.client_phone || '',
      status: 'new',
      metadata: {
        price: payload.price || 0,
        comment: payload.client_comment || '',
        domain: payload.service || 'cleaning',
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[ClientSite] Supabase error:', error);
    return null;
  }

  console.log('[ClientSite] Order created:', data.id);
  return data;
}

const MONOLITH_WINDOW_NAME = 'broverse-monolith';

let monolithWindow: Window | null = null;

function ensureMonolithWindow(): Window | null {
  if (typeof window === 'undefined') return null;

  if (monolithWindow && !monolithWindow.closed) {
    monolithWindow.focus();
    return monolithWindow;
  }

  monolithWindow = window.open(MONOLITH_ORIGIN, MONOLITH_WINDOW_NAME);
  return monolithWindow;
}

function postLead(win: Window, payload: BroverseLeadPayload) {
  win.postMessage({ type: 'BROVERSE_LEAD', payload }, MONOLITH_ORIGIN);
}

/** Отправляет лид в Монолит (:3000) через postMessage */
export function sendLeadToMonolith(payload: BroverseLeadPayload): boolean {
  const win = ensureMonolithWindow();
  if (!win) return false;

  const message = { type: 'BROVERSE_LEAD' as const, payload };

  postLead(win, payload);

  [600, 1500, 3000].forEach((ms) => {
    setTimeout(() => {
      if (win.closed) return;
      win.postMessage(message, MONOLITH_ORIGIN);
    }, ms);
  });

  return true;
}
