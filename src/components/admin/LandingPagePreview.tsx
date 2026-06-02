import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WebinarLandingPage } from "@/components/webinar/WebinarLandingPage";
import {
  PREVIEW_FORM_FIELDS,
  buildPreviewWebinar,
  saveLandingPreviewDraft,
  type LandingPreviewDraft,
} from "@/components/webinar/landing-templates/preview";
import type { Webinar } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

interface LandingPagePreviewProps {
  webinarId?: string;
  baseWebinar: Webinar;
  draft: LandingPreviewDraft;
}

type PreviewViewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: {
  id: PreviewViewport;
  label: string;
  width: number;
  icon: typeof Monitor;
}[] = [
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
];

export function LandingPagePreview({ webinarId, baseWebinar, draft }: LandingPagePreviewProps) {
  const previewWebinar = buildPreviewWebinar(baseWebinar, draft);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  const target = VIEWPORTS.find((v) => v.id === viewport) ?? VIEWPORTS[0];
  const useIframe = viewport !== "desktop" && Boolean(webinarId);

  useEffect(() => {
    if (!useIframe || !webinarId) return;
    const timer = window.setTimeout(() => {
      saveLandingPreviewDraft(webinarId, draft);
      setIframeKey((k) => k + 1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, webinarId, useIframe]);

  const iframeSrc = useMemo(
    () => (webinarId ? `/admin/webinars/landing-preview/${webinarId}?embed=1` : null),
    [webinarId],
  );

  const openInNewTab = () => {
    if (!webinarId) return;
    saveLandingPreviewDraft(webinarId, draft);
    window.open(`/admin/webinars/landing-preview/${webinarId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Preview com os dados do formulário (salve para publicar alterações na URL pública).
        </p>
        {webinarId && (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={openInNewTab}>
            <ExternalLink className="mr-2 size-4" />
            Abrir preview em nova aba
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-[#050608] shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#0A0C12] px-3 py-2">
          <div
            className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5"
            role="tablist"
            aria-label="Largura do preview"
          >
            {VIEWPORTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={viewport === id}
                onClick={() => setViewport(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewport === id
                    ? "bg-white/10 text-white"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/70",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <span className="text-xs tabular-nums text-white/35">{target.width}px</span>
        </div>

        <div className="flex justify-center overflow-x-auto p-3 sm:p-4 md:p-5">
          <div
            className={cn(
              "w-full transition-[max-width] duration-300 ease-out",
              viewport !== "desktop" && "mx-auto shrink-0",
            )}
            style={{ maxWidth: viewport === "desktop" ? "100%" : target.width }}
          >
            <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0A0C12] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              {useIframe && iframeSrc ? (
                <iframe
                  key={iframeKey}
                  title="Preview da landing"
                  src={iframeSrc}
                  className="block w-full border-0 bg-[#0A0C12]"
                  style={{
                    width: target.width,
                    maxWidth: "100%",
                    height: "min(75vh, 860px)",
                    minHeight: 480,
                  }}
                />
              ) : (
                <div className="max-h-[min(75vh,860px)] overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                  {viewport !== "desktop" && !webinarId && (
                    <p className="border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200/90">
                      Salve o webinar para ver tablet/mobile com breakpoints reais.
                    </p>
                  )}
                  <WebinarLandingPage
                    webinar={previewWebinar}
                    formFields={PREVIEW_FORM_FIELDS}
                    mode="register"
                    isPreview
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
