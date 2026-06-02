import {
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { applySetupMigrations, getSetupStatus, saveSetupConfiguration } from "@/lib/api/setup.functions";
import { SetupSecretsForm } from "@/components/setup/SetupSecretsForm";
import type { DatabaseCheckStatus, EnvVarStatus, SetupStatus } from "@/lib/setup/types";
import { cn } from "@/lib/utils";

type SetupWizardProps = {
  initialStatus: SetupStatus;
};

function copyText(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`);
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
  ) : (
    <Circle className="size-5 shrink-0 text-white/20" aria-hidden />
  );
}

function databaseLabel(status: DatabaseCheckStatus): { text: string; ok: boolean } {
  switch (status) {
    case "ok":
      return { text: "Banco conectado e migrations aplicadas", ok: true };
    case "missing_tables":
      return { text: "Banco vazio — migrations pendentes", ok: false };
    case "connection_failed":
      return { text: "Falha ao conectar — confira URL e service_role", ok: false };
    default:
      return { text: "Aguardando chaves do Supabase", ok: false };
  }
}

function EnvRow({ item }: { item: EnvVarStatus }) {
  const scopeLabel =
    item.scope === "server" ? "Só servidor" : item.scope === "optional" ? "Opcional" : "Client + servidor";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <StatusIcon ok={item.configured} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-medium text-white/90">{item.key}</code>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
              item.scope === "server"
                ? "bg-amber-500/10 text-amber-300/80"
                : item.required
                  ? "bg-brand-teal/10 text-brand-teal/90"
                  : "bg-white/[0.06] text-white/40",
            )}
          >
            {scopeLabel}
          </span>
          {!item.required && <span className="text-[0.65rem] text-white/30">opcional</span>}
        </div>
        <p className="mt-1 text-xs text-white/40">{item.description}</p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-medium",
          item.configured ? "text-emerald-400/90" : "text-white/25",
        )}
      >
        {item.configured ? "OK" : "Pendente"}
      </span>
    </div>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#0F1114] p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-teal/15 text-sm font-semibold text-brand-teal">
          {step}
        </span>
        <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ExternalLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      {children}
      <ExternalLink className="size-3.5 opacity-60" />
    </a>
  );
}

export function SetupWizard({ initialStatus }: SetupWizardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [checking, setChecking] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const reloadStatus = useCallback(async () => {
    const next = await getSetupStatus();
    setStatus(next);
    return next;
  }, []);

  const runVerify = useCallback(async (autoMigrate: boolean) => {
    let next = await getSetupStatus();

    if (
      autoMigrate &&
      next.database === "missing_tables" &&
      next.canAutoMigrate &&
      next.env.filter((v) => v.required).every((v) => v.configured)
    ) {
      setMigrating(true);
      toast.message("Criando tabelas e buckets automaticamente…");
      const result = await applySetupMigrations();
      setMigrating(false);

      if (result.ok) {
        const count = result.applied.length;
        toast.success(
          count > 0
            ? `${count} migration${count > 1 ? "s" : ""} aplicada${count > 1 ? "s" : ""}.`
            : "Banco já estava atualizado.",
        );
        next = await getSetupStatus();
      } else {
        toast.error(result.error ?? "Falha ao aplicar migrations.");
      }
    }

    setStatus(next);

    if (next.ready) {
      toast.success("Ambiente configurado! Redirecionando para o login…");
      window.location.href = "/login";
      return;
    }

    if (!autoMigrate || next.database !== "missing_tables") {
      toast.message("Ainda faltam passos — veja o checklist abaixo.");
    }
  }, []);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      await runVerify(true);
    } catch {
      toast.error("Não foi possível verificar o ambiente.");
    } finally {
      setChecking(false);
      setMigrating(false);
    }
  }, [runVerify]);

  const applyMigrationsOnly = useCallback(async () => {
    setMigrating(true);
    try {
      const result = await applySetupMigrations();
      if (result.ok) {
        toast.success(
          result.applied.length > 0
            ? `${result.applied.length} migrations aplicadas.`
            : "Nenhuma migration pendente.",
        );
        const next = await getSetupStatus();
        setStatus(next);
        if (next.ready) window.location.href = "/login";
      } else {
        toast.error(result.error ?? "Falha ao aplicar migrations.");
      }
    } catch {
      toast.error("Erro ao conectar ao banco.");
    } finally {
      setMigrating(false);
    }
  }, []);

  const busy = checking || migrating;

  const db = databaseLabel(status.database);
  const requiredEnv = status.env.filter((v) => v.required);
  const requiredDone = requiredEnv.every((v) => v.configured);
  const clientOrigin = typeof window !== "undefined" ? window.location.origin : status.appOrigin;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-16">
      {/* Header status */}
      <div
        className={cn(
          "rounded-2xl border p-6 sm:p-8",
          status.ready
            ? "border-emerald-500/20 bg-emerald-500/[0.06]"
            : "border-amber-500/20 bg-amber-500/[0.04]",
        )}
      >
        <div className="flex items-start gap-4">
          {status.ready ? (
            <CheckCircle2 className="size-8 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="size-8 shrink-0 text-amber-400" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-light tracking-tight text-white sm:text-2xl">
              {status.ready ? "Ambiente pronto" : "Configure o ambiente"}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              {status.ready
                ? "Todas as variáveis e o banco estão OK. Esta página fica oculta para visitantes."
                : "Você remixou ou fez deploy sem configurar. Preencha o formulário abaixo — salvamos no seu Supabase, sem sair desta tela."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={busy}
            className="dojo-btn-primary inline-flex shrink-0 items-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {migrating ? "Criando banco…" : "Verificar"}
          </button>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-wide text-white/30">Secrets</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {requiredDone ? "Completos" : `${requiredEnv.filter((v) => v.configured).length}/${requiredEnv.length}`}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-wide text-white/30">Banco</p>
            <p className={cn("mt-1 text-sm font-medium", db.ok ? "text-emerald-400/90" : "text-amber-300/80")}>
              {db.text}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-wide text-white/30">Painel admin</p>
            <p className="mt-1 truncate text-sm font-medium text-white/80">{clientOrigin}/login</p>
          </div>
        </div>
        {status.databaseMessage && status.database !== "ok" && (
          <p className="mt-4 text-xs text-amber-300/70">{status.databaseMessage}</p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-teal/20 bg-brand-teal/[0.04] px-4 py-3">
        <Shield className="mt-0.5 size-4 shrink-0 text-brand-teal" />
        <p className="text-xs leading-relaxed text-white/50">
          <strong className="font-medium text-white/70">Segurança:</strong> chaves de servidor nunca vão para o browser.
          Elas são salvas na tabela <code className="text-brand-teal/90">dojo_app_settings</code> do seu Supabase (sem
          acesso público). Visitantes do webinar <strong className="text-white/60">nunca</strong> veem esta página.
        </p>
      </div>

      <StepCard step={1} title="Criar projeto Supabase">
        <p className="mb-4 text-sm text-white/45">
          Crie um projeto <strong className="text-white/70">novo</strong> em supabase.com (não reutilize o do autor do
          template). Anote URL e chaves em Settings → API.
        </p>
        <div className="flex flex-wrap gap-2">
          <ExternalLinkButton href="https://supabase.com/dashboard/projects">Abrir Supabase</ExternalLinkButton>
          {status.supabaseProjectRef && (
            <ExternalLinkButton href={status.supabaseDashboardUrl}>Seu projeto</ExternalLinkButton>
          )}
        </div>
      </StepCard>

      <StepCard step={2} title="Suas chaves (salvar aqui)">
        <SetupSecretsForm
          envStatus={status.env}
          defaultAppUrl={clientOrigin}
          onSaved={() => void reloadStatus()}
        />

        <details className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <summary className="cursor-pointer text-xs font-medium text-white/40">
            Prefere colar no Lovable Cloud → Secrets?
          </summary>
          <p className="mt-3 text-xs text-white/35">
            Opcional: use os mesmos nomes no painel Cloud do Lovable. O formulário acima já salva no Supabase — não é
            obrigatório.
          </p>
          <div className="mt-3 space-y-2">
            {status.env.map((item) => (
              <EnvRow key={item.key} item={item} />
            ))}
          </div>
        </details>
      </StepCard>

      <StepCard step={3} title="Banco de dados (automático)">
        <p className="mb-4 text-sm text-white/45">
          O banco do remix começa <strong className="text-white/70">vazio</strong>. Com{" "}
          <code className="text-white/60">DATABASE_URL</code> ou{" "}
          <code className="text-white/60">SUPABASE_DB_PASSWORD</code> nos Secrets, o app cria sozinho todas as tabelas,
          RLS e buckets — igual ao template. Clique em <strong className="text-white/70">Verificar</strong>.
        </p>

        <div className="mb-4 rounded-xl border border-brand-teal/20 bg-brand-teal/[0.04] p-4 text-xs text-white/50">
          <p className="font-medium text-white/70">Como obter a conexão do banco</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Supabase → <strong className="text-white/60">Settings → Database</strong> → Connect
            </li>
            <li>
              Copie a URI do <strong className="text-white/60">Session pooler</strong> (porta 5432) como secret{" "}
              <code className="text-brand-teal/90">DATABASE_URL</code>
            </li>
            <li>
              Ou use só a senha do banco como <code className="text-brand-teal/90">SUPABASE_DB_PASSWORD</code> (Reset
              database password)
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExternalLinkButton href={status.supabaseDatabaseSettingsUrl}>
            Database settings
          </ExternalLinkButton>
          {status.canAutoMigrate && status.database === "missing_tables" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void applyMigrationsOnly()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-xs font-medium text-brand-teal transition-colors hover:bg-brand-teal/15 disabled:opacity-60"
            >
              {migrating ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Criar banco agora
            </button>
          )}
        </div>

        <details className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <summary className="cursor-pointer text-xs font-medium text-white/40">
            Fallback manual — só se o automático falhar
          </summary>
          <p className="mt-3 text-xs text-white/35">
            Cole cada arquivo de <code className="text-white/50">supabase/migrations/</code> no SQL Editor, na ordem:
          </p>
          <ExternalLinkButton href={status.supabaseSqlEditorUrl}>Abrir SQL Editor</ExternalLinkButton>
          <ol className="mt-3 space-y-2">
            {status.migrations.map((m, i) => (
              <li
                key={m.file}
                className="flex gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs"
              >
                <span className="shrink-0 font-mono text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <code className="text-white/70">{m.file}</code>
                  <p className="text-white/35">{m.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </details>
      </StepCard>

      <StepCard step={4} title="Criar usuário admin">
        <p className="mb-4 text-sm text-white/45">
          Supabase → Authentication → Users → Add user (email + senha). Use essas credenciais em{" "}
          <a href="/login" className="text-brand-teal/90 underline-offset-2 hover:underline">
            /login
          </a>{" "}
          para acessar <code className="text-white/60">/admin</code>.
        </p>
        <ExternalLinkButton href={status.supabaseAuthUsersUrl}>Gerenciar usuários</ExternalLinkButton>
      </StepCard>

      <StepCard step={5} title="OpenRouter (IA)">
        <p className="mb-4 text-sm text-white/45">
          Crie conta em openrouter.ai, gere uma API key e adicione como{" "}
          <code className="text-white/60">OPENROUTER_API_KEY</code> nos Secrets. Sem ela: admin e landing funcionam;
          transcrição automática e chat IA não.
        </p>
        <div className="flex flex-wrap gap-2">
          <ExternalLinkButton href="https://openrouter.ai/keys">Gerar API key</ExternalLinkButton>
          <button
            type="button"
            onClick={() => copyText("OPENROUTER_API_KEY", "Nome da variável")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06]"
          >
            <Copy className="size-3.5" />
            Copiar nome da variável
          </button>
        </div>
      </StepCard>

      <StepCard step={6} title="URLs do seu app">
        <p className="mb-4 text-sm text-white/45">
          Após configurar, estes são os endereços principais. Compartilhe apenas a landing do webinar com leads — nunca
          esta página de setup.
        </p>
        <ul className="space-y-2 text-sm">
          {[
            { label: "Login admin", path: "/login" },
            { label: "Painel", path: "/admin" },
            { label: "Landing pública (exemplo)", path: "/webinar/seu-slug" },
          ].map(({ label, path }) => {
            const url = `${clientOrigin}${path}`;
            return (
              <li
                key={path}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <span className="text-white/50">{label}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-white/70">{url}</code>
                  <button
                    type="button"
                    onClick={() => copyText(url, label)}
                    className="rounded p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                    aria-label={`Copiar ${label}`}
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-white/30">
          Opcional: defina <code>VITE_APP_URL</code> com a URL pública do preview Lovable (referer OpenRouter).
        </p>
        <div className="mt-3">
          <ExternalLinkButton href={status.supabaseStorageSettingsUrl}>
            Storage — limite de upload (Pro)
          </ExternalLinkButton>
        </div>
      </StepCard>
    </div>
  );
}
