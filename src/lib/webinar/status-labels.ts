import type { WebinarStatus } from "@/lib/supabase/database.types";

export const WEBINAR_STATUS_LABELS: Record<WebinarStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};
