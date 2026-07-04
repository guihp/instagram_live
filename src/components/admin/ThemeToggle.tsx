import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const handleToggle = () => {
    const next = getStoredTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={handleToggle}
      className={cn(
        showLabel
          ? "h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          : "shrink-0",
        className,
      )}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {showLabel ? (
        <>
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-accent/80">
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </span>
          <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
        </>
      ) : isDark ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}

/** Evita flash de tema errado no primeiro paint (chamar no shell HTML). */
export function themeInitScript() {
  return `(function(){try{var t=localStorage.getItem('app-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
}
