import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getLiveMessages, sendLiveMessage } from "@/lib/api/webinar.functions";
import type { WebinarChatMessage } from "@/lib/supabase/database.types";
import { getBrasiliaDateKey } from "@/lib/webinar/datetime";
import { messageHasBlockedWord } from "@/lib/webinar/chat-moderation";

interface ChatMessage {
  id: string;
  author_name: string;
  message: string;
  isScripted?: boolean;
  isAi?: boolean;
  isTeamReply?: boolean;
  pending?: boolean;
}

interface WebinarChatProps {
  webinarId: string;
  scriptedMessages: WebinarChatMessage[];
  currentVideoTime: number;
  leadId?: string;
  authorName: string;
  assistantName?: string;
  sessionDate?: string;
  participantEnabled?: boolean;
  blockedWords?: string[];
  className?: string;
  style?: CSSProperties;
}

export interface WebinarChatHandle {
  focusInput: () => void;
  scrollIntoView: () => void;
}

export const WebinarChat = forwardRef<WebinarChatHandle, WebinarChatProps>(function WebinarChat(
  {
    webinarId,
    scriptedMessages,
    currentVideoTime,
    leadId,
    authorName,
    assistantName = "Equipe",
    sessionDate,
    participantEnabled = true,
    blockedWords = [],
    className,
    style,
  },
  ref,
) {
  const sessionKey = sessionDate ?? getBrasiliaDateKey();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const injectedScriptedRef = useRef<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    },
    scrollIntoView: () => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  }));

  const sortedScripted = useMemo(
    () =>
      [...scriptedMessages]
        .filter((m) => m.message?.trim())
        .sort(
          (a, b) =>
            (a.appear_at_seconds ?? 0) - (b.appear_at_seconds ?? 0) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0),
        ),
    [scriptedMessages],
  );

  useEffect(() => {
    injectedScriptedRef.current = new Set();
    setMessages((prev) => prev.filter((m) => !m.isScripted));
  }, [scriptedMessages, sessionKey]);

  useEffect(() => {
    void getLiveMessages({ data: { webinarId, sessionDate: sessionKey } })
      .then((live) => {
        setMessages((prev) => {
          const scripted = prev.filter((m) => m.isScripted);
          const liveMsgs = live.map((m) => ({
            id: m.id,
            author_name: m.author_name,
            message: m.message,
            isAi: m.is_ai_response,
          }));
          return [...liveMsgs, ...scripted];
        });
      })
      .catch(() => {
        /* mensagens simuladas continuam visíveis */
      });
  }, [webinarId, sessionKey]);

  useEffect(() => {
    const additions: ChatMessage[] = [];

    for (const msg of sortedScripted) {
      const appearAt = Number(msg.appear_at_seconds ?? 0);
      if (appearAt <= currentVideoTime && !injectedScriptedRef.current.has(msg.id)) {
        injectedScriptedRef.current.add(msg.id);
        const kind = (msg as WebinarChatMessage & { kind?: string }).kind;
        additions.push({
          id: msg.id,
          author_name: msg.author_name,
          message: msg.message,
          isScripted: true,
          isTeamReply: kind === "team_reply",
          isAi: kind === "team_reply",
        });
      }
    }

    if (additions.length === 0) return;

    setMessages((prev) => [...prev, ...additions]);
  }, [currentVideoTime, sortedScripted]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !participantEnabled) return;

    if (messageHasBlockedWord(text, blockedWords)) {
      setInput("");
      toast.error("Sua mensagem não foi publicada.");
      return;
    }

    const optimisticId = `pending-${Date.now()}`;
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        author_name: authorName,
        message: text,
        pending: true,
      },
    ]);

    try {
      const result = await sendLiveMessage({
        data: {
          webinarId,
          leadId,
          authorName,
          message: text,
          currentVideoTime,
        },
      });

      if (result.rejected === "chat_locked") {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.info("O chat está fechado no momento.");
        return;
      }

      if (result.rejected === "blocked_word" || !result.userMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error("Sua mensagem não foi publicada.");
        return;
      }

      setMessages((prev) => {
        const withoutPending = prev.filter((m) => m.id !== optimisticId);
        return [
          ...withoutPending,
          {
            id: result.userMessage.id,
            author_name: result.userMessage.author_name,
            message: result.userMessage.message,
          },
          ...(result.aiMessage
            ? [
                {
                  id: result.aiMessage.id,
                  author_name: result.aiMessage.author_name,
                  message: result.aiMessage.message,
                  isAi: true,
                },
              ]
            : []),
        ];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(text);
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a mensagem");
    } finally {
      setSending(false);
    }
  };

  const canSend = participantEnabled && input.trim().length > 0 && !sending;

  return (
    <div
      ref={rootRef}
      style={style}
      className={cn(
        "flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm",
        className,
      )}
    >
      <div className="shrink-0 border-b bg-muted/30 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight">Chat ao vivo</h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} mensagem{messages.length === 1 ? "" : "s"} · respostas com{" "}
              {assistantName}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5 bg-webinar-accent-soft text-webinar-accent hover:bg-webinar-accent-soft/80 lg:hidden"
            onClick={() => inputRef.current?.focus()}
          >
            <MessageCircle className="size-3.5" />
            {assistantName}
          </Button>
          <span className="hidden rounded-full bg-webinar-accent-soft px-2.5 py-1 text-[11px] font-semibold text-webinar-accent lg:inline-flex">
            {assistantName}
          </span>
        </div>
      </div>

      <div
        ref={messagesViewportRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("text-sm", msg.pending && "opacity-70")}>
              <span
                className={cn(
                  "font-semibold",
                  (msg.isAi || msg.isTeamReply) && "text-webinar-accent",
                  msg.isScripted && !msg.isTeamReply && "text-muted-foreground",
                )}
              >
                {msg.author_name}
                {msg.isTeamReply ? " · equipe" : ""}
                {msg.pending ? " · enviando…" : ""}
              </span>
              <p className="mt-0.5 text-foreground/90">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {!participantEnabled ? (
        <p className="shrink-0 border-t bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          Chat fechado para mensagens dos participantes.
        </p>
      ) : null}

      <form
        className="flex shrink-0 gap-2 border-t bg-background p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            participantEnabled
              ? `Pergunte ao ${assistantName}...`
              : "Chat fechado"
          }
          disabled={sending || !participantEnabled}
          maxLength={500}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!canSend} aria-label="Enviar mensagem">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
});
