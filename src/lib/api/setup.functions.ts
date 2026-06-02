import { createServerFn } from "@tanstack/react-start";

import { getEnvVar } from "../load-env.server";
import { saveAndConfigureSetup } from "../setup/configure-setup.server";
import { runPendingMigrations } from "../setup/migrate.server";
import { hydrateEnvFromPersistedSettings } from "../setup/settings-store.server";
import { normalizeSetupPayload, setupSecretsSchema } from "../setup/setup-schema";
import { buildSetupStatus } from "../setup/status.server";
import type { MigrationRunResult, SaveSetupResult, SetupStatus } from "../setup/types";

function resolveAppOrigin(): string {
  return getEnvVar("VITE_APP_URL") ?? "http://localhost:5173";
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async (): Promise<SetupStatus> => {
  await hydrateEnvFromPersistedSettings();
  return buildSetupStatus(resolveAppOrigin());
});

export const applySetupMigrations = createServerFn({ method: "POST" }).handler(
  async (): Promise<MigrationRunResult> => {
    await hydrateEnvFromPersistedSettings();
    const status = await buildSetupStatus(resolveAppOrigin());
    if (status.ready) {
      return { ok: false, applied: [], skipped: [], error: "Ambiente já configurado." };
    }
    if (!status.canAutoMigrate) {
      return {
        ok: false,
        applied: [],
        skipped: [],
        error: "Informe DATABASE_URL ou SUPABASE_DB_PASSWORD no formulário abaixo.",
      };
    }
    return runPendingMigrations();
  },
);

export const saveSetupConfiguration = createServerFn({ method: "POST" })
  .inputValidator(setupSecretsSchema)
  .handler(async ({ data }): Promise<SaveSetupResult> => {
    const status = await buildSetupStatus(resolveAppOrigin());
    if (status.ready) {
      return { ok: false, error: "Ambiente já configurado." };
    }
    return saveAndConfigureSetup(normalizeSetupPayload(data), resolveAppOrigin());
  });
