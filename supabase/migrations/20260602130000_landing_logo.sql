ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS landing_logo_url text;

COMMENT ON COLUMN public.webinars.landing_logo_url IS
  'Logo horizontal da topbar (PNG/WebP/SVG). Recomendado ~240×48 px, fundo transparente.';
