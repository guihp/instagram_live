/** Concatena RTMP URL + stream key sem expor a chave em logs. */

export function buildRtmpDestination(rtmpUrl: string, streamKey: string): string {
  const base = rtmpUrl.trim().replace(/\/+$/, "");
  const key = streamKey.trim();
  if (!base || !key) {
    throw new Error("RTMP URL e stream key são obrigatórios.");
  }
  return `${base}/${key}`;
}

/** Redact stream key from ffmpeg stderr/stdout lines. */
export function sanitizeFfmpegLine(line: string, streamKey?: string): string {
  let sanitized = line;
  if (streamKey && streamKey.length > 4) {
    sanitized = sanitized.split(streamKey).join("[REDACTED]");
  }
  sanitized = sanitized.replace(/rtmps?:\/\/[^\s]+/gi, "[RTMP_REDACTED]");
  return sanitized.slice(0, 500);
}
