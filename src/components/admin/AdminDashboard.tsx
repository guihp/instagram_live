import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowUpRight,
  Eye,
  MousePointerClick,
  Plus,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { getDashboardStats } from "@/lib/api/admin.functions";
import { formatBrasiliaDateTime } from "@/lib/webinar/datetime";
import { parseLeadData } from "@/lib/webinar/lead-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>;

const chartConfig = {
  count: {
    label: "Leads capturados",
    color: "oklch(0.208 0.042 265.755)",
  },
} satisfies ChartConfig;

const statusLabel: Record<string, string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
};

const AUTO_REFRESH_MS = 30_000;

interface AdminDashboardProps {
  data: DashboardData;
}

export function AdminDashboard({ data: initialData }: AdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  useEffect(() => {
    setData(initialData);
    setLastUpdated(new Date());
  }, [initialData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await getDashboardStats();
      setData(fresh);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  const { summary, leadsByDay, webinarStats, recentClicks } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Métricas de captura, presença na live e cliques nos gatilhos · horários em Brasília
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Ao vivo
            </span>
            Atualizado às{" "}
            {formatBrasiliaDateTime(lastUpdated, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
            · refresh a cada 30s
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button asChild className="shrink-0">
            <Link to="/admin/webinars/new">
              <Plus className="size-4" />
              Novo webinar
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads capturados"
          value={summary.totalLeads}
          hint={`${summary.leadsToday} hoje`}
          icon={UserPlus}
        />
        <StatCard
          label="Assistiram à live"
          value={summary.totalAttended}
          hint="Entraram na sala ao vivo"
          icon={Eye}
        />
        <StatCard
          label="Cliques em gatilhos"
          value={summary.totalTriggerClicks}
          hint={`${summary.uniqueClickers} leads únicos`}
          icon={MousePointerClick}
        />
        <StatCard
          label="Webinars publicados"
          value={summary.publishedWebinars}
          hint={`${summary.totalWebinars} no total`}
          icon={Video}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              Leads capturados por dia
            </CardTitle>
            <CardDescription>Últimos 14 dias (fuso de Brasília)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
              <BarChart
                key={leadsByDay.map((d) => `${d.date}:${d.count}`).join("|")}
                data={leadsByDay}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent clicks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Cliques recentes</CardTitle>
            <CardDescription>Quem clicou nos botões do vídeo</CardDescription>
          </CardHeader>
          <CardContent>
            {recentClicks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum clique registrado ainda. Os gatilhos são contabilizados quando o lead clica
                na live.
              </p>
            ) : (
              <ul className="max-h-[240px] space-y-3 overflow-y-auto pr-1">
                {recentClicks.map((click) => {
                  const data = parseLeadData(click.leadData);
                  return (
                    <li
                      key={click.id}
                      className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">{click.leadName}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {click.triggerType === "cart" ? "Carrinho" : "Botão"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {click.triggerLabel} · {click.webinarTitle}
                      </p>
                      {(data.phone || data.email) && (
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {[data.phone, data.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {formatBrasiliaDateTime(click.clickedAt, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-webinar table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Performance por webinar</CardTitle>
            <CardDescription>
              Inscrições, presença na live, taxa de comparecimento e engajamento nos gatilhos
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/webinars">
              Ver todos
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {webinarStats.length === 0 ? (
            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum webinar ainda.{" "}
                <Link to="/admin/webinars/new" className="font-medium text-primary hover:underline">
                  Criar o primeiro
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webinar</TableHead>
                    <TableHead className="text-right">Inscritos</TableHead>
                    <TableHead className="text-right">Assistiram</TableHead>
                    <TableHead className="text-right">Comparecimento</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="hidden md:table-cell">Presença por dia</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webinarStats.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="font-medium">{w.title}</p>
                          <p className="text-xs text-muted-foreground">/webinar/{w.slug}</p>
                          <Badge
                            variant={w.status === "published" ? "default" : "secondary"}
                            className="mt-1.5"
                          >
                            {statusLabel[w.status] ?? w.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {w.leadsRegistered}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {w.leadsAttended}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "tabular-nums font-medium",
                            w.attendanceRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "",
                          )}
                        >
                          {w.attendanceRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {w.triggerClicks}
                        {w.uniqueClickers > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {w.uniqueClickers} lead{w.uniqueClickers !== 1 ? "s" : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {w.attendanceByDay.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {w.attendanceByDay.slice(0, 4).map((d) => (
                              <Badge key={d.date} variant="outline" className="text-[10px] font-normal">
                                {d.date.slice(5).replace("-", "/")}: {d.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/admin/webinars/$id" params={{ id: w.id }}>
                            Abrir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Rascunhos" value={summary.draftWebinars} icon={Video} />
        <MiniStat label="Taxa média de comparecimento" value={avgRate(webinarStats, "attendanceRate")} suffix="%" icon={Users} />
        <MiniStat label="Webinars com cliques" value={webinarStats.filter((w) => w.triggerClicks > 0).length} icon={MousePointerClick} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  suffix = "",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}

function avgRate(
  stats: DashboardData["webinarStats"],
  key: "attendanceRate" | "clickRate",
): number {
  if (stats.length === 0) return 0;
  const sum = stats.reduce((acc, s) => acc + s[key], 0);
  return Math.round(sum / stats.length);
}
