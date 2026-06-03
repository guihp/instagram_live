import type { Webinar, WebinarFormField } from "@/lib/supabase/database.types";
import type {
  LandingBenefit,
  LandingFooter,
  LandingStat,
  LandingTemplateId,
  LandingTheme,
} from "@/lib/webinar/landing";

export interface LandingTemplateProps {
  webinar: Webinar;
  formFields: WebinarFormField[];
  mode: "register" | "waiting";
  onRegister?: (data: Record<string, string>) => Promise<void>;
  registerLoading?: boolean;
  /** Admin inline preview — sem modal automático e CTAs não submetem */
  isPreview?: boolean;
}

export interface LandingViewModel {
  templateId: LandingTemplateId;
  theme: LandingTheme;
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  benefits: LandingBenefit[];
  topics: string[];
  audience: string[];
  stats: LandingStat[];
  footer: LandingFooter;
  showFooter: boolean;
  hasGroup: boolean;
  groupLink: string;
  logoUrl: string;
  heroImage: string | null;
  hostImage: string | null;
  hostImageFallback: string | null;
  promoVideoUrl: string | null;
  heroMedia: "video" | "image" | "none";
  scheduleSummary: string;
  nextSessionLabel: string;
  timeLeft: number;
  isLive: boolean;
  hostName: string;
  hostTitle: string;
  hostBio: string;
}
