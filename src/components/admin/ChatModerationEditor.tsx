import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EditorSection } from "@/components/admin/EditorSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface ChatModerationEditorProps {
  participantEnabled: boolean;
  blockedWords: string[];
  onParticipantEnabledChange: (enabled: boolean) => void;
  onBlockedWordsChange: (words: string[]) => void;
}

export function ChatModerationEditor({
  participantEnabled,
  blockedWords,
  onParticipantEnabledChange,
  onBlockedWordsChange,
}: ChatModerationEditorProps) {
  const [draft, setDraft] = useState("");

  const addWord = () => {
    const word = draft.trim().toLowerCase();
    if (!word) return;
    if (blockedWords.includes(word)) {
      setDraft("");
      return;
    }
    onBlockedWordsChange([...blockedWords, word]);
    setDraft("");
  };

  const removeWord = (word: string) => {
    onBlockedWordsChange(blockedWords.filter((w) => w !== word));
  };

  return (
    <EditorSection
      title="Moderação do chat"
      description="Bloqueie o envio de mensagens dos participantes quando precisar. Palavras na lista não são publicadas (a mensagem é descartada)."
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card/40 px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="chat-enabled" className="text-sm font-medium">
            Chat liberado para participantes
          </Label>
          <p className="text-xs text-muted-foreground">
            {participantEnabled
              ? "Visitantes podem enviar mensagens na live."
              : "Somente mensagens simuladas e respostas da equipe aparecem."}
          </p>
        </div>
        <Switch
          id="chat-enabled"
          checked={participantEnabled}
          onCheckedChange={onParticipantEnabledChange}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm">Palavras bloqueadas</Label>
        <p className="text-xs text-muted-foreground">
          Se a mensagem contiver qualquer termo abaixo, ela não aparece no chat (ex: palavrões, links de
          concorrentes, spam).
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            value={draft}
            placeholder="Digite e adicione..."
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWord();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={addWord}>
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>
        {blockedWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blockedWords.map((word) => (
              <Badge key={word} variant="secondary" className="gap-1 pr-1">
                {word}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remover ${word}`}
                  onClick={() => removeWord(word)}
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhuma palavra bloqueada.</p>
        )}
      </div>
    </EditorSection>
  );
}
