import type { CSSProperties, ReactNode } from "react";

import type { LandingTheme, LandingThemeVariant } from "@/lib/webinar/landing";

import "./styles/scope.css";

interface LandingShellProps {
  templateClass: string;
  theme: LandingTheme;
  children: ReactNode;
}

export function LandingShell({ templateClass, theme, children }: LandingShellProps) {
  return (
    <div
      className={`landing-tpl ${templateClass}`}
      data-variant={theme.variant satisfies LandingThemeVariant}
      data-hero={theme.heroMedia}
      style={
        {
          "--accent": theme.accent,
          "--font-display": '"Matter", system-ui, sans-serif',
          "--font-body": '"Matter", system-ui, sans-serif',
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
