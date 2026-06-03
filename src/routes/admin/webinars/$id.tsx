import { createFileRoute } from "@tanstack/react-router";

import { WebinarEditHeader } from "@/components/admin/WebinarEditHeader";
import { WebinarEditor } from "@/components/admin/WebinarEditor";
import { landingFromWebinar } from "@/components/admin/LandingPageEditor";
import { getWebinarAdmin } from "@/lib/api/admin.functions";
import { secondsToMinutes } from "@/lib/webinar/video-utils";

export const Route = createFileRoute("/admin/webinars/$id")({
  loader: ({ params }) => getWebinarAdmin({ data: { id: params.id } }),
  component: EditWebinarPage,
});

function EditWebinarPage() {
  const { webinar, formFields, chatMessages, triggers, leads, transcription } =
    Route.useLoaderData();
  const { id } = Route.useParams();

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <WebinarEditHeader title={webinar.title} slug={webinar.slug} status={webinar.status} />

      <WebinarEditor
        webinarId={id}
        sourceWebinar={webinar}
        hideShareLink
        transcriptionStatus={transcription?.status}
        insights={{ leads, transcription }}
        initial={{
          slug: webinar.slug,
          title: webinar.title,
          description: webinar.description ?? "",
          scheduled_at: new Date(webinar.scheduled_at).toISOString().slice(0, 16),
          schedule_recurrence: webinar.schedule_recurrence ?? "once",
          schedule_weekday: webinar.schedule_weekday,
          status: webinar.status,
          video_type: webinar.video_type,
          video_url: webinar.video_url ?? "",
          video_duration_seconds: webinar.video_duration_seconds,
          group_link: webinar.group_link ?? "",
          display_mode: webinar.display_mode,
          waiting_title: webinar.waiting_title ?? "",
          waiting_description: webinar.waiting_description ?? "",
          ai_context: webinar.ai_context ?? "",
          ai_assistant_name: webinar.ai_assistant_name ?? "",
          formFields: formFields.map((f: any) => ({
            field_key: f.field_key,
            label: f.label,
            field_type: f.field_type,
            required: f.required,
            enabled: f.enabled,
            sort_order: f.sort_order,
            phone_region: f.field_type === "tel" ? (f.phone_region ?? "BR") : null,
            isDefault: ["name", "phone", "email"].includes(f.field_key),
          })),
          chatMessages: chatMessages.map((m: any) => ({
            author_name: m.author_name,
            message: m.message,
            appear_at_minutes: secondsToMinutes(Number(m.appear_at_seconds)),
            sort_order: m.sort_order,
          })),
          triggers: triggers.map((t: any) => {
            const seconds = Number(t.appear_at_seconds);
            const legacyCartEnd =
              t.trigger_type === "cart" && !t.appear_mode && seconds === 0;
            const appearMode =
              t.appear_mode === "before_end" || legacyCartEnd ? "before_end" : "at_minute";
            const minutes = secondsToMinutes(seconds);

            return {
              trigger_type: t.trigger_type,
              label: t.label,
              action_url: t.action_url ?? "",
              appear_mode: appearMode as "at_minute" | "before_end",
              appear_at_minutes: legacyCartEnd ? 2 : minutes,
            };
          }),
          ...landingFromWebinar(webinar),
        }}
      />
    </div>
  );
}
