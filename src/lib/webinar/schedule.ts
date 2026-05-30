export type ScheduleRecurrence = "once" | "daily" | "weekly";

import { BRASILIA_TZ, brasiliaLocalToISO, isoToBrasiliaParts } from "@/lib/webinar/datetime";

export interface ScheduleConfig {
  scheduled_at: string | Date;
  schedule_recurrence: ScheduleRecurrence;
  schedule_weekday: number | null;
}

export interface SessionState {
  /** Início da sessão ativa (para sync do vídeo). Null se ainda não começou. */
  sessionStart: Date | null;
  isLive: boolean;
  /** Próximo início (countdown na sala de espera). */
  nextSessionStart: Date;
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function getWeekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day] ?? "—";
}

function applyTime(target: Date, template: Date): Date {
  const result = new Date(target);
  result.setHours(template.getHours(), template.getMinutes(), template.getSeconds(), 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Resolve estado da sessão (live vs espera) com base na recorrência. */
export function getSessionState(config: ScheduleConfig, now = new Date()): SessionState {
  const anchor = new Date(config.scheduled_at);
  const recurrence = config.schedule_recurrence ?? "once";

  if (recurrence === "once") {
    const isLive = now.getTime() >= anchor.getTime();
    return {
      sessionStart: isLive ? anchor : null,
      isLive,
      nextSessionStart: anchor,
    };
  }

  if (now.getTime() < anchor.getTime()) {
    return {
      sessionStart: null,
      isLive: false,
      nextSessionStart: anchor,
    };
  }

  if (recurrence === "daily") {
    const todayStart = applyTime(now, anchor);

    if (now.getTime() >= todayStart.getTime()) {
      return {
        sessionStart: todayStart,
        isLive: true,
        nextSessionStart: applyTime(addDays(now, 1), anchor),
      };
    }

    return {
      sessionStart: null,
      isLive: false,
      nextSessionStart: todayStart,
    };
  }

  // weekly
  const weekday = config.schedule_weekday ?? anchor.getDay();
  const todayAtTime = applyTime(now, anchor);

  if (now.getDay() === weekday && now.getTime() >= todayAtTime.getTime()) {
    const nextWeek = applyTime(addDays(now, 7), anchor);
    return {
      sessionStart: todayAtTime,
      isLive: true,
      nextSessionStart: nextWeek,
    };
  }

  let daysAhead = (weekday - now.getDay() + 7) % 7;
  if (daysAhead === 0 && now.getTime() < todayAtTime.getTime()) {
    return {
      sessionStart: null,
      isLive: false,
      nextSessionStart: todayAtTime,
    };
  }
  if (daysAhead === 0) daysAhead = 7;

  const nextDate = addDays(now, daysAhead);
  const nextStart = applyTime(nextDate, anchor);

  return {
    sessionStart: null,
    isLive: false,
    nextSessionStart: nextStart.getTime() < anchor.getTime() ? anchor : nextStart,
  };
}

export function isWebinarLive(config: ScheduleConfig, now = new Date()): boolean {
  return getSessionState(config, now).isLive;
}

export function getTimeUntilLive(config: ScheduleConfig, now = new Date()): number {
  const { isLive, nextSessionStart } = getSessionState(config, now);
  if (isLive) return 0;
  return Math.max(0, nextSessionStart.getTime() - now.getTime());
}

export function getSyncedSessionStart(config: ScheduleConfig, now = new Date()): Date {
  const { sessionStart, nextSessionStart } = getSessionState(config, now);
  return sessionStart ?? nextSessionStart;
}

export function describeSchedule(config: ScheduleConfig): string {
  const anchor = new Date(config.scheduled_at);
  const time = anchor.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRASILIA_TZ,
  });

  switch (config.schedule_recurrence ?? "once") {
    case "daily":
      return `Todos os dias às ${time} (Brasília)`;
    case "weekly": {
      const day = getWeekdayLabel(config.schedule_weekday ?? anchor.getDay());
      return `Toda ${day} às ${time} (Brasília)`;
    }
    default:
      return anchor.toLocaleString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: BRASILIA_TZ,
      });
  }
}

/** Monta scheduled_at a partir de recorrência + campos do formulário (horário de Brasília). */
export function buildScheduledAt(
  recurrence: ScheduleRecurrence,
  dateStr: string,
  timeStr: string,
): string {
  if (recurrence === "once") {
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (match) return brasiliaLocalToISO(match[1], match[2]);
    return brasiliaLocalToISO(dateStr.slice(0, 10), timeStr);
  }
  return brasiliaLocalToISO(dateStr, timeStr);
}

export function parseScheduleForForm(scheduled_at: string, recurrence: ScheduleRecurrence) {
  const { date, time, datetimeLocal } = isoToBrasiliaParts(scheduled_at);

  if (recurrence === "once") {
    return {
      scheduled_at: datetimeLocal,
      schedule_date: date,
      schedule_time: time,
    };
  }

  return { schedule_date: date, schedule_time: time };
}

export { WEEKDAY_LABELS };
