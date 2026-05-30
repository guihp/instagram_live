import { config } from "dotenv";

let loaded = false;

/** Carrega .env em handlers server-side. */
export function loadEnvServer() {
  if (loaded) return;
  config();
  loaded = true;
}

export function getEnvVar(name: string): string | undefined {
  loadEnvServer();
  return process.env[name]?.trim();
}
