import pg from "pg";

import { getEnvVar } from "../load-env.server";
import { resolveDatabaseUrl } from "./migrate.server";
import { getSetupEnvOverride } from "./setup-env.server";

const { Client } = pg;

export type SetupSecretsInput = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  DATABASE_URL?: string;
  SUPABASE_DB_PASSWORD?: string;
  VITE_APP_URL?: string;
  SUPABASE_STORAGE_MAX_BYTES?: string;
};

function entriesFromInput(input: SetupSecretsInput): { key: string; value: string }[] {
  const map: Record<string, string | undefined> = {
    VITE_SUPABASE_URL: input.VITE_SUPABASE_URL.trim(),
    VITE_SUPABASE_ANON_KEY: input.VITE_SUPABASE_ANON_KEY.trim(),
    SUPABASE_SERVICE_ROLE_KEY: input.SUPABASE_SERVICE_ROLE_KEY.trim(),
    OPENROUTER_API_KEY: input.OPENROUTER_API_KEY.trim(),
    DATABASE_URL: input.DATABASE_URL?.trim(),
    SUPABASE_DB_PASSWORD: input.SUPABASE_DB_PASSWORD?.trim(),
    VITE_APP_URL: input.VITE_APP_URL?.trim(),
    SUPABASE_STORAGE_MAX_BYTES: input.SUPABASE_STORAGE_MAX_BYTES?.trim(),
  };

  return Object.entries(map)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => ({ key, value }));
}

async function withPgClient<T>(
  databaseUrl: string,
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function persistSetupSecrets(input: SetupSecretsInput): Promise<void> {
  const databaseUrl =
    input.DATABASE_URL?.trim() ||
    resolveDatabaseUrl() ||
    (() => {
      const password = input.SUPABASE_DB_PASSWORD?.trim();
      const url = input.VITE_SUPABASE_URL.trim();
      if (!password || !url) return undefined;
      try {
        const ref = new URL(url).hostname.split(".")[0];
        if (!ref) return undefined;
        return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
      } catch {
        return undefined;
      }
    })();

  if (!databaseUrl) {
    throw new Error("Informe DATABASE_URL ou SUPABASE_DB_PASSWORD para salvar a configuração.");
  }

  const rows = entriesFromInput(input);
  if (rows.length === 0) {
    throw new Error("Nenhum valor para salvar.");
  }

  await withPgClient(databaseUrl, async (client) => {
    for (const { key, value } of rows) {
      await client.query(
        `
        INSERT INTO public.dojo_app_settings (key, value, updated_at)
        VALUES ($1, $2, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        `,
        [key, value],
      );
    }
  });
}

export async function loadPersistedSettings(): Promise<Record<string, string>> {
  const databaseUrl = resolveDatabaseUrl();
  if (databaseUrl) {
    try {
      return await loadSettingsViaPostgres(databaseUrl);
    } catch (err) {
      console.warn("[setup] Falha ao carregar settings via Postgres:", err);
    }
  }

  const url = getEnvVar("VITE_SUPABASE_URL");
  const serviceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return {};

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.from("dojo_app_settings").select("key, value");
    if (error) {
      if ((error as { code?: string }).code === "42P01") return {};
      console.warn("[setup] Falha ao carregar settings via Supabase:", error.message);
      return {};
    }
    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  } catch (err) {
    console.warn("[setup] Falha ao carregar settings:", err);
    return {};
  }
}

async function loadSettingsViaPostgres(databaseUrl: string): Promise<Record<string, string>> {
  return withPgClient(databaseUrl, async (client) => {
    const { rows } = await client.query<{ key: string; value: string }>(
      `SELECT key, value FROM public.dojo_app_settings`,
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  });
}

let configHydrated = false;

export function resetConfigHydration(): void {
  configHydrated = false;
}

/** Carrega secrets salvos no Supabase para process.env (uma vez por processo). */
export async function hydrateEnvFromPersistedSettings(): Promise<boolean> {
  if (configHydrated) return true;

  const persisted = await loadPersistedSettings();
  if (Object.keys(persisted).length === 0) return false;

  for (const [key, value] of Object.entries(persisted)) {
    if (value) process.env[key] = value;
  }

  configHydrated = true;
  return true;
}

export function resetConfigHydrationForTests(): void {
  resetConfigHydration();
}

export function buildEnvFileContent(input: SetupSecretsInput): string {
  const lines = [
    "# Gerado pelo /setup — não commite este arquivo",
    ...entriesFromInput(input).map(({ key, value }) => `${key}=${value}`),
    "",
  ];
  return lines.join("\n");
}

export function getEffectiveEnvVar(name: string): string | undefined {
  return getSetupEnvOverride(name) ?? getEnvVar(name);
}
