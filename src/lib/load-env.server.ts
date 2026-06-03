import { config } from "dotenv";

let loaded = false;

/** Carrega .env em handlers server-side (local dev). */
export function loadEnvServer() {
  if (loaded) return;
  config();
  loaded = true;
}

function readImportMetaEnv(name: string): string | undefined {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const value = env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

/**
 * Lê variáveis do process.env (runtime) ou import.meta.env (build Vite/Lovable publish).
 * No preview do Lovable costuma vir via process.env; na URL publicada (Cloudflare Workers)
 * muitas vezes só existem as vars injetadas no build (import.meta.env).
 */
export function getEnvVar(name: string): string | undefined {
  loadEnvServer();
  return process.env[name]?.trim() || readImportMetaEnv(name);
}
