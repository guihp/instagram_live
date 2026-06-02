import { Link } from "@tanstack/react-router";

import { formatBrasiliaDateTime } from "@/lib/webinar/datetime";
import { leadDisplayName, parseLeadData } from "@/lib/webinar/lead-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeadRow {
  id: string;
  registered_at: string;
  data: import("@/lib/supabase/database.types").Json;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface TranscriptionRow {
  status: string;
  processed_at: string | null;
  ai_summary: string | null;
  full_text: string | null;
}

interface WebinarEditorInsightsProps {
  leads: LeadRow[];
  transcription: TranscriptionRow | null;
}

export function WebinarEditorInsights({ leads, transcription }: WebinarEditorInsightsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Insights</CardTitle>
            <CardDescription>Leads capturados e transcrição do vídeo</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/leads">Ver todos os leads</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leads">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="transcription" disabled={!transcription}>
              Transcrição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-0">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inscrição</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>UTM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const data = parseLeadData(lead.data);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatBrasiliaDateTime(lead.registered_at, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{leadDisplayName(lead.data)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[data.email, data.phone].filter(Boolean).join(" · ") || "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") ||
                            "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        Nenhum lead inscrito neste webinar ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transcription" className="mt-0 space-y-4">
            {transcription ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{transcription.status}</Badge>
                  {transcription.processed_at && (
                    <span className="text-muted-foreground">
                      · processado em {formatBrasiliaDateTime(transcription.processed_at)}
                    </span>
                  )}
                </div>
                {transcription.ai_summary && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Resumo
                    </p>
                    <p className="text-sm leading-relaxed">{transcription.ai_summary}</p>
                  </div>
                )}
                {transcription.full_text && (
                  <details className="rounded-lg border p-4">
                    <summary className="cursor-pointer text-sm font-medium">Ver transcrição completa</summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed">
                      {transcription.full_text}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                A transcrição aparecerá aqui após o processamento do vídeo.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
