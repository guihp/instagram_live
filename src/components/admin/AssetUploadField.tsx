import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadWebinarAsset } from "@/lib/api/admin.functions";
import { fileToBase64 } from "@/lib/file-utils";
import { getAssetPublicUrl, getPromoVideoUrl } from "@/lib/webinar/landing";

export type AssetUploadType = "hero" | "promo" | "host";
export type AssetPreviewLayout = "banner" | "avatar";

interface AssetUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (path: string) => void;
  webinarId?: string;
  assetType: AssetUploadType;
  accept: string;
  previewType: "image" | "video";
  previewLayout?: AssetPreviewLayout;
}

export function AssetUploadField({
  label,
  description,
  value,
  onChange,
  webinarId,
  assetType,
  accept,
  previewType,
  previewLayout = "banner",
}: AssetUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = value
    ? previewType === "video"
      ? getPromoVideoUrl(value)
      : getAssetPublicUrl(value)
    : null;

  const handleFile = async (file: File) => {
    if (!webinarId) {
      toast.error("Salve o webinar antes de enviar arquivos");
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadWebinarAsset({
        data: {
          webinarId,
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type,
          assetType,
        },
      });
      onChange(result.path);
      toast.success("Arquivo enviado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {previewUrl && (
        <>
          {previewType === "image" && previewLayout === "avatar" ? (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="size-28 overflow-hidden rounded-full ring-2 ring-primary/25 shadow-sm sm:size-32">
                  <img src={previewUrl} alt={label} className="size-full object-cover object-center" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-1 -top-1 size-8 rounded-full shadow-md"
                  onClick={() => onChange("")}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-medium">Prévia na landing</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  A foto aparece em formato circular ao lado da bio do apresentador. Use uma imagem
                  quadrada ou retrato com o rosto centralizado.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border bg-muted/30">
              {previewType === "image" ? (
                <img
                  src={previewUrl}
                  alt={label}
                  className="aspect-[16/9] w-full object-cover object-center"
                />
              ) : (
                <video src={previewUrl} controls className="aspect-video w-full" playsInline />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 size-8"
                onClick={() => onChange("")}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={uploading || !webinarId}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : previewType === "image" ? (
          <ImageIcon className="size-4" />
        ) : (
          <Video className="size-4" />
        )}
        {uploading
          ? "Enviando..."
          : previewUrl
            ? "Substituir arquivo"
            : webinarId
              ? "Enviar arquivo"
              : "Salve o webinar para enviar"}
        {!uploading && <Upload className="size-4 opacity-60" />}
      </Button>
    </div>
  );
}
