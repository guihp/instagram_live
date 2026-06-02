import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServiceClient } from "../supabase/server";
import { getSupabaseStorageSettingsUrl } from "../supabase/dashboard-url.server";
import { getServerConfig } from "../config.server";
import { processVideoTranscription } from "../webinar/transcription";
import { MAX_VIDEO_DURATION_SECONDS } from "../webinar/openrouter.server";
import type { DisplayMode, FieldType, VideoType, WebinarStatus } from "../supabase/database.types";

const webinarInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduled_at: z.string(),
  schedule_recurrence: z.enum(["once", "daily", "weekly"]).default("once"),
  schedule_weekday: z.number().min(0).max(6).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  video_type: z.enum(["upload", "youtube"]),
  video_url: z.string().optional(),
  video_duration_seconds: z.number().optional(),
  group_link: z.string().optional(),
  display_mode: z.enum(["live", "recorded"]),
  waiting_title: z.string().optional(),
  waiting_description: z.string().optional(),
  ai_context: z.string().optional(),
  ai_assistant_name: z.string().optional(),
  landing_hero_image: z.string().nullable().optional(),
  landing_promo_video_url: z.string().nullable().optional(),
  landing_benefits: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
  landing_topics: z.array(z.string()).optional(),
  landing_audience: z.string().nullable().optional(),
  host_name: z.string().nullable().optional(),
  host_title: z.string().nullable().optional(),
  host_bio: z.string().nullable().optional(),
  host_image_url: z.string().nullable().optional(),
  landing_cta_text: z.string().nullable().optional(),
  landing_footer: z
    .object({
      enabled: z.boolean(),
      text: z.string(),
      links: z.array(z.object({ label: z.string(), url: z.string() })),
    })
    .nullable()
    .optional(),
});

const formFieldSchema = z.object({
  field_key: z.string().min(1),
  label: z.string().min(1),
  field_type: z.enum(["text", "email", "tel", "textarea"]),
  required: z.boolean(),
  enabled: z.boolean(),
  sort_order: z.number(),
  phone_region: z.enum(["BR", "US"]).nullable().optional(),
});

const chatMessageSchema = z.object({
  author_name: z.string(),
  message: z.string(),
  appear_at_seconds: z.number(),
  sort_order: z.number(),
});

const triggerSchema = z.object({
  trigger_type: z.enum(["button", "cart"]),
  label: z.string(),
  action_url: z.string().optional(),
  appear_at_seconds: z.number(),
  appear_mode: z.enum(["at_minute", "before_end"]).optional(),
});

export const listWebinars = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("webinars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listWebinarsWithStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceClient();

  const [{ data: webinars, error: wErr }, { data: leads, error: lErr }] = await Promise.all([
    supabase.from("webinars").select("*").order("created_at", { ascending: false }),
    supabase.from("webinar_leads").select("webinar_id"),
  ]);

  if (wErr) throw new Error(wErr.message);
  if (lErr) throw new Error(lErr.message);

  const leadCounts = new Map<string, number>();
  for (const lead of leads ?? []) {
    leadCounts.set(lead.webinar_id, (leadCounts.get(lead.webinar_id) ?? 0) + 1);
  }

  return (webinars ?? []).map((w) => ({
    ...w,
    leadCount: leadCounts.get(w.id) ?? 0,
  }));
});

export const updateWebinarStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["draft", "published", "archived"]),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("webinars")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getWebinarAdmin = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: webinar, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("id", data.id)
      .single();

    if (error || !webinar) throw new Error("Webinar não encontrado");

    const [fields, chat, triggers, leads, transcription] = await Promise.all([
      supabase.from("webinar_form_fields").select("*").eq("webinar_id", data.id).order("sort_order"),
      supabase.from("webinar_chat_messages").select("*").eq("webinar_id", data.id).order("appear_at_seconds"),
      supabase.from("webinar_triggers").select("*").eq("webinar_id", data.id).order("appear_at_seconds"),
      supabase.from("webinar_leads").select("*").eq("webinar_id", data.id).order("registered_at", { ascending: false }),
      supabase.from("webinar_transcriptions").select("*").eq("webinar_id", data.id).maybeSingle(),
    ]);

    return {
      webinar,
      formFields: fields.data ?? [],
      chatMessages: chat.data ?? [],
      triggers: triggers.data ?? [],
      leads: leads.data ?? [],
      transcription: transcription.data ?? null,
    };
  });

