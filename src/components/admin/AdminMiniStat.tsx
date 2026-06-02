import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminMiniStatProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  className?: string;
}

export function AdminMiniStat({ icon: Icon, label, value, suffix = "", className }: AdminMiniStatProps) {
  return (
    <div className={cn("dojo-surface-card flex items-center gap-3 px-4 py-3.5", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#1A1C22] text-white/30">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#606270]">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}
