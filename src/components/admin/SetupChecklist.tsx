import type { SetupItem } from "@/lib/setup-status.server";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";

interface SetupChecklistProps {
  items: SetupItem[];
  ready: boolean;
  canStream: boolean;
}

export function SetupChecklist({ items, ready, canStream }: SetupChecklistProps) {
  if (ready && canStream) return null;

  const pending = items.filter((item) => !item.done);

  return (
    <div className="mb-8 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-sm font-medium text-white">
              {ready ? "Painel ok — falta o worker para transmitir" : "Configuração pendente"}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {ready
                ? "Login e CRUD funcionam. Para ir ao ar no Instagram, suba o worker RTMP e configure WORKER_URL."
                : "Complete os passos abaixo no Supabase e em Lovable → Cloud → Secrets. Guia: LOVABLE.md e SETUP.md."}
            </p>
          </div>

          <ul className="space-y-2">
            {pending.map((item) => (
              <li key={item.id} className="flex gap-2 text-sm">
                <Circle className="mt-0.5 size-4 shrink-0 text-amber-400/80" />
                <div>
                  <p className="font-medium text-white/85">
                    {item.label}
                    {!item.required && (
                      <span className="ml-2 text-xs font-normal text-white/35">(opcional p/ admin)</span>
                    )}
                  </p>
                  <p className="text-white/45">{item.hint}</p>
                </div>
              </li>
            ))}
            {items
              .filter((item) => item.done)
              .map((item) => (
                <li key={item.id} className="flex gap-2 text-sm text-white/35">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500/70" />
                  <span>{item.label}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
