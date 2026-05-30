-- Schema inicial — plataforma de webinars ao vivo
-- Rode todas as migrations em ordem (supabase db push ou SQL Editor).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

CREATE TABLE public.webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  schedule_recurrence text NOT NULL DEFAULT 'once'
    CHECK (schedule_recurrence IN ('once', 'daily', 'weekly')),
  schedule_weekday smallint CHECK (schedule_weekday BETWEEN 0 AND 6),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  video_type text NOT NULL DEFAULT 'upload'
    CHECK (video_type IN ('upload', 'youtube')),
  video_url text,
  video_duration_seconds integer,
  group_link text,
  display_mode text NOT NULL DEFAULT 'live'
    CHECK (display_mode IN ('live', 'recorded')),
  waiting_title text,
  waiting_description text,
  ai_context text,
  landing_hero_image text,
  landing_promo_video_url text,
  landing_benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  landing_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  landing_audience text,
  host_name text,
  host_title text,
  host_bio text,
  host_image_url text,
  landing_cta_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinars_status ON public.webinars (status);
CREATE INDEX idx_webinars_scheduled_at ON public.webinars (scheduled_at);

CREATE TABLE public.webinar_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL
    CHECK (field_type IN ('text', 'email', 'tel', 'textarea')),
  required boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  phone_region text CHECK (phone_region IN ('BR', 'US')),
  UNIQUE (webinar_id, field_key)
);

CREATE INDEX idx_webinar_form_fields_webinar ON public.webinar_form_fields (webinar_id, sort_order);

CREATE TABLE public.webinar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  session_id text,
  registered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinar_leads_webinar ON public.webinar_leads (webinar_id, registered_at DESC);

CREATE TABLE public.webinar_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  message text NOT NULL,
  appear_at_seconds integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_webinar_chat_messages_webinar ON public.webinar_chat_messages (webinar_id, appear_at_seconds);

CREATE TABLE public.webinar_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  trigger_type text NOT NULL CHECK (trigger_type IN ('button', 'cart')),
  label text NOT NULL,
  action_url text,
  appear_at_seconds integer NOT NULL DEFAULT 0,
  detected_from_transcript boolean NOT NULL DEFAULT false,
  transcript_snippet text
);

CREATE INDEX idx_webinar_triggers_webinar ON public.webinar_triggers (webinar_id, appear_at_seconds);

CREATE TABLE public.webinar_transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL UNIQUE REFERENCES public.webinars (id) ON DELETE CASCADE,
  full_text text,
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.webinar_lead_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.webinar_leads (id) ON DELETE CASCADE,
  session_date date NOT NULL,
  attended_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, lead_id, session_date)
);

CREATE INDEX idx_webinar_lead_attendance_webinar ON public.webinar_lead_attendance (webinar_id, session_date);

CREATE TABLE public.webinar_trigger_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.webinar_leads (id) ON DELETE CASCADE,
  trigger_id uuid NOT NULL REFERENCES public.webinar_triggers (id) ON DELETE CASCADE,
  session_date date NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinar_trigger_clicks_webinar ON public.webinar_trigger_clicks (webinar_id, clicked_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security (acesso via service role no servidor)
-- ---------------------------------------------------------------------------

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_lead_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_trigger_clicks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Storage (buckets públicos para leitura; upload via service role)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'webinar-videos',
  'webinar-videos',
  true,
  5368709120,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'webinar-assets',
  'webinar-assets',
  true,
  104857600,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read webinar-videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'webinar-videos');

CREATE POLICY "Public read webinar-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'webinar-assets');
