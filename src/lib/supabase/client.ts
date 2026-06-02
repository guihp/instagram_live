import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function createBrowserClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env");
  }

  return createClient<Database>(url, key);
}

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabase(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

/** Cliente lazy — evita crash na importação quando o ambiente ainda não foi configurado. */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getBrowserSupabase(), prop, receiver);
  },
});
