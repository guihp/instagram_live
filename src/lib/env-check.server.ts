import { getEnvVar } from "./load-env.server";

/** Verifica apenas presença das variáveis — sem testar banco (rápido para error handlers). */
export function isRequiredEnvConfigured(): boolean {
  const keys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "WORKER_API_SECRET",
  ] as const;
  return keys.every((key) => Boolean(getEnvVar(key)));
}

export const CONFIG_ERROR_HINT =
  "No Lovable, o preview e o site publicado podem usar secrets diferentes. " +
  "Confira Cloud → Secrets no ambiente Live, adicione os secrets, rode a migration no Supabase, crie o usuário em Authentication → Users e clique Publish → Update. Veja SETUP.md.";
