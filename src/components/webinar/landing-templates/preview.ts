import type { LandingFormValues } from "@/components/admin/LandingPageEditor";
import type { Webinar, WebinarFormField } from "@/lib/supabase/database.types";
import type { ScheduleRecurrence } from "@/lib/supabase/database.types";

export const LANDING_PREVIEW_STORAGE_KEY = "dojo-landing-preview";

export interface LandingPreviewDraft {
  landing: LandingFormValues;
  title: string;
  description: string;
  waiting_title: string;
  waiting_description: string;
  slug: string;
  scheduled_at: string;
  schedule_recurrence: ScheduleRecurrence;
  schedule_weekday: number | null;
  group_link: string;
}

export function saveLandingPreviewDraft(webinarId: string, draft: LandingPreviewDraft) {
  sessionStorage.setItem(`${LANDING_PREVIEW_STORAGE_KEY}:${webinarId}`, JSON.stringify(draft));
}

export function loadLandingPreviewDraft(webinarId: string): LandingPreviewDraft | null {
  try {
    const raw = sessionStorage.getItem(`${LANDING_PREVIEW_STORAGE_KEY}:${webinarId}`);
    if (!raw) return null;
    return JSON.parse(raw) as LandingPreviewDraft;
  } catch {
    return null;
  }
}

export function buildPreviewWebinar(
  base: Webinar,
  draft: LandingPreviewDraft,
): Webinar {
  const { landing } = draft;
  return {
    ...base,
    title: draft.title || base.title,
    description: draft.description || base.description,
    waiting_title: draft.waiting_title || base.waiting_title,
    waiting_description: draft.waiting_description || base.waiting_description,
    slug: draft.slug || base.slug,
    scheduled_at: draft.scheduled_at || base.scheduled_at,
    schedule_recurrence: draft.schedule_recurrence ?? base.schedule_recurrence,
    schedule_weekday: draft.schedule_weekday ?? base.schedule_weekday,
    group_link: draft.group_link || base.group_link,
    landing_template: landing.landing_template,
    landing_theme: landing.landing_theme,
    landing_stats: landing.landing_stats,
    landing_logo_url: landing.landing_logo_url || null,
    landing_hero_image: landing.landing_hero_image || null,
    landing_promo_video_url: landing.landing_promo_video_url || null,
    landing_benefits: landing.landing_benefits,
    landing_topics: landing.landing_topics,
    landing_audience: landing.landing_audience,
    host_name: landing.host_name || null,
    host_title: landing.host_title || null,
    host_bio: landing.host_bio || null,
    host_image_url: landing.host_image_url || null,
    landing_cta_text: landing.landing_cta_text || null,
    landing_footer: landing.landing_footer,
  };
}

export const PREVIEW_FORM_FIELDS: WebinarFormField[] = [
  {
    id: "preview-name",
    webinar_id: "preview",
    field_key: "name",
    label: "Nome completo",
    field_type: "text",
    required: true,
    enabled: true,
    sort_order: 0,
    phone_region: null,
  },
  {
    id: "preview-email",
    webinar_id: "preview",
    field_key: "email",
    label: "E-mail",
    field_type: "email",
    required: true,
    enabled: true,
    sort_order: 1,
    phone_region: null,
  },
  {
    id: "preview-phone",
    webinar_id: "preview",
    field_key: "phone",
    label: "WhatsApp",
    field_type: "tel",
    required: true,
    enabled: true,
    sort_order: 2,
    phone_region: "BR",
  },
];
