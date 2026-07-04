import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Circle,
  Loader2,
  Radio,
  Square,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { IgBroadcastActivityFeed } from "@/components/instagram-live/IgBroadcastActivityFeed";
import { IgBroadcastStatusBadge } from "@/components/instagram-live/IgBroadcastStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  armIgBroadcast,
  getIgBroadcastStatus,
  getIgBroadcastVideoUrl,
  listIgBroadcastEvents,
  startIgBroadcast,
  stopIgBroadcast,
  updateIgBroadcast,
  uploadIgBroadcastVideo,
} from "@/lib/api/ig-live.functions";
import type { IgBroadcast, IgBroadcastEvent, IgBroadcastStatus } from "@/lib/supabase/database.types";
import { formatBrasiliaDateTime } from "@/lib/datetime";
import { fileToBase64 } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface IgBroadcastEditorProps {
  broadcast: IgBroadcast;
  isNew?: boolean;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function IgBroadcastEditor({ broadcast: initial, isNew }: IgBroadcastEditorProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [broadcast, setBroadcast] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [rtmpUrl, setRtmpUrl] = useState(initial.rtmp_url ?? "");
  const [streamKey, setStreamKey] = useState("");
  const [loopEnabled, setLoopEnabled] = useState(initial.loop_enabled);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalValue(initial.scheduled_at));
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<IgBroadcastEvent[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<IgBroadcastStatus>(initial.status);
  const [processAlive, setProcessAlive] = useState(false);
  const [armed, setArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arming, setArming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const isLive = runtimeStatus === "live" || runtimeStatus === "starting";
  const canControl = !isNew && broadcast.id;

  const checklist = useMemo(
    () => ({
      video: Boolean(broadcast.video_path),
      format: Boolean(broadcast.video_path),
      rtmp: Boolean(rtmpUrl.trim()),
      key: Boolean(streamKey.trim()) || armed,
      streaming: processAlive || runtimeStatus === "live",
    }),
    [broadcast.video_path, rtmpUrl, streamKey, armed, processAlive, runtimeStatus],
  );

  const refreshEvents = useCallback(async () => {
    if (!canControl) return;
    try {
      const list = await listIgBroadcastEvents({ data: { broadcastId: broadcast.id } });
      setEvents(list);
    } catch {
      /* ignore */
    }
  }, [broadcast.id, canControl]);

  const refreshStatus = useCallback(async () => {
    if (!canControl) return;
    try {
      const status = await getIgBroadcastStatus({ data: { broadcastId: broadcast.id } });
      if (status.status) setRuntimeStatus(status.status as IgBroadcastStatus);
      setProcessAlive(Boolean(status.processAlive));
      setArmed(Boolean(status.armed));
    } catch {
      /* worker offline */
    }
  }, [broadcast.id, canControl]);

  useEffect(() => {
    if (!canControl || !broadcast.video_path) return;
    void getIgBroadcastVideoUrl({ data: { broadcastId: broadcast.id } })
      .then(({ url }) => setVideoPreviewUrl(url))
      .catch(() => setVideoPreviewUrl(null));
  }, [broadcast.id, broadcast.video_path, canControl]);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (!canControl) return;
    void refreshStatus();
    const interval = setInterval(() => {
      void refreshStatus();
      void refreshEvents();
    }, 3000);
    return () => clearInterval(interval);
  }, [canControl, refreshStatus, refreshEvents]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateIgBroadcast({
        data: {
          id: broadcast.id,
          title: title.trim(),
          rtmp_url: rtmpUrl.trim() || null,
          loop_enabled: loopEnabled,
          scheduled_at: fromDatetimeLocalValue(scheduledAt),
        },
      });
      setBroadcast(updated);
      toast.success("Transmissão salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!canControl) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { path } = await uploadIgBroadcastVideo({
        data: {
          broadcastId: broadcast.id,
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type || "video/mp4",
        },
      });
      setBroadcast((prev) => ({ ...prev, video_path: path }));
      toast.success("Vídeo enviado");
      const { url } = await getIgBroadcastVideoUrl({ data: { broadcastId: broadcast.id } });
      setVideoPreviewUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleArm = async () => {
    if (!rtmpUrl.trim() || !streamKey.trim()) {
      toast.error("Preencha RTMP URL e stream key");
      return;
    }
    setArming(true);
    try {
      await handleSave();
      await armIgBroadcast({
        data: {
          broadcastId: broadcast.id,
          rtmpUrl: rtmpUrl.trim(),
          streamKey: streamKey.trim(),
          loop: loopEnabled,
        },
      });
      setStreamKey("");
      setArmed(true);
      setRuntimeStatus("armed");
      toast.success("Transmissão armada — chave guardada em memória no worker");
      void refreshEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao armar");
    } finally {
      setArming(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await handleSave();
      const payload: {
        broadcastId: string;
        rtmpUrl?: string;
        streamKey?: string;
        loop?: boolean;
      } = { broadcastId: broadcast.id, loop: loopEnabled };

      if (rtmpUrl.trim()) payload.rtmpUrl = rtmpUrl.trim();
      if (streamKey.trim()) payload.streamKey = streamKey.trim();

      await startIgBroadcast({ data: payload });
      setStreamKey("");
      setRuntimeStatus("starting");
      toast.success("Iniciando transmissão — clique Go Live no Instagram");
      void refreshEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopIgBroadcast({ data: { broadcastId: broadcast.id } });
      setRuntimeStatus("stopped");
      setProcessAlive(false);
      toast.success("Transmissão parada");
      void refreshEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao parar");
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-white/50 hover:text-white">
            <Link to="/admin/instagram-live">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {isNew ? "Nova transmissão" : title || "Transmissão"}
            </h1>
            {!isNew && (
              <IgBroadcastStatusBadge status={runtimeStatus} processAlive={processAlive} />
            )}
          </div>
        </div>

        {!isNew && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
            <Button
              variant="secondary"
              onClick={handleArm}
              disabled={arming || isLive}
            >
              {arming && <Loader2 className="size-4 animate-spin" />}
              Armar transmissão
            </Button>
            <Button onClick={handleStart} disabled={starting || isLive}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Radio className="size-4" />
              )}
              Iniciar
            </Button>
            <Button variant="destructive" onClick={handleStop} disabled={stopping || !isLive}>
              {stopping ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Square className="size-4" />
              )}
              Parar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Configuração</CardTitle>
              <CardDescription className="text-white/45">
                Título, agendamento e opções de reprodução.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Aula ao vivo — Funil Instagram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled">Agendamento (opcional)</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-white/40">
                  Arme a transmissão perto do horário — a stream key expira por sessão.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Repetir vídeo em loop</p>
                  <p className="text-xs text-white/45">Quando terminar, começa de novo do início</p>
                </div>
                <Switch checked={loopEnabled} onCheckedChange={setLoopEnabled} />
              </div>
              {loopEnabled && (
                <p className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/80">
                  Loop ligado pode interromper a live em vídeos curtos. Para o primeiro teste, deixe desligado.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Vídeo</CardTitle>
              <CardDescription className="text-white/45">
                Vertical 9:16 recomendado. O worker converte para 720×1280 @ 30fps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!canControl || uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Enviar vídeo
              </Button>
              {videoPreviewUrl && (
                <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-black">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="mx-auto max-h-[480px] w-full max-w-[270px]"
                    playsInline
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Conectar ao Instagram</CardTitle>
              <CardDescription className="text-white/45">
                Passo a passo para obter RTMP URL e stream key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
                <li>Use conta Instagram <strong className="text-white">Business ou Creator</strong>.</li>
                <li>
                  Abra{" "}
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    instagram.com
                  </a>{" "}
                  no desktop → botão <strong className="text-white">+ (Add post)</strong> →{" "}
                  <strong className="text-white">Live</strong>.
                </li>
                <li>
                  Escolha <strong className="text-white">Practice</strong> para testar ou{" "}
                  <strong className="text-white">Public</strong> para ir ao ar.
                </li>
                <li>
                  Copie a <strong className="text-white">RTMP URL</strong> e a{" "}
                  <strong className="text-white">stream key</strong> → cole abaixo.
                </li>
                <li>
                  Clique <strong className="text-white">Armar</strong> ou{" "}
                  <strong className="text-white">Iniciar</strong>, depois{" "}
                  <strong className="text-white">Go Live</strong> no Instagram.
                </li>
              </ol>

              <Alert className="border-amber-500/20 bg-amber-500/5">
                <AlertCircle className="size-4 text-amber-400" />
                <AlertTitle className="text-amber-100">Stream key sensível</AlertTitle>
                <AlertDescription className="text-amber-100/70">
                  A chave nunca é salva no banco nem enviada ao browser depois do armar/iniciar.
                  Use trilha livre de direitos — música comercial pode derrubar a live.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="rtmp">RTMP URL</Label>
                <Input
                  id="rtmp"
                  value={rtmpUrl}
                  onChange={(e) => setRtmpUrl(e.target.value)}
                  placeholder="rtmps://live-upload.instagram.com:443/rtmp/"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streamKey">Stream key</Label>
                <Input
                  id="streamKey"
                  type="password"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  placeholder={armed ? "Chave armada em memória — cole nova para trocar" : "Cole a chave do Live Producer"}
                  autoComplete="off"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "video", label: "Vídeo enviado" },
                { key: "format", label: "Vídeo vertical (9:16)" },
                { key: "rtmp", label: "Link RTMP do Instagram" },
                { key: "key", label: "Chave de transmissão pronta" },
                { key: "streaming", label: "Enviando para o Instagram" },
              ].map((item) => {
                const done = checklist[item.key as keyof typeof checklist];
                return (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    {done ? (
                      <Check className="size-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-white/25" />
                    )}
                    <span className={cn(done ? "text-white/80" : "text-white/45")}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {!isNew && broadcast.started_at && (
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm text-white">Sessão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-white/60">
                {broadcast.started_at && (
                  <p>Início: {formatBrasiliaDateTime(broadcast.started_at)}</p>
                )}
                {broadcast.ended_at && (
                  <p>Fim: {formatBrasiliaDateTime(broadcast.ended_at)}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Atividade</CardTitle>
              <CardDescription className="text-white/45">
                Acompanhe o que está acontecendo — atualiza a cada 3 segundos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IgBroadcastActivityFeed events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
