import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { previewChatReply } from "@/lib/api/admin.functions";
import { resolveAiAssistantName } from "@/lib/webinar/assistant-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getVideoPublicUrl } from "@/lib/webinar/playback";
import { minutesToSeconds } from "@/lib/webinar/video-utils";
import { isTriggerVisible } from "@/lib/webinar/triggers";
import type { DisplayMode, VideoType } from "@/lib/supabase/database.types";

interface PreviewChatMessage {
  author_name: string;
  message: string;
  appear_at_minutes: number;
  sort_order?: number;
}

interface PreviewTrigger {
  label: string;
  trigger_type: "button" | "cart";
  appear_at_minutes: number;
  appear_mode?: "at_minute" | "before_end";
}

interface DisplayMessage {
  id: string;
  author_name: string;
  message: string;
  isScripted?: boolean;
  isAi?: boolean;
  isTest?: boolean;
  appearAtMinutes?: number;
}

interface WebinarLivePreviewProps {
  videoUrl: string | null;
  videoType: VideoType;
  displayMode: DisplayMode;
  title: string;
  chatMessages: PreviewChatMessage[];
  triggers: PreviewTrigger[];
  aiContext?: string;
  aiAssistantName?: string;
  webinarId?: string;
  videoDurationSeconds?: number | null;
  className?: string;
}

function formatMinuteLabel(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WebinarLivePreview({
  videoUrl,
  videoType,
  displayMode,
  title,
  chatMessages,
  triggers,
  aiContext = "",
  aiAssistantName = "",
  webinarId,
  videoDurationSeconds,
  className,
}: WebinarLivePreviewProps) {
  const assistantDisplayName = resolveAiAssistantName(aiAssistantName);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoShellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTimeRef = useRef(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 150) + 820);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [shownScriptedIds, setShownScriptedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const playbackUrl = useMemo(() => {
    if (!videoUrl) return null;
    if (videoUrl.startsWith("blob:") || videoUrl.startsWith("http")) return videoUrl;
    return getVideoPublicUrl(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    const node = videoShellRef.current;
    if (!node) return;

    const updateHeight = () => setVideoHeight(node.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [playbackUrl]);

  const sortedScripted = useMemo(
    () =>
      [...chatMessages]
        .filter((m) => m.message.trim())
        .sort((a, b) => {
          const timeDiff = a.appear_at_minutes - b.appear_at_minutes;
          if (timeDiff !== 0) return timeDiff;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }),
    [chatMessages],
  );

  useEffect(() => {
    setShownScriptedIds(new Set());
    setMessages((prev) => prev.filter((m) => !m.isScripted));
  }, [chatMessages]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [playbackUrl]);

  useEffect(() => {
    if (currentTime < prevTimeRef.current - 0.5) {
      setShownScriptedIds(new Set());
      setMessages((prev) => prev.filter((m) => !m.isScripted));
    }
    prevTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    sortedScripted.forEach((msg, index) => {
      const id = `scripted-${index}`;
      const appearAtSeconds = minutesToSeconds(msg.appear_at_minutes);

      if (appearAtSeconds <= currentTime && !shownScriptedIds.has(id)) {
        setShownScriptedIds((prev) => new Set(prev).add(id));
        setMessages((prev) => [
          ...prev,
          {
            id,
            author_name: msg.author_name,
            message: msg.message,
            isScripted: true,
            appearAtMinutes: msg.appear_at_minutes,
          },
        ]);
      }
    });
  }, [currentTime, sortedScripted, shownScriptedIds]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleTriggers = triggers.filter((t) =>
    isTriggerVisible(
      {
        appear_at_seconds: minutesToSeconds(t.appear_at_minutes),
        appear_mode: t.appear_mode,
        trigger_type: t.trigger_type,
      },
      currentTime,
      videoDurationSeconds,
    ),
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userId = `test-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, author_name: "Você (teste)", message: text, isTest: true },
    ]);
    setInput("");
    setSending(true);

    try {
      const result = await previewChatReply({
        data: {
          message: text,
          aiContext: aiContext || undefined,
          webinarId,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          author_name: assistantDisplayName,
          message: result.reply,
          isAi: true,
        },
      ]);
    } catch {
      toast.error("Erro ao testar resposta da IA");
    } finally {
      setSending(false);
    }
  };

  if (!playbackUrl) return null;

  const scriptedCount = sortedScripted.length;

  return (
    <div className={cn("dojo-surface-card space-y-3 p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Eye className="size-4 text-primary" />
        <h3 className="font-semibold">Pré-visualização da live</h3>
        <Badge variant="secondary" className="text-xs">
          Modo preview — você pode pausar e voltar
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div ref={videoShellRef} className="relative overflow-hidden rounded-lg bg-black">
            {displayMode === "live" && (
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse gap-1.5">
                  <span className="size-2 rounded-full bg-white" />
                  AO VIVO
                </Badge>
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {viewerCount.toLocaleString("pt-BR")} assistindo
                </Badge>
              </div>
            )}
            {displayMode === "recorded" && (
              <div className="absolute left-3 top-3 z-10">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  Aula gravada
                </Badge>
              </div>
            )}

            {videoType === "upload" || playbackUrl.startsWith("blob:") ? (
              <video
                ref={videoRef}
                src={playbackUrl}
                className="aspect-video w-full object-contain"
                controls
                playsInline
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                Preview YouTube disponível apenas na página publicada
              </div>
            )}
          </div>

          <p className="text-sm font-medium">{title || "Título do webinar"}</p>

          {visibleTriggers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleTriggers.map((t, i) => (
                <Button key={i} size="sm" variant={t.trigger_type === "cart" ? "default" : "secondary"}>
                  {t.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex h-[min(360px,45vh)] min-h-[280px] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#17181A] lg:min-h-0"
          style={videoHeight ? { height: `${Math.round(videoHeight)}px` } : undefined}
        >
          <div className="border-b px-3 py-2">
            <p className="text-sm font-semibold">Chat ao vivo</p>
            <p className="text-xs text-muted-foreground">
              {scriptedCount > 0
                ? `${scriptedCount} mensagens simuladas · teste perguntas para a IA`
                : "Teste perguntas para a IA"}
            </p>
          </div>

          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {scriptedCount > 0
                    ? "Dê play no vídeo para ver as mensagens simuladas aparecerem no minuto configurado."
                    : "Envie uma pergunta de teste ou configure mensagens na aba Chat."}
                </p>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "font-medium",
                        msg.isAi && "text-primary",
                        msg.isScripted && "text-muted-foreground",
                        msg.isTest && "text-foreground",
                      )}
                    >
                      {msg.author_name}
                    </span>
                    {msg.isScripted && msg.appearAtMinutes != null && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                        {formatMinuteLabel(msg.appearAtMinutes)}
                      </Badge>
                    )}
                    {msg.isAi && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                        IA
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-foreground/90">{msg.message}</p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 border-t p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Testar pergunta para a IA..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              maxLength={500}
              disabled={sending}
              className="h-9 text-sm"
            />
            <Button
              size="icon"
              className="size-9 shrink-0"
              onClick={handleSend}
              disabled={sending || !input.trim()}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
