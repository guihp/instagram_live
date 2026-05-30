import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EditorSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function EditorSection({ title, description, children, className }: EditorSectionProps) {
  return (
    <section className={cn("rounded-xl border bg-card/50 p-5 space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
