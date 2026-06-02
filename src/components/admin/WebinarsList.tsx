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

import { AdminMiniStat } from "@/components/admin/AdminMiniStat";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
      <AdminPageHeader
        title="Webinars"
        subtitle="Gerencie eventos, status de publicação e acesse a configuração de cada um"
        action={
          <Button asChild variant="dojo">
            <Link to="/admin/webinars/new">
              <Plus className="size-4" />
              Novo webinar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMiniStat icon={Video} label="Total" value={counts.all} />
        <AdminMiniStat icon={Radio} label="Publicados" value={counts.published} />
        <AdminMiniStat icon={Archive} label="Rascunhos / arquivados" value={counts.draft + counts.archived} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 border-b border-white/[0.05] bg-[#1A1C22]/40 pb-4">
          <div>
            <CardTitle className="text-base font-medium text-white/90">Lista de webinars</CardTitle>
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
                className={cn(
                  "h-8",
                  filter === tab.key
                    ? "bg-brand-teal/15 text-brand-teal hover:bg-brand-teal/20"
                    : "border-white/[0.08] bg-transparent text-[#606270] hover:bg-white/[0.04] hover:text-white/80",
                )}
              >
                {tab.label}
                <span className="ml-1.5 rounded-full bg-white/[0.06] px-1.5 text-xs tabular-nums">
                  {counts[tab.key === "all" ? "all" : tab.key]}
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Video className="mx-auto size-10 text-white/20" strokeWidth={1.25} />
              <p className="mt-4 font-medium text-white/90">Nenhum webinar neste filtro</p>
              <p className="mt-1 text-sm text-[#606270]">
                {webinars.length === 0 ? (
                  <>
                    Crie seu primeiro evento.{" "}
                    <Link to="/admin/webinars/new" className="text-brand-teal hover:underline">
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
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
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
                      className="cursor-pointer border-white/[0.05] hover:bg-white/[0.02]"
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
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#1A1C22] text-brand-teal/80">
                            <Video className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-snug text-white/90">{w.title}</p>
                            <p className="truncate text-xs text-[#606270]">/webinar/{w.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] text-sm text-[#606270] md:table-cell">
                        {describeSchedule(toScheduleConfig(w))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-end gap-1 tabular-nums font-medium text-white/90">
                          <Users className="size-3.5 text-[#606270]" />
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
                              "h-8 w-full min-w-[130px] border-0 bg-transparent shadow-none focus:ring-1",
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
                        <Badge
                          variant="outline"
                          className="border-white/[0.08] bg-white/[0.02] font-normal text-[#606270]"
                        >
                          {w.display_mode === "live" ? "Ao vivo" : "Gravada"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-[#606270]"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          {w.status === "published" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-[#606270] hover:bg-white/[0.04] hover:text-white/80"
                              asChild
                            >
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
      return "bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/15";
    case "archived":
      return "bg-white/[0.04] text-[#606270] hover:bg-white/[0.06]";
    default:
      return "bg-amber-500/10 text-amber-400/90 hover:bg-amber-500/15";
  }
}
