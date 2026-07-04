import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  armStream,
  getStreamStatus,
  startStream,
  stopStream,
} from "./stream-manager.js";
import { getBroadcast, logBroadcastEvent, updateBroadcastStatus } from "./supabase.js";

interface StartBody {
  broadcastId: string;
  rtmpUrl?: string;
  streamKey?: string;
  loop?: boolean;
}

interface ArmBody {
  broadcastId: string;
  rtmpUrl: string;
  streamKey: string;
  loop?: boolean;
}

interface StopBody {
  broadcastId: string;
}

function parseBody<T>(request: FastifyRequest): T {
  return request.body as T;
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true }));

  app.post("/streams/arm", async (request, reply) => {
    const body = parseBody<ArmBody>(request);
    const { broadcastId, rtmpUrl, streamKey, loop = true } = body;

    if (!broadcastId || !rtmpUrl?.trim() || !streamKey?.trim()) {
      return reply.status(400).send({ error: "broadcastId, rtmpUrl e streamKey são obrigatórios." });
    }

    await getBroadcast(broadcastId);
    armStream(broadcastId, { rtmpUrl: rtmpUrl.trim(), streamKey: streamKey.trim(), loop });
    await updateBroadcastStatus(broadcastId, "armed");
    await logBroadcastEvent(
      broadcastId,
      "success",
      "Transmissão pronta. Clique «Iniciar» quando estiver no modo Live no Instagram.",
    );

    return { ok: true, status: "armed" };
  });

  app.post("/streams/start", async (request, reply) => {
    const body = parseBody<StartBody>(request);
    const { broadcastId, rtmpUrl, streamKey, loop } = body;

    if (!broadcastId) {
      return reply.status(400).send({ error: "broadcastId é obrigatório." });
    }

    try {
      await startStream(broadcastId, {
        rtmpUrl: rtmpUrl?.trim(),
        streamKey: streamKey?.trim(),
        loop,
      });
      return { ok: true, status: "starting" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar";
      await updateBroadcastStatus(broadcastId, "error").catch(() => {});
      await logBroadcastEvent(broadcastId, "error", message).catch(() => {});
      return reply.status(400).send({ error: message });
    }
  });

  app.post("/streams/stop", async (request, reply) => {
    const body = parseBody<StopBody>(request);
    const { broadcastId } = body;

    if (!broadcastId) {
      return reply.status(400).send({ error: "broadcastId é obrigatório." });
    }

    try {
      await stopStream(broadcastId);
      return { ok: true, status: "stopped" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao parar";
      return reply.status(400).send({ error: message });
    }
  });

  app.get<{ Params: { broadcastId: string } }>(
    "/streams/:broadcastId/status",
    async (request, reply) => {
      const { broadcastId } = request.params;

      try {
        const broadcast = await getBroadcast(broadcastId);
        const runtime = getStreamStatus(broadcastId);
        return {
          status: broadcast.status,
          processAlive: runtime.processAlive,
          armed: runtime.armed,
          startedAt: broadcast.started_at,
          endedAt: broadcast.ended_at,
        };
      } catch {
        return reply.status(404).send({ error: "Transmissão não encontrada." });
      }
    },
  );
}
