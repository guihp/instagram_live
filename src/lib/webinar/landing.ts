import { getStoragePublicUrl } from "./storage-utils";

export type LandingTemplateId = "classic" | "sidebar" | "centered";

export type LandingThemeVariant = "a" | "b";
export type LandingHeroMedia = "video" | "image" | "none";

export interface LandingTheme {
  variant: LandingThemeVariant;
  accent: string;
  heroMedia: LandingHeroMedia;
}

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingBenefit {
  title: string;
  description?: string;
}

export interface LandingFooterLink {
  label: string;
  url: string;
}

export interface LandingFooter {
  enabled: boolean;
  text: string;
  links: LandingFooterLink[];
}

export const LANDING_TEMPLATE_OPTIONS: {
  id: LandingTemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "Clássico",
    description: "Hero em duas colunas com vídeo ao lado e cards em grid.",
  },
  {
    id: "sidebar",
    label: "Lateral",
    description: "Hero amplo com card de inscrição fixo na lateral.",
  },
  {
    id: "centered",
    label: "Centralizado",
    description: "Hero central, faixa de números e benefícios com ícones.",
  },
];

export const DEFAULT_LANDING_THEME: LandingTheme = {
  variant: "a",
  accent: "#2E6BFF",
  heroMedia: "video",
};

export const DEFAULT_LANDING_STATS: LandingStat[] = [
  { value: "20 mil", label: "pessoas e empresas já automatizadas" },
  { value: "+20 mil", label: "fluxos construídos em produção" },
  { value: "20 mil", label: "horas de trabalho manual economizadas" },
];

export const DEFAULT_LANDING_FOOTER: LandingFooter = {
  enabled: true,
  text: "",
  links: [],
};

export const ACCENT_PRESETS = ["#2E6BFF", "#16A571", "#7A5AF0", "#F0682E", "#73a5b6"] as const;

/** Guia para upload da logo na topbar das landings */
export const LANDING_LOGO_SPECS = {
  recommendedWidth: 240,
  recommendedHeight: 48,
  ratioLabel: "5:1 (horizontal)",
  displayHeightPx: 30,
  maxDisplayWidthPx: 160,
  formats: "PNG ou WebP com fundo transparente",
} as const;

export interface WebinarLandingContent {
  landing_template: LandingTemplateId;
  landing_theme: LandingTheme | null;
  landing_stats: LandingStat[];
  landing_logo_url: string | null;
  landing_hero_image: string | null;
  landing_promo_video_url: string | null;
  landing_benefits: LandingBenefit[];
  landing_topics: string[];
  landing_audience: string[];
  host_name: string | null;
  host_title: string | null;
  host_bio: string | null;
  host_image_url: string | null;
  landing_cta_text: string | null;
  landing_footer: LandingFooter | null;
}

export function parseLandingTemplate(raw: unknown): LandingTemplateId {
  if (raw === "sidebar" || raw === "centered" || raw === "classic") return raw;
  return "classic";
}

export function parseLandingTheme(raw: unknown): LandingTheme {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LANDING_THEME };
  const data = raw as Partial<LandingTheme>;
  return {
    variant: data.variant === "b" ? "b" : "a",
    accent: typeof data.accent === "string" && data.accent.trim() ? data.accent.trim() : DEFAULT_LANDING_THEME.accent,
    heroMedia:
      data.heroMedia === "image" || data.heroMedia === "none" || data.heroMedia === "video"
        ? data.heroMedia
        : DEFAULT_LANDING_THEME.heroMedia,
  };
}

export function parseLandingStats(raw: unknown): LandingStat[] {
  if (!Array.isArray(raw)) return [...DEFAULT_LANDING_STATS];
  const items = raw
    .filter((item): item is LandingStat => typeof item === "object" && item !== null)
    .map((item) => ({
      value: String((item as LandingStat).value ?? "").trim(),
      label: String((item as LandingStat).label ?? "").trim(),
    }))
    .filter((item) => item.value || item.label);
  return items.length > 0 ? items : [...DEFAULT_LANDING_STATS];
}

export function parseLandingBenefits(raw: unknown): LandingBenefit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is LandingBenefit => typeof item === "object" && item !== null && "title" in item)
    .map((item) => ({
      title: String(item.title),
      description: item.description ? String(item.description) : undefined,
    }));
}

export function parseLandingTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

export function parseLandingAudience(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseLandingFooter(raw: unknown): LandingFooter {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LANDING_FOOTER };

  const data = raw as Partial<LandingFooter>;
  const links = Array.isArray(data.links)
    ? data.links
        .filter((item): item is LandingFooterLink => typeof item === "object" && item !== null && "label" in item)
        .map((item) => ({
          label: String(item.label ?? ""),
          url: String(item.url ?? ""),
        }))
        .filter((item) => item.label.trim() && item.url.trim())
    : [];

  return {
    enabled: data.enabled !== false,
    text: typeof data.text === "string" ? data.text : "",
    links,
  };
}

export function resolveHeroMedia(
  theme: LandingTheme,
  hasVideo: boolean,
  hasImage: boolean,
): LandingHeroMedia {
  if (theme.heroMedia === "none") return "none";
  if (theme.heroMedia === "image" && hasImage) return "image";
  if (theme.heroMedia === "video" && hasVideo) return "video";
  if (hasVideo) return "video";
  if (hasImage) return "image";
  return "none";
}

export function getAssetPublicUrl(path: string | null): string | null {
  return getStoragePublicUrl("webinar-assets", path);
}

export function getPromoVideoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  if (path.includes("/promo/")) {
    return getStoragePublicUrl("webinar-videos", path);
  }

  return getStoragePublicUrl("webinar-assets", path);
}

export interface AssetImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

/** URL otimizada via Supabase Image Transformations (resize + qualidade). */
export function getAssetImageUrl(
  path: string | null,
  options: AssetImageOptions = {},
): string | null {
  const publicUrl = getAssetPublicUrl(path);
  if (!publicUrl) return null;

  const { width, height, quality = 85, resize = "cover" } = options;
  if (!width && !height) return publicUrl;

  const objectMarker = "/storage/v1/object/public/";
  if (!publicUrl.includes(objectMarker)) return publicUrl;

  const renderUrl = publicUrl.replace(objectMarker, "/storage/v1/render/image/public/");
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("resize", resize);
  params.set("quality", String(quality));

  return `${renderUrl}?${params.toString()}`;
}

export { getStoragePublicUrl } from "./storage-utils";
