import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ComponentType } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Eye,
  LayoutDashboard,
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
import { supabase } from "@/lib/supabase/client";

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>;

const chartConfig = {
  count: {
    label: "Leads capturados",
    color: "#73a5b6",
  },
} satisfies ChartConfig;

const quickLinks = [
  {
    to: "/admin/webinars" as const,
    label: "Webinars",
    description: "Gerenciar transmissões e conteúdo",
    icon: Video,
  },
  {
    to: "/admin/leads" as const,
    label: "Leads",
    description: "Base de inscritos e contatos",
    icon: Users,
  },
  {
    to: "/admin/webinars/new" as const,
    label: "Novo webinar",
    description: "Criar uma nova transmissão",
    icon: Plus,
  },
  {
    to: "/admin" as const,
    label: "Dashboard",
    description: "Métricas e performance geral",
    icon: LayoutDashboard,
  },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

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
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: authData }) => {
      const email = authData.user?.email ?? "";
      const name = email.split("@")[0] ?? "Admin";
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    });
  }, []);

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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="relative min-w-0">
          <div className="dojo-header-glow" aria-hidden />
          <h1 className="relative text-[2.25rem] font-semibold leading-tight tracking-[-0.03em] text-white">
            {getGreeting()},{" "}
            <span className="text-[#BEDADF]">{userName}</span>
          </h1>
          <p className="relative mt-2 text-[0.9rem] text-[#606270]">
            Dojo · Aqui está o resumo do seu workspace.
          </p>
          <div className="dojo-subtitle-accent" aria-hidden />
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          title={`Atualizado às ${formatBrasiliaDateTime(lastUpdated, { hour: "2-digit", minute: "2-digit" })}`}
          className="relative mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#17181A] text-white/35 transition-colors hover:border-white/[0.1] hover:text-white/60 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* KPI cards — 4 colunas, label caps, número grande, ícone circular à direita */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads" value={summary.totalLeads} icon={UserPlus} />
        <StatCard label="Na live" value={summary.totalAttended} icon={Eye} />
        <StatCard label="Cliques" value={summary.totalTriggerClicks} icon={MousePointerClick} />
        <StatCard label="Webinars" value={summary.publishedWebinars} icon={Video} />
      </div>

      {/* Acesso rápido — lista vertical em um painel único */}
      <div>
        <p className="mb-4 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#606270]">
          Acesso rápido
        </p>
        <div className="dojo-surface-card overflow-hidden">
          {quickLinks.map((item, index) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              className={cn(
                "group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]",
                index < quickLinks.length - 1 && "border-b border-white/[0.05]",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#1A1C22] text-white/40 transition-colors group-hover:border-white/[0.1] group-hover:text-white/60">
                <item.icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9rem] font-medium text-white/90">{item.label}</p>
                <p className="mt-0.5 text-[0.8rem] text-[#606270]">{item.description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-white/15 transition-colors group-hover:text-white/35" />
            </Link>
          ))}
        </div>
      </div>

      {/* Métricas detalhadas — abaixo do fold, mesmo visual */}
      <div className="space-y-6 border-t border-white/[0.05] pt-10">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#606270]">
          Métricas detalhadas
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="Leads hoje" value={summary.leadsToday} icon={UserPlus} />
          <MiniStat
            label="Taxa de comparecimento"
            value={avgRate(webinarStats, "attendanceRate")}
            suffix="%"
            icon={Users}
          />
          <MiniStat
            label="Webinars com cliques"
            value={webinarStats.filter((w) => w.triggerClicks > 0).length}
            icon={MousePointerClick}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <DashboardPanel className="lg:col-span-3">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="size-4 text-white/35" />
              <h2 className="text-[0.9rem] font-medium text-white/90">Leads capturados por dia</h2>
            </div>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
              <BarChart
                key={leadsByDay.map((d) => `${d.date}:${d.count}`).join("|")}
                data={leadsByDay}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  tick={{ fill: "#606270", fontSize: 11 }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="#73a5b6" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ChartContainer>
          </DashboardPanel>

          <DashboardPanel className="lg:col-span-2">
            <h2 className="mb-4 text-[0.9rem] font-medium text-white/90">Cliques recentes</h2>
            {recentClicks.length === 0 ? (
              <p className="py-6 text-center text-[0.8rem] text-[#606270]">
                Nenhum clique registrado ainda.
              </p>
            ) : (
              <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {recentClicks.map((click) => {
                  const leadData = parseLeadData(click.leadData);
                  return (
                    <li
                      key={click.id}
                      className="rounded-xl border border-white/[0.06] bg-[#1A1C22] px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug text-white/90">{click.leadName}</p>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-white/[0.08] bg-transparent text-[10px] text-[#606270]"
                        >
                          {click.triggerType === "cart" ? "Carrinho" : "Botão"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[#606270]">
                        {click.triggerLabel} · {click.webinarTitle}
                      </p>
                      {(leadData.phone || leadData.email) && (
                        <p className="mt-1 text-xs text-[#606270]/80">
                          {[leadData.phone, leadData.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardPanel>
        </div>

        <DashboardPanel>
          <div className="mb-5 flex flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-[0.9rem] font-medium text-white/90">Performance por webinar</h2>
              <p className="mt-0.5 text-[0.8rem] text-[#606270]">
                Inscrições, presença na live e engajamento nos gatilhos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/[0.08] bg-transparent text-white/60 hover:bg-white/[0.04] hover:text-white/90"
            >
              <Link to="/admin/webinars">
                Ver todos
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          {webinarStats.length === 0 ? (
            <p className="py-4 text-center text-[0.8rem] text-[#606270]">
              Nenhum webinar ainda.{" "}
              <Link to="/admin/webinars/new" className="text-brand-teal hover:underline">
                Criar o primeiro
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[#606270]">Webinar</TableHead>
                    <TableHead className="text-right text-[#606270]">Inscritos</TableHead>
                    <TableHead className="text-right text-[#606270]">Assistiram</TableHead>
                    <TableHead className="text-right text-[#606270]">Comparecimento</TableHead>
                    <TableHead className="text-right text-[#606270]">Cliques</TableHead>
                    <TableHead className="hidden md:table-cell text-[#606270]">Presença por dia</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webinarStats.map((w) => (
                    <TableRow key={w.id} className="border-white/[0.06] hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="font-medium text-white/90">{w.title}</p>
                          <p className="text-xs text-[#606270]">/webinar/{w.slug}</p>
                          <Badge
                            variant={w.status === "published" ? "default" : "secondary"}
                            className="mt-1.5 border-white/[0.08] bg-white/[0.04] text-[#606270]"
                          >
                            {statusLabel[w.status] ?? w.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-white/90">
                        {w.leadsRegistered}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-white/70">
                        {w.leadsAttended}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "tabular-nums font-medium",
                            w.attendanceRate >= 50 ? "text-brand-teal" : "text-white/70",
                          )}
                        >
                          {w.attendanceRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-white/70">
                        {w.triggerClicks}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {w.attendanceByDay.length === 0 ? (
                          <span className="text-xs text-[#606270]">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {w.attendanceByDay.slice(0, 4).map((d) => (
                              <Badge
                                key={d.date}
                                variant="outline"
                                className="border-white/[0.08] text-[10px] font-normal text-[#606270]"
                              >
                                {d.date.slice(5).replace("-", "/")}: {d.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                        >
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
        </DashboardPanel>
      </div>
    </div>
  );
}

function DashboardPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("dojo-surface-card p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="dojo-surface-card px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#606270]">
            {label}
          </p>
          <p className="mt-3 text-[2.5rem] font-semibold leading-none tabular-nums tracking-tight text-white">
            {value}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#1A1C22] text-white/30">
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </span>
      </div>
    </div>
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
    <div className="dojo-surface-card flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#1A1C22] text-white/30">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#606270]">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">
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
