import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env") });

export function getWorkerConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const workerApiSecret = process.env.WORKER_API_SECRET;
  const port = Number(process.env.WORKER_PORT ?? 8787);
  const host = process.env.WORKER_HOST ?? "0.0.0.0";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  }
  if (!workerApiSecret) {
    throw new Error("WORKER_API_SECRET é obrigatório.");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    workerApiSecret,
    port,
    host,
    ffmpegPath: process.env.FFMPEG_PATH ?? "ffmpeg",
  };
}
