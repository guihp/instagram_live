import { config } from "dotenv";

import { getSetupEnvOverride } from "./setup/setup-env.server";

let loaded = false;

/** Carrega .env em handlers server-side. */
export function loadEnvServer() {
  if (loaded) return;
  config();
  loaded = true;
}

export function getEnvVar(name: string): string | undefined {
  loadEnvServer();
  const override = getSetupEnvOverride(name);
  if (override) return override;
  return process.env[name]?.trim();
}
