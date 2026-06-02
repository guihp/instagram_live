import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface RotatingTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

export function RotatingText({ texts, interval = 2500, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts, interval]);

  const current = texts[index] ?? texts[0] ?? "";

  return (
    <span className={cn("inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="inline-flex"
        >
          {current.split("").map((char, i) => (
            <motion.span
              key={`${current}-${i}`}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    damping: 28,
                    stiffness: 360,
                    mass: 0.8,
                    delay: i * 0.02,
                  },
                },
                exit: {
                  opacity: 0,
                  y: -6,
                  transition: { duration: 0.15, delay: i * 0.01 },
                },
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
