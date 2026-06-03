-- Landing templates, theme tweaks, stats (centered), audience as JSON array

ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS landing_template text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS landing_theme jsonb NOT NULL DEFAULT '{"variant":"a","accent":"#2E6BFF","heroMedia":"video"}'::jsonb,
  ADD COLUMN IF NOT EXISTS landing_stats jsonb NOT NULL DEFAULT '[
    {"value":"20 mil","label":"pessoas e empresas já automatizadas"},
    {"value":"+20 mil","label":"fluxos construídos em produção"},
    {"value":"20 mil","label":"horas de trabalho manual economizadas"}
  ]'::jsonb;

COMMENT ON COLUMN public.webinars.landing_template IS 'classic | sidebar | centered';
COMMENT ON COLUMN public.webinars.landing_theme IS 'variant (a|b), accent hex, heroMedia (video|image|none)';
COMMENT ON COLUMN public.webinars.landing_stats IS 'Faixa de números do template centered: [{value, label}]';

-- audience: text -> jsonb (Postgres não permite subquery no USING do ALTER TYPE)
ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS landing_audience_new jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.webinars w
SET landing_audience_new = CASE
  WHEN w.landing_audience IS NULL OR btrim(w.landing_audience::text) = '' THEN '[]'::jsonb
  WHEN left(btrim(w.landing_audience::text), 1) = '[' THEN w.landing_audience::jsonb
  ELSE COALESCE(
    (
      SELECT jsonb_agg(btrim(x) ORDER BY ord)
      FROM regexp_split_to_table(w.landing_audience::text, E'[\r\n]+') WITH ORDINALITY AS t(x, ord)
      WHERE btrim(x) <> ''
    ),
    '[]'::jsonb
  )
END
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'webinars' AND column_name = 'landing_audience'
    AND data_type = 'text'
);

ALTER TABLE public.webinars DROP COLUMN IF EXISTS landing_audience;
ALTER TABLE public.webinars RENAME COLUMN landing_audience_new TO landing_audience;
ALTER TABLE public.webinars ALTER COLUMN landing_audience SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.webinars.landing_audience IS 'Lista de bullets — público-alvo';
