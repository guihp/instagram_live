export function parseBlockedWords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((w): w is string => typeof w === "string")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** Mensagem contém alguma palavra/frase bloqueada (sem diferenciar maiúsculas). */
export function messageHasBlockedWord(message: string, blockedWords: string[]): boolean {
  if (blockedWords.length === 0) return false;
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  return blockedWords.some((word) => normalized.includes(word));
}
