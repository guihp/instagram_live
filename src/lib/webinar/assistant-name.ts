export const DEFAULT_AI_ASSISTANT_NAME = "Equipe";

export function resolveAiAssistantName(
  configured: string | null | undefined,
  hostName?: string | null,
): string {
  const trimmed = configured?.trim();
  if (trimmed) return trimmed;

  const host = hostName?.trim();
  if (host) return host;

  return DEFAULT_AI_ASSISTANT_NAME;
}
