import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ChatMessagesEditor, type ChatMessageDraft } from "@/components/admin/ChatMessagesEditor";
import { TriggersEditor, type TriggerDraft } from "@/components/admin/TriggersEditor";
import { EditorSection } from "@/components/admin/EditorSection";
import { CopyWebinarLink } from "@/components/admin/CopyWebinarLink";
import { WebinarEditorInsights } from "@/components/admin/WebinarEditorInsights";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { WebinarLivePreview } from "@/components/admin/WebinarLivePreview";
import {
  LandingPageEditor,
  landingFromWebinar,
  landingToPayload,
  type LandingFormValues,
} from "@/components/admin/LandingPageEditor";
import {
  ScheduleSettings,
  scheduleFormToPayload,
  scheduleFromWebinar,
  type ScheduleFormValues,
} from "@/components/admin/ScheduleSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createWebinar,
  finalizeWebinarVideoChunkUpload,
  initWebinarVideoChunkUpload,
  removeWebinarVideo,
  requestTranscription,
  updateWebinar,
} from "@/lib/api/admin.functions";
import type {
  DisplayMode,
  FieldType,
  PhoneRegion,
  ScheduleRecurrence,
  WebinarStatus,
  VideoType,
} from "@/lib/supabase/database.types";
import { uploadWebinarVideoDirect } from "@/lib/webinar/upload-video";
import {
  formatDuration,
  formatFileSize,
  getVideoDurationFromFile,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_INPUT_BYTES,
  minutesToSeconds,
  secondsToMinutes,
  slugifyFieldKey,
} from "@/lib/webinar/video-utils";

interface FormField {
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  enabled: boolean;
  sort_order: number;
  phone_region?: PhoneRegion | null;
  isDefault?: boolean;
}

interface ChatMessage extends ChatMessageDraft {}

interface Trigger extends TriggerDraft {}

export interface WebinarFormData {
  slug: string;
  title: string;
  description: string;
  scheduled_at: string;
  status: WebinarStatus;
  video_type: VideoType;
  video_url: string;
  video_duration_seconds: number | null;
  group_link: string;
  display_mode: DisplayMode;
  waiting_title: string;
  waiting_description: string;
  ai_context: string;
  ai_assistant_name: string;
  formFields: FormField[];
  chatMessages: ChatMessage[];
  triggers: Trigger[];
}

interface WebinarInsightsData {
  leads: {
    id: string;
    registered_at: string;
    data: unknown;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
  }[];
  transcription: {
    status: string;
    processed_at: string | null;
    ai_summary: string | null;
    full_text: string | null;
  } | null;
}

interface WebinarEditorProps {
  webinarId?: string;
  initial?: Partial<WebinarFormData> & {
    schedule_recurrence?: ScheduleRecurrence;
    schedule_weekday?: number | null;
  } & Partial<LandingFormValues>;
  transcriptionStatus?: string;
  hideShareLink?: boolean;
  insights?: WebinarInsightsData;
  onSaved?: () => void;
}

const DEFAULT_FIELD_KEYS = new Set(["name", "phone", "email"]);

const defaultForm: WebinarFormData = {
  slug: "",
  title: "",
  description: "",
  scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  status: "draft",
  video_type: "upload",
  video_url: "",
  video_duration_seconds: null,
  group_link: "",
  display_mode: "live",
  waiting_title: "",
  waiting_description: "",
  ai_context: "",
  ai_assistant_name: "",
  formFields: [
    { field_key: "name", label: "Nome", field_type: "text", required: true, enabled: true, sort_order: 0, isDefault: true, phone_region: null },
    { field_key: "phone", label: "Telefone", field_type: "tel", required: true, enabled: true, sort_order: 1, isDefault: true, phone_region: "BR" },
    { field_key: "email", label: "E-mail", field_type: "email", required: true, enabled: true, sort_order: 2, isDefault: true, phone_region: null },
  ],
  chatMessages: [],
  triggers: [],
};

