import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { getServerConfig } from "../config.server";
import {
  AI_CONTEXT_XML_INSTRUCTIONS,
  CHAT_REPLY_SYSTEM_PREFIX,
  isAiContextXml,
} from "./ai-context-xml";
import type { DetectedChatMessage, DetectedTrigger, TranscriptionSegment } from "./transcription";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/** Modelos usados — IDs válidos na OpenRouter (mai/2026) */
export const OPENROUTER_MODELS = {
  transcription: "openai/whisper-large-v3",
  analysis: "google/gemini-2.5-flash",
  chat: "google/gemini-2.5-flash",
} as const;

const CHUNK_SECONDS = 300;
const MAX_VIDEO_SECONDS = 5400;
const MAX_AUDIO_CHUNK_BYTES = 20 * 1024 * 1024;

const TRANSCRIPTION_MODELS = [
  "openai/whisper-large-v3",
  "openai/whisper-1",
] as const;

function sanitizeLogBody(path: string, body: unknown): unknown {
  if (path !== "/audio/transcriptions" || typeof body !== "object" || body === null) {
    return body;
  }
  const input = (body as { input_audio?: { data?: string; format?: string } }).input_audio;
  return {
    ...(body as Record<string, unknown>),
    input_audio: {
      format: input?.format,
      dataBytes: input?.data ? Math.floor((input.data.length * 3) / 4) : 0,
    },
  };
}

function getOpenRouterKey(): string {
  const key = getServerConfig().openRouterApiKey;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY não encontrada. Adicione no .env e reinicie o servidor (npm run dev).",
    );
  }
  if (!key.startsWith("sk-or-")) {
    throw new Error(
      "OPENROUTER_API_KEY inválida — confira se está em uma linha separada no .env",
    );
  }
  return key;
}

async function openRouterFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${OPENROUTER_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.VITE_APP_URL ?? "http://localhost:5173",
      "X-OpenRouter-Title": "Webinar Platform",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) {
      throw new Error(
        `OpenRouter 401 — chave rejeitada. Gere uma nova em openrouter.ai/keys e reinicie o dev server. Detalhe: ${errText.slice(0, 200)}`,
      );
    }
    throw new Error(
      `OpenRouter error (${res.status}) ${JSON.stringify(sanitizeLogBody(path, body))}: ${errText.slice(0, 400)}`,
    );
  }

  return res.json() as Promise<T>;
}

