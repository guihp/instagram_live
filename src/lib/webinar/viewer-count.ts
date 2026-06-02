export interface ViewerCountConfig {
  start?: number | null;
  mid?: number | null;
  end?: number | null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Público simulado que varia entre início, meio e fim da live (com leve oscilação). */
export function getSimulatedViewerCount(
  config: ViewerCountConfig,
  progress: number,
  tickSeconds: number,
): number {
  const start = config.start ?? 820;
  const end = config.end ?? start + 280;
  const mid = config.mid ?? Math.round((start + end) / 2);

  const p = clamp(progress, 0, 1);
  let base: number;
  if (p < 0.33) {
    base = lerp(start, mid, p / 0.33);
  } else if (p < 0.66) {
    const midSwing = Math.sin(tickSeconds / 31) * (Math.max(40, Math.abs(end - start) * 0.08));
    base = mid + midSwing;
  } else {
    base = lerp(mid, end, (p - 0.66) / 0.34);
  }

  const wave = Math.sin(tickSeconds / 47) * 12 + Math.cos(tickSeconds / 83) * 8;
  const jitter = ((tickSeconds * 17) % 23) - 11;
  return clamp(Math.round(base + wave + jitter), Math.min(start, end) - 40, Math.max(start, end, mid) + 60);
}
