/** Traduz erros do worker para mensagens amigáveis (toast / UI). */

const FRIENDLY_ERRORS: { test: RegExp; message: string }[] = [
  {
    test: /worker.*não configurado|WORKER_API_SECRET|fetch failed|ECONNREFUSED/i,
    message:
      "Worker RTMP offline. Local: npm run worker:ig-live. No Lovable: hospede apps/ig-live-worker e defina WORKER_URL + WORKER_API_SECRET nos secrets.",
  },
  {
    test: /chave ausente/i,
    message: "Cole a stream key do Instagram e clique «Armar transmissão».",
  },
  {
    test: /nenhum vídeo/i,
    message: "Envie um vídeo vertical antes de iniciar.",
  },
  {
    test: /rtmp url e stream key/i,
    message: "Preencha a RTMP URL e a stream key do Live Producer.",
  },
  {
    test: /já está em andamento/i,
    message: "Esta transmissão já está rodando. Use «Parar» antes de iniciar de novo.",
  },
];

export function toFriendlyWorkerError(raw: string): string {
  for (const { test, message } of FRIENDLY_ERRORS) {
    if (test.test(raw)) return message;
  }
  if (raw.includes("ffmpeg") || raw.includes("muxer") || raw.includes("TLS")) {
    return "A transmissão falhou. Veja «Atividade» ao lado para o que fazer.";
  }
  return raw.length > 120 ? "Não foi possível completar a ação. Veja «Atividade» para detalhes." : raw;
}
