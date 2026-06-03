import type { LucideIcon } from "lucide-react";
import { MessageCircle, MousePointerClick, UserPlus, Video, Zap } from "lucide-react";

import dojoLogo from "@/assets/dojo-logo-branca.png";
import { cn } from "@/lib/utils";

interface FeatureCard {
  icon: LucideIcon;
  label: string;
  detail: string;
  className?: string;
  delay?: string;
}

const features: FeatureCard[] = [
  {
    icon: Video,
    label: "Webinars",
    detail: "12 ativos",
    className: "left-[8%] top-[18%]",
    delay: "dojo-stagger-4",
  },
  {
    icon: UserPlus,
    label: "Leads",
    detail: "2.4k capturados",
    className: "right-[6%] top-[22%]",
    delay: "dojo-stagger-5",
  },
  {
    icon: MessageCircle,
    label: "Chat IA",
    detail: "8 online",
    className: "left-[12%] bottom-[28%]",
    delay: "dojo-stagger-6",
  },
  {
    icon: MousePointerClick,
    label: "Gatilhos",
    detail: "CTR alto",
    className: "right-[10%] bottom-[32%]",
    delay: "dojo-stagger-5",
  },
  {
    icon: Zap,
    label: "Live",
    detail: "Ao vivo",
    className: "left-1/2 bottom-[12%] -translate-x-1/2",
    delay: "dojo-stagger-6",
  },
];

export function AuthDecorPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative hidden flex-1 items-center justify-center overflow-hidden bg-black lg:flex",
        className,
      )}
    >
      {/* Star glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-[700px] w-[160px] rounded-full bg-brand-teal/14 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute h-[160px] w-[700px] rounded-full bg-brand-teal/14 blur-3xl"
          aria-hidden
        />
        <div className="absolute size-[300px] rounded-full bg-brand-teal/8 blur-3xl" aria-hidden />
        <div
          className="animate-star-rotate absolute size-[500px]"
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 h-[60px] w-[500px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-brand-teal/5 blur-xl" />
          <div className="absolute left-1/2 top-1/2 h-[60px] w-[500px] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-brand-teal/5 blur-xl" />
        </div>
        <div className="absolute size-10 rounded-full bg-brand-ice/12 blur-md" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.6)_100%)]"
          aria-hidden
        />
      </div>

      {/* Central card */}
      <div className="relative z-10 flex size-52 animate-fade-up items-center justify-center rounded-3xl dojo-glass-card-central sm:size-60">
        <div className="flex flex-col items-center gap-4">
          <img src={dojoLogo} alt="DOJO" className="h-8 w-auto opacity-90" />
          <span className="text-[0.55rem] font-medium uppercase tracking-[0.35em] text-white/40">
            Webinars
          </span>
        </div>
      </div>

      {/* Floating feature cards */}
      {features.map((feature) => (
        <div
          key={feature.label}
          className={cn(
            "absolute z-20 animate-fade-up opacity-0",
            feature.delay,
            feature.className,
          )}
        >
          <div className="animate-hex-float dojo-glass-card flex min-w-[120px] items-center gap-2.5 rounded-xl px-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
              <feature.icon className="size-3.5 text-brand-teal" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-medium text-white/50">{feature.label}</p>
              <p className="font-mono text-[0.55rem] text-white/20">{feature.detail}</p>
            </div>
          </div>
        </div>
      ))}

      <p className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[0.55rem] uppercase tracking-[0.35em] text-white/20">
        Webinars · Leads · Live · Gatilhos
      </p>
    </div>
  );
}
