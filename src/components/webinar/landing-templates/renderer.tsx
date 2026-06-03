import type { LandingTemplateId } from "@/lib/webinar/landing";

import { LandingCentered } from "./centered/LandingCentered";
import { LandingClassic } from "./classic/LandingClassic";
import { LandingSidebar } from "./sidebar/LandingSidebar";
import type { LandingTemplateProps } from "./types";

const TEMPLATES = {
  classic: LandingClassic,
  sidebar: LandingSidebar,
  centered: LandingCentered,
} as const;

export function LandingTemplateRenderer({
  templateId,
  ...props
}: LandingTemplateProps & { templateId: LandingTemplateId }) {
  const Component = TEMPLATES[templateId] ?? LandingClassic;
  return <Component {...props} />;
}
