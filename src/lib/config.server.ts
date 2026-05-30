import { getEnvVar, loadEnvServer } from "./load-env.server";

export function getServerConfig() {
  loadEnvServer();
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: getEnvVar("VITE_SUPABASE_URL") ?? getEnvVar("SUPABASE_URL"),
    supabaseServiceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    openRouterApiKey: getEnvVar("OPENROUTER_API_KEY"),
    /** Limite de upload no Storage (bytes). Padrão 48 MB (Free). Após aumentar Global limit no Supabase, defina ex.: 524288000 */
    supabaseStorageMaxBytes: Number(getEnvVar("SUPABASE_STORAGE_MAX_BYTES") ?? 48 * 1024 * 1024),
  };
}
