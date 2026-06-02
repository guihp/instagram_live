import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listWebinarsForChatImport } from "@/lib/api/admin.functions";

export interface ChatGenerateOptions {
  messageCount: number;
  referenceWebinarId?: string;
}

interface ChatGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCount?: number;
  currentWebinarId?: string;
  onConfirm: (options: ChatGenerateOptions) => void;
  loading?: boolean;
}

export function ChatGenerateDialog({
  open,
  onOpenChange,
  defaultCount = 20,
  currentWebinarId,
  onConfirm,
  loading = false,
}: ChatGenerateDialogProps) {
  const [count, setCount] = useState(defaultCount);
  const [referenceId, setReferenceId] = useState<string>("none");
  const [webinars, setWebinars] = useState<{ id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setCount(defaultCount);
    setReferenceId("none");
    void listWebinarsForChatImport({ data: { excludeId: currentWebinarId } })
      .then(setWebinars)
      .catch(() => setWebinars([]));
  }, [open, defaultCount, currentWebinarId]);

  const handleConfirm = () => {
    onConfirm({
      messageCount: Math.min(50, Math.max(8, count)),
      referenceWebinarId: referenceId !== "none" ? referenceId : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Gerar chat do vídeo
          </DialogTitle>
          <DialogDescription>
            A IA vai criar comentários humanizados, perguntas e respostas da equipe no timing do vídeo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="chat-count">Quantos comentários simulados?</Label>
            <Input
              id="chat-count"
              type="number"
              min={8}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || defaultCount)}
            />
            <p className="text-xs text-muted-foreground">Entre 8 e 50. Perguntas incluem resposta da equipe.</p>
          </div>

          <div className="space-y-2">
            <Label>Usar chat de outro webinar como base (opcional)</Label>
            <Select value={referenceId} onValueChange={setReferenceId}>
              <SelectTrigger>
                <SelectValue placeholder="Só transcrição deste vídeo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Só transcrição deste vídeo</SelectItem>
                {webinars.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading} className="gap-2">
            {loading ? "Gerando..." : "Gerar com IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
