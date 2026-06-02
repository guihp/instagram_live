import { createServiceClient } from "../supabase/server";

import { analyzeTranscript, extractAndTranscribeVideo } from "./openrouter.server";

export interface TranscriptionJob {
  webinarId: string;
}

export interface DetectedTrigger {
  label: string;
  appearAtSeconds: number;
  transcriptSnippet: string;
  triggerType: "button" | "cart";
  appearMode?: "at_minute" | "before_end";
}

export interface DetectedChatMessage {
  authorName: string;
  message: string;
  appearAtSeconds: number;
  kind: "question" | "comment" | "reaction";
  sortOrder: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export async function processVideoTranscription(job: TranscriptionJob): Promise<{
  segments: TranscriptionSegment[];
  summary: string;
  aiContext: string;
  triggers: DetectedTrigger[];
  chatMessages: DetectedChatMessage[];
}> {
  const supabase = createServiceClient();

  const { data: webinar, error } = await supabase
    .from("webinars")
    .select("video_url, video_type, video_duration_seconds")
    .eq("id", job.webinarId)
    .single();

  if (error || !webinar?.video_url) {
    throw new Error("Webinar sem vídeo configurado");
  }

  if (webinar.video_type !== "upload") {
    throw new Error("Transcrição automática disponível apenas para vídeos enviados via upload");
  }

  const duration = webinar.video_duration_seconds ?? 3600;

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("webinar-videos")
    .download(webinar.video_url);

  if (downloadError || !fileData) {
    throw new Error(`Erro ao baixar vídeo: ${downloadError?.message}`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { fullText, segments } = await extractAndTranscribeVideo(buffer, duration);
  const analysis = await analyzeTranscript(fullText, segments);

  await supabase
    .from("webinar_transcriptions")
    .upsert(
      {
        webinar_id: job.webinarId,
        full_text: fullText,
        segments,
        ai_summary: analysis.summary,
        status: "completed",
        processed_at: new Date().toISOString(),
      },
      { onConflict: "webinar_id" },
    );

  await supabase
    .from("webinars")
    .update({ ai_context: analysis.aiContext })
    .eq("id", job.webinarId);

  if (analysis.triggers.length > 0) {
    await supabase.from("webinar_triggers").delete().eq("webinar_id", job.webinarId).eq("detected_from_transcript", true);

    await supabase.from("webinar_triggers").insert(
      analysis.triggers.map((t) => ({
        webinar_id: job.webinarId,
        trigger_type: t.triggerType,
        label: t.label,
        appear_at_seconds: t.appearAtSeconds,
        appear_mode: t.appearMode ?? (t.triggerType === "cart" ? "before_end" : "at_minute"),
        detected_from_transcript: true,
        transcript_snippet: t.transcriptSnippet,
      })),
    );
  }

  await supabase.from("webinar_chat_messages").delete().eq("webinar_id", job.webinarId);

  if (analysis.chatMessages.length > 0) {
    await supabase.from("webinar_chat_messages").insert(
      analysis.chatMessages.map((m) => ({
        webinar_id: job.webinarId,
        author_name: m.authorName,
        message: m.message,
        appear_at_seconds: m.appearAtSeconds,
        sort_order: m.sortOrder,
      })),
    );
  }

  return {
    segments,
    summary: analysis.summary,
    aiContext: analysis.aiContext,
    triggers: analysis.triggers,
    chatMessages: analysis.chatMessages,
  };
}

export const TRIGGER_PHRASES = [
  "clique no botão",
  "botão abaixo",
  "link na descrição",
  "carrinho",
  "compre agora",
  "oferta especial",
];
