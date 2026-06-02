import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Radio, ShoppingCart, Sparkles, Users } from "lucide-react";

import { trackLiveAttendance, trackTriggerClick } from "@/lib/api/webinar.functions";

import { SyncedVideoPlayer } from "@/components/webinar/SyncedVideoPlayer";
import { WebinarChat } from "@/components/webinar/WebinarChat";
import { Button } from "@/components/ui/button";
import type {
  Webinar,
  WebinarChatMessage,
  WebinarTrigger,
} from "@/lib/supabase/database.types";
import { resolveAiAssistantName } from "@/lib/webinar/assistant-name";
import { isTriggerVisible } from "@/lib/webinar/triggers";

interface LiveRoomProps {
  webinar: Webinar;
  chatMessages: WebinarChatMessage[];
  triggers: WebinarTrigger[];
  leadData: Record<string, string>;
  leadId?: string;
}

export function LiveRoom({
  webinar,
  chatMessages,
  triggers,
  leadData,
  leadId,
}: LiveRoomProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const attendanceTracked = useRef(false);

  const durationSeconds = webinar.video_duration_seconds;
  const assistantName = resolveAiAssistantName(webinar.ai_assistant_name, webinar.host_name);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    if (!leadId || attendanceTracked.current) return;
    attendanceTracked.current = true;
    void trackLiveAttendance({ data: { webinarId: webinar.id, leadId } }).catch(() => {
      attendanceTracked.current = false;
    });
  }, [leadId, webinar.id]);

  const handleTriggerClick = (trigger: WebinarTrigger) => {
    if (leadId) {
      void trackTriggerClick({
        data: { webinarId: webinar.id, leadId, triggerId: trigger.id },
      });
    }
    if (trigger.action_url) {
      window.open(trigger.action_url, "_blank", "noopener,noreferrer");
    }
  };

  const visibleTriggers = useMemo(
    () =>
      triggers.filter((t) =>
        isTriggerVisible(
          {
            appear_at_seconds: t.appear_at_seconds,
            appear_mode: t.appear_mode,
            trigger_type: t.trigger_type,
          },
          currentTime,
          durationSeconds,
        ),
      ),
    [triggers, currentTime, durationSeconds],
  );

  const cartTriggers = visibleTriggers.filter((t) => t.trigger_type === "cart");
  const buttonTriggers = visibleTriggers.filter((t) => t.trigger_type !== "cart");

  const authorName =
    (leadData.name as string) ||
    (leadData.nome as string) ||
    Object.values(leadData).find((v) => typeof v === "string" && v.trim()) ||
    "Participante";

  const leadEntries = Object.entries(leadData).filter(([, value]) => String(value ?? "").trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-webinar-ink via-webinar-ink to-webinar-surface">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-webinar-ink/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 sm:px-3">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-red-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 sm:text-xs">
                Ao vivo
              </span>
            </div>

            <div className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden />

            <div className="min-w-0">
              <p className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-white/45 sm:block">
                Transmissão
              </p>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg lg:text-xl">
                {webinar.title}
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-white/50 md:flex">
            <Radio className="size-3.5 text-webinar-accent" aria-hidden />
            <span>Chat com {assistantName}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] ring-1 ring-white/10 lg:rounded-3xl">
              <SyncedVideoPlayer
                scheduledAt={webinar.scheduled_at}
                scheduleRecurrence={webinar.schedule_recurrence}
                scheduleWeekday={webinar.schedule_weekday}
                videoType={webinar.video_type}
                videoUrl={webinar.video_url}
                durationSeconds={durationSeconds}
                displayMode={webinar.display_mode}
                onTimeUpdate={handleTimeUpdate}
                className="rounded-none"
              />

              {cartTriggers.length > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6">
                  <div className="pointer-events-auto mx-auto flex max-w-lg animate-in fade-in slide-in-from-bottom-4 flex-col gap-2 rounded-2xl border border-white/15 bg-webinar-ink/95 p-4 shadow-2xl backdrop-blur-md duration-500">
                    <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                      <Sparkles className="size-3.5" />
                      Oferta especial
                    </p>
                    {cartTriggers.map((trigger) => (
                      <Button
                        key={trigger.id}
                        size="lg"
                        className="h-12 w-full gap-2 bg-webinar-accent text-base font-semibold hover:bg-webinar-accent/90"
                        onClick={() => handleTriggerClick(trigger)}
                      >
                        <ShoppingCart className="size-5" />
                        {trigger.label}
                        {trigger.action_url ? <ExternalLink className="size-4 opacity-80" /> : null}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {buttonTriggers.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5">
                {buttonTriggers.map((trigger) => (
                  <Button
                    key={trigger.id}
                    size="lg"
                    className="gap-2 bg-webinar-ink text-white hover:bg-webinar-ink/90"
                    onClick={() => handleTriggerClick(trigger)}
                  >
                    {trigger.label}
                    {trigger.action_url ? <ExternalLink className="size-4 opacity-80" /> : null}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <aside className="flex min-h-[420px] flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.5rem)] lg:max-h-[calc(100vh-5.5rem)]">
            <WebinarChat
              webinarId={webinar.id}
              scriptedMessages={chatMessages}
              currentVideoTime={currentTime}
              leadId={leadId}
              authorName={authorName}
              assistantName={assistantName}
              className="min-h-0 flex-1 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
            />

            {leadEntries.length > 0 && (
              <div className="shrink-0 rounded-2xl border border-border/60 bg-white/95 p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="size-3.5" />
                  Sua inscrição
                </p>
                <dl className="grid gap-2 text-sm">
                  {leadEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <dt className="capitalize text-muted-foreground">{key}</dt>
                      <dd className="truncate font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
