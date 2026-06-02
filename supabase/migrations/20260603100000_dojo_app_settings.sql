-- Configuração persistida após /setup (lida só pelo service role; sem policies = deny anon/auth)
CREATE TABLE IF NOT EXISTS public.dojo_app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dojo_app_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.dojo_app_settings IS
  'Secrets e URLs salvos pelo wizard /setup. Acesso apenas via service_role.';
