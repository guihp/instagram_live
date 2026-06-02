import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionState } from "@/lib/webinar/schedule";
import {
  getSyncedPlaybackPosition,
  getVideoPublicUrl,
  getYoutubeEmbedUrl,
  toScheduleConfig,
} from "@/lib/webinar/playback";
import { getSimulatedViewerCount, type ViewerCountConfig } from "@/lib/webinar/viewer-count";

interface SyncedVideoPlayerProps {
  scheduledAt: string;
  scheduleRecurrence?: string | null;
  scheduleWeekday?: number | null;
  videoType: "upload" | "youtube";
  videoUrl: string | null;
  durationSeconds: number | null;
  displayMode: "live" | "recorded";
  viewerCountConfig?: ViewerCountConfig;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  /** Último frame visível (não tenta dar play após o fim). */
  freezeAtEnd?: boolean;
}

function resolveStreamDuration(
  configuredSeconds: number | null,
  video?: HTMLVideoElement | null,
): number | null {
  const fromFile =
    video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;

  if (fromFile && configuredSeconds && configuredSeconds > 0) {
    if (configuredSeconds > fromFile * 1.5) return fromFile;
    return Math.max(fromFile, configuredSeconds);
  }

  return fromFile ?? (configuredSeconds && configuredSeconds > 0 ? configuredSeconds : null);
}

export function SyncedVideoPlayer({
  scheduledAt,
  scheduleRecurrence,
  scheduleWeekday,
  videoType,
  videoUrl,
  durationSeconds,
  displayMode,
  viewerCountConfig,
  className,
  onTimeUpdate,
  freezeAtEnd = false,
}: SyncedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const syncingRef = useRef(false);
  const userUnmutedRef = useRef(false);
  const [viewerCount, setViewerCount] = useState(() =>
    getSimulatedViewerCount(viewerCountConfig ?? {}, 0, 0),
  );
  const [tick, setTick] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMutedForAutoplay, setIsMutedForAutoplay] = useState(false);
  const [isLiveSession, setIsLiveSession] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const publicUrl = videoType === "upload" ? getVideoPublicUrl(videoUrl) : null;
  const youtubeEmbed = videoType === "youtube" && videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

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

  const getTargetPosition = useCallback(
    (video?: HTMLVideoElement | null) => {
      const elapsed = getSyncedPlaybackPosition(scheduleConfig, durationSeconds);
      const streamDuration = resolveStreamDuration(durationSeconds, video);
      if (streamDuration != null) {
        return Math.min(elapsed, Math.max(0, streamDuration - 0.05));
      }
      return elapsed;
    },
    [scheduleConfig, durationSeconds],
  );

  const isAtStreamEnd = useCallback(
    (position: number, video?: HTMLVideoElement | null) => {
      const streamDuration = resolveStreamDuration(durationSeconds, video);
      return streamDuration != null && position >= streamDuration - 0.5;
    },
    [durationSeconds],
  );

  const tryPlay = useCallback(
    async (video: HTMLVideoElement, position: number) => {
      if (!isVisible || isAtStreamEnd(position, video)) return;

      const attempt = async (muted: boolean) => {
        video.muted = muted;
        await video.play();
      };

      try {
        if (!userUnmutedRef.current) {
          await attempt(true);
          setIsMutedForAutoplay(true);
          return;
        }
        await attempt(false);
        setIsMutedForAutoplay(false);
      } catch {
        try {
          await attempt(true);
          setIsMutedForAutoplay(true);
        } catch {
          /* browser bloqueou autoplay */
        }
      }
    },
    [isVisible, isAtStreamEnd],
  );

  const seekVideo = useCallback(
    (video: HTMLVideoElement, position: number, playAfter = true) => {
      if (video.readyState < 1) return;

      syncingRef.current = true;
      const finish = () => {
        syncingRef.current = false;
        if (playAfter && !isAtStreamEnd(position, video)) {
          void tryPlay(video, position);
        }
      };

      if (Math.abs(video.currentTime - position) < 0.35) {
        finish();
        return;
      }

      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        finish();
      };

      video.addEventListener("seeked", onSeeked);
      video.currentTime = position;
    },
    [isAtStreamEnd, tryPlay],
  );

  const syncToClock = useCallback(() => {
    const { isLive } = getSessionState(scheduleConfig);
    setIsLiveSession(isLive);

    if (videoType !== "upload" || !videoRef.current) {
      onTimeUpdateRef.current?.(getTargetPosition());
      return;
    }

    const video = videoRef.current;
    const position = getTargetPosition(video);
    onTimeUpdateRef.current?.(position);

    if (!isLive || position <= 0) {
      if (!video.paused) video.pause();
      return;
    }

    if (video.readyState < 1) return;

    if (isAtStreamEnd(position, video)) {
      seekVideo(video, position, false);
      if (!video.paused) video.pause();
      return;
    }

    if (freezeAtEnd) return;

    const drift = Math.abs(video.currentTime - position);
    if (drift > 1.5 || video.paused) {
      seekVideo(video, position, true);
    } else if (video.paused) {
      void tryPlay(video, position);
    }
  }, [scheduleConfig, videoType, getTargetPosition, isAtStreamEnd, seekVideo, tryPlay, freezeAtEnd]);

  useEffect(() => {
    const duration = resolveStreamDuration(durationSeconds, videoRef.current);
    const progress = duration && duration > 0 ? getTargetPosition(videoRef.current) / duration : 0;
    setViewerCount(getSimulatedViewerCount(viewerCountConfig ?? {}, progress, tick));
  }, [tick, viewerCountConfig, durationSeconds, getTargetPosition]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    syncToClock();
    syncIntervalRef.current = setInterval(syncToClock, 1000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncToClock]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => syncToClock();
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplay", onReady);
    return () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, [syncToClock, publicUrl]);

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
      syncToClock();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [syncToClock]);

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

  const handleUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    userUnmutedRef.current = true;
    video.muted = false;
    setIsMutedForAutoplay(false);
    void video.play().catch(() => {});
    syncToClock();
  }, [syncToClock]);

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
            autoPlay
            muted
            controls={false}
            disablePictureInPicture
            preload="auto"
            controlsList="nodownload noremoteplayback noplaybackrate nofullscreen"
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={(e) => {
              if (!syncingRef.current) {
                onTimeUpdateRef.current?.(e.currentTarget.currentTime);
              }
            }}
          />

          {!isLiveSession && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-6 text-center">
              <p className="text-sm font-medium text-white/90 sm:text-base">
                A transmissão começa em breve. Aguarde o horário da aula.
              </p>
            </div>
          )}

          {isMutedForAutoplay && isLiveSession && (
            <button
              type="button"
              onClick={handleUnmute}
              className="absolute left-3 top-14 z-20 flex items-center gap-2 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90 sm:text-sm"
            >
              <Volume2 className="size-4" />
              Ativar som
            </button>
          )}

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
