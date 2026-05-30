import { Plus, Trash2 } from "lucide-react";

import { AssetUploadField } from "@/components/admin/AssetUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingBenefit, LandingFooter } from "@/lib/webinar/landing";
import { parseLandingFooter } from "@/lib/webinar/landing";

export interface LandingFormValues {
  landing_hero_image: string;
  landing_promo_video_url: string;
  landing_benefits: LandingBenefit[];
  landing_topics: string[];
  landing_audience: string;
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
}

export function LandingPageEditor({ values, onChange, webinarId }: LandingPageEditorProps) {
  const set = (patch: Partial<LandingFormValues>) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Configure a landing page que o participante vê antes e durante a espera da live.
        Imagens vão para <code>webinar-assets</code>; vídeos promocionais para <code>webinar-videos</code>.
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
          <Card key={i}>
            <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_1fr_auto]">
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
            </CardContent>
          </Card>
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

      <div className="space-y-2">
        <Label>Para quem é este webinar?</Label>
        <Textarea
          value={values.landing_audience}
          onChange={(e) => set({ landing_audience: e.target.value })}
          placeholder="Empreendedores que querem escalar vendas online..."
          rows={3}
        />
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

      <div className="space-y-4 rounded-xl border bg-card/50 p-5">
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
            <Card key={i}>
              <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_1fr_auto]">
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function landingFromWebinar(w: {
  landing_hero_image?: string | null;
  landing_promo_video_url?: string | null;
  landing_benefits?: unknown;
  landing_topics?: unknown;
  landing_audience?: string | null;
  host_name?: string | null;
  host_title?: string | null;
  host_bio?: string | null;
  host_image_url?: string | null;
  landing_cta_text?: string | null;
  landing_footer?: unknown;
}): LandingFormValues {
  return {
    landing_hero_image: w.landing_hero_image ?? "",
    landing_promo_video_url: w.landing_promo_video_url ?? "",
    landing_benefits: Array.isArray(w.landing_benefits)
      ? (w.landing_benefits as LandingBenefit[])
      : [],
    landing_topics: Array.isArray(w.landing_topics) ? w.landing_topics.map(String) : [],
    landing_audience: w.landing_audience ?? "",
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
    landing_hero_image: values.landing_hero_image || null,
    landing_promo_video_url: values.landing_promo_video_url || null,
    landing_benefits: values.landing_benefits.filter((b) => b.title.trim()),
    landing_topics: values.landing_topics.filter((t) => t.trim()),
    landing_audience: values.landing_audience || null,
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
