import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listLeads } from "@/lib/api/admin.functions";
import { formatBrasiliaDateTime } from "@/lib/webinar/datetime";
import type { Json } from "@/lib/supabase/database.types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/leads/")({
  loader: () => listLeads(),
  component: LeadsPage,
});

type LeadRow = Awaited<ReturnType<typeof listLeads>>[number];

function parseLeadData(data: Json): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null) result[key] = String(value);
  }
  return result;
}

function LeadsPage() {
  const leads = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Leads"
        subtitle="Todos os horários exibidos em Brasília (UTC−3)"
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.05] hover:bg-transparent">
                <TableHead>Data (Brasília)</TableHead>
                <TableHead>Webinar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem (UTM)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: LeadRow) => {
                const data = parseLeadData(lead.data);
                const extraKeys = Object.keys(data).filter(
                  (k) => !["name", "phone", "email"].includes(k),
                );

                return (
                  <TableRow key={lead.id} className="border-white/[0.05]">
                    <TableCell className="whitespace-nowrap text-sm text-white/80">
                      {formatBrasiliaDateTime(lead.registered_at, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {lead.webinar ? (
                        <div>
                          <Link
                            to="/admin/webinars/$id"
                            params={{ id: lead.webinar_id }}
                            className="font-medium text-white/90 hover:text-brand-teal hover:underline"
                          >
                            {lead.webinar.title}
                          </Link>
                          <p className="text-xs text-[#606270]">/webinar/{lead.webinar.slug}</p>
                        </div>
                      ) : (
                        <span className="text-[#606270]">{lead.webinar_id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">{data.name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-white/80">{data.phone ?? "—"}</TableCell>
                    <TableCell className="text-white/80">{data.email ?? "—"}</TableCell>
                    <TableCell className="text-xs text-[#606270]">
                      <div className="space-y-0.5">
                        {lead.utm_source && <div>source: {lead.utm_source}</div>}
                        {lead.utm_medium && <div>medium: {lead.utm_medium}</div>}
                        {lead.utm_campaign && <div>campaign: {lead.utm_campaign}</div>}
                        {!lead.utm_source && !lead.utm_medium && !lead.utm_campaign && "—"}
                        {extraKeys.length > 0 && (
                          <div className="mt-1 text-[10px] opacity-70">
                            +{extraKeys.length} campo(s) extra
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-[#606270]">
                    Nenhum lead registrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