export const createWebinar = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinar: webinarInputSchema,
      formFields: z.array(formFieldSchema).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: webinar, error } = await supabase
      .from("webinars")
      .insert(data.webinar as Record<string, unknown>)
      .select("*")
      .single();

    if (error || !webinar) throw new Error(error?.message ?? "Erro ao criar webinar");

    const defaultFields = data.formFields ?? [
      { field_key: "name", label: "Nome", field_type: "text" as FieldType, required: true, enabled: true, sort_order: 0, phone_region: null },
      { field_key: "phone", label: "Telefone", field_type: "tel" as FieldType, required: true, enabled: true, sort_order: 1, phone_region: "BR" as const },
      { field_key: "email", label: "E-mail", field_type: "email" as FieldType, required: true, enabled: true, sort_order: 2, phone_region: null },
    ];

    await supabase.from("webinar_form_fields").insert(
      defaultFields.map((f) => ({ ...f, webinar_id: webinar.id })),
    );

    await supabase.from("webinar_transcriptions").insert({ webinar_id: webinar.id, status: "pending" });

    return webinar;
  });

export const updateWebinar = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      webinar: webinarInputSchema.partial(),
      formFields: z.array(formFieldSchema.extend({ id: z.string().uuid().optional() })).optional(),
      chatMessages: z.array(chatMessageSchema.extend({ id: z.string().uuid().optional() })).optional(),
      triggers: z.array(triggerSchema.extend({ id: z.string().uuid().optional() })).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("webinars")
      .update(data.webinar as never)
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    if (data.formFields) {
      await supabase.from("webinar_form_fields").delete().eq("webinar_id", data.id);
      if (data.formFields.length > 0) {
        await supabase.from("webinar_form_fields").insert(
          data.formFields.map((f) => ({ ...f, webinar_id: data.id })),
        );
      }
    }

    if (data.chatMessages) {
      await supabase.from("webinar_chat_messages").delete().eq("webinar_id", data.id);
      if (data.chatMessages.length > 0) {
        await supabase.from("webinar_chat_messages").insert(
          data.chatMessages.map((m) => ({ ...m, webinar_id: data.id })),
        );
      }
    }

    if (data.triggers) {
      await supabase.from("webinar_triggers").delete().eq("webinar_id", data.id);
      if (data.triggers.length > 0) {
        await supabase.from("webinar_triggers").insert(
          data.triggers.map((t) => ({ ...t, webinar_id: data.id })),
        );
      }
    }

    return { success: true };
  });

export const deleteWebinar = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { error } = await supabase.from("webinars").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

function getStorageLimitHelp(): string {
  const { supabaseUrl } = getServerConfig();
  const settingsUrl = getSupabaseStorageSettingsUrl(supabaseUrl);
  return `Aumente o "Global file size limit" em Storage Settings do Supabase (requer Pro): ${settingsUrl} — depois defina SUPABASE_STORAGE_MAX_BYTES no .env e reinicie o servidor.`;
}

export const getVideoUploadLimits = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseStorageMaxBytes, supabaseUrl } = getServerConfig();
  const { formatFileSize } = await import("../webinar/video-utils");
  return {
    maxStorageBytes: supabaseStorageMaxBytes,
    maxStorageLabel: formatFileSize(supabaseStorageMaxBytes),
    dashboardUrl: getSupabaseStorageSettingsUrl(supabaseUrl),
  };
});

function throwIfStorageSizeError(message: string): never {
  const lower = message.toLowerCase();
  if (lower.includes("maximum allowed size") || lower.includes("413") || lower.includes("payload too large")) {
    throw new Error(`Limite global do Supabase Storage atingido. ${getStorageLimitHelp()}`);
  }
  throw new Error(message);
}

