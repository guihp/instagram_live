import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WebinarTrigger } from "@/lib/supabase/database.types";

interface PostLiveOverlayProps {
  title: string;
  description: string;
  checkoutTrigger: WebinarTrigger | null;
  onCheckoutClick?: (trigger: WebinarTrigger) => void;
}

export function PostLiveOverlay({
  title,
  description,
  checkoutTrigger,
  onCheckoutClick,
}: PostLiveOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-webinar-ink/92 px-6 text-center backdrop-blur-sm">
      <div className="max-w-lg space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Transmissão encerrada</p>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="text-sm leading-relaxed text-white/75 sm:text-base">{description}</p>
      </div>

      {checkoutTrigger ? (
        <Button
          type="button"
          size="lg"
          className="h-auto gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-white hover:bg-emerald-600"
          onClick={() => onCheckoutClick?.(checkoutTrigger)}
        >
          <ShoppingCart className="size-5" />
          {checkoutTrigger.label}
        </Button>
      ) : null}
    </div>
  );
}
