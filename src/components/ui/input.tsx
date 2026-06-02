import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onWheel, ...props }, ref) => {
    return (
      <input
        type={type}
        onWheel={
          type === "number"
            ? (e) => {
                e.currentTarget.blur();
                onWheel?.(e);
              }
            : onWheel
        }
        className={cn(
          "flex h-9 w-full rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-base text-white/90 shadow-sm transition-[border-color,background,box-shadow] duration-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/15 focus-visible:border-white/[0.12] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_1px_rgba(115,165,182,0.06),0_0_30px_-10px_rgba(115,165,182,0.08)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          type === "number" &&
            "[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
