"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  downloadIcs,
  googleCalendarUrl,
  type CalendarEntry,
} from "@/lib/calendar";
import {
  STATUS_ACCENT_CLASS,
  roleCategoryOf,
  modeConfig,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import {
  bundeslandLabel,
  dayKey,
  holidaysByDayKey,
  type Bundesland,
  type GermanHoliday,
} from "@/lib/holidays";
import { applicationHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";

const WEEK_STARTS_ON = 1;
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function entryDotClass(entry: CalendarEntry): string {
  return entry.kind === "interview"
    ? STATUS_ACCENT_CLASS[entry.application.status]
    : "bg-sky-500";
}

function roleLabelOf(application: Application): string {
  return (
    roleCategoryOf(application) ||
    `${modeConfig(application.type).roleLabel} offen`
  );
}

function EntryChip({ entry }: { entry: CalendarEntry }) {
  const time = entry.kind === "interview" ? format(entry.date, "HH:mm") : "";
  return (
    <span className="flex w-full min-w-0 items-center gap-1 rounded bg-muted/70 px-1 py-0.5 text-[11px] leading-tight">
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", entryDotClass(entry))}
      />
      {time ? (
        <span className="shrink-0 font-medium tabular-nums">{time}</span>
      ) : null}
      <span className="truncate">
        {entry.application.unternehmen || "Unbekannt"}
      </span>
    </span>
  );
}

function LegendItem({
  swatch,
  label,
}: {
  swatch: ReactNode;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
}

function CalendarLegend({ region }: { region: Bundesland }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <LegendItem
        swatch={
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            1
          </span>
        }
        label="Heute"
      />
      <LegendItem
        swatch={
          <span className="size-3 rounded-sm bg-primary/20 ring-1 ring-primary/40 ring-inset" />
        }
        label="Mit Termin"
      />
      <LegendItem
        swatch={<span className="size-3 rounded-sm bg-rose-500/40" />}
        label={`Feiertag (${bundeslandLabel(region)})`}
      />
      <LegendItem
        swatch={<span className="size-3 rounded-sm bg-muted/60 ring-1 ring-border" />}
        label="Anderer Monat"
      />
      <LegendItem
        swatch={<span className="size-2 rounded-full bg-emerald-500" />}
        label="Gesprächstermin (Farbe = Status)"
      />
      <LegendItem
        swatch={<span className="size-2 rounded-full bg-sky-500" />}
        label="Wiedervorlage"
      />
    </div>
  );
}

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entries: CalendarEntry[];
  region: Bundesland;
}

export function MonthCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  entries,
  region,
}: MonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const holidays = useMemo(() => {
    const years = [...new Set(days.map((day) => day.getFullYear()))];
    return holidaysByDayKey(years, region);
  }, [days, region]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const key = format(entry.date, "yyyy-MM-dd");
      const list = map.get(key);
      if (list) list.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  }, [entries]);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base capitalize sm:text-lg">
            {format(month, "MMMM yyyy", { locale: de })}
          </CardTitle>
          <CardDescription className="hidden sm:block">
            Tage mit Terminen sind farbig markiert.
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(startOfMonth(new Date()))}
          >
            Heute
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Vorheriger Monat"
            onClick={() => onMonthChange(subMonths(month, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Nächster Monat"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-w-0">
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEntries = entriesByDay.get(format(day, "yyyy-MM-dd")) ?? [];
              const selected = isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, month);
              const holiday = inMonth ? holidays.get(dayKey(day)) : undefined;
              const today = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex min-h-[68px] min-w-0 flex-col gap-1 border-r border-b p-1 text-left transition-colors",
                    "[&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                    "hover:bg-muted/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    "sm:min-h-[112px] sm:p-1.5 lg:min-h-[140px]",
                    // Month separation: adjacent months are clearly greyed out.
                    !inMonth && "bg-muted/60 text-muted-foreground/70",
                    // In-month tiles get a colour code.
                    inMonth &&
                      (holiday
                        ? "bg-rose-500/15"
                        : dayEntries.length > 0
                          ? "bg-primary/[0.07]"
                          : isWeekend
                            ? "bg-muted/25"
                            : ""),
                    // Mark where the new month starts.
                    inMonth && day.getDate() === 1 && "border-l-2 border-l-primary/50",
                    selected && "ring-2 ring-primary ring-inset",
                  )}
                >
                  {inMonth ? (
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums sm:size-6 sm:text-sm",
                        today && "bg-primary text-primary-foreground",
                        holiday &&
                          !today &&
                          "font-semibold text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  ) : (
                    <span className="shrink-0 px-0.5 text-[10px] font-medium tabular-nums sm:text-xs">
                      {format(day, "d. MMM", { locale: de })}
                    </span>
                  )}

                  {holiday ? (
                    <span
                      className="hidden truncate text-[11px] leading-tight font-medium text-rose-600 sm:block dark:text-rose-400"
                      title={holiday.name}
                    >
                      {holiday.name}
                    </span>
                  ) : null}

                  <div className="flex w-full min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {dayEntries.slice(0, 4).map((entry) => (
                        <span
                          key={entry.key}
                          aria-hidden
                          className={cn(
                            "size-1.5 rounded-full",
                            entryDotClass(entry),
                          )}
                        />
                      ))}
                    </div>

                    <div className="hidden w-full min-w-0 flex-col gap-0.5 sm:flex">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <EntryChip key={entry.key} entry={entry} />
                      ))}
                      {dayEntries.length > 3 ? (
                        <span className="pl-1 text-[11px] text-muted-foreground">
                          +{dayEntries.length - 3} weitere
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <CalendarLegend region={region} />
      </CardContent>
    </Card>
  );
}

