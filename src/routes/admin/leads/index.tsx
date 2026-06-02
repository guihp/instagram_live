import { Link, createFileRoute } from "@tanstack/react-router";

import { listLeads } from "@/lib/api/admin.functions";
import { formatBrasiliaDateTime } from "@/lib/webinar/datetime";
import type { Json } from "@/lib/supabase/database.types";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leads</h2>
        <p className="text-sm text-muted-foreground">
          Todos os horários exibidos em Brasília (UTC−3)
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap text-sm">
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
                          className="font-medium hover:underline"
                        >
                          {lead.webinar.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">/webinar/{lead.webinar.slug}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{lead.webinar_id}</span>
                    )}
                  </TableCell>
                  <TableCell>{data.name ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{data.phone ?? "—"}</TableCell>
                  <TableCell>{data.email ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum lead registrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
