import {
  getMissingEnvKeys,
  isRequiredEnvConfigured,
  getSetupStatus,
  formatSetupHint,
} from "./setup-status.server";

export { getMissingEnvKeys, isRequiredEnvConfigured, getSetupStatus, formatSetupHint };

/** Mensagem síncrona para error boundaries (sem checagem de banco/worker). */
export function getConfigErrorHint(): string {
  const missing = getMissingEnvKeys();

  const lines = [
    "Ambiente incompleto para Instagram Live.",
    "",
    "No Lovable: Cloud → Secrets (Test e Live), depois Publish → Update.",
    "Guia completo: LOVABLE.md e SETUP.md.",
    "",
  ];

  if (missing.length > 0) {
    lines.push("Secrets faltando:");
    for (const key of missing) {
      lines.push(`• ${key}`);
    }
    lines.push("");
  }

  lines.push(
    "Também confira no Supabase:",
    "• Migration: supabase/migrations/20260704120000_initial_schema.sql",
    "• Usuário admin: Authentication → Users → Add user",
    "",
    "Para transmitir: worker RTMP (apps/ig-live-worker) + WORKER_URL público no Lovable.",
  );

  return lines.join("\n");
}

export const CONFIG_ERROR_HINT = getConfigErrorHint();
