export const BRASILIA_TZ = "America/Sao_Paulo";

export function formatBrasiliaDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    timeZone: BRASILIA_TZ,
    ...options,
  });
}

export function formatBrasiliaDateTimeLong(date: Date | string): string {
  return formatBrasiliaDateTime(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBrasiliaTime(date: Date | string): string {
  return formatBrasiliaDateTime(date, { hour: "2-digit", minute: "2-digit" });
}

/** Chave YYYY-MM-DD no fuso de Brasília (para agrupar métricas). */
export function getBrasiliaDateKey(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatBrasiliaDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: BRASILIA_TZ,
  });
}

/** Converte data + hora informadas como horário de Brasília para ISO UTC. */
export function brasiliaLocalToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute, 0, 0)).toISOString();
}

/** Extrai partes de data/hora no fuso de Brasília a partir de um ISO UTC. */
export function isoToBrasiliaParts(iso: string): {
  date: string;
  time: string;
  datetimeLocal: string;
} {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const time = `${get("hour").padStart(2, "0")}:${get("minute").padStart(2, "0")}`;
  return { date, time, datetimeLocal: `${date}T${time}` };
}
