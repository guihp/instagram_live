import { useEffect, useState } from "react";
import { Download, MessageCircle, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EditorSection } from "@/components/admin/EditorSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/webinar/video-utils";
import {
  getWebinarChatMessagesForImport,
  listWebinarsForChatImport,
  saveChatSnapshot,
} from "@/lib/api/admin.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChatMessageDraft {
  author_name: string;
  message: string;
  appear_at_minutes: number;
  sort_order: number;
  kind?: "question" | "comment" | "reaction" | "team_reply";
}

interface ChatMessagesEditorProps {
  webinarId?: string;
  messages: ChatMessageDraft[];
  onChange: (messages: ChatMessageDraft[]) => void;
  videoDurationSeconds?: number | null;
  onRegenerate?: () => void;
  regenerating?: boolean;
  canRegenerate?: boolean;
  defaultGenerateCount?: number;
}

const KIND_LABELS: Record<NonNullable<ChatMessageDraft["kind"]>, string> = {
  question: "Pergunta",
  comment: "Comentário",
  reaction: "Reação",
  team_reply: "Resposta da equipe",
};

const KIND_STYLES: Record<NonNullable<ChatMessageDraft["kind"]>, string> = {
  question: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  comment: "bg-muted text-muted-foreground",
  reaction: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  team_reply: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatAppearTime(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  return formatDuration(totalSeconds);
}

function inferKind(message: ChatMessageDraft): NonNullable<ChatMessageDraft["kind"]> {
  if (message.kind) return message.kind;
  const text = message.message.trim();
  if (text.endsWith("?")) return "question";
  if (/^(show|top|demais|massa|boa|incrivel|parabens|amei)/i.test(text)) return "reaction";
  if (/equipe|suporte|moderador/i.test(message.author_name)) return "team_reply";
  return "comment";
}

export function ChatMessagesEditor({
  webinarId,
  messages,
  onChange,
  videoDurationSeconds,
  onRegenerate,
  regenerating = false,
  canRegenerate = false,
}: ChatMessagesEditorProps) {
  const [importSourceId, setImportSourceId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const handleImportFromWebinar = async () => {
    if (!importSourceId) return;
    setImporting(true);
    try {
      const rows = (await getWebinarChatMessagesForImport({
        data: { webinarId: importSourceId },
      })) as Array<{
        author_name: string;
        message: string;
        appear_at_seconds: number;
        sort_order: number;
        kind?: string;
      }>;
      onChange(
        rows.map((m, i) => ({
          author_name: m.author_name,
          message: m.message,
          appear_at_minutes: (m.appear_at_seconds ?? 0) / 60,
          sort_order: m.sort_order ?? i,
          kind: (m.kind as ChatMessageDraft["kind"]) ?? "comment",
        })),
      );
      toast.success(`${rows.length} mensagens importadas. Salve o webinar para aplicar.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    } finally {
      setImporting(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!webinarId || !snapshotLabel.trim()) return;
    setSavingSnapshot(true);
    try {
      await saveChatSnapshot({
        data: {
          webinarId,
          label: snapshotLabel.trim(),
          messages: messages.map((m, i) => ({
            author_name: m.author_name,
            message: m.message,
            appear_at_seconds: Math.round(m.appear_at_minutes * 60),
            sort_order: m.sort_order ?? i,
            kind: m.kind,
          })),
        },
      });
      toast.success("Snapshot do chat salvo neste webinar.");
      setSnapshotLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar snapshot");
    } finally {
      setSavingSnapshot(false);
    }
  };
  const sorted = [...messages].sort(
    (a, b) => a.appear_at_minutes - b.appear_at_minutes || a.sort_order - b.sort_order,
  );

  const updateMessage = (index: number, patch: Partial<ChatMessageDraft>) => {
    const next = [...messages];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeMessage = (index: number) => {
    onChange(messages.filter((_, i) => i !== index));
  };

  const addMessage = () => {
    onChange([
      ...messages,
      {
        author_name: "Participante",
        message: "",
        appear_at_minutes: 0,
        sort_order: messages.length,
        kind: "comment",
      },
    ]);
  };

  return (
    <EditorSection
      title="Chat simulado ao vivo"
      description="Mensagens que aparecem no chat conforme o vídeo avança. A IA gera perguntas e comentários automaticamente ao processar a transcrição."
    >
      {webinarId ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium">Reutilizar chat de outro webinar</p>
          <p className="text-xs text-muted-foreground">
            Importa mensagens já configuradas. Para a IA usar como base ao gerar de novo, escolha o webinar no
            diálogo &quot;Gerar do vídeo&quot;.
          </p>
          <div className="flex flex-wrap gap-2">
            <ImportWebinarSelect
              excludeId={webinarId}
              value={importSourceId}
              onChange={setImportSourceId}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={!importSourceId || importing}
              onClick={() => void handleImportFromWebinar()}
            >
              <Download className="size-4" />
              {importing ? "Importando..." : "Importar mensagens"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
            <Input
              className="max-w-xs h-9"
              placeholder="Nome do snapshot (ex: Live março)"
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!snapshotLabel.trim() || savingSnapshot || messages.length === 0}
              onClick={() => void handleSaveSnapshot()}
            >
              <Save className="size-4" />
              {savingSnapshot ? "Salvando..." : "Salvar snapshot"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{messages.length} mensagens</Badge>
          {videoDurationSeconds ? (
            <Badge variant="outline">Vídeo: {formatDuration(videoDurationSeconds)}</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canRegenerate && onRegenerate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={regenerating}
              onClick={onRegenerate}
            >
              <Sparkles className="size-4" />
              {regenerating ? "Gerando..." : "Gerar do vídeo (IA)"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addMessage}>
            <Plus className="size-4" />
            Adicionar mensagem
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-[#1A1C22]/40 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-6" />
          </div>
          <div className="max-w-md space-y-1">
            <p className="text-sm font-medium">Nenhuma mensagem configurada</p>
            <p className="text-xs text-muted-foreground">
              Processe a transcrição do vídeo na aba Vídeo para a IA preencher perguntas e comentários
              com o timing correto, ou adicione mensagens manualmente.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((msg) => {
            const index = messages.indexOf(msg);
            const kind = inferKind(msg);

            return (
              <article
                key={`${msg.sort_order}-${index}`}
                className="relative rounded-xl border bg-card/40 p-4 pl-5 shadow-sm"
              >
                <div className="absolute bottom-4 left-0 top-4 w-1 rounded-full bg-primary/30" />

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(msg.author_name)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={msg.author_name}
                          placeholder="Nome no chat"
                          className="h-8 max-w-[180px] text-sm font-medium"
                          onChange={(e) => updateMessage(index, { author_name: e.target.value })}
                        />
                        <Badge className={cn("font-normal", KIND_STYLES[kind])}>{KIND_LABELS[kind]}</Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatAppearTime(msg.appear_at_minutes)}
                        </Badge>
                      </div>

                      <Textarea
                        value={msg.message}
                        placeholder="Texto da mensagem no chat..."
                        rows={2}
                        className="min-h-[72px] resize-y text-sm leading-relaxed"
                        onChange={(e) => updateMessage(index, { message: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-end gap-3 lg:w-44 lg:flex-col lg:items-stretch">
                    <div className="space-y-1.5 lg:w-full">
                      <Label className="text-xs text-muted-foreground">Aparece no minuto</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={msg.appear_at_minutes}
                        onChange={(e) =>
                          updateMessage(index, { appear_at_minutes: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => removeMessage(index)}
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </EditorSection>
  );
}

function ImportWebinarSelect({
  excludeId,
  value,
  onChange,
}: {
  excludeId: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    void listWebinarsForChatImport({ data: { excludeId } }).then((rows) =>
      setItems(rows.map((r) => ({ id: r.id, title: r.title }))),
    );
  }, [excludeId]);

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[min(100%,280px)]">
        <SelectValue placeholder="Escolher webinar..." />
      </SelectTrigger>
      <SelectContent>
        {items.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            {w.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
