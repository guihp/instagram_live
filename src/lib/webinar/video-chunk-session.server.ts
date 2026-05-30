import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SESSIONS_ROOT = join(tmpdir(), "webinar-video-sessions");

export interface ChunkSessionMeta {
  webinarId: string;
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
  durationSeconds: number;
  contentType: string;
}

function sessionDir(sessionId: string): string {
  return join(SESSIONS_ROOT, sessionId);
}

function metaPath(sessionId: string): string {
  return join(sessionDir(sessionId), "meta.json");
}

function chunkPath(sessionId: string, index: number): string {
  return join(sessionDir(sessionId), `chunk-${String(index).padStart(5, "0")}`);
}

function assembledPath(sessionId: string): string {
  return join(sessionDir(sessionId), "assembled-input");
}

export function createChunkSession(meta: ChunkSessionMeta): string {
  mkdirSync(SESSIONS_ROOT, { recursive: true });
  const sessionId = crypto.randomUUID();
  mkdirSync(sessionDir(sessionId), { recursive: true });
  writeFileSync(metaPath(sessionId), JSON.stringify(meta));
  return sessionId;
}

export function getChunkSessionMeta(sessionId: string): ChunkSessionMeta {
  const path = metaPath(sessionId);
  if (!existsSync(path)) {
    throw new Error("Sessão de upload expirada ou inválida. Tente enviar o vídeo novamente.");
  }
  return JSON.parse(readFileSync(path, "utf-8")) as ChunkSessionMeta;
}

export function writeChunk(sessionId: string, chunkIndex: number, data: Buffer): void {
  getChunkSessionMeta(sessionId);
  writeFileSync(chunkPath(sessionId, chunkIndex), data);
}

export async function assembleChunks(sessionId: string): Promise<{ inputPath: string; meta: ChunkSessionMeta }> {
  const meta = getChunkSessionMeta(sessionId);
  const outPath = assembledPath(sessionId);
  const parts: Buffer[] = [];

  for (let i = 0; i < meta.totalChunks; i++) {
    const part = chunkPath(sessionId, i);
    if (!existsSync(part)) {
      throw new Error(`Upload incompleto — falta o bloco ${i + 1} de ${meta.totalChunks}.`);
    }
    parts.push(readFileSync(part));
  }

  writeFileSync(outPath, Buffer.concat(parts));
  return { inputPath: outPath, meta };
}

export function readAssembledFile(sessionId: string): Buffer {
  const path = assembledPath(sessionId);
  if (!existsSync(path)) {
    throw new Error("Arquivo montado não encontrado.");
  }
  return readFileSync(path);
}

export function destroyChunkSession(sessionId: string): void {
  const dir = sessionDir(sessionId);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
