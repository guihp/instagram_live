-- Chat ao vivo: sessão do dia, pós-live, público simulado, estratégias e snapshots

ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS post_live_hold_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS post_live_title text,
  ADD COLUMN IF NOT EXISTS post_live_description text,
  ADD COLUMN IF NOT EXISTS viewer_count_start integer,
  ADD COLUMN IF NOT EXISTS viewer_count_mid integer,
  ADD COLUMN IF NOT EXISTS viewer_count_end integer,
  ADD COLUMN IF NOT EXISTS chat_strategies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_generate_count integer NOT NULL DEFAULT 20;

ALTER TABLE public.webinar_live_messages
  ADD COLUMN IF NOT EXISTS session_date date;

UPDATE public.webinar_live_messages
SET session_date = (created_at AT TIME ZONE 'America/Sao_Paulo')::date
WHERE session_date IS NULL;

ALTER TABLE public.webinar_live_messages
  ALTER COLUMN session_date SET NOT NULL,
  ALTER COLUMN session_date SET DEFAULT (timezone('America/Sao_Paulo', now()))::date;

CREATE INDEX IF NOT EXISTS idx_webinar_live_messages_session
  ON public.webinar_live_messages (webinar_id, session_date, created_at);

ALTER TABLE public.webinar_chat_messages
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'comment'
    CHECK (kind IN ('question', 'comment', 'reaction', 'team_reply'));

CREATE TABLE IF NOT EXISTS public.webinar_chat_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  label text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinar_chat_snapshots_webinar
  ON public.webinar_chat_snapshots (webinar_id, created_at DESC);

ALTER TABLE public.webinar_chat_snapshots ENABLE ROW LEVEL SECURITY;
