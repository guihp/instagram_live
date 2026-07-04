import { getServerConfig } from "../config.server";
import { toFriendlyWorkerError } from "../instagram-live/friendly-errors";

interface WorkerResponse {
  ok?: boolean;
  status?: string;
  error?: string;
  processAlive?: boolean;
  armed?: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
}

async function callWorker<T extends WorkerResponse>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const { workerUrl, workerApiSecret } = getServerConfig();

  if (!workerApiSecret) {
    throw new Error(
      "WORKER_API_SECRET não configurado. Adicione no .env e reinicie o servidor.",
    );
  }

  const res = await fetch(`${workerUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Worker-Secret": workerApiSecret,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as T;
  if (!res.ok) {
    throw new Error(toFriendlyWorkerError(data.error ?? `Worker respondeu ${res.status}`));
  }
  return data;
}

export function armWorkerStream(input: {
  broadcastId: string;
  rtmpUrl: string;
  streamKey: string;
  loop: boolean;
}) {
  return callWorker("/streams/arm", "POST", {
    broadcastId: input.broadcastId,
    rtmpUrl: input.rtmpUrl,
    streamKey: input.streamKey,
    loop: input.loop,
  });
}

export function startWorkerStream(input: {
  broadcastId: string;
  rtmpUrl?: string;
  streamKey?: string;
  loop?: boolean;
}) {
  const payload: Record<string, unknown> = { broadcastId: input.broadcastId };
  if (input.rtmpUrl) payload.rtmpUrl = input.rtmpUrl;
  if (input.streamKey) payload.streamKey = input.streamKey;
  if (input.loop !== undefined) payload.loop = input.loop;
  return callWorker("/streams/start", "POST", payload);
}

export function stopWorkerStream(broadcastId: string) {
  return callWorker("/streams/stop", "POST", { broadcastId });
}

export function getWorkerStreamStatus(broadcastId: string) {
  return callWorker<WorkerResponse>(`/streams/${broadcastId}/status`, "GET");
}
