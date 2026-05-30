import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Trash2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getVideoUploadLimits } from "@/lib/api/admin.functions";
import { formatDuration } from "@/lib/webinar/video-utils";
import { cn } from "@/lib/utils";

function getVideoDisplayName(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  const withoutTimestamp = fileName.replace(/^\d+-/, "");
  return withoutTimestamp || fileName;
}

interface VideoUploadFieldProps {
  videoPath: string;
  durationSeconds: number | null;
  webinarId?: string;
  pendingPreview?: boolean;
  uploading?: boolean;
  converting?: boolean;
  uploadPercent?: number;
  transcribing?: boolean;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export function VideoUploadField({
  videoPath,
  durationSeconds,
  webinarId,
  pendingPreview = false,
  uploading = false,
  converting = false,
  uploadPercent = 0,
  transcribing = false,
  disabled = false,
  onFileSelect,
  onRemove,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [storageLimitLabel, setStorageLimitLabel] = useState("48 MB");

  useEffect(() => {
    void getVideoUploadLimits().then((limits) => {
      setStorageLimitLabel(limits.maxStorageLabel);
    });
  }, []);

  const busy = uploading || converting || transcribing || disabled;
  const hasVideo = Boolean(videoPath) || pendingPreview;
  const displayName = videoPath
    ? getVideoDisplayName(videoPath)
    : pendingPreview
      ? "Vídeo selecionado"
      : "";

  const statusText = pendingPreview && !videoPath
    ? durationSeconds
      ? `Duração: ${formatDuration(durationSeconds)} · preview local (salve o webinar para enviar)`
      : "Preview local — salve o webinar para enviar ao servidor"
    : durationSeconds
      ? `Duração: ${formatDuration(durationSeconds)} · enviado ao Supabase`
      : "Vídeo configurado · enviado ao Supabase";

  return (
    <div className="space-y-2">
      <Label>Upload de vídeo (máx. 1h30)</Label>
      <p className="text-xs text-muted-foreground">
        Qualquer formato (MP4, MOV, WebM…) é enviado em partes ao servidor, convertido para MP4 H.264 e
        comprimido para caber no limite do Supabase ({storageLimitLabel}).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {hasVideo ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Film className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{statusText}</p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Substituir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/10 px-4 py-8 text-center transition-colors",
            busy ? "cursor-not-allowed opacity-60" : "hover:border-primary/40 hover:bg-muted/20",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Video className="size-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {uploading ? "Enviando vídeo..." : "Clique para enviar um vídeo"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, MOV ou WebM · até 1h30 · limite final no Supabase: {storageLimitLabel}
            </p>
          </div>
        </button>
      )}

      {!webinarId && !hasVideo && (
        <p className="text-xs text-muted-foreground">
          Selecione o vídeo para ver o preview. Salve o webinar para enviar ao servidor.
        </p>
      )}

      {(uploading || converting || transcribing) && (
        <div className="space-y-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          {uploading && (
            <p className="flex items-center gap-2 text-primary">
              <Loader2 className="size-3 animate-spin" />
              Enviando vídeo… {uploadPercent > 0 ? `${uploadPercent}%` : ""}
            </p>
          )}
          {converting && (
            <p className="flex items-center gap-2 text-primary">
              <Loader2 className="size-3 animate-spin" />
              Convertendo para MP4 (H.264) otimizado para a live…
            </p>
          )}
          {transcribing && !converting && !uploading && (
            <p className="flex items-center gap-2 text-primary">
              <Loader2 className="size-3 animate-spin" />
              Transcrevendo com Whisper + Gemini via OpenRouter…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
