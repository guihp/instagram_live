import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSyncedPlaybackPosition,
  getVideoPublicUrl,
  getYoutubeEmbedUrl,
  toScheduleConfig,
} from "@/lib/webinar/playback";

interface SyncedVideoPlayerProps {
  scheduledAt: string;
  scheduleRecurrence?: string | null;
  scheduleWeekday?: number | null;
  videoType: "upload" | "youtube";
  videoUrl: string | null;
  durationSeconds: number | null;
  displayMode: "live" | "recorded";
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export function SyncedVideoPlayer({
  scheduledAt,
  scheduleRecurrence,
  scheduleWeekday,
  videoType,
  videoUrl,
  durationSeconds,
  displayMode,
  className,
  onTimeUpdate,
}: SyncedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 200) + 847);
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  onTimeUpdateRef.current = onTimeUpdate;

  const scheduleConfig = useMemo(
    () =>
      toScheduleConfig({
        scheduled_at: scheduledAt,
        schedule_recurrence: scheduleRecurrence,
        schedule_weekday: scheduleWeekday,
      }),
    [scheduledAt, scheduleRecurrence, scheduleWeekday],
  );

  const syncToClock = useCallback(() => {
    const position = getSyncedPlaybackPosition(scheduleConfig, durationSeconds);
    onTimeUpdateRef.current?.(position);

    if (videoType === "upload" && videoRef.current) {
      const video = videoRef.current;
      const drift = Math.abs(video.currentTime - position);
      if (drift > 1.5) {
        video.currentTime = position;
      }
      if (isVisible && video.paused && position > 0) {
        video.play().catch(() => {});
      }
    }
  }, [scheduleConfig, durationSeconds, videoType, isVisible]);

  useEffect(() => {
    syncToClock();
    syncIntervalRef.current = setInterval(syncToClock, 1000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncToClock]);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);

      if (videoRef.current) {
        if (!visible) {
          videoRef.current.pause();
        } else {
          syncToClock();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [syncToClock]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }

    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (iosVideo?.webkitEnterFullscreen) {
      iosVideo.webkitEnterFullscreen();
      return;
    }

    if (container) {
      await container.requestFullscreen().catch(() => {});
    }
  }, []);

  const publicUrl = videoType === "upload" ? getVideoPublicUrl(videoUrl) : null;
  const youtubeEmbed = videoType === "youtube" && videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/player relative overflow-hidden rounded-lg bg-black",
        "[&:fullscreen]:flex [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:items-center [&:fullscreen]:justify-center",
        "[&:fullscreen_video]:aspect-auto [&:fullscreen_video]:h-full [&:fullscreen_video]:max-h-full [&:fullscreen_video]:w-full",
        className,
      )}
    >
      {displayMode === "live" && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse gap-1.5 px-2 py-0.5">
            <span className="size-2 rounded-full bg-white" />
            AO VIVO
          </Badge>
          <Badge variant="secondary" className="bg-black/60 text-white">
            {viewerCount.toLocaleString("pt-BR")} assistindo
          </Badge>
        </div>
      )}

      {displayMode === "recorded" && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant="secondary" className="bg-black/60 text-white">
            Aula gravada
          </Badge>
        </div>
      )}

      {videoType === "upload" && publicUrl ? (
        <>
          <video
            ref={videoRef}
            src={publicUrl}
            className="aspect-video w-full object-contain"
            playsInline
            muted={false}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noremoteplayback noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            onPause={(e) => {
              if (isVisible) {
                e.currentTarget.play().catch(() => {});
              }
            }}
            onSeeked={(e) => {
              const position = getSyncedPlaybackPosition(scheduleConfig, durationSeconds);
              if (Math.abs(e.currentTarget.currentTime - position) > 0.5) {
                e.currentTarget.currentTime = position;
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            onClick={() => void toggleFullscreen()}
            className="absolute bottom-3 right-3 z-20 size-10 rounded-lg border-0 bg-black/70 text-white opacity-90 shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/85 hover:text-white group-hover/player:opacity-100 sm:bottom-4 sm:right-4"
          >
            {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
          </Button>
        </>
      ) : youtubeEmbed ? (
        <iframe
          src={youtubeEmbed}
          className="aspect-video w-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title="Webinar"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center text-muted-foreground">
          Vídeo não configurado
        </div>
      )}
    </div>
  );
}
