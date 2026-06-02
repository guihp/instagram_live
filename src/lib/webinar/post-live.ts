import { getSessionState, type ScheduleConfig } from "./schedule";

export function isPostLiveHoldActive(
  config: ScheduleConfig,
  durationSeconds: number | null,
  holdMinutes: number,
  now = new Date(),
): boolean {
  if (!durationSeconds || durationSeconds <= 0 || holdMinutes <= 0) return false;

  const { sessionStart, isLive } = getSessionState(config, now);
  if (!isLive || !sessionStart) return false;

  const elapsedMs = now.getTime() - sessionStart.getTime();
  const videoEndMs = durationSeconds * 1000;
  const holdMs = holdMinutes * 60 * 1000;

  return elapsedMs >= videoEndMs && elapsedMs < videoEndMs + holdMs;
}

export function hasVideoEndedForSession(
  config: ScheduleConfig,
  durationSeconds: number | null,
  now = new Date(),
): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  const { sessionStart, isLive } = getSessionState(config, now);
  if (!isLive || !sessionStart) return false;
  const elapsedSeconds = (now.getTime() - sessionStart.getTime()) / 1000;
  return elapsedSeconds >= durationSeconds - 0.5;
}
