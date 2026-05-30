import {
  finalizeWebinarVideoChunkUpload,
  initWebinarVideoChunkUpload,
  uploadWebinarVideoChunk,
} from "@/lib/api/admin.functions";
import { formatFileSize, VIDEO_UPLOAD_CHUNK_BYTES } from "@/lib/webinar/video-utils";

export interface UploadProgress {
  phase: "uploading" | "converting";
  percent: number;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Falha ao ler bloco do vídeo"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler bloco do vídeo"));
    reader.readAsDataURL(blob);
  });
}

export async function uploadWebinarVideoDirect(
  file: File,
  webinarId: string,
  durationSeconds: number,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ path: string; durationSeconds: number }> {
  const contentType = file.type || "video/mp4";
  const totalChunks = Math.ceil(file.size / VIDEO_UPLOAD_CHUNK_BYTES);

  const { sessionId } = await initWebinarVideoChunkUpload({
    data: {
      webinarId,
      fileName: file.name,
      fileSizeBytes: file.size,
      totalChunks,
      durationSeconds,
      contentType,
    },
  });

  onProgress?.({ phase: "uploading", percent: 0 });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * VIDEO_UPLOAD_CHUNK_BYTES;
    const chunkBlob = file.slice(start, start + VIDEO_UPLOAD_CHUNK_BYTES);
    const chunkBase64 = await blobToBase64(chunkBlob);

    await uploadWebinarVideoChunk({
      data: {
        sessionId,
        chunkIndex: i,
        chunkBase64,
      },
    });

    onProgress?.({
      phase: "uploading",
      percent: Math.round(((i + 1) / totalChunks) * 100),
    });
  }

  onProgress?.({ phase: "converting", percent: 100 });

  try {
    const result = await finalizeWebinarVideoChunkUpload({
      data: {
        sessionId,
        webinarId,
        durationSeconds: Math.round(durationSeconds),
      },
    });

    return { path: result.path, durationSeconds: result.durationSeconds };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("limite global")) {
      throw err;
    }
    throw new Error(
      `${message} Se o vídeo tem ${formatFileSize(file.size)}, pode ser necessário aumentar o limite global do Supabase Storage.`,
    );
  }
}
