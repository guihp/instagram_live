import { Link, useRouter } from "@tanstack/react-router";
import { ChevronRight, Loader2, Plus, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IgBroadcastStatusBadge } from "@/components/instagram-live/IgBroadcastStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteIgBroadcast } from "@/lib/api/ig-live.functions";
import type { IgBroadcast } from "@/lib/supabase/database.types";
import { formatBrasiliaDateTime } from "@/lib/datetime";

interface IgBroadcastListProps {
  broadcasts: IgBroadcast[];
}

export function IgBroadcastList({ broadcasts: initialBroadcasts }: IgBroadcastListProps) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [deleteTarget, setDeleteTarget] = useState<IgBroadcast | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteIgBroadcast({ data: { id: deleteTarget.id } });
      setBroadcasts((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success(`«${deleteTarget.title}» excluída`);
      setDeleteTarget(null);
      void router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Instagram Live</h1>
          <p className="mt-1 text-sm text-white/50">
            Transmita vídeo pré-gravado para o Live Producer do Instagram via RTMP.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/admin/instagram-live/new">
            <Plus className="size-4" />
            Nova transmissão
          </Link>
        </Button>
      </div>

      {broadcasts.length === 0 ? (
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Radio className="size-5 text-white/50" />
              Nenhuma transmissão
            </CardTitle>
            <CardDescription className="text-white/45">
              Crie uma transmissão, envie um vídeo vertical e conecte ao Instagram Live Producer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/instagram-live/new">Criar primeira transmissão</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-white/50">Título</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="hidden text-white/50 md:table-cell">Agendamento</TableHead>
                <TableHead className="hidden text-white/50 sm:table-cell">Criada</TableHead>
                <TableHead className="w-[88px] text-right text-white/50">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((b) => (
                <TableRow key={b.id} className="border-white/[0.06] hover:bg-white/[0.02]">
                  <TableCell className="font-medium text-white">{b.title}</TableCell>
                  <TableCell>
                    <IgBroadcastStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="hidden text-white/60 md:table-cell">
                    {b.scheduled_at ? formatBrasiliaDateTime(b.scheduled_at) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-white/60 sm:table-cell">
                    {formatBrasiliaDateTime(b.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        to="/admin/instagram-live/$id"
                        params={{ id: b.id }}
                        className="inline-flex size-8 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      >
                        <ChevronRight className="size-4" />
                        <span className="sr-only">Abrir</span>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-white/35 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => setDeleteTarget(b)}
                        aria-label={`Excluir ${b.title}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-white/10 bg-[#1A1C22] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transmissão?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {deleteTarget && (
                <>
                  <strong className="text-white/90">{deleteTarget.title}</strong> será removida
                  permanentemente, incluindo o vídeo enviado e o histórico de atividade.
                  {deleteTarget.status === "live" || deleteTarget.status === "starting" ? (
                    <span className="mt-2 block text-amber-200/90">
                      Esta transmissão está ao vivo — o envio será interrompido antes de excluir.
                    </span>
                  ) : null}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="border-white/10 bg-transparent text-white hover:bg-white/5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
