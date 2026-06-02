import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-base text-white/90 shadow-sm transition-[border-color,background,box-shadow] duration-500 placeholder:text-white/15 focus-visible:border-white/[0.12] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_1px_rgba(115,165,182,0.06),0_0_30px_-10px_rgba(115,165,182,0.08)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
