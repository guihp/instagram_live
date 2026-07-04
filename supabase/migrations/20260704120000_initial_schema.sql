-- Instagram Live broadcasts (RTMP via worker)

CREATE TABLE public.ig_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  video_path text,
  rtmp_url text,
  loop_enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'armed', 'starting', 'live', 'stopped', 'error')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ig_broadcasts_status ON public.ig_broadcasts (status);
CREATE INDEX idx_ig_broadcasts_scheduled_at ON public.ig_broadcasts (scheduled_at)
  WHERE scheduled_at IS NOT NULL;

CREATE TABLE public.ig_broadcast_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.ig_broadcasts (id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ig_broadcast_events_broadcast ON public.ig_broadcast_events (broadcast_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security — admin autenticado; worker usa service role
-- ---------------------------------------------------------------------------

ALTER TABLE public.ig_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_broadcast_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ig_broadcasts"
  ON public.ig_broadcasts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated write ig_broadcasts"
  ON public.ig_broadcasts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated read ig_broadcast_events"
  ON public.ig_broadcast_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated write ig_broadcast_events"
  ON public.ig_broadcast_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Storage — bucket privado para vídeos de transmissão IG
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ig-broadcasts-video',
  'ig-broadcasts-video',
  false,
  5368709120,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[]
)
ON CONFLICT (id) DO NOTHING;