export const initWebinarVideoChunkUpload = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      fileName: z.string(),
      fileSizeBytes: z.number().positive(),
      totalChunks: z.number().int().positive(),
      durationSeconds: z.number().positive(),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new Error(
        `Vídeo excede o limite de 1h30 (duração detectada: ${Math.ceil(data.durationSeconds / 60)} min)`,
      );
    }

    const { MAX_VIDEO_INPUT_BYTES, formatFileSize } = await import("../webinar/video-utils");
    if (data.fileSizeBytes > MAX_VIDEO_INPUT_BYTES) {
      throw new Error(
        `Arquivo muito grande (${formatFileSize(data.fileSizeBytes)}). Máximo: ${formatFileSize(MAX_VIDEO_INPUT_BYTES)}.`,
      );
    }

    const { createChunkSession } = await import("../webinar/video-chunk-session.server");
    const sessionId = createChunkSession({
      webinarId: data.webinarId,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      totalChunks: data.totalChunks,
      durationSeconds: data.durationSeconds,
      contentType: data.contentType,
    });

    const { supabaseStorageMaxBytes } = getServerConfig();
    const { VIDEO_UPLOAD_CHUNK_BYTES } = await import("../webinar/video-utils");

    return {
      sessionId,
      chunkSize: VIDEO_UPLOAD_CHUNK_BYTES,
      maxStorageBytes: supabaseStorageMaxBytes,
    };
  });

export const uploadWebinarVideoChunk = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      chunkIndex: z.number().int().min(0),
      chunkBase64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { writeChunk } = await import("../webinar/video-chunk-session.server");
    const buffer = Buffer.from(data.chunkBase64, "base64");
    writeChunk(data.sessionId, data.chunkIndex, buffer);
    return { ok: true };
  });

export const finalizeWebinarVideoChunkUpload = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      webinarId: z.string().uuid(),
      durationSeconds: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { assembleChunks, destroyChunkSession } = await import("../webinar/video-chunk-session.server");
    const { convertVideoFileToWebinarMp4 } = await import("../webinar/convert-video.server");
    const { supabaseStorageMaxBytes } = getServerConfig();

    let sessionId = data.sessionId;
    try {
      const { inputPath, meta } = await assembleChunks(sessionId);

      if (meta.webinarId !== data.webinarId) {
        throw new Error("Sessão de upload inválida para este webinar.");
      }

      const targetMaxBytes = supabaseStorageMaxBytes;
      const { buffer: converted, sizeBytes } = await convertVideoFileToWebinarMp4(inputPath, {
        maxOutputBytes: targetMaxBytes,
        durationSeconds: data.durationSeconds,
      });

      if (sizeBytes > targetMaxBytes) {
        const { formatFileSize } = await import("../webinar/video-utils");
        throw new Error(
          `Após conversão o vídeo ficou com ${formatFileSize(sizeBytes)}, acima do limite configurado (${formatFileSize(targetMaxBytes)}). ${getStorageLimitHelp()}`,
        );
      }

      const supabase = createServiceClient();
      const finalPath = `${data.webinarId}/${Date.now()}-webinar.mp4`;

      const { error: uploadError } = await supabase.storage
        .from("webinar-videos")
        .upload(finalPath, converted, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        throwIfStorageSizeError(uploadError.message);
      }

      const { error: updateError } = await supabase
        .from("webinars")
        .update({
          video_url: finalPath,
          video_type: "upload" as VideoType,
          video_duration_seconds: Math.round(data.durationSeconds),
        })
        .eq("id", data.webinarId);

      if (updateError) throw new Error(updateError.message);

      await supabase
        .from("webinar_transcriptions")
        .upsert({ webinar_id: data.webinarId, status: "pending" }, { onConflict: "webinar_id" });

      return { path: finalPath, durationSeconds: Math.round(data.durationSeconds), sizeBytes };
    } finally {
      destroyChunkSession(sessionId);
    }
  });

export const removeWebinarVideo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ webinarId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: webinar, error: fetchError } = await supabase
      .from("webinars")
      .select("video_url")
      .eq("id", data.webinarId)
      .single();

    if (fetchError || !webinar) {
      throw new Error("Webinar não encontrado");
    }

    if (webinar.video_url) {
      await supabase.storage.from("webinar-videos").remove([webinar.video_url]);
    }

    const { error: updateError } = await supabase
      .from("webinars")
      .update({
        video_url: null,
        video_duration_seconds: null,
      })
      .eq("id", data.webinarId);

    if (updateError) throw new Error(updateError.message);

    return { success: true };
  });

