import { getEnvVar, loadEnvServer } from "./load-env.server";

export function getServerConfig() {
  loadEnvServer();
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: getEnvVar("VITE_SUPABASE_URL") ?? getEnvVar("SUPABASE_URL"),
    supabaseServiceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    workerUrl: getEnvVar("WORKER_URL") ?? "http://localhost:8787",
    workerApiSecret: getEnvVar("WORKER_API_SECRET"),
  };
}
