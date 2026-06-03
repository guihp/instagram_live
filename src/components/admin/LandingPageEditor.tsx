import { Plus, Trash2 } from "lucide-react";

import { AssetUploadField } from "@/components/admin/AssetUploadField";
import { LandingPagePreview } from "@/components/admin/LandingPagePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Webinar } from "@/lib/supabase/database.types";
import {
  ACCENT_PRESETS,
  DEFAULT_LANDING_STATS,
  DEFAULT_LANDING_THEME,
  LANDING_LOGO_SPECS,
  LANDING_TEMPLATE_OPTIONS,
  type LandingBenefit,
  type LandingFooter,
  type LandingStat,
  type LandingTemplateId,
  type LandingTheme,
  parseLandingAudience,
  parseLandingFooter,
  parseLandingStats,
  parseLandingTemplate,
  parseLandingTheme,
} from "@/lib/webinar/landing";
import type { LandingPreviewDraft } from "@/components/webinar/landing-templates/preview";
import { cn } from "@/lib/utils";

export interface LandingFormValues {
  landing_template: LandingTemplateId;
  landing_theme: LandingTheme;
  landing_stats: LandingStat[];
  landing_logo_url: string;
  landing_hero_image: string;
  landing_promo_video_url: string;
  landing_benefits: LandingBenefit[];
  landing_topics: string[];
  landing_audience: string[];
  host_name: string;
  host_title: string;
  host_bio: string;
  host_image_url: string;
  landing_cta_text: string;
  landing_footer: LandingFooter;
}

interface LandingPageEditorProps {
  values: LandingFormValues;
  onChange: (values: LandingFormValues) => void;
  webinarId?: string;
  previewBaseWebinar?: Webinar;
  previewMeta?: Omit<LandingPreviewDraft, "landing">;
}

