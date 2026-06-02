import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  highlight?: string;
  accent?: boolean;
  glow?: boolean;
  action?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  highlight,
  accent = true,
  glow = false,
  action,
  className,
}: AdminPageHeaderProps) {
  const titleParts = highlight && title.includes(highlight)
    ? title.split(highlight)
    : null;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="relative min-w-0">
        {glow && <div className="dojo-header-glow" aria-hidden />}
        <h1 className="relative text-[2.25rem] font-semibold leading-tight tracking-[-0.03em] text-white">
          {titleParts ? (
            <>
              {titleParts[0]}
              <span className="text-[#BEDADF]">{highlight}</span>
              {titleParts[1]}
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle && (
          <p className="relative mt-2 text-[0.9rem] text-[#606270]">{subtitle}</p>
        )}
        {accent && subtitle && <div className="dojo-subtitle-accent" aria-hidden />}
      </div>
      {action && <div className="relative shrink-0">{action}</div>}
    </div>
  );
}
