export type TriggerAppearMode = "at_minute" | "before_end";

export interface TriggerTimingInput {
  appear_at_seconds: number;
  appear_mode?: TriggerAppearMode | string | null;
  trigger_type?: "button" | "cart";
}

/** Gatilho visível conforme modo configurado no admin. */
export function isTriggerVisible(
  trigger: TriggerTimingInput,
  currentTime: number,
  durationSeconds: number | null | undefined,
): boolean {
  let mode: TriggerAppearMode =
    trigger.appear_mode === "before_end" ? "before_end" : "at_minute";
  let offset = Math.max(0, Number(trigger.appear_at_seconds ?? 0));

  // Legado: carrinho no minuto 0 aparecia no início — tratar como 2 min antes do fim.
  if (
    !trigger.appear_mode &&
    trigger.trigger_type === "cart" &&
    offset === 0 &&
    durationSeconds &&
    durationSeconds > 0
  ) {
    mode = "before_end";
    offset = 120;
  }

  if (mode === "before_end") {
    if (!durationSeconds || durationSeconds <= 0) return false;
    const showFrom = Math.max(0, durationSeconds - offset);
    return currentTime >= showFrom;
  }

  return currentTime >= offset;
}

export function formatTriggerTimingLabel(
  trigger: TriggerTimingInput,
  durationSeconds?: number | null,
): string {
  const mode: TriggerAppearMode =
    trigger.appear_mode === "before_end" ? "before_end" : "at_minute";
  const offset = Number(trigger.appear_at_seconds ?? 0);

  if (mode === "before_end") {
    if (offset <= 0) return "No final do vídeo";
    const minutes = Math.round((offset / 60) * 10) / 10;
    return `${minutes} min antes do fim`;
  }

  const minutes = Math.round((offset / 60) * 10) / 10;
  if (durationSeconds && durationSeconds > 0) {
    return `Minuto ${minutes} de ${Math.round((durationSeconds / 60) * 10) / 10}`;
  }
  return `Minuto ${minutes} do vídeo`;
}

export const TRIGGER_APPEAR_MODE_LABELS: Record<TriggerAppearMode, string> = {
  at_minute: "Em um minuto específico",
  before_end: "Antes do fim do vídeo",
};
