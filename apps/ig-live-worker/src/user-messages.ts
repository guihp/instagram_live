/** Mensagens amigáveis para o painel — detalhes técnicos ficam só no console. */

export type UserEventType = "success" | "info" | "warning" | "error" | "step";

export interface UserEvent {
  type: UserEventType;
  message: string;
  hint?: string;
}

const FFMPEG_PATTERNS: { test: RegExp; event: UserEvent }[] = [
  {
    test: /poorly interleaved|negative timestamp|not in the proper order|Invalid argument/i,
    event: {
      type: "error",
      message: "A transmissão parou por instabilidade no vídeo.",
      hint:
        "Desligue «Loop do vídeo» e tente de novo. Se o vídeo for muito curto, use um clip de pelo menos 1 minuto.",
    },
  },
  {
    test: /broken pipe|I\/O error|Error writing trailer|session has been invalidated/i,
    event: {
      type: "error",
      message: "O Instagram encerrou a conexão.",
      hint:
        "Gere uma nova stream key, clique «Go Live» no Instagram antes ou logo após «Iniciar», e teste no modo Practice.",
    },
  },
  {
    test: /SSL|TLS|bad write retry/i,
    event: {
      type: "warning",
      message: "Problema de conexão segura com o Instagram.",
      hint: "Confira se a RTMP URL começa com rtmps:// e cole a chave novamente.",
    },
  },
  {
    test: /does not contain any stream|No such file|HTTP error 403|HTTP error 404/i,
    event: {
      type: "error",
      message: "Não foi possível ler o vídeo enviado.",
      hint: "Envie o vídeo de novo (MP4 vertical) e aguarde o upload terminar antes de iniciar.",
    },
  },
  {
    test: /Connection refused|Connection timed out|Unable to open/i,
    event: {
      type: "error",
      message: "Não foi possível conectar ao servidor do Instagram.",
      hint: "Verifique a RTMP URL copiada do Live Producer e se a live ainda está aberta no Instagram.",
    },
  },
];

export function parseFfmpegStderr(stderr: string): UserEvent | null {
  for (const { test, event } of FFMPEG_PATTERNS) {
    if (test.test(stderr)) return event;
  }
  return null;
}

export function exitCodeToUserEvent(code: number | null, stderrBuffer = ""): UserEvent {
  const fromStderr = parseFfmpegStderr(stderrBuffer);
  if (fromStderr) return fromStderr;

  if (code === 0) {
    return { type: "info", message: "Transmissão encerrada normalmente." };
  }

  if (code === 255 || code === 1) {
    return {
      type: "error",
      message: "A transmissão foi interrompida.",
      hint: "Confira se o Instagram ainda está em modo Live e se a stream key não expirou.",
    };
  }

  return {
    type: "error",
    message: "A transmissão parou de forma inesperada.",
    hint:
      "Gere nova stream key no Instagram, desligue o loop do vídeo e tente outra vez. Se persistir, fale com o suporte.",
  };
}

export function formatUserEventForDb(event: UserEvent): { type: UserEventType; message: string } {
  const message = event.hint ? `${event.message}\n\n→ ${event.hint}` : event.message;
  return { type: event.type, message };
}

export function logTechnical(broadcastId: string, label: string, detail: string): void {
  console.error(`[ig-live-worker][${broadcastId}] ${label}:`, detail);
}
