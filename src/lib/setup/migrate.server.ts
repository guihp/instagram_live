import pg from "pg";

import { getEnvVar } from "../load-env.server";
import { SETUP_MIGRATIONS } from "./migrations";
import type { MigrationRunResult } from "./types";

const { Client } = pg;

const MIGRATION_SCHEMA = "dojo_setup";
const MIGRATION_TABLE = `${MIGRATION_SCHEMA}.schema_migrations`;

/** SQL embutido no build — funciona no deploy Lovable sem depender do filesystem. */
const migrationModules = import.meta.glob("../../../supabase/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function projectRefFromSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

/** Resolve URI Postgres para migrations (direct ou pooler session — copiado do dashboard). */
export function resolveDatabaseUrl(): string | undefined {
  const direct = getEnvVar("DATABASE_URL") ?? getEnvVar("SUPABASE_DB_URL");
  if (direct) return direct;

  const password = getEnvVar("SUPABASE_DB_PASSWORD");
  const ref = projectRefFromSupabaseUrl(
    getEnvVar("VITE_SUPABASE_URL") ?? getEnvVar("SUPABASE_URL"),
  );
  if (!password || !ref) return undefined;

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

export function canAutoMigrateDatabase(): boolean {
  return Boolean(resolveDatabaseUrl());
}

function sortedMigrationEntries(): { filename: string; sql: string }[] {
  return Object.entries(migrationModules)
    .map(([path, sql]) => ({
      filename: path.split("/").pop() ?? path,
      sql,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

async function ensureMigrationLedger(client: pg.Client): Promise<void> {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${MIGRATION_SCHEMA}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrationFilenames(client: pg.Client): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATION_TABLE}`,
  );
  return new Set(rows.map((r) => r.filename));
}

export async function runPendingMigrations(): Promise<MigrationRunResult> {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    return {
      ok: false,
      applied: [],
      skipped: [],
      error:
        "Adicione DATABASE_URL (Settings → Database → Connect → URI) ou SUPABASE_DB_PASSWORD nos Secrets do Lovable.",
    };
  }

  const entries = sortedMigrationEntries();
  if (entries.length === 0) {
    return {
      ok: false,
      applied: [],
      skipped: [],
      error: "Nenhum arquivo de migration encontrado no build.",
    };
  }

  const known = new Set(SETUP_MIGRATIONS.map((m) => m.file));
  for (const entry of entries) {
    if (!known.has(entry.filename as (typeof SETUP_MIGRATIONS)[number]["file"])) {
      console.warn(`[setup] migration desconhecida no bundle: ${entry.filename}`);
    }
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await client.connect();
    await ensureMigrationLedger(client);
    const done = await getAppliedMigrationFilenames(client);

    for (const { filename, sql } of entries) {
      if (done.has(filename)) {
        skipped.push(filename);
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO ${MIGRATION_TABLE} (filename) VALUES ($1)`, [filename]);
        await client.query("COMMIT");
        applied.push(filename);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    return { ok: true, applied, skipped };
  } catch (err) {
    return {
      ok: false,
      applied,
      skipped,
      error: err instanceof Error ? err.message : "Erro ao aplicar migrations.",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
