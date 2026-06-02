import { createServerFn } from "@tanstack/react-start";

import { getEnvVar } from "../load-env.server";
import { runPendingMigrations } from "../setup/migrate.server";
import { buildSetupStatus } from "../setup/status.server";
import type { MigrationRunResult, SetupStatus } from "../setup/types";

function resolveAppOrigin(): string {
  return getEnvVar("VITE_APP_URL") ?? "http://localhost:5173";
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async (): Promise<SetupStatus> => {
  return buildSetupStatus(resolveAppOrigin());
});

export const applySetupMigrations = createServerFn({ method: "POST" }).handler(
  async (): Promise<MigrationRunResult> => {
    const status = await buildSetupStatus(resolveAppOrigin());
    if (status.ready) {
      return { ok: false, applied: [], skipped: [], error: "Ambiente já configurado." };
    }
    if (!status.canAutoMigrate) {
      return {
        ok: false,
        applied: [],
        skipped: [],
        error: "Adicione DATABASE_URL ou SUPABASE_DB_PASSWORD nos Secrets do Lovable.",
      };
    }
    return runPendingMigrations();
  },
);
