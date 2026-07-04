import type { IgBroadcastStatus } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const IG_BROADCAST_STATUS_LABELS: Record<IgBroadcastStatus, string> = {
  idle: "Aguardando",
  armed: "Armada",
  starting: "Iniciando",
  live: "Ao vivo",
  stopped: "Parada",
  error: "Erro",
};

const STATUS_STYLES: Record<IgBroadcastStatus, string> = {
  idle: "border-white/10 bg-white/[0.04] text-white/60",
  armed: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  starting: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  live: "border-red-500/30 bg-red-500/10 text-red-200",
  stopped: "border-white/10 bg-white/[0.04] text-white/50",
  error: "border-destructive/40 bg-destructive/10 text-red-300",
};

interface IgBroadcastStatusBadgeProps {
  status: IgBroadcastStatus;
  processAlive?: boolean;
  className?: string;
}

export function IgBroadcastStatusBadge({
  status,
  processAlive,
  className,
}: IgBroadcastStatusBadgeProps) {
  const label =
    status === "live" && processAlive === false
      ? "Desconectado"
      : IG_BROADCAST_STATUS_LABELS[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        status === "live" && processAlive !== false && "animate-pulse motion-reduce:animate-none",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status === "live" && processAlive !== false && (
        <span className="mr-1.5 inline-block size-1.5 rounded-full bg-red-400" />
      )}
      {label}
    </Badge>
  );
}