export async function transcribeAudioChunk(
  audioBase64: string,
  format: string,
): Promise<string> {
  let lastError = "Falha desconhecida na transcrição";

  for (const model of TRANSCRIPTION_MODELS) {
    try {
      const result = await openRouterFetch<{ text: string }>("/audio/transcriptions", {
        model,
        input_audio: { data: audioBase64, format },
      });
      if (result.text?.trim()) {
        return result.text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Transcrição de áudio falhou (${format}). ${lastError}`);
}

export interface AnalyzeTranscriptOptions {
  messageCount?: number;
  assistantName?: string;
  referenceMessages?: Array<{
    author_name: string;
    message: string;
    appear_at_seconds: number;
    kind?: string;
  }>;
}

export async function analyzeTranscript(
  fullText: string,
  segments: TranscriptionSegment[],
  options: AnalyzeTranscriptOptions = {},
): Promise<{
  summary: string;
  aiContext: string;
  triggers: DetectedTrigger[];
  chatMessages: DetectedChatMessage[];
}> {
  const segmentsPreview = segments
    .slice(0, 200)
    .map((s) => `[${formatTimestamp(s.start)}] ${s.text}`)
    .join("\n");

  const targetCount = Math.min(50, Math.max(8, options.messageCount ?? 20));
  const teamName = options.assistantName?.trim() || "Equipe";
  const referenceBlock =
    options.referenceMessages && options.referenceMessages.length > 0
      ? `\nMENSAGENS DE REFERÊNCIA (use como inspiração de tom e temas, adapte ao conteúdo atual):\n${JSON.stringify(options.referenceMessages.slice(0, 40), null, 0).slice(0, 6000)}`
      : "";

  const result = await openRouterFetch<{ choices: Array<{ message: { content: string } }> }>(
    "/chat/completions",
    {
      model: OPENROUTER_MODELS.analysis,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você analisa transcrições de webinars em português para alimentar o CHAT AO VIVO.

O público do chat já está assistindo — inscrição/acesso já aconteceram ANTES da live. O XML serve para responder dúvidas sobre CONTEÚDO DA AULA, GRAVAÇÃO e esclarecimentos — nunca sobre como se inscrever.

Retorne JSON válido com:
{
  "summary": "resumo em 2-3 parágrafos (texto corrido, fora do XML)",
  "ai_context": "<webinar_context>...</webinar_context>",
  "triggers": [
    {
      "label": "texto do botão",
      "appear_at_seconds": 123,
      "trigger_type": "button" ou "cart",
      "appear_mode": "at_minute" ou "before_end",
      "transcript_snippet": "trecho"
    }
  ],
  "chat_messages": [
    {
      "author_name": "Nome brasileiro plausível",
      "message": "Pergunta ou comentário natural sobre o que acabou de ser dito na aula",
      "appear_at_seconds": 90,
      "kind": "question" | "comment" | "reaction",
      "team_reply": {
        "message": "Resposta curta da equipe (só quando kind for question)",
        "delay_seconds": 20
      }
    }
  ]
}

Para chat_messages: gere exatamente ${targetCount} mensagens simuladas distribuídas ao longo do vídeo (do início ao fim).
Misture perguntas sobre o conteúdo, comentários de apoio e reações. Timestamps devem coincidir com tópicos da transcrição.
Nomes variados (Ana, Carlos, Fernanda, João, Mariana, etc.). Tom informal de chat ao vivo em português do Brasil — como pessoa real digitando no celular.
Em cerca de 25% das mensagens de participantes, use pequenos erros de português (voce, pq, obg, falta de acento, "kkk" ocasional). Não exagere.
Para cada kind "question", inclua team_reply com resposta curta e humanizada em nome de "${teamName}" (delay_seconds entre 15 e 90).
NÃO inclua mensagens sobre inscrição, acesso ou horário do evento.
${referenceBlock}

Para triggers tipo cart use appear_mode "before_end" e appear_at_seconds como segundos antes do fim do vídeo.

${AI_CONTEXT_XML_INSTRUCTIONS}`,
        },
        {
          role: "user",
          content: `TRANSCRIÇÃO:\n${fullText.slice(0, 120000)}\n\nSEGMENTOS:\n${segmentsPreview}`,
        },
      ],
    },
  );

  const raw = result.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    summary?: string;
    ai_context?: string;
    triggers?: Array<{
      label: string;
      appear_at_seconds: number;
      trigger_type?: string;
      appear_mode?: string;
      transcript_snippet?: string;
    }>;
    chat_messages?: Array<{
      author_name: string;
      message: string;
      appear_at_seconds: number;
      kind?: string;
      team_reply?: { message: string; delay_seconds?: number };
    }>;
  };

  let aiContext = parsed.ai_context ?? "";
  if (aiContext && !aiContext.trimStart().startsWith("<webinar_context")) {
    aiContext = wrapLegacyContextAsXml(aiContext);
  }

  return {
    summary: parsed.summary ?? "",
    aiContext,
    triggers: (parsed.triggers ?? []).map((t) => {
      const triggerType = t.trigger_type === "cart" ? "cart" : "button";
      const appearMode =
        t.appear_mode === "before_end" || triggerType === "cart" ? "before_end" : "at_minute";
      return {
        label: t.label,
        appearAtSeconds: t.appear_at_seconds,
        triggerType,
        appearMode: appearMode as "at_minute" | "before_end",
        transcriptSnippet: t.transcript_snippet ?? "",
      };
    }),
    chatMessages: flattenChatMessagesWithReplies(parsed.chat_messages ?? [], teamName),
  };
}

