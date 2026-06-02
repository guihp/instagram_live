import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface Particle {
  tx: string;
  ty: string;
  color: string;
  delay: string;
  size: number;
}

function buildParticles(burst: number): Particle[] {
  const colors = ["#73a5b6", "#ddf7f9", "#a8d4e0", "#fbbf24", "#ffffff"];
  return Array.from({ length: 10 }, (_, i) => {
    const seed = burst * 17 + i * 41;
    const angle = ((seed % 360) * Math.PI) / 180;
    const dist = 24 + (seed % 28);
    return {
      tx: `${Math.cos(angle) * dist}px`,
      ty: `${Math.sin(angle) * dist - 18}px`,
      color: colors[i % colors.length],
      delay: `${(i * 0.04).toFixed(2)}s`,
      size: 3 + (seed % 3),
    };
  });
}

interface TriggerRevealSparklesProps {
  webinarId: string;
  /** IDs dos gatilhos visíveis no momento */
  visibleTriggerIds: string[];
  className?: string;
}

/**
 * Fogos discretos quando um gatilho (botão) aparece na live pela primeira vez na sessão.
 */
export function TriggerRevealSparkles({
  webinarId,
  visibleTriggerIds,
  className,
}: TriggerRevealSparklesProps) {
  const celebratedRef = useRef<Set<string>>(new Set());
  const [burst, setBurst] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    celebratedRef.current.clear();
  }, [webinarId]);

  useEffect(() => {
    let hasNew = false;
    for (const id of visibleTriggerIds) {
      if (!celebratedRef.current.has(id)) {
        celebratedRef.current.add(id);
        hasNew = true;
      }
    }
    if (!hasNew) return;

    setBurst((b) => b + 1);
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 1400);
    return () => window.clearTimeout(timer);
  }, [visibleTriggerIds]);

  const particles = useMemo(() => buildParticles(burst), [burst]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-1/2 z-10 flex h-0 items-center justify-center overflow-visible",
        className,
      )}
      aria-hidden
    >
      {particles.map((p, i) => (
        <span
          key={`${burst}-${i}`}
          className="trigger-spark-particle absolute left-1/2 top-1/2 rounded-full"
          style={
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              "--spark-tx": p.tx,
              "--spark-ty": p.ty,
              "--spark-delay": p.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
