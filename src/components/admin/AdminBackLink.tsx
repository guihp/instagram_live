import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminBackLinkProps {
  to: string;
  label: string;
  className?: string;
}

export function AdminBackLink({ to, label, className }: AdminBackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 text-[0.85rem] text-[#606270] transition-colors hover:text-white/80",
        className,
      )}
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
