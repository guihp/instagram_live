import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { saveSetupConfiguration } from "@/lib/api/setup.functions";
import type { EnvVarStatus } from "@/lib/setup/types";
import { cn } from "@/lib/utils";

type FieldDef = {
  key: keyof FormState;
  label: string;
  hint: string;
  required: boolean;
  serverOnly?: boolean;
};

type FormState = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  DATABASE_URL: string;
  SUPABASE_DB_PASSWORD: string;
  VITE_APP_URL: string;
  SUPABASE_STORAGE_MAX_BYTES: string;
};

const FIELDS: FieldDef[] = [
  {
    key: "VITE_SUPABASE_URL",
    label: "Supabase — Project URL",
    hint: "Settings → API → Project URL",
    required: true,
  },
  {
    key: "VITE_SUPABASE_ANON_KEY",
    label: "Supabase — anon public",
    hint: "Settings → API → anon public",
    required: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "Supabase — service_role",
    hint: "Settings → API → service_role (nunca exposta no browser)",
    required: true,
    serverOnly: true,
  },
  {
    key: "OPENROUTER_API_KEY",
    label: "OpenRouter API key",
    hint: "openrouter.ai/keys — IA do chat e transcrição",
    required: true,
    serverOnly: true,
  },
  {
    key: "DATABASE_URL",
    label: "Database URI (recomendado)",
    hint: "Settings → Database → Connect → Session pooler (porta 5432)",
    required: false,
    serverOnly: true,
  },
  {
    key: "SUPABASE_DB_PASSWORD",
    label: "Senha do banco (alternativa)",
    hint: "Se não usar DATABASE_URL — Reset database password",
    required: false,
    serverOnly: true,
  },
  {
    key: "VITE_APP_URL",
    label: "URL pública do app",
    hint: "Opcional — URL do preview Lovable",
    required: false,
  },
  {
    key: "SUPABASE_STORAGE_MAX_BYTES",
    label: "Limite de upload (bytes)",
    hint: "Opcional — ex.: 524288000 após Supabase Pro",
    required: false,
    serverOnly: true,
  },
];

const emptyForm = (): FormState => ({
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  OPENROUTER_API_KEY: "",
  DATABASE_URL: "",
  SUPABASE_DB_PASSWORD: "",
  VITE_APP_URL: "",
  SUPABASE_STORAGE_MAX_BYTES: "",
});

type SetupSecretsFormProps = {
  envStatus: EnvVarStatus[];
  defaultAppUrl?: string;
  onSaved: () => void;
};

export function SetupSecretsForm({ envStatus, defaultAppUrl, onSaved }: SetupSecretsFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm(),
    VITE_APP_URL: defaultAppUrl ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.DATABASE_URL.trim() && !form.SUPABASE_DB_PASSWORD.trim()) {
      toast.error("Informe DATABASE_URL ou a senha do banco para criar as tabelas automaticamente.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveSetupConfiguration({
        data: {
          VITE_SUPABASE_URL: form.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: form.VITE_SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: form.SUPABASE_SERVICE_ROLE_KEY,
          OPENROUTER_API_KEY: form.OPENROUTER_API_KEY,
          DATABASE_URL: form.DATABASE_URL || undefined,
          SUPABASE_DB_PASSWORD: form.SUPABASE_DB_PASSWORD || undefined,
          VITE_APP_URL: form.VITE_APP_URL || undefined,
          SUPABASE_STORAGE_MAX_BYTES: form.SUPABASE_STORAGE_MAX_BYTES || undefined,
        },
      });

      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar.");
        return;
      }

      if (result.migrationApplied && result.migrationApplied.length > 0) {
        toast.success(`Banco criado (${result.migrationApplied.length} migrations).`);
      } else {
        toast.success("Configuração salva no seu Supabase.");
      }

      if (result.envFileHint) {
        toast.message(result.envFileHint);
      }

      if (result.ready) {
        toast.success("Tudo pronto! Redirecionando…");
        window.location.href = "/login";
        return;
      }

      onSaved();
    } catch {
      toast.error("Erro ao salvar. Confira os valores e tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <p className="text-sm text-white/45">
        Preencha aqui — <strong className="text-white/70">salvamos no seu Supabase</strong> (tabela protegida, só
        servidor). Não precisa abrir Cloud → Secrets no Lovable. Depois de republicar o preview, a config continua no
        banco.
      </p>

      <div className="space-y-3">
        {FIELDS.map((field) => {
          const configured = envStatus.find((e) => e.key === field.key)?.configured;
          const isSecret = field.serverOnly || field.key.includes("KEY") || field.key.includes("PASSWORD");

          return (
            <div
              key={field.key}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label htmlFor={field.key} className="text-sm font-medium text-white/85">
                  {field.label}
                  {field.required ? <span className="text-brand-teal"> *</span> : null}
                </label>
                {field.serverOnly && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-amber-300/80">
                    só servidor
                  </span>
                )}
                {configured && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-400/90">
                    já salvo
                  </span>
                )}
              </div>
              <p className="mb-2 text-xs text-white/35">{field.hint}</p>
              <div className="relative">
                <input
                  id={field.key}
                  type={isSecret && !visible[field.key] ? "password" : "text"}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  required={field.required}
                  autoComplete="off"
                  placeholder={configured ? "••••••••  (deixe em branco para manter)" : ""}
                  className="dojo-glass-input h-11 w-full px-3.5 pr-10 font-mono text-xs"
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                    aria-label={visible[field.key] ? "Ocultar" : "Mostrar"}
                  >
                    {visible[field.key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dojo-btn-border-glow pt-2">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "dojo-btn-primary flex h-[52px] w-full items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando e criando banco…
            </>
          ) : (
            "Salvar e configurar tudo"
          )}
        </button>
      </div>

      <p className="text-center text-[0.7rem] text-white/30">
        Os valores ficam na tabela <code className="text-white/45">dojo_app_settings</code> do seu projeto — não no
        código nem no frontend público.
      </p>
    </form>
  );
}
