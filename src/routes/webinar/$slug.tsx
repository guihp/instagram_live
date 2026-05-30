import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { LiveRoom } from "@/components/webinar/LiveRoom";
import { WebinarLandingPage } from "@/components/webinar/WebinarLandingPage";
import { getWebinarBySlug, registerLead } from "@/lib/api/webinar.functions";
import {
  getOrCreateSessionId,
  getStoredLead,
  saveStoredLead,
} from "@/lib/webinar/lead-storage";
import { isWebinarLiveFromWebinar } from "@/lib/webinar/playback";

export const Route = createFileRoute("/webinar/$slug")({
  loader: async ({ params }) => {
    return getWebinarBySlug({ data: { slug: params.slug } });
  },
  component: WebinarPage,
});

type Step = "form" | "waiting" | "live";

function WebinarPage() {
  const { webinar, formFields, chatMessages, triggers } = Route.useLoaderData();
  const search = Route.useSearch() as Record<string, string | undefined>;

  const [step, setStep] = useState<Step>("form");
  const [leadData, setLeadData] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const checkLive = useCallback(() => isWebinarLiveFromWebinar(webinar), [webinar]);

  useEffect(() => {
    const stored = getStoredLead(webinar.id);
    if (stored) {
      setLeadData(stored.data);
      setLeadId(stored.leadId);
      setStep(checkLive() ? "live" : "waiting");
    }
  }, [webinar.id, checkLive]);

  useEffect(() => {
    if (step === "waiting" && checkLive()) {
      setStep("live");
    }
    const interval = setInterval(() => {
      if (step === "waiting" && checkLive()) {
        setStep("live");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, checkLive]);

  const handleRegister = async (data: Record<string, string>) => {
    setLoading(true);
    try {
      const sessionId = getOrCreateSessionId();
      const result = await registerLead({
        data: {
          webinarId: webinar.id,
          data,
          sessionId,
          utmSource: search.utm_source,
          utmMedium: search.utm_medium,
          utmCampaign: search.utm_campaign,
        },
      });

      saveStoredLead({
        leadId: result.leadId,
        webinarId: webinar.id,
        sessionId,
        data,
        registeredAt: new Date().toISOString(),
      });

      setLeadData(data);
      setLeadId(result.leadId);
      setStep(checkLive() ? "live" : "waiting");
      toast.success("Inscrição confirmada!");
    } catch {
      toast.error("Erro ao registrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "form") {
    return (
      <WebinarLandingPage
        webinar={webinar}
        formFields={formFields}
        mode="register"
        onRegister={handleRegister}
        registerLoading={loading}
      />
    );
  }

  if (step === "waiting") {
    return (
      <WebinarLandingPage webinar={webinar} formFields={formFields} mode="waiting" />
    );
  }

  return (
    <LiveRoom
      webinar={webinar}
      chatMessages={chatMessages}
      triggers={triggers}
      leadData={leadData}
      leadId={leadId}
    />
  );
}
