import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

export interface ConvertVideoOptions {
  /** Tamanho máximo do arquivo de saída (bytes). Ativa bitrate adaptativo. */
  maxOutputBytes?: number;
  durationSeconds?: number;
}

function buildVideoEncodingArgs(options?: ConvertVideoOptions): string[] {
  const audioKbps = 64;

  if (options?.maxOutputBytes && options.durationSeconds && options.durationSeconds > 0) {
    const totalKbps = Math.floor((options.maxOutputBytes * 8) / options.durationSeconds / 1000);
    const videoKbps = Math.max(64, totalKbps - audioKbps);

    return [
      "-c:v",
      "libx264",
      "-profile:v",
      "main",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "fast",
      "-vf",
      "scale='min(854,iw)':-2",
      "-b:v",
      `${videoKbps}k`,
      "-maxrate",
      `${Math.floor(videoKbps * 1.2)}k`,
      "-bufsize",
      `${videoKbps * 2}k`,
      "-c:a",
      "aac",
      "-b:a",
      `${audioKbps}k`,
      "-ac",
      "1",
    ];
  }

  return [
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-vf",
    "scale='min(1280,iw)':-2",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
  ];
}

/**
 * Converte qualquer vídeo para MP4 H.264/AAC otimizado para streaming na live.
 */
export async function convertVideoToWebinarMp4(
  input: Buffer,
  options?: ConvertVideoOptions,
): Promise<Buffer> {
  const tmpDir = mkdtempSync(join(tmpdir(), "webinar-convert-"));
  const inputPath = join(tmpDir, "input");
  const outputPath = join(tmpDir, "output.mp4");

  try {
    writeFileSync(inputPath, input);

    const encodingArgs = buildVideoEncodingArgs(options);

    const result = spawnSync(
      ffmpegPath!,
      ["-i", inputPath, ...encodingArgs, "-movflags", "+faststart", "-y", outputPath],
      { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
    );

    if (result.status !== 0) {
      throw new Error(
        `Falha ao converter vídeo para MP4: ${result.stderr?.slice(-600) ?? "erro desconhecido"}`,
      );
    }

    return readFileSync(outputPath);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function convertVideoFileToWebinarMp4(
  inputPath: string,
  options?: ConvertVideoOptions,
): Promise<{ buffer: Buffer; sizeBytes: number }> {
  const input = readFileSync(inputPath);
  let buffer = await convertVideoToWebinarMp4(input, options);

  if (options?.maxOutputBytes && buffer.length > options.maxOutputBytes) {
    buffer = await convertVideoToWebinarMp4(input, {
      maxOutputBytes: Math.floor(options.maxOutputBytes * 0.85),
      durationSeconds: options.durationSeconds,
    });
  }

  return { buffer, sizeBytes: buffer.length };
}

export function getFileSizeBytes(path: string): number {
  return statSync(path).size;
}
