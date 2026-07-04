import Fastify from "fastify";

import { getWorkerConfig } from "./config.js";
import { registerRoutes } from "./routes.js";
import { startScheduler } from "./scheduler.js";
import { verifyFfmpegInstalled } from "./stream-manager.js";

async function main() {
  verifyFfmpegInstalled();

  const { port, host, workerApiSecret } = getWorkerConfig();
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health") return;

    const secret = request.headers["x-worker-secret"];
    if (secret !== workerApiSecret) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  await registerRoutes(app);
  startScheduler();

  await app.listen({ port, host });
  console.log(`[ig-live-worker] API em http://${host}:${port}`);
}

main().catch((err) => {
  console.error("[ig-live-worker] Falha ao iniciar:", err);
  process.exit(1);
});