export const requestTranscription = createServerFn({ method: "POST" })
  .inputValidator(z.object({ webinarId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    await supabase
      .from("webinar_transcriptions")
      .upsert(
        { webinar_id: data.webinarId, status: "processing" as const },
        { onConflict: "webinar_id" },
      );

    try {
      const result = await processVideoTranscription({ webinarId: data.webinarId });
      return {
        status: "completed" as const,
        summary: result.summary,
        aiContext: result.aiContext,
        triggersCount: result.triggers.length,
        chatMessagesCount: result.chatMessages.length,
        chatMessages: result.chatMessages.map((m) => ({
          author_name: m.authorName,
          message: m.message,
          appear_at_minutes: m.appearAtSeconds / 60,
          sort_order: m.sortOrder,
          kind: m.kind,
        })),
      };
    } catch (err) {
      await supabase
        .from("webinar_transcriptions")
        .update({ status: "failed" })
        .eq("webinar_id", data.webinarId);

      throw err instanceof Error ? err : new Error("Erro na transcrição");
    }
  });

export const getTranscriptionStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ webinarId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: transcription } = await supabase
      .from("webinar_transcriptions")
      .select("*")
      .eq("webinar_id", data.webinarId)
      .maybeSingle();

    return transcription;
  });

export const listLeads = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceClient();

  const [{ data: leads, error: leadsError }, { data: webinars, error: webinarsError }] =
    await Promise.all([
      supabase.from("webinar_leads").select("*").order("registered_at", { ascending: false }),
      supabase.from("webinars").select("id, title, slug"),
    ]);

  if (leadsError) throw new Error(leadsError.message);
  if (webinarsError) throw new Error(webinarsError.message);

  const webinarMap = new Map((webinars ?? []).map((w) => [w.id, w]));

  return (leads ?? []).map((lead) => ({
    ...lead,
    webinar: webinarMap.get(lead.webinar_id) ?? null,
  }));
});

