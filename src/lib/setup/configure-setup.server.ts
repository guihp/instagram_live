import { createClient } from "@supabase/supabase-js";

import { runPendingMigrations } from "./migrate.server";
import {
  buildEnvFileContent,
  loadPersistedSettings,
  persistSetupSecrets,
  resetConfigHydration,
  type SetupSecretsInput,
} from "./settings-store.server";
import { withSetupEnvAsync } from "./setup-env.server";
import { buildSetupStatus } from "./status.server";
import type { SaveSetupResult } from "./types";
import { hydrateEnvFromPersistedSettings } from "./settings-store.server";

function toEnvRecord(input: SetupSecretsInput): Record<string, string> {
  const entries: Record<string, string> = {
    VITE_SUPABASE_URL: input.VITE_SUPABASE_URL.trim(),
    VITE_SUPABASE_ANON_KEY: input.VITE_SUPABASE_ANON_KEY.trim(),
    SUPABASE_SERVICE_ROLE_KEY: input.SUPABASE_SERVICE_ROLE_KEY.trim(),
    OPENROUTER_API_KEY: input.OPENROUTER_API_KEY.trim(),
  };
  if (input.DATABASE_URL?.trim()) entries.DATABASE_URL = input.DATABASE_URL.trim();
  if (input.SUPABASE_DB_PASSWORD?.trim()) {
    entries.SUPABASE_DB_PASSWORD = input.SUPABASE_DB_PASSWORD.trim();
  }
  if (input.VITE_APP_URL?.trim()) entries.VITE_APP_URL = input.VITE_APP_URL.trim();
  if (input.SUPABASE_STORAGE_MAX_BYTES?.trim()) {
    entries.SUPABASE_STORAGE_MAX_BYTES = input.SUPABASE_STORAGE_MAX_BYTES.trim();
  }
  return entries;
}

async function validateSupabaseConnection(input: SetupSecretsInput): Promise<string | undefined> {
  const url = input.VITE_SUPABASE_URL.trim();
  const serviceKey = input.SUPABASE_SERVICE_ROLE_KEY.trim();
  const anonKey = input.VITE_SUPABASE_ANON_KEY.trim();

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: adminError } = await admin.from("dojo_app_settings").select("key").limit(1);
  if (adminError && (adminError as { code?: string }).code !== "42P01") {
    return `Supabase (service_role): ${adminError.message}`;
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: anonError } = await anon.auth.getSession();
  if (anonError) {
    return `Supabase (anon): ${anonError.message}`;
  }

  return undefined;
}

async function tryWriteEnvFile(content: string): Promise<boolean> {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const { writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    await writeFile(join(process.cwd(), ".env"), content, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function saveAndConfigureSetup(
  input: SetupSecretsInput,
  appOrigin: string,
): Promise<SaveSetupResult> {
  const persisted = await loadPersistedSettings();

  const merged: SetupSecretsInput = {
    VITE_SUPABASE_URL: input.VITE_SUPABASE_URL.trim() || persisted.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY: input.VITE_SUPABASE_ANON_KEY.trim() || persisted.VITE_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY:
      input.SUPABASE_SERVICE_ROLE_KEY.trim() || persisted.SUPABASE_SERVICE_ROLE_KEY || "",
    OPENROUTER_API_KEY: input.OPENROUTER_API_KEY.trim() || persisted.OPENROUTER_API_KEY || "",
    DATABASE_URL: input.DATABASE_URL?.trim() || persisted.DATABASE_URL,
    SUPABASE_DB_PASSWORD: input.SUPABASE_DB_PASSWORD?.trim() || persisted.SUPABASE_DB_PASSWORD,
    VITE_APP_URL: input.VITE_APP_URL?.trim() || persisted.VITE_APP_URL,
    SUPABASE_STORAGE_MAX_BYTES:
      input.SUPABASE_STORAGE_MAX_BYTES?.trim() || persisted.SUPABASE_STORAGE_MAX_BYTES,
  };

  if (!merged.VITE_SUPABASE_URL || !merged.VITE_SUPABASE_ANON_KEY || !merged.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Preencha URL, anon e service_role do Supabase." };
  }
  if (!merged.OPENROUTER_API_KEY) {
    return { ok: false, error: "Preencha a chave do OpenRouter." };
  }
  if (!merged.DATABASE_URL && !merged.SUPABASE_DB_PASSWORD) {
    return {
      ok: false,
      error: "Informe DATABASE_URL ou SUPABASE_DB_PASSWORD para criar o banco automaticamente.",
    };
  }

  const envRecord = toEnvRecord(merged);

  return withSetupEnvAsync(envRecord, async () => {
    const connectionError = await validateSupabaseConnection(merged);
    if (connectionError) {
      return { ok: false, error: connectionError };
    }

    let migrationApplied: string[] = [];
    const migrationResult = await runPendingMigrations();
    if (!migrationResult.ok) {
      return { ok: false, error: migrationResult.error, migrationApplied: migrationResult.applied };
    }
    migrationApplied = migrationResult.applied;

    try {
      await persistSetupSecrets(merged);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falha ao salvar configuração no banco.",
        migrationApplied,
      };
    }

    for (const [key, value] of Object.entries(envRecord)) {
      process.env[key] = value;
    }

    resetConfigHydration();
    await hydrateEnvFromPersistedSettings();

    const envContent = buildEnvFileContent(merged);
    const wroteEnvFile = await tryWriteEnvFile(envContent);

    const status = await buildSetupStatus(appOrigin);

    return {
      ok: true,
      migrationApplied,
      wroteEnvFile,
      envFileHint: wroteEnvFile
        ? "Arquivo .env criado localmente."
        : "No Lovable, republicar o preview após salvar (config fica no seu Supabase).",
      ready: status.ready,
    };
  });
}
