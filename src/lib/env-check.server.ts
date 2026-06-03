import { getEnvVar } from "./load-env.server";

/** Verifica apenas presença das variáveis — sem testar banco (rápido para error handlers). */
export function isRequiredEnvConfigured(): boolean {
  const keys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENROUTER_API_KEY",
  ] as const;
  return keys.every((key) => Boolean(getEnvVar(key)));
}

export const CONFIG_ERROR_HINT =
  "Configure os 4 secrets em Lovable → Cloud → Secrets, rode as migrations SQL no Supabase e crie um usuário em Authentication → Users. Veja SETUP.md e .env.example.";
