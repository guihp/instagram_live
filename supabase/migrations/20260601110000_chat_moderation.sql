-- Moderação do chat: bloquear envio de participantes e palavras proibidas

ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS chat_participant_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_blocked_words jsonb NOT NULL DEFAULT '[]'::jsonb;
