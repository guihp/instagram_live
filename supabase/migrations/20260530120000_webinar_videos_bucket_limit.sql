-- Vídeos de webinar (até ~1h30 em alta qualidade) — 5 GB
UPDATE storage.buckets
SET
  file_size_limit = 5368709120,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[]
WHERE id = 'webinar-videos';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'webinar-videos',
  'webinar-videos',
  true,
  5368709120,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;
