import { z } from "zod";

/** Validação leve no cliente; merge e checagens finais no servidor. */
export const setupSecretsSchema = z.object({
  VITE_SUPABASE_URL: z.string(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  VITE_APP_URL: z.string().optional(),
  SUPABASE_STORAGE_MAX_BYTES: z.string().optional(),
});

export type SetupSecretsPayload = z.infer<typeof setupSecretsSchema>;

export function normalizeSetupPayload(payload: SetupSecretsPayload) {
  return {
    VITE_SUPABASE_URL: payload.VITE_SUPABASE_URL.trim(),
    VITE_SUPABASE_ANON_KEY: payload.VITE_SUPABASE_ANON_KEY.trim(),
    SUPABASE_SERVICE_ROLE_KEY: payload.SUPABASE_SERVICE_ROLE_KEY.trim(),
    OPENROUTER_API_KEY: payload.OPENROUTER_API_KEY.trim(),
    DATABASE_URL: payload.DATABASE_URL?.trim() || undefined,
    SUPABASE_DB_PASSWORD: payload.SUPABASE_DB_PASSWORD?.trim() || undefined,
    VITE_APP_URL: payload.VITE_APP_URL?.trim() || undefined,
    SUPABASE_STORAGE_MAX_BYTES: payload.SUPABASE_STORAGE_MAX_BYTES?.trim() || undefined,
  };
}
