ALTER TABLE public.webinar_triggers
ADD COLUMN IF NOT EXISTS appear_mode text NOT NULL DEFAULT 'at_minute';

ALTER TABLE public.webinar_triggers
DROP CONSTRAINT IF EXISTS webinar_triggers_appear_mode_check;

ALTER TABLE public.webinar_triggers
ADD CONSTRAINT webinar_triggers_appear_mode_check
CHECK (appear_mode IN ('at_minute', 'before_end'));

COMMENT ON COLUMN public.webinar_triggers.appear_mode IS
  'at_minute = aparece no minuto do vídeo; before_end = aparece X segundos antes do fim';
