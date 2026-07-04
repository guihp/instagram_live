import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Info,
  Radio,
  TriangleAlert,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { IgBroadcastEvent } from "@/lib/supabase/database.types";
import { formatBrasiliaDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** Tipos legados/técnicos — não exibir no painel do cliente. */
const HIDDEN_EVENT_TYPES = new Set(["ffmpeg", "scheduler"]);

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Info; className: string; borderClass: string }
> = {
  success: {
    label: "Sucesso",
    icon: CheckCircle2,
    className: "text-emerald-300",
    borderClass: "border-emerald-500/20 bg-emerald-500/5",
  },
  step: {
    label: "Passo",
    icon: CircleDot,
    className: "text-sky-300",
    borderClass: "border-sky-500/20 bg-sky-500/5",
  },
  info: {
    label: "Informação",
    icon: Info,
    className: "text-white/70",
    borderClass: "border-white/[0.06] bg-white/[0.02]",
  },
  warning: {
    label: "Atenção",
    icon: TriangleAlert,
    className: "text-amber-200",
    borderClass: "border-amber-500/20 bg-amber-500/5",
  },
  error: {
    label: "Problema",
    icon: AlertCircle,
    className: "text-red-200",
    borderClass: "border-red-500/20 bg-red-500/5",
  },
};

function normalizeLegacyEvent(ev: IgBroadcastEvent): IgBroadcastEvent | null {
  if (HIDDEN_EVENT_TYPES.has(ev.type)) return null;

  if (ev.type === "error" && ev.message.includes("ffmpeg encerrou")) {
    return {
      ...ev,
      type: "error",
      message:
        "A transmissão parou de forma inesperada.\n\n→ Desligue o loop do vídeo, gere nova stream key no Instagram e tente de novo.",
    };
  }

  if (ev.type === "info" && ev.message.includes("ffmpeg conectado")) {
    return {
      ...ev,
      type: "success",
      message: "Vídeo sendo enviado ao Instagram. Agora clique «Go Live» no Live Producer.",
    };
  }

  if (ev.type === "info" && ev.message.includes("Iniciando ffmpeg")) {
    return { ...ev, type: "step", message: "Preparando envio do vídeo ao Instagram…" };
  }

  if (ev.type === "info" && ev.message.includes("armada")) {
    return {
      ...ev,
      type: "success",
      message: "Transmissão pronta. Clique «Iniciar» quando estiver no modo Live no Instagram.",
    };
  }

  if (ev.type === "info" && ev.message.includes("parada pelo operador")) {
    return { ...ev, type: "info", message: "Transmissão parada por você." };
  }

  return ev;
}

function splitMessage(message: string): { body: string; hint?: string } {
  const hintMatch = message.match(/\n\n→\s*([\s\S]+)$/);
  if (hintMatch) {
    return {
      body: message.replace(/\n\n→[\s\S]+$/, "").trim(),
      hint: hintMatch[1].trim(),
    };
  }
  return { body: message.trim() };
}

interface IgBroadcastActivityFeedProps {
  events: IgBroadcastEvent[];
  className?: string;
}

export function IgBroadcastActivityFeed({ events, className }: IgBroadcastActivityFeedProps) {
  const visible = events
    .map(normalizeLegacyEvent)
    .filter((ev): ev is IgBroadcastEvent => ev !== null);

  const latestError = visible.find((ev) => ev.type === "error");

  return (
    <div className={cn("space-y-4", className)}>
      {latestError && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-medium text-red-100">Precisa de ajuda?</p>
          <p className="mt-1 text-sm text-red-100/80">{splitMessage(latestError.message).body}</p>
          {splitMessage(latestError.message).hint && (
            <p className="mt-2 text-xs text-red-100/60">
              {splitMessage(latestError.message).hint}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="h-[300px] pr-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Radio className="size-8 text-white/20" strokeWidth={1.5} />
            <p className="text-sm text-white/45">Nenhuma atividade ainda.</p>
            <p className="max-w-[220px] text-xs text-white/30">
              Os passos da transmissão aparecerão aqui em linguagem simples.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0 border-l border-white/[0.08] pl-4">
            {visible.map((ev) => {
              const meta = TYPE_META[ev.type] ?? TYPE_META.info;
              const Icon = meta.icon;
              const { body, hint } = splitMessage(ev.message);

              return (
                <li key={ev.id} className="relative pb-4 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[1.35rem] top-1 flex size-5 items-center justify-center rounded-full border bg-[#0F1114]",
                      meta.borderClass,
                    )}
                  >
                    <Icon className={cn("size-3", meta.className)} strokeWidth={2} />
                  </span>
                  <article
                    className={cn(
                      "rounded-lg border px-3 py-2.5",
                      meta.borderClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-[11px] font-semibold uppercase tracking-wide", meta.className)}>
                        {meta.label}
                      </span>
                      <time className="shrink-0 text-[10px] text-white/35">
                        {formatBrasiliaDateTime(ev.created_at)}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/85">{body}</p>
                    {hint && (
                      <p className="mt-2 rounded-md bg-black/20 px-2 py-1.5 text-xs leading-relaxed text-white/55">
                        <span className="font-medium text-white/70">O que fazer: </span>
                        {hint}
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </ScrollArea>
    </div>
  );
}
