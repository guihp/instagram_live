ALTER TABLE public.webinars
ADD COLUMN IF NOT EXISTS ai_assistant_name text;

COMMENT ON COLUMN public.webinars.ai_assistant_name IS
  'Nome exibido nas respostas da IA no chat ao vivo (ex: Maria, Equipe do curso)';
