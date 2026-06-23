import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export interface Order {
  id: string;
  service_name: string;
  client_name: string | null;
  client_phone: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type OrderInsert = Omit<Order, "id" | "created_at" | "status">;

export function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase не настроен. Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local"
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error("Supabase не настроен: отсутствует NEXT_PUBLIC_SUPABASE_URL");
  }
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

export function isSupabasePaused(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("paused") ||
    msg.includes("not active") ||
    msg.includes("PGRST002") ||
    msg.includes("project is paused") ||
    msg.includes("HTTP 402")
  );
}
