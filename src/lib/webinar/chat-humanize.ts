/** Aplica pequenos "erros" de digitação em ~30% das mensagens de participantes (não em respostas da equipe). */
const TYPO_SWAPS: Array<[RegExp, string]> = [
  [/\bvocê\b/gi, "voce"],
  [/\btambém\b/gi, "tambem"],
  [/\bentão\b/gi, "entao"],
  [/\bporque\b/gi, "pq"],
  [/\bmuito\b/gi, "mutio"],
  [/\binteressante\b/gi, "interesante"],
  [/\bconteúdo\b/gi, "conteudo"],
  [/\bexplicação\b/gi, "explicacao"],
  [/\bverdade\b/gi, "vdd"],
  [/\bobrigad[oa]\b/gi, "obg"],
];

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function maybeHumanizeParticipantMessage(message: string, authorSeed: string): string {
  const seed = hashSeed(`${authorSeed}:${message}`);
  if (seed % 100 > 32) return message;

  let out = message;
  const swapIndex = seed % TYPO_SWAPS.length;
  const [pattern, replacement] = TYPO_SWAPS[swapIndex];
  out = out.replace(pattern, replacement);

  if (seed % 5 === 0 && out.length > 12 && !out.includes("!!")) {
    out = out.replace(/([.!?])\s*$/, " kkk$1");
  }

  return out;
}
