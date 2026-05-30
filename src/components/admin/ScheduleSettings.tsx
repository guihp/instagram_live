import { Calendar, CalendarDays, CalendarRange } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isoToBrasiliaParts } from "@/lib/webinar/datetime";
import {
  buildScheduledAt,
  describeSchedule,
  getWeekdayLabel,
  WEEKDAY_LABELS,
  type ScheduleRecurrence,
} from "@/lib/webinar/schedule";

export interface ScheduleFormValues {
  schedule_recurrence: ScheduleRecurrence;
  schedule_weekday: number | null;
  schedule_date: string;
  schedule_time: string;
  scheduled_at: string;
}

interface ScheduleSettingsProps {
  values: ScheduleFormValues;
  onChange: (values: ScheduleFormValues) => void;
}

const RECURRENCE_OPTIONS: {
  value: ScheduleRecurrence;
  label: string;
  description: string;
  icon: typeof Calendar;
}[] = [
  {
    value: "once",
    label: "Uma vez",
    description: "Data e hora específicas — acontece só uma vez",
    icon: Calendar,
  },
  {
    value: "daily",
    label: "Todos os dias",
    description: "Mesmo horário, todos os dias da semana",
    icon: CalendarDays,
  },
  {
    value: "weekly",
    label: "Dia da semana",
    description: "Um dia fixo por semana, ex: toda terça às 19h",
    icon: CalendarRange,
  },
];

export function ScheduleSettings({ values, onChange }: ScheduleSettingsProps) {
  const set = (patch: Partial<ScheduleFormValues>) => {
    const next = { ...values, ...patch };
    onChange(next);
  };

  const previewConfig = {
    scheduled_at: buildScheduledAt(
      values.schedule_recurrence,
      values.schedule_recurrence === "once"
        ? values.scheduled_at.slice(0, 10)
        : values.schedule_date,
      values.schedule_recurrence === "once"
        ? values.scheduled_at.slice(11, 16)
        : values.schedule_time,
    ),
    schedule_recurrence: values.schedule_recurrence,
    schedule_weekday: values.schedule_weekday,
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <Label className="text-base font-semibold">Quando a aula acontece</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Defina se a transmissão é única, diária ou em um dia fixo da semana. Horários em Brasília (UTC−3).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {RECURRENCE_OPTIONS.map((opt) => {
          const selected = values.schedule_recurrence === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const patch: Partial<ScheduleFormValues> = { schedule_recurrence: opt.value };
                if (opt.value === "weekly" && values.schedule_weekday === null) {
                  patch.schedule_weekday = new Date().getDay();
                }
                set(patch);
              }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-background hover:bg-muted/50",
              )}
            >
              <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
              <span className="font-medium text-sm">{opt.label}</span>
              <span className="text-xs text-muted-foreground leading-snug">{opt.description}</span>
            </button>
          );
        })}
      </div>

      {values.schedule_recurrence === "once" && (
        <div className="space-y-2">
          <Label>Data e hora da transmissão</Label>
          <Input
            type="datetime-local"
            value={values.scheduled_at}
            onChange={(e) => set({ scheduled_at: e.target.value })}
          />
        </div>
      )}

      {values.schedule_recurrence === "daily" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Horário (todos os dias)</Label>
            <Input
              type="time"
              value={values.schedule_time}
              onChange={(e) => set({ schedule_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Primeira transmissão a partir de</Label>
            <Input
              type="date"
              value={values.schedule_date}
              onChange={(e) => set({ schedule_date: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Antes dessa data, a sala de espera fica ativa.
            </p>
          </div>
        </div>
      )}

      {values.schedule_recurrence === "weekly" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Dia da semana</Label>
            <Select
              value={String(values.schedule_weekday ?? 0)}
              onValueChange={(v) => set({ schedule_weekday: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEEKDAY_LABELS.map((label, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input
              type="time"
              value={values.schedule_time}
              onChange={(e) => set({ schedule_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Primeira transmissão a partir de</Label>
            <Input
              type="date"
              value={values.schedule_date}
              onChange={(e) => set({ schedule_date: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border bg-background px-3 py-2 text-sm">
        <span className="text-muted-foreground">Resumo: </span>
        <strong>{describeSchedule(previewConfig)}</strong>
        {values.schedule_recurrence === "weekly" && values.schedule_weekday !== null && (
          <span className="text-muted-foreground">
            {" "}
            ({getWeekdayLabel(values.schedule_weekday)})
          </span>
        )}
      </div>
    </div>
  );
}

export function scheduleFormToPayload(values: ScheduleFormValues) {
  if (values.schedule_recurrence === "once") {
    return {
      scheduled_at: buildScheduledAt("once", values.scheduled_at, values.scheduled_at.slice(11, 16)),
      schedule_recurrence: "once" as const,
      schedule_weekday: null,
    };
  }

  return {
    scheduled_at: buildScheduledAt(
      values.schedule_recurrence,
      values.schedule_date,
      values.schedule_time,
    ),
    schedule_recurrence: values.schedule_recurrence,
    schedule_weekday: values.schedule_recurrence === "weekly" ? values.schedule_weekday : null,
  };
}

export function scheduleFromWebinar(webinar: {
  scheduled_at: string;
  schedule_recurrence?: string | null;
  schedule_weekday?: number | null;
}): ScheduleFormValues {
  const recurrence = (webinar.schedule_recurrence as ScheduleRecurrence) ?? "once";
  const { date, time, datetimeLocal } = isoToBrasiliaParts(webinar.scheduled_at);

  return {
    schedule_recurrence: recurrence,
    schedule_weekday: webinar.schedule_weekday ?? null,
    schedule_date: date,
    schedule_time: time,
    scheduled_at: datetimeLocal,
  };
}
