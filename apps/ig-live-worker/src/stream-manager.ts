import { spawn, type ChildProcess } from "node:child_process";
import { spawnSync } from "node:child_process";

import { getWorkerConfig } from "./config.js";
import {
  getBroadcast,
  getSignedVideoUrl,
  logBroadcastEvent,
  updateBroadcastStatus,
  type IgBroadcastStatus,
} from "./supabase.js";
import { buildRtmpDestination, sanitizeFfmpegLine } from "./rtmp.js";
import {
  exitCodeToUserEvent,
  formatUserEventForDb,
  logTechnical,
  parseFfmpegStderr,
} from "./user-messages.js";

interface StreamCredentials {
  rtmpUrl: string;
  streamKey: string;
  loop: boolean;
}

interface ActiveStream {
  process: ChildProcess;
  credentials: StreamCredentials;
}

const activeStreams = new Map<string, ActiveStream>();
const armedCredentials = new Map<string, StreamCredentials>();

export function verifyFfmpegInstalled(): void {
  const { ffmpegPath } = getWorkerConfig();
  const result = spawnSync(ffmpegPath, ["-version"], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(
      `[ig-live-worker] ffmpeg não encontrado em "${ffmpegPath}". Instale ffmpeg e reinicie.`,
    );
    process.exit(1);
  }
  const firstLine = result.stdout.split("\n")[0] ?? "ffmpeg";
  console.log(`[ig-live-worker] ${firstLine}`);
}

export function getArmedCredentials(broadcastId: string): StreamCredentials | undefined {
  return armedCredentials.get(broadcastId);
}

export function armStream(
  broadcastId: string,
  credentials: StreamCredentials,
): void {
  armedCredentials.set(broadcastId, credentials);
}

export function disarmStream(broadcastId: string): void {
  armedCredentials.delete(broadcastId);
}

export function isProcessAlive(broadcastId: string): boolean {
  const active = activeStreams.get(broadcastId);
  if (!active) return false;
  return active.process.exitCode === null && !active.process.killed;
}

export function getStreamStatus(broadcastId: string): {
  processAlive: boolean;
  armed: boolean;
} {
  return {
    processAlive: isProcessAlive(broadcastId),
    armed: armedCredentials.has(broadcastId),
  };
}

function resolveCredentials(
  broadcastId: string,
  input?: Partial<StreamCredentials>,
): StreamCredentials {
  const fromMemory = armedCredentials.get(broadcastId);
  const rtmpUrl = input?.rtmpUrl ?? fromMemory?.rtmpUrl;
  const streamKey = input?.streamKey ?? fromMemory?.streamKey;
  const loop = input?.loop ?? fromMemory?.loop ?? true;

  if (!rtmpUrl || !streamKey) {
    throw new Error("Chave ausente — cole a stream key e arme a transmissão.");
  }

  return { rtmpUrl, streamKey, loop };
}

