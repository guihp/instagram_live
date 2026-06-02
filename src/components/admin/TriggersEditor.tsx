import { Plus, ShoppingCart, Trash2, Zap } from "lucide-react";

import { EditorSection } from "@/components/admin/EditorSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TRIGGER_APPEAR_MODE_LABELS,
  type TriggerAppearMode,
} from "@/lib/webinar/triggers";
import { formatDuration } from "@/lib/webinar/video-utils";

export interface TriggerDraft {
  trigger_type: "button" | "cart";
  label: string;
  action_url: string;
  appear_at_minutes: number;
  appear_mode: TriggerAppearMode;
}

interface TriggersEditorProps {
  triggers: TriggerDraft[];
  onChange: (triggers: TriggerDraft[]) => void;
  videoDurationSeconds?: number | null;
}

const DEFAULT_CART: TriggerDraft = {
  trigger_type: "cart",
  label: "Comprar agora",
  action_url: "",
  appear_at_minutes: 2,
  appear_mode: "before_end",
};

export function TriggersEditor({ triggers, onChange, videoDurationSeconds }: TriggersEditorProps) {
  const updateTrigger = (index: number, patch: Partial<TriggerDraft>) => {
    const next = [...triggers];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index));
  };

  const addTrigger = (preset?: Partial<TriggerDraft>) => {
    onChange([
      ...triggers,
      {
        trigger_type: "button",
        label: "Saiba mais",
        action_url: "",
        appear_at_minutes: 10,
        appear_mode: "at_minute",
        ...preset,
      },
    ]);
  };

  return (
    <EditorSection
      title="Gatilhos e ofertas"
      description="Botões que aparecem durante a live. Use “Antes do fim” para ofertas como Comprar agora — o botão só surge nos últimos minutos do vídeo."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{triggers.length} gatilho(s)</Badge>
        {videoDurationSeconds ? (
          <Badge variant="outline">Vídeo: {formatDuration(videoDurationSeconds)}</Badge>
        ) : (
          <Badge variant="outline">Configure o vídeo para ver timing no fim</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => addTrigger()}>
          <Plus className="size-4" />
          Botão genérico
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => addTrigger(DEFAULT_CART)}
        >
          <ShoppingCart className="size-4" />
          Oferta (final do vídeo)
        </Button>
      </div>

      {triggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-[#1A1C22]/40 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="size-6" />
          </div>
          <div className="max-w-md space-y-1">
            <p className="text-sm font-medium">Nenhum gatilho configurado</p>
            <p className="text-xs text-muted-foreground">
              Adicione um botão de compra para aparecer só no final, ou botões em minutos específicos da aula.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger, i) => {
            const isCart = trigger.trigger_type === "cart";
            const isBeforeEnd = trigger.appear_mode === "before_end";

            return (
              <article
                key={i}
                className={cn(
                  "rounded-xl border bg-card/40 p-4 shadow-sm",
                  isCart && "border-webinar-accent/30 bg-webinar-accent/5",
                )}
              >
                <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select
                      value={trigger.trigger_type}
                      onValueChange={(v) =>
                        updateTrigger(i, {
                          trigger_type: v as TriggerDraft["trigger_type"],
                          ...(v === "cart"
                            ? { appear_mode: "before_end" as const, appear_at_minutes: 2 }
                            : {}),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="button">Botão</SelectItem>
                        <SelectItem value="cart">Carrinho / compra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                    <Input
                      value={trigger.label}
                      placeholder="Comprar agora"
                      onChange={(e) => updateTrigger(i, { label: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-xs text-muted-foreground">URL de destino</Label>
                    <Input
                      value={trigger.action_url}
                      placeholder="https://checkout..."
                      onChange={(e) => updateTrigger(i, { action_url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-xs text-muted-foreground">Quando aparece</Label>
                    <Select
                      value={trigger.appear_mode}
                      onValueChange={(v) =>
                        updateTrigger(i, {
                          appear_mode: v as TriggerAppearMode,
                          ...(v === "before_end" && trigger.appear_at_minutes === 0
                            ? { appear_at_minutes: 2 }
                            : {}),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="at_minute">{TRIGGER_APPEAR_MODE_LABELS.at_minute}</SelectItem>
                        <SelectItem value="before_end">{TRIGGER_APPEAR_MODE_LABELS.before_end}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground">
                      {isBeforeEnd ? "Min. antes do fim" : "Minuto do vídeo"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={trigger.appear_at_minutes}
                      onChange={(e) =>
                        updateTrigger(i, { appear_at_minutes: Number(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="flex lg:col-span-1 lg:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeTrigger(i)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {isBeforeEnd
                    ? isCart
                      ? `O botão de compra aparece ${trigger.appear_at_minutes || 0} min antes do vídeo terminar.`
                      : `Visível ${trigger.appear_at_minutes || 0} min antes do fim do vídeo.`
                    : `Visível a partir do minuto ${trigger.appear_at_minutes} da transmissão.`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </EditorSection>
  );
}
