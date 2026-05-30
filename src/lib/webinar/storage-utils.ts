const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

export function resolveStorageContentType(fileName: string, contentType?: string): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized && normalized !== "application/octet-stream") {
    return normalized;
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : undefined;
  return (ext && MIME_BY_EXTENSION[ext]) || "application/octet-stream";
}

export function getStoragePublicUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return path;

  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
