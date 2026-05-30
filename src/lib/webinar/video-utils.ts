export const MAX_VIDEO_DURATION_SECONDS = 5400; // 1h30

/** Limite global do Supabase Storage (plano Free = 50 MB). Aumente em Storage Settings (Pro). */
export const SUPABASE_GLOBAL_STORAGE_MAX_BYTES = 50 * 1024 * 1024;

/** Margem segura para upload após conversão. */
export const SUPABASE_SAFE_UPLOAD_MAX_BYTES = 48 * 1024 * 1024;

/** Tamanho máximo do arquivo original enviado ao servidor (via chunks). */
export const MAX_VIDEO_INPUT_BYTES = 2 * 1024 * 1024 * 1024;

/** Tamanho de cada chunk enviado ao servidor (2 MB). */
export const VIDEO_UPLOAD_CHUNK_BYTES = 2 * 1024 * 1024;

/** @deprecated Use MAX_VIDEO_INPUT_BYTES */
export const MAX_VIDEO_FILE_BYTES = MAX_VIDEO_INPUT_BYTES;

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

export function getVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Não foi possível detectar a duração do vídeo"));
        return;
      }
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Erro ao ler metadados do vídeo"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 100) / 100;
}

export function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

export function slugifyFieldKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || `campo_${Date.now()}`;
}