export function WebinarEditor({
  webinarId,
  initial,
  transcriptionStatus,
  hideShareLink = false,
  insights,
  onSaved,
}: WebinarEditorProps) {
  const mergedInitial = { ...defaultForm, ...initial };
  const [form, setForm] = useState<WebinarFormData>(mergedInitial);
  const [schedule, setSchedule] = useState<ScheduleFormValues>(() =>
    initial?.scheduled_at
      ? scheduleFromWebinar({
          scheduled_at: initial.scheduled_at,
          schedule_recurrence: initial.schedule_recurrence ?? "once",
          schedule_weekday: initial.schedule_weekday ?? null,
        })
      : scheduleFromWebinar({
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          schedule_recurrence: "once",
          schedule_weekday: null,
        }),
  );
  const [landing, setLanding] = useState<LandingFormValues>(() =>
    initial ? landingFromWebinar(initial) : landingFromWebinar({}),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionState, setTranscriptionState] = useState(transcriptionStatus ?? "pending");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(() => {
    if (initial?.video_url) {
      return initial.video_url.startsWith("http") || initial.video_url.startsWith("blob:")
        ? initial.video_url
        : initial.video_url;
    }
    return null;
  });

  useEffect(() => {
    return () => {
      if (previewVideoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewVideoUrl);
      }
    };
  }, [previewVideoUrl]);

  const update = <K extends keyof WebinarFormData>(key: K, value: WebinarFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const schedulePayload = scheduleFormToPayload(schedule);
      const landingPayload = landingToPayload(landing);
      const payload = {
        slug: form.slug,
        title: form.title,
        description: form.description || undefined,
        ...schedulePayload,
        ...landingPayload,
        status: form.status,
        video_type: form.video_type,
        video_url: form.video_url || undefined,
        video_duration_seconds: form.video_duration_seconds ?? undefined,
        group_link: form.group_link || undefined,
        display_mode: form.display_mode,
        waiting_title: form.waiting_title || undefined,
        waiting_description: form.waiting_description || undefined,
        ai_context: form.ai_context || undefined,
        ai_assistant_name: form.ai_assistant_name.trim() || undefined,
      };

      const formFieldsPayload = form.formFields.map(({ isDefault: _, ...f }) => f);
      const chatPayload = form.chatMessages.map((m) => ({
        author_name: m.author_name,
        message: m.message,
        appear_at_seconds: minutesToSeconds(m.appear_at_minutes),
        sort_order: m.sort_order,
      }));
      const triggersPayload = form.triggers.map((t) => ({
        trigger_type: t.trigger_type,
        label: t.label,
        action_url: t.action_url || undefined,
        appear_at_seconds: minutesToSeconds(t.appear_at_minutes),
        appear_mode: t.appear_mode,
      }));

      if (webinarId) {
        await updateWebinar({
          data: {
            id: webinarId,
            webinar: payload,
            formFields: formFieldsPayload,
            chatMessages: chatPayload,
            triggers: triggersPayload,
          },
        });
        toast.success("Webinar atualizado!");
      } else {
        await createWebinar({
          data: { webinar: payload, formFields: formFieldsPayload },
        });
        toast.success("Webinar criado!");
      }
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleVideoFileSelect = async (file: File) => {
    if (file.size > MAX_VIDEO_INPUT_BYTES) {
      toast.error(
        `Arquivo muito grande (${formatFileSize(file.size)}). Máximo: ${formatFileSize(MAX_VIDEO_INPUT_BYTES)}.`,
      );
      return;
    }

    const duration = await getVideoDurationFromFile(file);

    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      toast.error(`Vídeo muito longo (${formatDuration(duration)}). Máximo: 1h30.`);
      return;
    }

    if (previewVideoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewVideoUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setPreviewVideoUrl(blobUrl);
    update("video_duration_seconds", Math.round(duration));

    if (!webinarId) {
      toast.info("Preview carregado. Salve o webinar para concluir o upload.");
      return;
    }

    await handleVideoUpload(file, duration);
  };

  const handleRemoveVideo = async () => {
    if (previewVideoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewVideoUrl);
    }

    if (webinarId && form.video_url) {
      try {
        await removeWebinarVideo({ data: { webinarId } });
        toast.success("Vídeo removido");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao remover vídeo");
        return;
      }
    }

    update("video_url", "");
    update("video_duration_seconds", null);
    setPreviewVideoUrl(null);
  };

  const handleVideoUpload = async (file: File, knownDuration?: number) => {
    if (!webinarId) {
      toast.error("Salve o webinar antes de fazer upload do vídeo");
      return;
    }

    setUploading(true);
    setConverting(false);
    setUploadPercent(0);
    try {
      const duration = knownDuration ?? (await getVideoDurationFromFile(file));

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        toast.error(`Vídeo muito longo (${formatDuration(duration)}). Máximo: 1h30.`);
        return;
      }

      const result = await uploadWebinarVideoDirect(file, webinarId, duration, (progress) => {
        if (progress.phase === "uploading") {
          setUploading(true);
          setConverting(false);
          setUploadPercent(progress.percent);
        } else {
          setUploading(false);
          setConverting(true);
          setUploadPercent(100);
        }
      });

      setConverting(false);

      update("video_url", result.path);
      update("video_type", "upload");
      update("video_duration_seconds", result.durationSeconds);

      if (previewVideoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewVideoUrl);
      }
      setPreviewVideoUrl(result.path);

      toast.success(`Vídeo enviado! Duração detectada: ${formatDuration(result.durationSeconds)}`);

      setTranscriptionState("processing");
      setTranscribing(true);
      toast.info("Extraindo conteúdo do vídeo com IA... Isso pode levar alguns minutos.");

      try {
        const transcriptionResult = await requestTranscription({ data: { webinarId } });
        setTranscriptionState("completed");
        if (transcriptionResult.aiContext) {
          update("ai_context", transcriptionResult.aiContext);
        }
        if (transcriptionResult.chatMessages?.length) {
          update("chatMessages", transcriptionResult.chatMessages);
        }
        toast.success(
          `Conteúdo extraído! ${transcriptionResult.triggersCount} gatilho(s) e ${transcriptionResult.chatMessagesCount} mensagem(ns) de chat.`,
        );
      } catch (err) {
        setTranscriptionState("failed");
        toast.error(err instanceof Error ? err.message : "Erro na transcrição");
      } finally {
        setTranscribing(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      setConverting(false);
      setUploadPercent(0);
    }
  };

  const handleRetranscribe = async () => {
    if (!webinarId) return;
    setTranscribing(true);
    setTranscriptionState("processing");
    try {
      const result = await requestTranscription({ data: { webinarId } });
      setTranscriptionState("completed");
      if (result.aiContext) update("ai_context", result.aiContext);
      if (result.chatMessages?.length) {
        update("chatMessages", result.chatMessages);
      }
      toast.success(
        `Conteúdo reprocessado! ${result.chatMessagesCount} mensagem(ns) de chat geradas.`,
      );
    } catch (err) {
      setTranscriptionState("failed");
      toast.error(err instanceof Error ? err.message : "Erro na transcrição");
    } finally {
      setTranscribing(false);
    }
  };

  const addFormField = () => {
    const label = "Novo campo";
    update("formFields", [
      ...form.formFields,
      {
        field_key: slugifyFieldKey(label),
        label,
        field_type: "text",
        required: false,
        enabled: true,
        sort_order: form.formFields.length,
        phone_region: null,
        isDefault: false,
      },
    ]);
  };

  return (
    <Card className="overflow-hidden">
      {!hideShareLink && form.slug && (
        <div className="border-b bg-muted/20 px-6 py-4">
          <CopyWebinarLink slug={form.slug} published={form.status === "published"} variant="inline" />
        </div>
      )}

      <Tabs defaultValue="geral" className="gap-0">
        <CardHeader className="border-b bg-muted/30 pb-0">
          <div className="space-y-1 pb-4">
            <CardTitle className="text-lg">Configuração</CardTitle>
            <CardDescription>Ajuste conteúdo, agendamento, formulário, vídeo e interações da live.</CardDescription>
          </div>
          <TabsList className="mb-0 grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="geral" className="data-[state=active]:bg-background">
              Geral
            </TabsTrigger>
            <TabsTrigger value="landing" className="data-[state=active]:bg-background">
              Landing
            </TabsTrigger>
            <TabsTrigger value="formulario" className="data-[state=active]:bg-background">
              Formulário
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-background">
              Vídeo
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-background">
              Chat
            </TabsTrigger>
            <TabsTrigger value="gatilhos" className="data-[state=active]:bg-background">
              Gatilhos
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <div className="p-6">
          <TabsContent value="geral" className="mt-0 space-y-5">
            <EditorSection
              title="Identidade"
              description="Nome e endereço público do webinar."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="nome-do-webinar"
                  />
                  <p className="text-xs text-muted-foreground">/webinar/{form.slug || "..."}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                />
              </div>
            </EditorSection>

            <EditorSection
              title="Agendamento"
              description="Define quando a transmissão acontece e a recorrência."
            >
              <ScheduleSettings values={schedule} onChange={setSchedule} />
            </EditorSection>

            <EditorSection title="Publicação" description="Controle visibilidade e aparência na live.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v as WebinarStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exibição na live</Label>
                  <Select value={form.display_mode} onValueChange={(v) => update("display_mode", v as DisplayMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Badge AO VIVO</SelectItem>
                      <SelectItem value="recorded">Aula gravada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EditorSection>

            <EditorSection
              title="Pós-inscrição"
              description="Experiência após o lead se inscrever e antes da transmissão."
            >
              <div className="space-y-2">
                <Label>Link do grupo (WhatsApp/Telegram)</Label>
                <Input
                  value={form.group_link}
                  onChange={(e) => update("group_link", e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título da sala de espera</Label>
                  <Input value={form.waiting_title} onChange={(e) => update("waiting_title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição da sala de espera</Label>
                  <Textarea
                    value={form.waiting_description}
                    onChange={(e) => update("waiting_description", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </EditorSection>

            {insights && (
              <WebinarEditorInsights leads={insights.leads} transcription={insights.transcription} />
            )}
          </TabsContent>

        <TabsContent value="landing" className="mt-0 space-y-4">
          <LandingPageEditor values={landing} onChange={setLanding} webinarId={webinarId} />
        </TabsContent>

        <TabsContent value="formulario" className="mt-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card/50 p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">Campos de inscrição</h3>
              <p className="text-sm text-muted-foreground">
                Configure quais informações coletar dos participantes antes da live.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFormField}>
              <Plus className="mr-2 size-4" />
              Adicionar campo
            </Button>
          </div>

          {form.formFields.map((field, i) => (
            <Card key={`${field.field_key}-${i}`}>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>Identificador</Label>
                  <Input
                    value={field.field_key}
                    disabled={field.isDefault ?? DEFAULT_FIELD_KEYS.has(field.field_key)}
                    onChange={(e) => {
                      const fields = [...form.formFields];
                      fields[i] = { ...field, field_key: slugifyFieldKey(e.target.value) };
                      update("formFields", fields);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rótulo exibido</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const fields = [...form.formFields];
                      fields[i] = { ...field, label: e.target.value };
                      update("formFields", fields);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={field.field_type}
                    onValueChange={(v) => {
                      const fields = [...form.formFields];
                      const nextType = v as FieldType;
                      fields[i] = {
                        ...field,
                        field_type: nextType,
                        phone_region: nextType === "tel" ? (field.phone_region ?? "BR") : null,
                      };
                      update("formFields", fields);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="tel">Telefone</SelectItem>
                      <SelectItem value="textarea">Texto longo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {field.field_type === "tel" && (
                  <div className="space-y-2">
                    <Label>Formato do telefone</Label>
                    <Select
                      value={field.phone_region ?? "BR"}
                      onValueChange={(v) => {
                        const fields = [...form.formFields];
                        fields[i] = { ...field, phone_region: v as PhoneRegion };
                        update("formFields", fields);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR">Brasil — (DD) 9 XXXX-XXXX</SelectItem>
                        <SelectItem value="US">EUA — (XXX) XXX-XXXX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.enabled}
                      onCheckedChange={(v) => {
                        const fields = [...form.formFields];
                        fields[i] = { ...field, enabled: v };
                        update("formFields", fields);
                      }}
                    />
                    <Label className="text-xs">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(v) => {
                        const fields = [...form.formFields];
                        fields[i] = { ...field, required: v };
                        update("formFields", fields);
                      }}
                    />
                    <Label className="text-xs">Obrigatório</Label>
                  </div>
                </div>
                <div className="flex items-end">
                  {!(field.isDefault ?? DEFAULT_FIELD_KEYS.has(field.field_key)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => update("formFields", form.formFields.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="video" className="mt-0 space-y-5">
          <EditorSection title="Fonte do vídeo" description="Upload recomendado para sincronização perfeita na live.">
            <div className="space-y-2">
              <Label>Tipo de vídeo</Label>
              <Select value={form.video_type} onValueChange={(v) => update("video_type", v as VideoType)}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload (Supabase) — recomendado</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.video_type === "youtube" ? (
              <div className="space-y-2">
                <Label>URL do YouTube</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => update("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  YouTube tem controle limitado de sincronização. Para sync perfeito, use upload.
                </p>
              </div>
            ) : (
              <VideoUploadField
                videoPath={form.video_url}
                durationSeconds={form.video_duration_seconds}
                webinarId={webinarId}
                pendingPreview={Boolean(previewVideoUrl?.startsWith("blob:") && !form.video_url)}
                uploading={uploading}
                converting={converting}
                uploadPercent={uploadPercent}
                transcribing={transcribing}
                onFileSelect={handleVideoFileSelect}
                onRemove={() => void handleRemoveVideo()}
              />
            )}
          </EditorSection>

          <EditorSection
            title="Contexto da IA"
            description="Nome e XML usados pelo chat ao vivo. O XML é gerado automaticamente após transcrição."
          >
            <div className="space-y-2">
              <Label htmlFor="ai_assistant_name">Nome do assistente no chat</Label>
              <Input
                id="ai_assistant_name"
                value={form.ai_assistant_name}
                onChange={(e) => update("ai_assistant_name", e.target.value)}
                placeholder="Ex: Maria, Equipe do curso, Ana da equipe"
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Nome exibido nas respostas automáticas da IA. Se vazio, usa o nome do apresentador ou
                &quot;Equipe&quot;.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">Status: {transcriptionState}</Badge>
              {webinarId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetranscribe}
                  disabled={transcribing || !form.video_url}
                  className="gap-2"
                >
                  {transcribing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Reprocessar do vídeo
                </Button>
              )}
            </div>
            <Textarea
              value={form.ai_context}
              onChange={(e) => update("ai_context", e.target.value)}
              placeholder={'<webinar_context lang="pt-BR">...</webinar_context>'}
              rows={12}
              className="font-mono text-xs leading-relaxed"
            />
          </EditorSection>

          {(previewVideoUrl || form.video_url) && (
            <EditorSection title="Preview da live" description="Simulação do player com chat e gatilhos.">
              <WebinarLivePreview
                videoUrl={previewVideoUrl ?? form.video_url}
                videoType={form.video_type}
                displayMode={form.display_mode}
                title={form.title}
                webinarId={webinarId}
                aiContext={form.ai_context}
                aiAssistantName={form.ai_assistant_name}
                chatMessages={form.chatMessages}
                triggers={form.triggers.map((t) => ({
                  label: t.label,
                  trigger_type: t.trigger_type,
                  appear_at_minutes: t.appear_at_minutes,
                  appear_mode: t.appear_mode,
                }))}
                videoDurationSeconds={form.video_duration_seconds}
              />
            </EditorSection>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-0 space-y-5">
          <ChatMessagesEditor
            messages={form.chatMessages}
            onChange={(messages) => update("chatMessages", messages)}
            videoDurationSeconds={form.video_duration_seconds}
            canRegenerate={Boolean(webinarId && form.video_url)}
            regenerating={transcribing}
            onRegenerate={() => void handleRetranscribe()}
          />
        </TabsContent>

        <TabsContent value="gatilhos" className="mt-0 space-y-5">
          <TriggersEditor
            triggers={form.triggers}
            onChange={(triggers) => update("triggers", triggers)}
            videoDurationSeconds={form.video_duration_seconds}
          />
        </TabsContent>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button onClick={handleSave} disabled={saving || !form.title || !form.slug}>
            {saving ? "Salvando..." : webinarId ? "Salvar alterações" : "Criar webinar"}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}
