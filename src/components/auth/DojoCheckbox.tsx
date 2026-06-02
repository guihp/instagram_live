import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface DojoCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function DojoCheckbox({ id, label, checked, onChange, className }: DojoCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("group relative flex cursor-pointer items-center gap-2.5", className)}
    >
      <span className="relative size-4 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded border transition-colors duration-300",
            checked
              ? "border-brand-teal/50 bg-brand-teal/15"
              : "border-white/10 bg-white/[0.02] group-hover:border-white/15",
          )}
        >
          <Check
            className={cn(
              "size-2.5 text-brand-teal transition-opacity duration-200",
              checked ? "opacity-100" : "opacity-0",
            )}
            strokeWidth={3}
          />
        </span>
      </span>
      <span className="text-[0.7rem] text-white/25 transition-colors group-hover:text-white/40">
        {label}
      </span>
    </label>
  );
}
