import { createClient } from "@supabase/supabase-js";

import { getWorkerConfig } from "./config.js";

export function createServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getWorkerConfig();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type IgBroadcastStatus =
  | "idle"
  | "armed"
  | "starting"
  | "live"
  | "stopped"
  | "error";

export async function logBroadcastEvent(
  broadcastId: string,
  type: string,
  message: string,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("ig_broadcast_events").insert({
    broadcast_id: broadcastId,
    type,
    message: message.slice(0, 2000),
  });
}

export async function updateBroadcastStatus(
  broadcastId: string,
  status: IgBroadcastStatus,
  extra?: { started_at?: string; ended_at?: string },
): Promise<void> {
  const supabase = createServiceClient();
  const payload: Record<string, unknown> = { status };
  if (extra?.started_at) payload.started_at = extra.started_at;
  if (extra?.ended_at) payload.ended_at = extra.ended_at;

  const { error } = await supabase.from("ig_broadcasts").update(payload).eq("id", broadcastId);
  if (error) throw new Error(error.message);
}

export async function getBroadcast(broadcastId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ig_broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .single();
  if (error || !data) throw new Error("Transmissão não encontrada");
  return data;
}

export async function getSignedVideoUrl(videoPath: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("ig-broadcasts-video")
    .createSignedUrl(videoPath, 60 * 60 * 4);

  if (error || !data?.signedUrl) {
    throw new Error("Não foi possível gerar URL assinada do vídeo.");
  }
  return data.signedUrl;
}

export async function findScheduledArmedBroadcasts() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ig_broadcasts")
    .select("*")
    .eq("status", "armed")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now);

  if (error) throw new Error(error.message);
  return data ?? [];
}
