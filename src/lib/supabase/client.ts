import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export function createBrowserClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env");
  }

  return createClient<Database>(url, key);
}

export const supabase = createBrowserClient();
