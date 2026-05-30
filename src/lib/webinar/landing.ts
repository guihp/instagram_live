import { getStoragePublicUrl } from "./storage-utils";

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

export const DEFAULT_LANDING_FOOTER: LandingFooter = {
  enabled: true,
  text: "",
  links: [],
};

export interface WebinarLandingContent {
  landing_hero_image: string | null;
  landing_promo_video_url: string | null;
  landing_benefits: LandingBenefit[];
  landing_topics: string[];
  landing_audience: string | null;
  host_name: string | null;
  host_title: string | null;
  host_bio: string | null;
  host_image_url: string | null;
  landing_cta_text: string | null;
  landing_footer: LandingFooter | null;
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
