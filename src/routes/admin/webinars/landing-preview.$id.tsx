import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { WebinarLandingPage } from "@/components/webinar/WebinarLandingPage";
import {
  PREVIEW_FORM_FIELDS,
  buildPreviewWebinar,
  loadLandingPreviewDraft,
} from "@/components/webinar/landing-templates/preview";
import { getWebinarAdmin } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/webinars/landing-preview/$id")({
  loader: ({ params }) => getWebinarAdmin({ data: { id: params.id } }),
  component: LandingPreviewPage,
});

function LandingPreviewPage() {
  const { webinar } = Route.useLoaderData();
  const { id } = Route.useParams();

  const previewWebinar = useMemo(() => {
    const draft = loadLandingPreviewDraft(id);
    if (!draft) return webinar;
    return buildPreviewWebinar(webinar, draft);
  }, [webinar, id]);

  return (
    <WebinarLandingPage
      webinar={previewWebinar}
      formFields={PREVIEW_FORM_FIELDS}
      mode="register"
      isPreview
    />
  );
}
