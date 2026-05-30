import { ExternalLink, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  describeSchedule,
  formatCountdown,
  getTimeUntilLiveFromWebinar,
  toScheduleConfig,
} from "@/lib/webinar/playback";
import { getSessionState } from "@/lib/webinar/schedule";
import type { Webinar } from "@/lib/supabase/database.types";

interface WaitingRoomProps {
  webinar: Webinar;
  onOpenGroup: () => void;
}

export function WaitingRoom({ webinar, onOpenGroup }: WaitingRoomProps) {
  const config = toScheduleConfig(webinar);
  const timeLeft = getTimeUntilLiveFromWebinar(webinar);
  const { nextSessionStart } = getSessionState(config);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {webinar.waiting_title ?? webinar.title}
          </CardTitle>
          <CardDescription>
            {webinar.waiting_description ?? webinar.description ?? "Aguarde o início da transmissão."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {timeLeft > 0 && (
            <div className="rounded-lg bg-muted px-6 py-4">
              <p className="text-sm text-muted-foreground">A transmissão começa em</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{formatCountdown(timeLeft)}</p>
              <p className="mt-2 text-sm font-medium">{describeSchedule(config)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Próximo início:{" "}
                {nextSessionStart.toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {webinar.group_link && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Entre no grupo enquanto aguarda a live começar
              </p>
              <Button onClick={onOpenGroup} size="lg" className="gap-2">
                <Users className="size-4" />
                Entrar no grupo
                <ExternalLink className="size-3.5 opacity-70" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
