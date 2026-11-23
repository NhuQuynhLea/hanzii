import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ls } from "@/lib/storage";

/**
 * Shared Supabase client — single connection for Realtime presence and the
 * score/doc store. Null when env vars are missing (solo mode).
 */
let client: SupabaseClient | null = null;
let uid = "";

export function supaUid(): string {
  if (!uid) {
    uid = ls.get("nh:uid") || "";
    if (!uid) {
      uid = crypto.randomUUID();
      ls.set("nh:uid", uid);
    }
  }
  return uid;
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 16 } },
  });
  return client;
}
