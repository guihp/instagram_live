export type EnvVarKey =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "OPENROUTER_API_KEY"
  | "DATABASE_URL"
  | "SUPABASE_DB_PASSWORD"
  | "VITE_APP_URL"
  | "SUPABASE_STORAGE_MAX_BYTES";

export type EnvVarScope = "client" | "server" | "optional";

export type EnvVarStatus = {
  key: EnvVarKey;
  label: string;
  description: string;
  scope: EnvVarScope;
  required: boolean;
  configured: boolean;
};

export type DatabaseCheckStatus = "skipped" | "ok" | "missing_tables" | "connection_failed";

export type MigrationRunResult = {
  ok: boolean;
  applied: string[];
  skipped: string[];
  error?: string;
};

export type SetupStatus = {
  ready: boolean;
  env: EnvVarStatus[];
  database: DatabaseCheckStatus;
  databaseMessage?: string;
  canAutoMigrate: boolean;
  supabaseProjectRef?: string;
  supabaseDashboardUrl: string;
  supabaseDatabaseSettingsUrl: string;
  supabaseSqlEditorUrl: string;
  supabaseAuthUsersUrl: string;
  supabaseStorageSettingsUrl: string;
  appOrigin: string;
  adminLoginUrl: string;
  migrations: { file: string; description: string }[];
};
