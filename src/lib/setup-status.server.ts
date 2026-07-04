import { getEnvVar } from "./load-env.server";
import { getServerConfig } from "./config.server";
import { createServiceClient } from "./supabase/server";

export type SetupItemId =
  | "supabase_url"
  | "supabase_anon"
  | "supabase_service_role"
  | "worker_secret"
  | "database"
  | "admin_user"
  | "worker_online";

export interface SetupItem {
  id: SetupItemId;
  label: string;
  done: boolean;
  required: boolean;
  hint: string;
}

const ENV_SPECS = [
  {
    id: "supabase_url" as const,
    keys: ["VITE_SUPABASE_URL"],
    label: "Supabase URL",
    hint: "Supabase → Settings → API → Project URL → secret VITE_SUPABASE_URL no Lovable Cloud → Secrets.",
  },
  {
    id: "supabase_anon" as const,
    keys: ["VITE_SUPABASE_ANON_KEY"],
    label: "Supabase anon key",
    hint: "Supabase → Settings → API → anon public → secret VITE_SUPABASE_ANON_KEY.",
  },
  {
    id: "supabase_service_role" as const,
    keys: ["SUPABASE_SERVICE_ROLE_KEY"],
    label: "Supabase service role",
    hint: "Supabase → Settings → API → service_role (secret) → SUPABASE_SERVICE_ROLE_KEY no Lovable.",
  },
  {
    id: "worker_secret" as const,
    keys: ["WORKER_API_SECRET"],
    label: "Worker API secret",
    hint: "Defina WORKER_API_SECRET no Lovable (mesmo valor usado no apps/ig-live-worker).",
  },
] as const;

export function getMissingEnvKeys(): string[] {
  return ENV_SPECS.flatMap((spec) =>
    spec.keys.filter((key) => !getEnvVar(key)),
  );
}

export function isRequiredEnvConfigured(): boolean {
  return getMissingEnvKeys().length === 0;
}

function envItems(): SetupItem[] {
  return ENV_SPECS.map((spec) => ({
    id: spec.id,
    label: spec.label,
    done: spec.keys.every((key) => Boolean(getEnvVar(key))),
    required: true,
    hint: spec.hint,
  }));
}

async function checkDatabase(): Promise<SetupItem> {
  const base: SetupItem = {
    id: "database",
    label: "Migration do banco (ig_broadcasts)",
    done: false,
    required: true,
    hint:
      "Rode supabase/migrations/20260704120000_initial_schema.sql no SQL Editor do Supabase (ou supabase db push).",
  };

  if (!isRequiredEnvConfigured()) return base;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("ig_broadcasts").select("id").limit(1);
    if (error) {
      if (/does not exist|relation|schema cache/i.test(error.message)) {
        return base;
      }
      return { ...base, hint: `Erro ao acessar o banco: ${error.message}` };
    }
    return { ...base, done: true };
  } catch {
    return base;
  }
}

async function checkAdminUser(): Promise<SetupItem> {
  const base: SetupItem = {
    id: "admin_user",
    label: "Usuário admin (login)",
    done: false,
    required: true,
    hint: "Supabase → Authentication → Users → Add user (email/senha para /login).",
  };

  if (!isRequiredEnvConfigured()) return base;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) return { ...base, hint: error.message };
    return { ...base, done: (data.users?.length ?? 0) > 0 };
  } catch {
    return base;
  }
}

async function checkWorkerOnline(): Promise<SetupItem> {
  const { workerUrl } = getServerConfig();
  const isLocalhost = /localhost|127\.0\.0\.1/.test(workerUrl);

  const base: SetupItem = {
    id: "worker_online",
    label: "Worker RTMP online",
    done: false,
    required: false,
    hint: isLocalhost
      ? "Local: npm run worker:ig-live. No Lovable publicado: hospede apps/ig-live-worker (Railway/Render/VPS) e defina WORKER_URL com a URL pública."
      : `Confira se o worker responde em ${workerUrl}/health e se WORKER_API_SECRET bate com o worker.`,
  };

  if (!getEnvVar("WORKER_API_SECRET")) return base;

  try {
    const res = await fetch(`${workerUrl}/health`, { signal: AbortSignal.timeout(4000) });
    return { ...base, done: res.ok };
  } catch {
    return base;
  }
}

export async function getSetupStatus() {
  const items = [...envItems(), await checkDatabase(), await checkAdminUser(), await checkWorkerOnline()];
  const requiredPending = items.filter((i) => i.required && !i.done);
  const optionalPending = items.filter((i) => !i.required && !i.done);

  return {
    ready: requiredPending.length === 0,
    canStream: items.find((i) => i.id === "worker_online")?.done ?? false,
    items,
    requiredPending,
    optionalPending,
    missingEnv: getMissingEnvKeys(),
  };
}

export function formatSetupHint(status: Awaited<ReturnType<typeof getSetupStatus>>): string {
  if (status.ready && status.canStream) {
    return "Ambiente pronto. Crie uma transmissão em /admin/instagram-live.";
  }

  const lines: string[] = [
    "Checklist para rodar no Lovable (veja LOVABLE.md e SETUP.md):",
    "",
  ];

  for (const item of status.items.filter((i) => !i.done)) {
    lines.push(`• ${item.label}: ${item.hint}`);
  }

  if (status.ready && !status.canStream) {
    lines.push("", "O painel admin funciona, mas iniciar stream exige o worker RTMP online.");
  }

  lines.push(
    "",
    "Secrets vão em Lovable → Cloud → Secrets (Test e Live). Depois: Publish → Update.",
    "Não crie tela /setup no app — configure só via Cloud Secrets + Supabase.",
  );

  return lines.join("\n");
}