function flattenChatMessagesWithReplies(
  raw: Array<{
    author_name: string;
    message: string;
    appear_at_seconds: number;
    kind?: string;
    team_reply?: { message: string; delay_seconds?: number };
  }>,
  teamName: string,
): Array<{
  authorName: string;
  message: string;
  appearAtSeconds: number;
  kind: "question" | "comment" | "reaction" | "team_reply";
  sortOrder: number;
}> {
  const out: Array<{
    authorName: string;
    message: string;
    appearAtSeconds: number;
    kind: "question" | "comment" | "reaction" | "team_reply";
    sortOrder: number;
  }> = [];

  let order = 0;
  for (const m of raw) {
    if (!m.message?.trim() || !m.author_name?.trim()) continue;
    const kind =
      m.kind === "question" || m.kind === "reaction"
        ? m.kind
        : m.kind === "team_reply"
          ? "team_reply"
          : "comment";

    out.push({
      authorName: m.author_name.trim(),
      message: m.message.trim(),
      appearAtSeconds: Math.max(0, Math.round(m.appear_at_seconds ?? 0)),
      kind,
      sortOrder: order++,
    });

    if (kind === "question" && m.team_reply?.message?.trim()) {
      const delay = Math.min(120, Math.max(10, Math.round(m.team_reply.delay_seconds ?? 25)));
      out.push({
        authorName: teamName,
        message: m.team_reply.message.trim(),
        appearAtSeconds: Math.max(0, Math.round(m.appear_at_seconds ?? 0)) + delay,
        kind: "team_reply",
        sortOrder: order++,
      });
    }
  }

  return out.sort((a, b) => a.appearAtSeconds - b.appearAtSeconds || a.sortOrder - b.sortOrder);
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function extractAndTranscribeVideo(videoBuffer: Buffer, durationSeconds: number): Promise<{
  fullText: string;
  segments: TranscriptionSegment[];
}> {
  if (durationSeconds > MAX_VIDEO_SECONDS) {
    throw new Error(`Vídeo excede o limite de 1h30 (${Math.ceil(durationSeconds / 60)} min)`);
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "webinar-"));
  const inputPath = join(tmpDir, "input.mp4");
  const audioPath = join(tmpDir, "audio.mp3");

  try {
    writeFileSync(inputPath, videoBuffer);

    const extractResult = spawnSync(
      ffmpegPath!,
      ["-i", inputPath, "-vn", "-acodec", "libmp3lame", "-ab", "64k", "-ar", "16000", "-ac", "1", "-y", audioPath],
      { encoding: "utf-8" },
    );

    if (extractResult.status !== 0) {
      throw new Error(`Falha ao extrair áudio: ${extractResult.stderr?.slice(0, 300)}`);
    }

    const audioBuffer = readFileSync(audioPath);
    const totalChunks = Math.max(1, Math.ceil(durationSeconds / CHUNK_SECONDS));
    const segments: TranscriptionSegment[] = [];
    const textParts: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const startSec = i * CHUNK_SECONDS;
      const chunkPath = join(tmpDir, `chunk-${i}.wav`);

      const sliceResult = spawnSync(
        ffmpegPath!,
        [
          "-i",
          audioPath,
          "-ss",
          String(startSec),
          "-t",
          String(CHUNK_SECONDS),
          "-acodec",
          "pcm_s16le",
          "-ar",
          "16000",
          "-ac",
          "1",
          "-y",
          chunkPath,
        ],
        { encoding: "utf-8" },
      );

      if (sliceResult.status !== 0) {
        continue;
      }

      let chunkBuffer: Buffer;
      try {
        chunkBuffer = readFileSync(chunkPath);
      } catch {
        continue;
      }

      if (chunkBuffer.length < 2000 || chunkBuffer.length > MAX_AUDIO_CHUNK_BYTES) {
        continue;
      }

      const chunkText = await transcribeAudioChunk(chunkBuffer.toString("base64"), "wav");

      if (chunkText.trim()) {
        textParts.push(chunkText);
        segments.push({
          start: startSec,
          end: Math.min(startSec + CHUNK_SECONDS, durationSeconds),
          text: chunkText,
        });
      }
    }

    return {
      fullText: textParts.join("\n\n"),
      segments,
    };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function wrapLegacyContextAsXml(plainText: string): string {
  const escaped = plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<webinar_context lang="pt-BR" audience="participantes_ja_inscritos">
  <overview>${escaped}</overview>
  <chat_persona>
    <role>Moderador do chat ao vivo</role>
    <tone>humanizado, objetivo</tone>
    <max_sentences>2</max_sentences>
    <never_mention>inscrição, cadastro, link de acesso</never_mention>
  </chat_persona>
</webinar_context>`;
}

export async function generateChatReply(
  userMessage: string,
  aiContext: string,
  transcriptExcerpt?: string,
): Promise<string> {
  const normalizedContext =
    aiContext && !isAiContextXml(aiContext) ? wrapLegacyContextAsXml(aiContext) : aiContext;

  const contextBlock = [
    normalizedContext && `CONTEXTO XML DO WEBINAR:\n${normalizedContext}`,
    transcriptExcerpt && `TRECHO DA TRANSCRIÇÃO (referência adicional):\n${transcriptExcerpt.slice(0, 4000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await openRouterFetch<{ choices: Array<{ message: { content: string } }> }>(
    "/chat/completions",
    {
      model: OPENROUTER_MODELS.chat,
      messages: [
        {
          role: "system",
          content: `${CHAT_REPLY_SYSTEM_PREFIX}\n\n${contextBlock}`,
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 180,
      temperature: 0.7,
    },
  );

  const reply = result.choices[0]?.message?.content?.trim();
  if (!reply) return "Obrigado pela pergunta! Já já a gente responde por aqui.";

  return reply.replace(/^["']|["']$/g, "").slice(0, 500);
}

export { MAX_VIDEO_SECONDS as MAX_VIDEO_DURATION_SECONDS };
