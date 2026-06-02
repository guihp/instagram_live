import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Radio, ShoppingCart, Sparkles, Users } from "lucide-react";

import { trackLiveAttendance, trackTriggerClick } from "@/lib/api/webinar.functions";

import { SyncedVideoPlayer } from "@/components/webinar/SyncedVideoPlayer";
import { WebinarChat, type WebinarChatHandle } from "@/components/webinar/WebinarChat";
import type {
  Webinar,
  WebinarChatMessage,
  WebinarTrigger,
} from "@/lib/supabase/database.types";
import { resolveAiAssistantName } from "@/lib/webinar/assistant-name";
import { isTriggerVisible } from "@/lib/webinar/triggers";
import { toScheduleConfig } from "@/lib/webinar/playback";
import { isPostLiveHoldActive } from "@/lib/webinar/post-live";
import { PostLiveOverlay } from "@/components/webinar/PostLiveOverlay";
import { TriggerRevealSparkles } from "@/components/webinar/TriggerRevealSparkles";
import { parseBlockedWords } from "@/lib/webinar/chat-moderation";
import { cn } from "@/lib/utils";

const LEAD_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  nome: "Nome",
  phone: "Telefone",
  telefone: "Telefone",
  email: "E-mail",
};

function LeadRegistrationCard({
  entries,
  className,
}: {
  entries: [string, string][];
  className?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        "shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm",
        className,
      )}
    >
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
        <Users className="size-3.5 text-webinar-accent" aria-hidden />
        Sua inscrição
      </p>
      <dl className="grid gap-2 text-sm">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5"
          >
            <dt className="shrink-0 capitalize text-white/50">
              {LEAD_FIELD_LABELS[key.toLowerCase()] ?? key}
            </dt>
            <dd className="min-w-0 truncate text-right font-medium text-white/90">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

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
  const [videoHeight, setVideoHeight] = useState<number | null>(null);
  const attendanceTracked = useRef(false);
  const videoShellRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<WebinarChatHandle>(null);

  const durationSeconds = webinar.video_duration_seconds;
  const assistantName = resolveAiAssistantName(webinar.ai_assistant_name, webinar.host_name);
  const scheduleConfig = toScheduleConfig(webinar);
  const holdMinutes = webinar.post_live_hold_minutes ?? 60;
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(nowTick), [nowTick]);
  const postLiveActive = isPostLiveHoldActive(scheduleConfig, durationSeconds, holdMinutes, now);

  const checkoutTrigger = useMemo(
    () => triggers.find((t) => t.trigger_type === "cart") ?? null,
    [triggers],
  );

  const chatParticipantEnabled = webinar.chat_participant_enabled !== false;
  const chatBlockedWords = parseBlockedWords(webinar.chat_blocked_words);

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

  useEffect(() => {
    const node = videoShellRef.current;
    if (!node) return;

    const updateHeight = () => {
      setVideoHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

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

  const authorName =
    (leadData.name as string) ||
    (leadData.nome as string) ||
    Object.values(leadData).find((v) => typeof v === "string" && v.trim()) ||
    "Participante";

  const leadEntries = Object.entries(leadData).filter(([, value]) => String(value ?? "").trim());

  const chatHeightStyle =
    videoHeight && videoHeight > 0
      ? ({ height: `${Math.round(videoHeight)}px` } as const)
      : undefined;

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
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            <div
              ref={videoShellRef}
              className="relative overflow-hidden rounded-2xl shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] ring-1 ring-white/10 lg:rounded-3xl"
            >
              <SyncedVideoPlayer
                scheduledAt={webinar.scheduled_at}
                scheduleRecurrence={webinar.schedule_recurrence}
                scheduleWeekday={webinar.schedule_weekday}
                videoType={webinar.video_type}
                videoUrl={webinar.video_url}
                durationSeconds={durationSeconds}
                displayMode={webinar.display_mode}
                viewerCountConfig={{
                  start: webinar.viewer_count_start,
                  mid: webinar.viewer_count_mid,
                  end: webinar.viewer_count_end,
                }}
                freezeAtEnd={postLiveActive}
                onTimeUpdate={handleTimeUpdate}
                className="rounded-none"
              />
              {postLiveActive && (
                <PostLiveOverlay
                  title={webinar.post_live_title?.trim() || "Webinar encerrado"}
                  description={
                    webinar.post_live_description?.trim() ||
                    "Obrigado por acompanhar ao vivo. Garanta sua vaga enquanto a oferta está disponível."
                  }
                  checkoutTrigger={checkoutTrigger}
                  onCheckoutClick={handleTriggerClick}
                />
              )}
            </div>

            {visibleTriggers.length > 0 && !postLiveActive && (
              <div className="relative flex animate-in fade-in slide-in-from-top-2 flex-col gap-3 overflow-visible duration-300">
                <TriggerRevealSparkles
                  webinarId={webinar.id}
                  visibleTriggerIds={visibleTriggers.map((t) => t.id)}
                />
                {visibleTriggers.some((t) => t.trigger_type === "cart") && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    <Sparkles className="size-3.5" />
                    Oferta especial · tempo limitado
                  </span>
                )}

                <div className="flex flex-col gap-2">
                  {visibleTriggers.map((trigger) => {
                    const isCart = trigger.trigger_type === "cart";

                    if (isCart) {
                      return (
                        <button
                          key={trigger.id}
                          type="button"
                          onClick={() => handleTriggerClick(trigger)}
                          className="group/offer relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 px-5 py-4 text-white shadow-[0_12px_40px_-12px_rgba(16,185,129,0.55)] transition-transform hover:scale-[1.01] active:scale-[0.99] sm:px-7 sm:py-5"
                        >
                          <span
                            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover/offer:opacity-100"
                            aria-hidden
                          />
                          <span className="relative flex items-center justify-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-12">
                              <ShoppingCart className="size-5 sm:size-6" strokeWidth={2.25} />
                            </span>
                            <span className="text-left">
                              <span className="block text-lg font-extrabold leading-tight sm:text-xl">
                                {trigger.label}
                              </span>
                              <span className="mt-0.5 block text-xs font-medium text-emerald-50/90 sm:text-sm">
                                Clique para garantir sua vaga
                              </span>
                            </span>
                            {trigger.action_url ? (
                              <ExternalLink className="size-5 shrink-0 opacity-90" />
                            ) : null}
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={trigger.id}
                        type="button"
                        onClick={() => handleTriggerClick(trigger)}
                        className="group/cta relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#5a8fa0] via-[#73a5b6] to-[#8ec4d4] px-6 py-5 text-white shadow-[0_16px_48px_-14px_rgba(115,165,182,0.65)] ring-1 ring-white/20 transition-transform hover:scale-[1.01] hover:shadow-[0_20px_56px_-12px_rgba(115,165,182,0.75)] active:scale-[0.99] sm:px-8 sm:py-6"
                      >
                        <span
                          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity group-hover/cta:opacity-100"
                          aria-hidden
                        />
                        <span className="relative flex items-center justify-center gap-3">
                          <span className="text-lg font-extrabold tracking-tight sm:text-xl">
                            {trigger.label}
                          </span>
                          {trigger.action_url ? (
                            <ExternalLink className="size-5 shrink-0 opacity-95 sm:size-6" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <LeadRegistrationCard entries={leadEntries} className="hidden lg:block" />
          </div>

          <aside className="flex min-h-0 flex-col gap-3">
            <WebinarChat
              ref={chatRef}
              webinarId={webinar.id}
              scriptedMessages={chatMessages}
              currentVideoTime={currentTime}
              leadId={leadId}
              authorName={authorName}
              assistantName={assistantName}
              participantEnabled={chatParticipantEnabled}
              blockedWords={chatBlockedWords}
              className="h-[min(360px,45vh)] min-h-[280px] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5 lg:min-h-0"
              style={chatHeightStyle}
            />

            <LeadRegistrationCard entries={leadEntries} className="lg:hidden" />
          </aside>
        </div>
      </main>
    </div>
  );
}
