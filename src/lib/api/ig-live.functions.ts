import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServiceClient } from "../supabase/server";
import {
  armWorkerStream,
  getWorkerStreamStatus,
  startWorkerStream,
  stopWorkerStream,
} from "./ig-live.worker";

const broadcastInputSchema = z.object({
  title: z.string().min(1),
  rtmp_url: z.string().nullable().optional(),
  loop_enabled: z.boolean().default(true),
  scheduled_at: z.string().nullable().optional(),
  video_path: z.string().nullable().optional(),
});

export const listIgBroadcasts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ig_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getIgBroadcast = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: broadcast, error } = await supabase
      .from("ig_broadcasts")
      .select("*")
      .eq("id", data.id)
      .single();

    if (error || !broadcast) throw new Error("Transmissão não encontrada");
    return broadcast;
  });

export const createIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(broadcastInputSchema)
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("ig_broadcasts")
      .insert({
        title: data.title,
        rtmp_url: data.rtmp_url ?? null,
        loop_enabled: data.loop_enabled,
        scheduled_at: data.scheduled_at ?? null,
        video_path: data.video_path ?? null,
        status: "idle",
      })
      .select("*")
      .single();

    if (error || !row) throw new Error(error?.message ?? "Erro ao criar transmissão");
    return row;
  });

export const updateIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    broadcastInputSchema.extend({
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("ig_broadcasts")
      .update({
        title: data.title,
        rtmp_url: data.rtmp_url ?? null,
        loop_enabled: data.loop_enabled,
        scheduled_at: data.scheduled_at ?? null,
        ...(data.video_path !== undefined ? { video_path: data.video_path } : {}),
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error || !row) throw new Error(error?.message ?? "Erro ao atualizar");
    return row;
  });

export const deleteIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();

    const { data: broadcast, error: fetchError } = await supabase
      .from("ig_broadcasts")
      .select("video_path, status")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!broadcast) throw new Error("Transmissão não encontrada");

    if (broadcast.status === "live" || broadcast.status === "starting") {
      try {
        await stopWorkerStream(data.id);
      } catch {
        /* worker offline — segue com exclusão */
      }
    }

    const pathsToRemove = new Set<string>();
    if (broadcast.video_path) pathsToRemove.add(broadcast.video_path);

    const { data: folderFiles } = await supabase.storage
      .from("ig-broadcasts-video")
      .list(data.id);

    for (const file of folderFiles ?? []) {
      if (file.name) pathsToRemove.add(`${data.id}/${file.name}`);
    }

    if (pathsToRemove.size > 0) {
      await supabase.storage.from("ig-broadcasts-video").remove([...pathsToRemove]);
    }

    const { error } = await supabase.from("ig_broadcasts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadIgBroadcastVideo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      broadcastId: z.string().uuid(),
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const buffer = Buffer.from(data.fileBase64, "base64");
    const ext = data.fileName.includes(".") ? data.fileName.split(".").pop() : "mp4";
    const path = `${data.broadcastId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("ig-broadcasts-video")
      .upload(path, buffer, { contentType: data.contentType, upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await supabase
      .from("ig_broadcasts")
      .update({ video_path: path })
      .eq("id", data.broadcastId);

    if (updateError) throw new Error(updateError.message);

    return { path };
  });

export const getIgBroadcastVideoUrl = createServerFn({ method: "GET" })
  .inputValidator(z.object({ broadcastId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: broadcast } = await supabase
      .from("ig_broadcasts")
      .select("video_path")
      .eq("id", data.broadcastId)
      .single();

    if (!broadcast?.video_path) return { url: null };

    const { data: signed, error } = await supabase.storage
      .from("ig-broadcasts-video")
      .createSignedUrl(broadcast.video_path, 3600);

    if (error || !signed?.signedUrl) throw new Error("Erro ao gerar preview do vídeo");
    return { url: signed.signedUrl };
  });

export const listIgBroadcastEvents = createServerFn({ method: "GET" })
  .inputValidator(z.object({ broadcastId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    const { data: events, error } = await supabase
      .from("ig_broadcast_events")
      .select("*")
      .eq("broadcast_id", data.broadcastId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return events ?? [];
  });

export const armIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      broadcastId: z.string().uuid(),
      rtmpUrl: z.string().min(1),
      streamKey: z.string().min(1),
      loop: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createServiceClient();
    await supabase
      .from("ig_broadcasts")
      .update({ rtmp_url: data.rtmpUrl.trim() })
      .eq("id", data.broadcastId);

    return armWorkerStream({
      broadcastId: data.broadcastId,
      rtmpUrl: data.rtmpUrl.trim(),
      streamKey: data.streamKey.trim(),
      loop: data.loop,
    });
  });

export const startIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      broadcastId: z.string().uuid(),
      rtmpUrl: z.string().optional(),
      streamKey: z.string().optional(),
      loop: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const payload: {
      broadcastId: string;
      rtmpUrl?: string;
      streamKey?: string;
      loop?: boolean;
    } = { broadcastId: data.broadcastId };

    if (data.rtmpUrl?.trim()) payload.rtmpUrl = data.rtmpUrl.trim();
    if (data.streamKey?.trim()) payload.streamKey = data.streamKey.trim();
    if (data.loop !== undefined) payload.loop = data.loop;

    return startWorkerStream(payload);
  });

export const stopIgBroadcast = createServerFn({ method: "POST" })
  .inputValidator(z.object({ broadcastId: z.string().uuid() }))
  .handler(async ({ data }) => stopWorkerStream(data.broadcastId));

export const getIgBroadcastStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ broadcastId: z.string().uuid() }))
  .handler(async ({ data }) => getWorkerStreamStatus(data.broadcastId));