export async function startStream(
  broadcastId: string,
  input?: Partial<StreamCredentials>,
): Promise<void> {
  if (isProcessAlive(broadcastId)) {
    throw new Error("Transmissão já está em andamento.");
  }

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast.video_path) {
    throw new Error("Nenhum vídeo enviado para esta transmissão.");
  }

  const credentials = resolveCredentials(broadcastId, {
    rtmpUrl: input?.rtmpUrl ?? broadcast.rtmp_url ?? undefined,
    streamKey: input?.streamKey,
    loop: input?.loop ?? broadcast.loop_enabled,
  });

  armedCredentials.set(broadcastId, credentials);
  await updateBroadcastStatus(broadcastId, "starting");
  await logBroadcastEvent(
    broadcastId,
    "step",
    "Preparando envio do vídeo ao Instagram…",
  );

  const videoUrl = await getSignedVideoUrl(broadcast.video_path);
  const rtmpDestination = buildRtmpDestination(credentials.rtmpUrl, credentials.streamKey);
  const loopFlag = credentials.loop ? "-1" : "0";
  const { ffmpegPath } = getWorkerConfig();

  const args = [
    "-re",
    "-stream_loop",
    loopFlag,
    "-fflags",
    "+genpts",
    "-i",
    videoUrl,
    "-vf",
    "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p",
    "-r",
    "30",
    "-vsync",
    "cfr",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-b:v",
    "3500k",
    "-maxrate",
    "3500k",
    "-bufsize",
    "7000k",
    "-g",
    "60",
    "-keyint_min",
    "60",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-async",
    "1",
    "-max_interleave_delta",
    "0",
    "-reset_timestamps",
    "1",
    "-avoid_negative_ts",
    "make_zero",
    "-f",
    "flv",
    rtmpDestination,
  ];

  const ffmpeg = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  activeStreams.set(broadcastId, { process: ffmpeg, credentials });

  let started = false;
  let stderrBuffer = "";
  let userErrorLogged = false;

  const logUserErrorOnce = async (stderr: string) => {
    if (userErrorLogged) return;
    const parsed = parseFfmpegStderr(stderr);
    if (!parsed) return;
    userErrorLogged = true;
    const { type, message } = formatUserEventForDb(parsed);
    await logBroadcastEvent(broadcastId, type, message);
  };

  const handleOutput = (chunk: Buffer, stream: "stdout" | "stderr") => {
    const text = chunk.toString("utf8");
    stderrBuffer = (stderrBuffer + text).slice(-8000);
    const sanitized = sanitizeFfmpegLine(text, credentials.streamKey);
    logTechnical(broadcastId, `ffmpeg ${stream}`, sanitized);

    if (stream === "stderr" && /error/i.test(text)) {
      void logUserErrorOnce(stderrBuffer);
    }
  };

  ffmpeg.stdout?.on("data", (d) => handleOutput(d, "stdout"));
  ffmpeg.stderr?.on("data", (d) => {
    handleOutput(d, "stderr");
    if (!started && d.toString().includes("frame=")) {
      started = true;
      void updateBroadcastStatus(broadcastId, "live", {
        started_at: new Date().toISOString(),
      });
      void logBroadcastEvent(
        broadcastId,
        "success",
        "Vídeo sendo enviado ao Instagram. Agora clique «Go Live» no Live Producer.",
      );
    }
  });

  ffmpeg.on("error", (err) => {
    logTechnical(broadcastId, "spawn error", err.message);
    void updateBroadcastStatus(broadcastId, "error");
    void logBroadcastEvent(
      broadcastId,
      "error",
      "Não foi possível iniciar o envio do vídeo.\n\n→ Verifique se o worker está rodando e se o vídeo foi enviado corretamente.",
    );
    activeStreams.delete(broadcastId);
    disarmStream(broadcastId);
  });

  ffmpeg.on("close", (code) => {
    activeStreams.delete(broadcastId);
    disarmStream(broadcastId);

    void (async () => {
      const current = await getBroadcast(broadcastId).catch(() => null);
      if (!current) return;

      if (current.status === "live" || current.status === "starting") {
        const nextStatus: IgBroadcastStatus = code === 0 ? "stopped" : "error";
        await updateBroadcastStatus(broadcastId, nextStatus, {
          ended_at: new Date().toISOString(),
        });

        if (code !== 0) {
          logTechnical(broadcastId, "exit code", String(code ?? "?"));
          const userEvent = exitCodeToUserEvent(code, stderrBuffer);
          const { type, message } = formatUserEventForDb(userEvent);
          if (!userErrorLogged) {
            await logBroadcastEvent(broadcastId, type, message);
          }
        } else {
          await logBroadcastEvent(broadcastId, "info", "Transmissão encerrada.");
        }
      }
    })();
  });

  setTimeout(() => {
    if (isProcessAlive(broadcastId) && !started) {
      void updateBroadcastStatus(broadcastId, "live", {
        started_at: new Date().toISOString(),
      });
      void logBroadcastEvent(
        broadcastId,
        "success",
        "Vídeo sendo enviado ao Instagram. Agora clique «Go Live» no Live Producer.",
      );
    }
  }, 8000);
}

export async function stopStream(broadcastId: string): Promise<void> {
  const active = activeStreams.get(broadcastId);
  if (active) {
    active.process.kill("SIGTERM");
    setTimeout(() => {
      if (isProcessAlive(broadcastId)) {
        active.process.kill("SIGKILL");
      }
    }, 3000);
    activeStreams.delete(broadcastId);
  }

  disarmStream(broadcastId);
  await updateBroadcastStatus(broadcastId, "stopped", {
    ended_at: new Date().toISOString(),
  });
  await logBroadcastEvent(broadcastId, "info", "Transmissão parada por você.");
}

export async function runScheduledStarts(): Promise<void> {
  const { findScheduledArmedBroadcasts } = await import("./supabase.js");
  const due = await findScheduledArmedBroadcasts();

  for (const broadcast of due) {
    if (isProcessAlive(broadcast.id)) continue;

    const creds = armedCredentials.get(broadcast.id);
    if (!creds?.streamKey) {
      await updateBroadcastStatus(broadcast.id, "error");
      await logBroadcastEvent(
        broadcast.id,
        "error",
        "Chave ausente — cole a stream key e arme a transmissão.",
      );
      continue;
    }

    try {
      await startStream(broadcast.id);
      await logBroadcastEvent(broadcast.id, "step", "Início automático pelo horário agendado.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar";
      await updateBroadcastStatus(broadcast.id, "error");
      await logBroadcastEvent(broadcast.id, "error", msg);
    }
  }
}
