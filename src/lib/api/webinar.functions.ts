import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServiceClient } from "../supabase/server";
import { resolveAiAssistantName } from "../webinar/assistant-name";
import { getBrasiliaDateKey } from "../webinar/datetime";
import { messageHasBlockedWord, parseBlockedWords } from "../webinar/chat-moderation";

async function resolveLeadIdForWebinar(
  webinarId: string,
  leadId?: string,
): Promise<string | null> {
  if (!leadId) return null;

  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from("webinar_leads")
    .select("id")
    .eq("id", leadId)
    .eq("webinar_id", webinarId)
    .maybeSingle();

  return lead?.id ?? null;
}

const slugSchema = z.object({ slug: z.string().min(1) });

export const getWebinarBySlug = createServerFn({ method: "GET" })
  .inputValidator(slugSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: webinar, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .single();

    if (error || !webinar) {
      throw new Error("Webinar não encontrado");
    }

    const [fields, chatMessages, triggers] = await Promise.all([
      supabase
        .from("webinar_form_fields")
        .select("*")
        .eq("webinar_id", webinar.id)
        .eq("enabled", true)
        .order("sort_order"),
      supabase
        .from("webinar_chat_messages")
        .select("*")
        .eq("webinar_id", webinar.id)
        .order("appear_at_seconds"),
      supabase
        .from("webinar_triggers")
        .select("*")
        .eq("webinar_id", webinar.id)
        .order("appear_at_seconds"),
    ]);

    return {
      webinar,
      formFields: fields.data ?? [],
      chatMessages: chatMessages.data ?? [],
      triggers: triggers.data ?? [],
    };
  });

export const registerLead = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      data: z.record(z.string()),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      sessionId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: lead, error } = await supabase
      .from("webinar_leads")
      .insert({
        webinar_id: data.webinarId,
        data: data.data,
        utm_source: data.utmSource ?? null,
        utm_medium: data.utmMedium ?? null,
        utm_campaign: data.utmCampaign ?? null,
        session_id: data.sessionId,
      })
      .select("id")
      .single();

    if (error || !lead) {
      throw new Error("Erro ao registrar lead");
    }

    return { leadId: lead.id };
  });

export const sendLiveMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      leadId: z.string().uuid().optional(),
      authorName: z.string().min(1),
      message: z.string().min(1).max(500),
      currentVideoTime: z.number().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const leadId = await resolveLeadIdForWebinar(data.webinarId, data.leadId);

    const { data: webinar } = await supabase
      .from("webinars")
      .select("chat_participant_enabled, chat_blocked_words, ai_context, ai_assistant_name, host_name")
      .eq("id", data.webinarId)
      .single();

    if (webinar && webinar.chat_participant_enabled === false) {
      return { rejected: "chat_locked" as const, userMessage: null, aiMessage: null };
    }

    const blockedWords = parseBlockedWords(webinar?.chat_blocked_words);
    if (messageHasBlockedWord(data.message, blockedWords)) {
      return { rejected: "blocked_word" as const, userMessage: null, aiMessage: null };
    }

    const sessionDate = getBrasiliaDateKey();

    const { data: msg, error } = await supabase
      .from("webinar_live_messages")
      .insert({
        webinar_id: data.webinarId,
        lead_id: leadId,
        author_name: data.authorName,
        message: data.message,
        is_ai_response: false,
        session_date: sessionDate,
      })
      .select("*")
      .single();

    if (error || !msg) {
      const detail = error?.message ?? "";
      if (detail.includes("webinar_live_messages") && detail.includes("does not exist")) {
        throw new Error(
          "Chat ao vivo não configurado no banco. Aplique a migration webinar_live_messages no Supabase.",
        );
      }
      throw new Error(detail || "Erro ao enviar mensagem");
    }

    let aiMsg = null;

    try {
      const { data: transcription } = await supabase
        .from("webinar_transcriptions")
        .select("full_text")
        .eq("webinar_id", data.webinarId)
        .maybeSingle();

      const assistantName = resolveAiAssistantName(
        webinar?.ai_assistant_name,
        webinar?.host_name,
      );

      let aiReply = "Obrigado pela pergunta! Nossa equipe responderá em breve.";

      if (webinar?.ai_context || transcription?.full_text) {
        try {
          const { generateChatReply } = await import("../webinar/openrouter.server");
          aiReply = await generateChatReply(
            data.message,
            webinar?.ai_context ?? "",
            transcription?.full_text ?? undefined,
          );
        } catch {
          aiReply = "Boa pergunta! A equipe responde por aqui em instantes.";
        }
      }

      const { data: insertedAiMsg, error: aiError } = await supabase
        .from("webinar_live_messages")
        .insert({
          webinar_id: data.webinarId,
          lead_id: leadId,
          author_name: assistantName,
          message: aiReply,
          is_ai_response: true,
          session_date: sessionDate,
        })
        .select("*")
        .single();

      if (!aiError && insertedAiMsg) {
        aiMsg = insertedAiMsg;
      }
    } catch {
      /* resposta da IA é opcional — mensagem do usuário já foi salva */
    }

    return { userMessage: msg, aiMessage: aiMsg };
  });

export const getLiveMessages = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const sessionDate = data.sessionDate ?? getBrasiliaDateKey();

    const { data: messages, error } = await supabase
      .from("webinar_live_messages")
      .select("*")
      .eq("webinar_id", data.webinarId)
      .eq("session_date", sessionDate)
      .order("created_at");

    if (error) {
      if (error.code === "42P01") return [];
      throw new Error(error.message);
    }
    return messages ?? [];
  });

export const trackLiveAttendance = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      leadId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const leadId = await resolveLeadIdForWebinar(data.webinarId, data.leadId);
    if (!leadId) return { success: false };

    const supabase = createServiceClient();
    const sessionDate = getBrasiliaDateKey();

    const { error } = await supabase.from("webinar_lead_attendance").insert({
      webinar_id: data.webinarId,
      lead_id: leadId,
      session_date: sessionDate,
    });

    if (error && error.code !== "23505") throw new Error("Erro ao registrar presença");
    return { success: true };
  });

export const trackTriggerClick = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      leadId: z.string().uuid(),
      triggerId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const leadId = await resolveLeadIdForWebinar(data.webinarId, data.leadId);
    if (!leadId) return { success: false };

    const supabase = createServiceClient();

    const { error } = await supabase.from("webinar_trigger_clicks").insert({
      webinar_id: data.webinarId,
      lead_id: leadId,
      trigger_id: data.triggerId,
      session_date: getBrasiliaDateKey(),
    });

    if (error) throw new Error("Erro ao registrar clique");
    return { success: true };
  });
