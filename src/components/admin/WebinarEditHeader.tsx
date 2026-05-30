import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CopyWebinarLink } from "@/components/admin/CopyWebinarLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WebinarStatus } from "@/lib/supabase/database.types";
import { WEBINAR_STATUS_LABELS } from "@/lib/webinar/status-labels";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<WebinarStatus, string> = {
  published: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20",
  draft: "bg-amber-600/10 text-amber-800 dark:text-amber-400 border-amber-600/20",
  archived: "bg-muted text-muted-foreground",
};

interface WebinarEditHeaderProps {
  title: string;
  slug: string;
  status: WebinarStatus;
}

export function WebinarEditHeader({ title, slug, status }: WebinarEditHeaderProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2 text-muted-foreground">
        <Link to="/admin/webinars">
          <ArrowLeft className="size-4" />
          Voltar aos webinars
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <Badge variant="outline" className={cn("font-medium", STATUS_BADGE[status])}>
                  {WEBINAR_STATUS_LABELS[status]}
                </Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">/webinar/{slug}</p>
            </div>

            {status === "published" && (
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link to="/webinar/$slug" params={{ slug }} target="_blank">
                  <ExternalLink className="mr-2 size-4" />
                  Ver página pública
                </Link>
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <CopyWebinarLink slug={slug} published={status === "published"} variant="inline" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
