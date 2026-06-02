import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Archive,
  ChevronRight,
  ExternalLink,
  Plus,
  Radio,
  Users,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { listWebinarsWithStats } from "@/lib/api/admin.functions";
import { updateWebinarStatus as updateWebinarStatusFn } from "@/lib/api/admin.functions";
import { describeSchedule, toScheduleConfig } from "@/lib/webinar/playback";
import type { WebinarStatus } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type WebinarRow = Awaited<ReturnType<typeof listWebinarsWithStats>>[number];

const STATUS_OPTIONS: { value: WebinarStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

const FILTER_TABS: { key: WebinarStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Rascunhos" },
  { key: "archived", label: "Arquivados" },
];

interface WebinarsListProps {
  webinars: WebinarRow[];
}

export function WebinarsList({ webinars: initialWebinars }: WebinarsListProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [filter, setFilter] = useState<WebinarStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [webinars, setWebinars] = useState(initialWebinars);

  const counts = useMemo(
    () => ({
      all: webinars.length,
      published: webinars.filter((w) => w.status === "published").length,
      draft: webinars.filter((w) => w.status === "draft").length,
      archived: webinars.filter((w) => w.status === "archived").length,
    }),
    [webinars],
  );

  const filtered = useMemo(
    () => (filter === "all" ? webinars : webinars.filter((w) => w.status === filter)),
    [webinars, filter],
  );

  const handleStatusChange = async (id: string, status: WebinarStatus) => {
    setUpdatingId(id);
    try {
      await updateWebinarStatusFn({ data: { id, status } });
      setWebinars((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
      toast.success(`Status alterado para ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`);
      void router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openWebinar = (id: string) => {
    void navigate({ to: "/admin/webinars/$id", params: { id } });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Webinars</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie eventos, status de publicação e acesse a configuração de cada um
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/admin/webinars/new">
            <Plus className="size-4" />
            Novo webinar
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat icon={Video} label="Total" value={counts.all} />
        <MiniStat icon={Radio} label="Publicados" value={counts.published} />
        <MiniStat icon={Archive} label="Rascunhos / arquivados" value={counts.draft + counts.archived} />
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div>
            <CardTitle className="text-lg">Lista de webinars</CardTitle>
            <CardDescription>Clique em qualquer linha para abrir o editor</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                size="sm"
                variant={filter === tab.key ? "default" : "outline"}
                onClick={() => setFilter(tab.key)}
                className="h-8"
              >
                {tab.label}
                <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                  {counts[tab.key === "all" ? "all" : tab.key]}
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Video className="mx-auto size-10 text-muted-foreground/40" strokeWidth={1.25} />
              <p className="mt-4 font-medium">Nenhum webinar neste filtro</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {webinars.length === 0 ? (
                  <>
                    Crie seu primeiro evento.{" "}
                    <Link to="/admin/webinars/new" className="text-primary hover:underline">
                      Novo webinar
                    </Link>
                  </>
                ) : (
                  "Tente outro filtro de status."
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[200px]">Webinar</TableHead>
                    <TableHead className="hidden md:table-cell">Agendamento</TableHead>
                    <TableHead className="text-right">Inscritos</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Modo</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w) => (
                    <TableRow
                      key={w.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => openWebinar(w.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openWebinar(w.id);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`Abrir ${w.title}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Video className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-snug">{w.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              /webinar/{w.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] text-sm text-muted-foreground md:table-cell">
                        {describeSchedule(toScheduleConfig(w))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-end gap-1 tabular-nums font-medium">
                          <Users className="size-3.5 text-muted-foreground" />
                          {w.leadCount}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <Select
                          value={w.status}
                          disabled={updatingId === w.id}
                          onValueChange={(v) => void handleStatusChange(w.id, v as WebinarStatus)}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-full min-w-[130px] border-0 shadow-none focus:ring-1",
                              statusTriggerClass(w.status),
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-normal">
                          {w.display_mode === "live" ? "Ao vivo" : "Gravada"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          {w.status === "published" && (
                            <Button variant="ghost" size="icon" className="size-8" asChild>
                              <Link
                                to="/webinar/$slug"
                                params={{ slug: w.slug }}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="size-4" />
                                <span className="sr-only">Ver página pública</span>
                              </Link>
                            </Button>
                          )}
                          <ChevronRight className="size-4 opacity-40" aria-hidden />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function statusTriggerClass(status: WebinarStatus): string {
  switch (status) {
    case "published":
      return "bg-primary/10 text-primary hover:bg-primary/15";
    case "archived":
      return "bg-muted text-muted-foreground hover:bg-muted/80";
    default:
      return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400";
  }
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Video;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
