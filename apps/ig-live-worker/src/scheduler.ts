import cron from "node-cron";

import { runScheduledStarts } from "./stream-manager.js";

export function startScheduler(): void {
  cron.schedule("* * * * *", () => {
    void runScheduledStarts().catch((err) => {
      console.error("[ig-live-worker] scheduler error:", err instanceof Error ? err.message : err);
    });
  });
  console.log("[ig-live-worker] Scheduler ativo (a cada minuto).");
}
