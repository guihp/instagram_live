import { useEffect, useState } from "react";

import type { Webinar } from "@/lib/supabase/database.types";
import { formatBrasiliaDateTimeLong } from "@/lib/webinar/datetime";
import defaultLandingLogo from "@/assets/dojo-logo-branca.png";
import {
  getAssetImageUrl,
  getAssetPublicUrl,
  getPromoVideoUrl,
  parseLandingAudience,
  parseLandingBenefits,
  parseLandingFooter,
  parseLandingStats,
  parseLandingTemplate,
  parseLandingTheme,
  parseLandingTopics,
  resolveHeroMedia,
} from "@/lib/webinar/landing";
import {
  describeSchedule,
  getTimeUntilLiveFromWebinar,
  toScheduleConfig,
} from "@/lib/webinar/playback";
import { getSessionState } from "@/lib/webinar/schedule";

import type { LandingViewModel } from "./types";

export function useLandingModel(webinar: Webinar, mode: "register" | "waiting"): LandingViewModel {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilLiveFromWebinar(webinar));

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeUntilLiveFromWebinar(webinar));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [webinar]);

  const config = toScheduleConfig(webinar);
  const { nextSessionStart } = getSessionState(config);
  const theme = parseLandingTheme(webinar.landing_theme);
  const promoVideoUrl = getPromoVideoUrl(webinar.landing_promo_video_url);
  const customLogo = getAssetPublicUrl(webinar.landing_logo_url);
  const logoUrl = customLogo ?? defaultLandingLogo;
  const heroImage = getAssetPublicUrl(webinar.landing_hero_image);
  const hasVideo = Boolean(promoVideoUrl);
  const hasImage = Boolean(heroImage);
  const footer = parseLandingFooter(webinar.landing_footer);

  return {
    templateId: parseLandingTemplate(webinar.landing_template),
    theme,
    heroTitle: mode === "waiting" ? (webinar.waiting_title ?? webinar.title) : webinar.title,
    heroSubtitle:
      mode === "waiting"
        ? (webinar.waiting_description ??
          webinar.description ??
          "Prepare-se: em instantes você terá acesso à aula ao vivo.")
        : (webinar.description ?? "Aula ao vivo gratuita, 100% online. Vagas limitadas."),
    ctaText: webinar.landing_cta_text ?? "Garantir minha vaga grátis",
    benefits: parseLandingBenefits(webinar.landing_benefits),
    topics: parseLandingTopics(webinar.landing_topics),
    audience: parseLandingAudience(webinar.landing_audience),
    stats: parseLandingStats(webinar.landing_stats),
    footer,
    showFooter: footer.enabled && (footer.text.trim().length > 0 || footer.links.length > 0),
    hasGroup: Boolean(webinar.group_link?.trim()),
    groupLink: webinar.group_link?.trim() ?? "",
    logoUrl,
    heroImage,
    hostImage: getAssetImageUrl(webinar.host_image_url, { width: 400, height: 400, quality: 90 }),
    hostImageFallback: getAssetPublicUrl(webinar.host_image_url),
    promoVideoUrl,
    heroMedia: resolveHeroMedia(theme, hasVideo, hasImage),
    scheduleSummary: describeSchedule(config),
    nextSessionLabel: `${formatBrasiliaDateTimeLong(nextSessionStart)} · Brasília`,
    timeLeft,
    isLive: timeLeft <= 0,
    hostName: webinar.host_name ?? "",
    hostTitle: webinar.host_title ?? "",
    hostBio: webinar.host_bio ?? "",
  };
}
