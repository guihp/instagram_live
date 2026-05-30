CREATE TABLE IF NOT EXISTS public.webinar_live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.webinar_leads(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  message text NOT NULL,
  is_ai_response boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinar_live_messages_webinar_created
  ON public.webinar_live_messages (webinar_id, created_at);

ALTER TABLE public.webinar_live_messages ENABLE ROW LEVEL SECURITY;
