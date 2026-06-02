import type { Webinar, WebinarFormField } from "@/lib/supabase/database.types";
import { parseLandingTemplate } from "@/lib/webinar/landing";

import { LandingTemplateRenderer } from "./landing-templates";

interface WebinarLandingPageProps {
  webinar: Webinar;
  formFields: WebinarFormField[];
  mode: "register" | "waiting";
  onRegister?: (data: Record<string, string>) => Promise<void>;
  registerLoading?: boolean;
  /** Preview no admin — layout real sem modal automático */
  isPreview?: boolean;
}

export function WebinarLandingPage(props: WebinarLandingPageProps) {
  const templateId = parseLandingTemplate(props.webinar.landing_template);
  return <LandingTemplateRenderer templateId={templateId} {...props} isPreview={props.isPreview} />;
}