export function LandingPageEditor({
  values,
  onChange,
  webinarId,
  previewBaseWebinar,
  previewMeta,
}: LandingPageEditorProps) {
  const set = (patch: Partial<LandingFormValues>) => onChange({ ...values, ...patch });
  const showStats = values.landing_template === "centered";

  const previewDraft: LandingPreviewDraft | null =
    previewBaseWebinar && previewMeta
      ? { landing: values, ...previewMeta }
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Escolha um dos três layouts. Ajustes visuais e conteúdo aparecem no preview abaixo e em nova aba
        (rascunho local — salve o webinar para publicar).
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Template da landing</Label>
        <div className="grid gap-3 md:grid-cols-3">
          {LANDING_TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => set({ landing_template: opt.id })}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                values.landing_template === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="block font-semibold">{opt.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      <AssetUploadField
        label="Logo da landing (topbar)"
        description={`${LANDING_LOGO_SPECS.formats}. Proporção ${LANDING_LOGO_SPECS.ratioLabel} — recomendado ${LANDING_LOGO_SPECS.recommendedWidth}×${LANDING_LOGO_SPECS.recommendedHeight} px (exibe até ${LANDING_LOGO_SPECS.maxDisplayWidthPx}×${LANDING_LOGO_SPECS.displayHeightPx} px). Se vazio, usa a logo Dojo padrão.`}
        value={values.landing_logo_url}
        onChange={(path) => set({ landing_logo_url: path })}
        webinarId={webinarId}
        assetType="logo"
        accept="image/png,image/webp,image/svg+xml"
        previewType="image"
        previewLayout="logo"
      />

      <div className="dojo-surface-card grid gap-3 p-3 sm:p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Estilo visual</Label>
          <Select
            value={values.landing_theme.variant}
            onValueChange={(variant: "a" | "b") =>
              set({ landing_theme: { ...values.landing_theme, variant } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Premium (sóbrio)</SelectItem>
              <SelectItem value="b">Tech (energético)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cor de destaque</Label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                className={cn(
                  "size-9 rounded-lg border-2 transition-transform hover:scale-105",
                  values.landing_theme.accent === color ? "border-white ring-2 ring-primary" : "border-transparent",
                )}
                style={{ background: color }}
                onClick={() => set({ landing_theme: { ...values.landing_theme, accent: color } })}
              />
            ))}
          </div>
          <Input
            value={values.landing_theme.accent}
            onChange={(e) => set({ landing_theme: { ...values.landing_theme, accent: e.target.value } })}
            placeholder="#2E6BFF"
          />
        </div>
        <div className="space-y-2">
          <Label>Mídia do hero</Label>
          <Select
            value={values.landing_theme.heroMedia}
            onValueChange={(heroMedia: LandingTheme["heroMedia"]) =>
              set({ landing_theme: { ...values.landing_theme, heroMedia } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Vídeo (se houver)</SelectItem>
              <SelectItem value="image">Imagem de capa</SelectItem>
              <SelectItem value="none">Sem mídia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showStats && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Faixa de números (template centralizado)</Label>
          {values.landing_stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-[#17181A]/80 p-3 sm:p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                <Input
                  placeholder="20 mil"
                  value={stat.value}
                  onChange={(e) => {
                    const items = [...values.landing_stats];
                    items[i] = { ...stat, value: e.target.value };
                    set({ landing_stats: items });
                  }}
                />
                <Input
                  placeholder="Descrição do número"
                  value={stat.label}
                  onChange={(e) => {
                    const items = [...values.landing_stats];
                    items[i] = { ...stat, label: e.target.value };
                    set({ landing_stats: items });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => set({ landing_stats: values.landing_stats.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                landing_stats: [...values.landing_stats, { value: "", label: "" }],
              })
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar número
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <AssetUploadField
          label="Imagem de capa (hero)"
          description="Recomendado: 1920×1080 px, JPG ou PNG"
          value={values.landing_hero_image}
          onChange={(path) => set({ landing_hero_image: path })}
          webinarId={webinarId}
          assetType="hero"
          accept="image/jpeg,image/png,image/webp"
          previewType="image"
        />
        <AssetUploadField
          label="Vídeo promocional"
          description="MP4 ou WebM — preview do conteúdo da aula"
          value={values.landing_promo_video_url}
          onChange={(path) => set({ landing_promo_video_url: path })}
          webinarId={webinarId}
          assetType="promo"
          accept="video/mp4,video/webm,video/quicktime"
          previewType="video"
        />
      </div>

      <div className="space-y-2">
        <Label>Texto do botão de inscrição</Label>
        <Input
          value={values.landing_cta_text}
          onChange={(e) => set({ landing_cta_text: e.target.value })}
          placeholder="Garantir minha vaga"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Benefícios / O que vai conquistar</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                landing_benefits: [...values.landing_benefits, { title: "", description: "" }],
              })
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar
          </Button>
        </div>
        {values.landing_benefits.map((b, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-[#17181A]/80 p-3 sm:p-4"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="Título do benefício"
                value={b.title}
                onChange={(e) => {
                  const items = [...values.landing_benefits];
                  items[i] = { ...b, title: e.target.value };
                  set({ landing_benefits: items });
                }}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={b.description ?? ""}
                onChange={(e) => {
                  const items = [...values.landing_benefits];
                  items[i] = { ...b, description: e.target.value };
                  set({ landing_benefits: items });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  set({ landing_benefits: values.landing_benefits.filter((_, j) => j !== i) })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Conteúdo da aula (tópicos)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ landing_topics: [...values.landing_topics, ""] })}
          >
            <Plus className="mr-2 size-4" />
            Adicionar tópico
          </Button>
        </div>
        {values.landing_topics.map((topic, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Tópico ${i + 1}`}
              value={topic}
              onChange={(e) => {
                const items = [...values.landing_topics];
                items[i] = e.target.value;
                set({ landing_topics: items });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => set({ landing_topics: values.landing_topics.filter((_, j) => j !== i) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Para quem é este webinar?</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ landing_audience: [...values.landing_audience, ""] })}
          >
            <Plus className="mr-2 size-4" />
            Adicionar item
          </Button>
        </div>
        {values.landing_audience.map((line, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Público ${i + 1}`}
              value={line}
              onChange={(e) => {
                const items = [...values.landing_audience];
                items[i] = e.target.value;
                set({ landing_audience: items });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => set({ landing_audience: values.landing_audience.filter((_, j) => j !== i) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome do host / apresentador</Label>
          <Input value={values.host_name} onChange={(e) => set({ host_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Cargo / título</Label>
          <Input value={values.host_title} onChange={(e) => set({ host_title: e.target.value })} />
        </div>
      </div>

      <AssetUploadField
        label="Foto do host"
        description="JPG ou PNG — retrato ou quadrado, rosto centralizado"
        value={values.host_image_url}
        onChange={(path) => set({ host_image_url: path })}
        webinarId={webinarId}
        assetType="host"
        accept="image/jpeg,image/png,image/webp"
        previewType="image"
        previewLayout="avatar"
      />

      <div className="space-y-2">
        <Label>Bio do host</Label>
        <Textarea
          value={values.host_bio}
          onChange={(e) => set({ host_bio: e.target.value })}
          rows={4}
          placeholder="Especialista com X anos de experiência..."
        />
      </div>

      <div className="dojo-surface-card space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Rodapé da landing</Label>
            <p className="text-xs text-muted-foreground">
              Texto legal, copyright e links (política de privacidade, termos, redes sociais).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={values.landing_footer.enabled}
              onCheckedChange={(enabled) =>
                set({ landing_footer: { ...values.landing_footer, enabled } })
              }
            />
            <Label className="text-sm">Exibir rodapé</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto do rodapé</Label>
          <Textarea
            value={values.landing_footer.text}
            onChange={(e) =>
              set({ landing_footer: { ...values.landing_footer, text: e.target.value } })
            }
            rows={3}
            placeholder="© 2026 Sua Empresa. Todos os direitos reservados."
            disabled={!values.landing_footer.enabled}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Links do rodapé</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!values.landing_footer.enabled}
              onClick={() =>
                set({
                  landing_footer: {
                    ...values.landing_footer,
                    links: [...values.landing_footer.links, { label: "", url: "" }],
                  },
                })
              }
            >
              <Plus className="mr-2 size-4" />
              Adicionar link
            </Button>
          </div>

          {values.landing_footer.links.map((link, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-[#17181A]/80 p-3 sm:p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Rótulo (ex: Política de privacidade)"
                  value={link.label}
                  disabled={!values.landing_footer.enabled}
                  onChange={(e) => {
                    const links = [...values.landing_footer.links];
                    links[i] = { ...link, label: e.target.value };
                    set({ landing_footer: { ...values.landing_footer, links } });
                  }}
                />
                <Input
                  placeholder="https://..."
                  value={link.url}
                  disabled={!values.landing_footer.enabled}
                  onChange={(e) => {
                    const links = [...values.landing_footer.links];
                    links[i] = { ...link, url: e.target.value };
                    set({ landing_footer: { ...values.landing_footer, links } });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!values.landing_footer.enabled}
                  onClick={() =>
                    set({
                      landing_footer: {
                        ...values.landing_footer,
                        links: values.landing_footer.links.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewDraft && (
        <LandingPagePreview webinarId={webinarId} baseWebinar={previewBaseWebinar!} draft={previewDraft} />
      )}
    </div>
  );
}

export function landingFromWebinar(w: {
  landing_template?: string | null;
  landing_theme?: unknown;
  landing_stats?: unknown;
  landing_logo_url?: string | null;
  landing_hero_image?: string | null;
  landing_promo_video_url?: string | null;
  landing_benefits?: unknown;
  landing_topics?: unknown;
  landing_audience?: unknown;
  host_name?: string | null;
  host_title?: string | null;
  host_bio?: string | null;
  host_image_url?: string | null;
  landing_cta_text?: string | null;
  landing_footer?: unknown;
}): LandingFormValues {
  return {
    landing_template: parseLandingTemplate(w.landing_template),
    landing_theme: parseLandingTheme(w.landing_theme),
    landing_stats: parseLandingStats(w.landing_stats),
    landing_logo_url: w.landing_logo_url ?? "",
    landing_hero_image: w.landing_hero_image ?? "",
    landing_promo_video_url: w.landing_promo_video_url ?? "",
    landing_benefits: Array.isArray(w.landing_benefits)
      ? (w.landing_benefits as LandingBenefit[])
      : [],
    landing_topics: Array.isArray(w.landing_topics) ? w.landing_topics.map(String) : [],
    landing_audience: parseLandingAudience(w.landing_audience),
    host_name: w.host_name ?? "",
    host_title: w.host_title ?? "",
    host_bio: w.host_bio ?? "",
    host_image_url: w.host_image_url ?? "",
    landing_cta_text: w.landing_cta_text ?? "Garantir minha vaga",
    landing_footer: parseLandingFooter(w.landing_footer),
  };
}

export function landingToPayload(values: LandingFormValues) {
  return {
    landing_template: values.landing_template,
    landing_theme: values.landing_theme,
    landing_stats: values.landing_stats.filter((s) => s.value.trim() || s.label.trim()),
    landing_logo_url: values.landing_logo_url || null,
    landing_hero_image: values.landing_hero_image || null,
    landing_promo_video_url: values.landing_promo_video_url || null,
    landing_benefits: values.landing_benefits.filter((b) => b.title.trim()),
    landing_topics: values.landing_topics.filter((t) => t.trim()),
    landing_audience: values.landing_audience.filter((t) => t.trim()),
    host_name: values.host_name || null,
    host_title: values.host_title || null,
    host_bio: values.host_bio || null,
    host_image_url: values.host_image_url || null,
    landing_cta_text: values.landing_cta_text || "Garantir minha vaga",
    landing_footer: {
      enabled: values.landing_footer.enabled,
      text: values.landing_footer.text.trim(),
      links: values.landing_footer.links.filter((l) => l.label.trim() && l.url.trim()),
    },
  };
}

export function emptyLandingFormValues(): LandingFormValues {
  return {
    landing_template: "classic",
    landing_theme: { ...DEFAULT_LANDING_THEME },
    landing_stats: [...DEFAULT_LANDING_STATS],
    landing_logo_url: "",
    landing_hero_image: "",
    landing_promo_video_url: "",
    landing_benefits: [],
    landing_topics: [],
    landing_audience: [],
    host_name: "",
    host_title: "",
    host_bio: "",
    host_image_url: "",
    landing_cta_text: "Garantir minha vaga",
    landing_footer: { enabled: true, text: "", links: [] },
  };
}
