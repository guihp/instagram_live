ALTER TABLE public.webinars
ADD COLUMN IF NOT EXISTS landing_footer jsonb;

COMMENT ON COLUMN public.webinars.landing_footer IS
  'Rodapé da landing: { enabled, text, links: [{ label, url }] }';
