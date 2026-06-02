import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getLiveMessages, sendLiveMessage } from "@/lib/api/webinar.functions";
import type { WebinarChatMessage } from "@/lib/supabase/database.types";

interface ChatMessage {
  id: string;
  author_name: string;
  message: string;
  isScripted?: boolean;
  isAi?: boolean;
  pending?: boolean;
}

interface WebinarChatProps {
  webinarId: string;
  scriptedMessages: WebinarChatMessage[];
  currentVideoTime: number;
  leadId?: string;
  authorName: string;
  assistantName?: string;
  className?: string;
}

export function WebinarChat({
  webinarId,
  scriptedMessages,
  currentVideoTime,
  leadId,
  authorName,
  assistantName = "Equipe",
  className,
}: WebinarChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const injectedScriptedRef = useRef<Set<string>>(new Set());

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
  }, [scriptedMessages]);

  useEffect(() => {
    void getLiveMessages({ data: { webinarId } })
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
  }, [webinarId]);

  useEffect(() => {
    const additions: ChatMessage[] = [];

    for (const msg of sortedScripted) {
      const appearAt = Number(msg.appear_at_seconds ?? 0);
      if (appearAt <= currentVideoTime && !injectedScriptedRef.current.has(msg.id)) {
        injectedScriptedRef.current.add(msg.id);
        additions.push({
          id: msg.id,
          author_name: msg.author_name,
          message: msg.message,
          isScripted: true,
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
    if (!text || sending) return;

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
        },
      });

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

  const canSend = input.trim().length > 0 && !sending;

  return (
    <div
      className={cn(
        "flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm",
        className,
      )}
    >
      <div className="shrink-0 border-b bg-muted/30 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Chat ao vivo</h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} mensagem{messages.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="rounded-full bg-webinar-accent-soft px-2.5 py-1 text-[11px] font-semibold text-webinar-accent">
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
                  msg.isAi && "text-webinar-accent",
                  msg.isScripted && "text-muted-foreground",
                )}
              >
                {msg.author_name}
                {msg.pending ? " · enviando…" : ""}
              </span>
              <p className="mt-0.5 text-foreground/90">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      <form
        className="flex shrink-0 gap-2 border-t bg-background p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          disabled={sending}
          maxLength={500}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!canSend} aria-label="Enviar mensagem">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
