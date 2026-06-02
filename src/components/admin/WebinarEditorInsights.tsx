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
  data: unknown;
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-white/[0.05] bg-[#1A1C22]/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-medium text-white/90">Insights</CardTitle>
            <CardDescription>Leads capturados e transcrição do vídeo</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-white/[0.08] bg-transparent text-white/70 hover:bg-white/[0.04] hover:text-white/90"
          >
            <Link to="/admin/leads">Ver todos os leads</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="leads">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="transcription" disabled={!transcription}>
              Transcrição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
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
                      <TableRow key={lead.id} className="border-white/[0.05]">
                        <TableCell className="whitespace-nowrap text-sm text-white/80">
                          {formatBrasiliaDateTime(lead.registered_at, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-white/90">
                          {leadDisplayName(lead.data)}
                        </TableCell>
                        <TableCell className="text-sm text-[#606270]">
                          {[data.email, data.phone].filter(Boolean).join(" · ") || "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-[#606270]">
                          {[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") ||
                            "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-[#606270]">
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
                  <span className="text-[#606270]">Status:</span>
                  <Badge variant="outline" className="border-white/[0.08] text-[#606270]">
                    {transcription.status}
                  </Badge>
                  {transcription.processed_at && (
                    <span className="text-[#606270]">
                      · processado em {formatBrasiliaDateTime(transcription.processed_at)}
                    </span>
                  )}
                </div>
                {transcription.ai_summary && (
                  <div className="rounded-xl border border-white/[0.06] bg-[#1A1C22]/50 p-4">
                    <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#606270]">
                      Resumo
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">{transcription.ai_summary}</p>
                  </div>
                )}
                {transcription.full_text && (
                  <details className="rounded-xl border border-white/[0.06] p-4">
                    <summary className="cursor-pointer text-sm font-medium text-white/90">
                      Ver transcrição completa
                    </summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-[#141414] p-3 text-xs leading-relaxed text-white/70">
                      {transcription.full_text}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <p className="text-sm text-[#606270]">
                A transcrição aparecerá aqui após o processamento do vídeo.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