export const uploadWebinarAsset = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      webinarId: z.string().uuid(),
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string(),
      assetType: z.enum(["hero", "promo", "host"]),
    }),
  )
  .handler(async ({ data }) => {
    const { resolveStorageContentType } = await import("../webinar/storage-utils");
    const supabase = createServiceClient();
    const buffer = Buffer.from(data.fileBase64, "base64");
    const ext = data.fileName.includes(".") ? data.fileName.split(".").pop() : "bin";
    const contentType = resolveStorageContentType(data.fileName, data.contentType);

    const isPromoVideo = data.assetType === "promo";
    const bucket = isPromoVideo ? "webinar-videos" : "webinar-assets";
    const path = isPromoVideo
      ? `${data.webinarId}/promo/${Date.now()}.${ext}`
      : `${data.webinarId}/${data.assetType}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadError) {
      const message = uploadError.message.toLowerCase();
      if (message.includes("mime type") && message.includes("not supported")) {
        throw new Error(
          `Formato não permitido (${contentType}). Use MP4, WebM ou MOV para vídeos promocionais.`,
        );
      }
      throwIfStorageSizeError(uploadError.message);
    }

    return { path };
  });

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceClient();
  const { getBrasiliaDateKey, formatBrasiliaDateShort } = await import("../webinar/datetime");
  const { leadDisplayName } = await import("../webinar/lead-utils");

  const [webinarsRes, leadsRes, attendanceRes, clicksRes, triggersRes] = await Promise.all([
    supabase.from("webinars").select("*").order("created_at", { ascending: false }),
    supabase.from("webinar_leads").select("*").order("registered_at", { ascending: false }),
    supabase.from("webinar_lead_attendance").select("*"),
    supabase.from("webinar_trigger_clicks").select("*").order("clicked_at", { ascending: false }),
    supabase.from("webinar_triggers").select("id, label, trigger_type, webinar_id"),
  ]);

  for (const res of [webinarsRes, leadsRes, attendanceRes, clicksRes, triggersRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const webinars = webinarsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const attendance = attendanceRes.data ?? [];
  const clicks = clicksRes.data ?? [];
  const triggers = triggersRes.data ?? [];

  const todayKey = getBrasiliaDateKey();
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const triggerById = new Map(triggers.map((t) => [t.id, t]));
  const webinarById = new Map(webinars.map((w) => [w.id, w]));

  const leadsToday = leads.filter((l) => getBrasiliaDateKey(l.registered_at) === todayKey).length;

  const last7Keys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Keys.push(getBrasiliaDateKey(d));
  }

  const leadsByDayMap = new Map(last7Keys.map((k) => [k, 0]));
  for (const lead of leads) {
    const key = getBrasiliaDateKey(lead.registered_at);
    if (leadsByDayMap.has(key)) {
      leadsByDayMap.set(key, (leadsByDayMap.get(key) ?? 0) + 1);
    }
  }

  const leadsByDay = last7Keys.map((date) => ({
    date,
    label: formatBrasiliaDateShort(date),
    count: leadsByDayMap.get(date) ?? 0,
  }));

  const webinarStats = webinars.map((w) => {
    const registered = leads
      .filter((l) => l.webinar_id === w.id)
      .sort((a, b) => b.registered_at.localeCompare(a.registered_at));
    const attended = attendance.filter((a) => a.webinar_id === w.id);
    const webinarClicks = clicks.filter((c) => c.webinar_id === w.id);
    const uniqueAttended = new Set(attended.map((a) => a.lead_id)).size;
    const uniqueClickers = new Set(webinarClicks.map((c) => c.lead_id)).size;

    const attendanceByDay = new Map<string, number>();
    for (const a of attended) {
      attendanceByDay.set(a.session_date, (attendanceByDay.get(a.session_date) ?? 0) + 1);
    }

    return {
      id: w.id,
      title: w.title,
      slug: w.slug,
      status: w.status,
      leadsRegistered: registered.length,
      leadsAttended: uniqueAttended,
      triggerClicks: webinarClicks.length,
      uniqueClickers,
      attendanceRate:
        registered.length > 0 ? Math.round((uniqueAttended / registered.length) * 100) : 0,
      clickRate:
        uniqueAttended > 0 ? Math.round((uniqueClickers / uniqueAttended) * 100) : 0,
      lastLeadAt: registered[0]?.registered_at ?? null,
      attendanceByDay: [...attendanceByDay.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7),
    };
  });

  const recentClicks = clicks.slice(0, 15).map((c) => {
    const lead = leadById.get(c.lead_id);
    const trigger = triggerById.get(c.trigger_id);
    const webinar = webinarById.get(c.webinar_id);
    return {
      id: c.id,
      clickedAt: c.clicked_at,
      sessionDate: c.session_date,
      leadId: c.lead_id,
      leadName: lead ? leadDisplayName(lead.data) : "Lead",
      leadData: lead?.data ?? {},
      triggerLabel: trigger?.label ?? "Botão",
      triggerType: trigger?.trigger_type ?? "button",
      webinarTitle: webinar?.title ?? "Webinar",
      webinarSlug: webinar?.slug ?? "",
    };
  });

  return {
    summary: {
      totalWebinars: webinars.length,
      publishedWebinars: webinars.filter((w) => w.status === "published").length,
      draftWebinars: webinars.filter((w) => w.status === "draft").length,
      totalLeads: leads.length,
      leadsToday,
      totalAttended: new Set(attendance.map((a) => a.lead_id)).size,
      totalTriggerClicks: clicks.length,
      uniqueClickers: new Set(clicks.map((c) => c.lead_id)).size,
    },
    leadsByDay,
    webinarStats,
    recentClicks,
  };
});

export const previewChatReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      message: z.string().min(1).max(500),
      aiContext: z.string().optional(),
      webinarId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    let transcriptExcerpt: string | undefined;

    if (data.webinarId) {
      const supabase = createServiceClient();
      const { data: transcription } = await supabase
        .from("webinar_transcriptions")
        .select("full_text")
        .eq("webinar_id", data.webinarId)
        .maybeSingle();
      transcriptExcerpt = transcription?.full_text ?? undefined;
    }

    const aiContext = data.aiContext?.trim() ?? "";

    if (!aiContext && !transcriptExcerpt) {
      return {
        reply:
          "Configure o contexto da IA na aba Geral ou processe a transcrição do vídeo para testar respostas aqui.",
      };
    }

    try {
      const { generateChatReply } = await import("../webinar/openrouter.server");
      const reply = await generateChatReply(data.message, aiContext, transcriptExcerpt);
      return { reply };
    } catch {
      return {
        reply: "Não foi possível gerar a resposta agora. Verifique a OPENROUTER_API_KEY e tente de novo.",
      };
    }
  });

export type { WebinarStatus, DisplayMode, VideoType };
