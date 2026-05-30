import { createClient } from "@supabase/supabase-js";

import { getServerConfig } from "../config.server";
import type { Database } from "./database.types";

export function createServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerConfig();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY e VITE_SUPABASE_URL são obrigatórios no .env — reinicie o dev server",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
