import { getEnvVar } from "../load-env.server";
import { getSupabaseStorageSettingsUrl } from "../supabase/dashboard-url.server";
import { createServiceClient } from "../supabase/server";
import { canAutoMigrateDatabase } from "./migrate.server";
import { SETUP_MIGRATIONS } from "./migrations";
import type { DatabaseCheckStatus, EnvVarStatus, SetupStatus } from "./types";

const ENV_SPECS: Omit<EnvVarStatus, "configured">[] = [
  {
    key: "VITE_SUPABASE_URL",
    label: "Supabase — Project URL",
    description: "Settings → API → Project URL",
    scope: "client",
    required: true,
  },
  {
    key: "VITE_SUPABASE_ANON_KEY",
    label: "Supabase — anon public",
    description: "Settings → API → anon public (pode ir no client)",
    scope: "client",
    required: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "Supabase — service_role",
    description: "Settings → API → service_role — só servidor, nunca no browser",
    scope: "server",
    required: true,
  },
  {
    key: "OPENROUTER_API_KEY",
    label: "OpenRouter API key",
    description: "Transcrição de vídeo e respostas IA no chat ao vivo",
    scope: "server",
    required: true,
  },
  {
    key: "DATABASE_URL",
    label: "Supabase — Database URI",
    description:
      "Settings → Database → Connect → URI (Session pooler). Necessário para criar tabelas automaticamente.",
    scope: "server",
    required: false,
  },
  {
    key: "SUPABASE_DB_PASSWORD",
    label: "Supabase — senha do banco",
    description: "Alternativa ao DATABASE_URL — Settings → Database → Reset password",
    scope: "server",
    required: false,
  },
  {
    key: "VITE_APP_URL",
    label: "URL pública do app",
    description: "Opcional — referer para OpenRouter (ex.: URL do preview Lovable)",
    scope: "client",
    required: false,
  },
  {
    key: "SUPABASE_STORAGE_MAX_BYTES",
    label: "Limite de upload (bytes)",
    description: "Opcional — após aumentar limite no Storage (plano Pro)",
    scope: "server",
    required: false,
  },
];

function projectRefFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

function supabaseDashboardBase(ref: string | undefined): string {
  if (!ref) return "https://supabase.com/dashboard";
  return `https://supabase.com/dashboard/project/${ref}`;
}

async function checkDatabase(supabaseUrl: string | undefined): Promise<{
  status: DatabaseCheckStatus;
  message?: string;
}> {
  const hasServerSecrets =
    Boolean(supabaseUrl) &&
    Boolean(getEnvVar("SUPABASE_SERVICE_ROLE_KEY")) &&
    Boolean(getEnvVar("VITE_SUPABASE_ANON_KEY"));

  if (!hasServerSecrets) {
    return { status: "skipped", message: "Configure as chaves do Supabase antes de testar o banco." };
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("webinars").select("id").limit(1);

    if (!error) return { status: "ok" };

    const code = (error as { code?: string }).code;
    if (code === "42P01" || error.message?.includes("does not exist")) {
      return {
        status: "missing_tables",
        message: canAutoMigrateDatabase()
          ? "Banco vazio — clique em Verificar para criar tabelas automaticamente."
          : "Banco vazio — adicione DATABASE_URL ou SUPABASE_DB_PASSWORD nos Secrets para migrations automáticas.",
      };
    }

    return {
      status: "connection_failed",
      message: error.message || "Não foi possível conectar ao Supabase.",
    };
  } catch (err) {
    return {
      status: "connection_failed",
      message: err instanceof Error ? err.message : "Erro ao conectar ao Supabase.",
    };
  }
}

export async function buildSetupStatus(appOrigin: string): Promise<SetupStatus> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL") ?? getEnvVar("SUPABASE_URL");
  const ref = projectRefFromUrl(supabaseUrl);
  const dashboard = supabaseDashboardBase(ref);

  const env: EnvVarStatus[] = ENV_SPECS.map((spec) => ({
    ...spec,
    configured: Boolean(getEnvVar(spec.key)),
  }));

  const requiredConfigured = env.filter((v) => v.required).every((v) => v.configured);
  const databaseResult = await checkDatabase(supabaseUrl);
  const ready = requiredConfigured && databaseResult.status === "ok";

  return {
    ready,
    env,
    database: databaseResult.status,
    databaseMessage: databaseResult.message,
    canAutoMigrate: canAutoMigrateDatabase(),
    supabaseProjectRef: ref,
    supabaseDashboardUrl: dashboard,
    supabaseDatabaseSettingsUrl: `${dashboard}/settings/database`,
    supabaseSqlEditorUrl: `${dashboard}/sql/new`,
    supabaseAuthUsersUrl: `${dashboard}/auth/users`,
    supabaseStorageSettingsUrl: getSupabaseStorageSettingsUrl(supabaseUrl),
    appOrigin,
    adminLoginUrl: `${appOrigin}/login`,
    migrations: [...SETUP_MIGRATIONS],
  };
}
