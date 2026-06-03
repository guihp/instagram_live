import { Clock3, ExternalLink, ShieldCheck, Sparkles, X } from "lucide-react";

import { LeadCaptureForm } from "@/components/webinar/LeadCaptureForm";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WebinarFormField } from "@/lib/supabase/database.types";
import { formatCountdown } from "@/lib/webinar/playback";
import { cn } from "@/lib/utils";

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  webinarTitle: string;
  ctaText: string;
  fields: WebinarFormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  loading?: boolean;
  timeLeft?: number;
  scheduleLabel?: string;
}

export function RegistrationModal({
  open,
  onOpenChange,
  title,
  webinarTitle,
  ctaText,
  fields,
  onSubmit,
  loading,
  timeLeft = 0,
  scheduleLabel,
}: RegistrationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[520px]",
          "[&>button:last-child]:hidden",
        )}
        aria-describedby="registration-modal-desc"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-webinar-ink via-webinar-ink to-[oklch(0.18_0.06_265)] px-6 pb-8 pt-6 text-white sm:px-8 sm:pt-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.55_0.2_250/0.4),transparent)]"
            aria-hidden
          />

          <DialogClose className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          <div className="relative space-y-4 pr-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="size-3.5 text-webinar-accent" />
              Inscrição gratuita
            </span>

            <div>
              <DialogTitle className="text-left text-2xl font-bold leading-tight tracking-tight sm:text-[1.65rem]">
                {title}
              </DialogTitle>
              <DialogDescription
                id="registration-modal-desc"
                className="mt-2 text-left text-sm leading-relaxed text-white/70 sm:text-base"
              >
                Garanta sua vaga em <strong className="font-semibold text-white">{webinarTitle}</strong>{" "}
                e receba o acesso à transmissão na hora.
              </DialogDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {timeLeft > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-webinar-accent/25 px-3 py-1.5 text-xs font-medium">
                  <Clock3 className="size-3.5" aria-hidden />
                  Começa em{" "}
                  <strong className="font-mono font-bold tabular-nums">{formatCountdown(timeLeft)}</strong>
                </span>
              )}
              {scheduleLabel && (
                <span className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80">
                  {scheduleLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-6 sm:px-8 sm:py-7">
          <LeadCaptureForm
            fields={fields}
            onSubmit={onSubmit}
            loading={loading}
            embedded
            variant="popup"
            submitLabel={ctaText}
          />

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
            <span>100% gratuito · sem cartão · confirmação imediata</span>
          </div>
        </div>

        <div className="border-t bg-muted/30 px-6 py-3 text-center sm:px-8">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Ao continuar, você concorda em receber informações sobre esta aula. Seus dados não são
            compartilhados com terceiros.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
