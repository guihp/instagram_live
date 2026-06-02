import { getSessionState, type ScheduleConfig } from "./schedule";

export type { ScheduleConfig, ScheduleRecurrence, SessionState } from "./schedule";
export {
  getSessionState,
  isWebinarLive,
  getTimeUntilLive,
  describeSchedule,
  getWeekdayLabel,
  buildScheduledAt,
  parseScheduleForForm,
  WEEKDAY_LABELS,
} from "./schedule";

/**
 * Calcula a posição de reprodução do vídeo com base no horário da sessão ativa.
 * Não limita pela duração — o player usa a duração real do arquivo para isso.
 */
export function getSyncedPlaybackPosition(
  config: ScheduleConfig,
  _durationSeconds: number | null,
  now = new Date(),
): number {
  const { sessionStart, isLive } = getSessionState(config, now);
  if (!isLive || !sessionStart) return 0;

  const elapsedSeconds = (now.getTime() - sessionStart.getTime()) / 1000;
  return Math.max(0, elapsedSeconds);
}

/** @deprecated Use getSyncedPlaybackPosition com ScheduleConfig */
export function getSyncedPlaybackPositionLegacy(
  scheduledAt: string | Date,
  durationSeconds: number | null,
): number {
  return getSyncedPlaybackPosition(
    { scheduled_at: scheduledAt, schedule_recurrence: "once", schedule_weekday: null },
    durationSeconds,
  );
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function getVideoPublicUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/webinar-videos/${path}`;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0`;
    }
  }
  return null;
}

export function toScheduleConfig(webinar: {
  scheduled_at: string;
  schedule_recurrence?: string | null;
  schedule_weekday?: number | null;
}): ScheduleConfig {
  return {
    scheduled_at: webinar.scheduled_at,
    schedule_recurrence: (webinar.schedule_recurrence as ScheduleConfig["schedule_recurrence"]) ?? "once",
    schedule_weekday: webinar.schedule_weekday ?? null,
  };
}

// Re-export for convenience
export function isWebinarLiveFromWebinar(
  webinar: {
    scheduled_at: string;
    schedule_recurrence?: string | null;
    schedule_weekday?: number | null;
  },
  now = new Date(),
): boolean {
  return getSessionState(toScheduleConfig(webinar), now).isLive;
}

export function getTimeUntilLiveFromWebinar(
  webinar: {
    scheduled_at: string;
    schedule_recurrence?: string | null;
    schedule_weekday?: number | null;
  },
  now = new Date(),
): number {
  const { isLive, nextSessionStart } = getSessionState(toScheduleConfig(webinar), now);
  if (isLive) return 0;
  return Math.max(0, nextSessionStart.getTime() - now.getTime());
}