export function CalendarEntryRow({ entry }: { entry: CalendarEntry }) {
  const { application, kind } = entry;
  const googleUrl = kind === "interview" ? googleCalendarUrl(application) : null;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", entryDotClass(entry))}
          />
          <span className="truncate text-sm font-medium tabular-nums">
            {kind === "interview"
              ? `${format(entry.date, "HH:mm")} Uhr`
              : "Wiedervorlage"}
          </span>
          <StatusBadge status={application.status} />
        </div>
        <Link
          href={applicationHref(application.id)}
          className="mt-1 block truncate text-sm font-medium hover:underline"
        >
          {application.unternehmen || "Unbekanntes Unternehmen"}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {roleLabelOf(application)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {googleUrl ? (
          <Button asChild variant="outline" size="icon-sm">
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="In Google Calendar öffnen"
              title="In Google Calendar öffnen"
            >
              <CalendarPlus />
            </a>
          </Button>
        ) : null}
        {kind === "interview" ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => downloadIcs(application)}
            aria-label="Als ICS herunterladen"
            title="Als ICS herunterladen"
          >
            <Download />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CalendarAgenda({
  date,
  entries,
  holiday,
}: {
  date: Date;
  entries: CalendarEntry[];
  holiday?: GermanHoliday | null;
}) {
  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          {format(date, "EEEE, d. MMMM", { locale: de })}
        </CardTitle>
        <CardDescription>
          {entries.length === 0
            ? "Keine Einträge"
            : `${entries.length} ${entries.length === 1 ? "Eintrag" : "Einträge"}`}
        </CardDescription>
        {holiday ? (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span aria-hidden className="size-1.5 rounded-full bg-rose-500" />
            {holiday.name}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {entries.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nichts geplant"
            description="An diesem Tag stehen keine Gesprächstermine oder Wiedervorlagen an."
            className="py-10"
          />
        ) : (
          <ScrollArea className="h-80 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <div className="flex w-full min-w-0 flex-col gap-2 pe-1">
              {entries.map((entry) => (
                <CalendarEntryRow key={entry.key} entry={entry} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/** Used by the dashboard's "Anstehende Termine" card. */
export function InterviewRow({ application }: { application: Application }) {
  const googleUrl = googleCalendarUrl(application);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tabular-nums">
          {formatDateTime(application.interviewAt)}
        </p>
        <Link
          href={applicationHref(application.id)}
          className="block truncate text-sm font-medium hover:underline"
        >
          {application.unternehmen || "Unbekanntes Unternehmen"}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {roleLabelOf(application)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {googleUrl ? (
          <Button asChild variant="outline" size="icon-sm">
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="In Google Calendar öffnen"
              title="In Google Calendar öffnen"
            >
              <CalendarPlus />
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => downloadIcs(application)}
          aria-label="Als ICS herunterladen"
          title="Als ICS herunterladen"
        >
          <Download />
        </Button>
      </div>
    </div>
  );
}
