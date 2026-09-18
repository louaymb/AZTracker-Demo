"use client";

import { endOfMonth, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { CalendarClock, CalendarDays, Download, Inbox } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarAgenda,
  InterviewRow,
  MonthCalendar,
} from "@/components/calendar/interview-calendar";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import {
  buildCalendarEntries,
  downloadEntriesIcs,
  type CalendarEntry,
} from "@/lib/calendar";
import { daysUntil, toDate } from "@/lib/format";
import {
  DEFAULT_BUNDESLAND,
  dayKey,
  holidaysByDayKey,
  isBundesland,
  type Bundesland,
} from "@/lib/holidays";

function firstRelevantDate(entries: CalendarEntry[]): Date {
  const today = startOfDay(new Date());
  const next = entries.find((entry) => startOfDay(entry.date) >= today);
  return next?.date ?? new Date();
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Skeleton className="h-[34rem] w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

export default function CalendarPage() {
  const { applications, loading, error } = useApplications();
  const { mode, labels } = useAppMode();
  const { profile } = useAuth();

  const storedBundesland = profile?.settings?.bundesland;
  const region: Bundesland = isBundesland(storedBundesland)
    ? storedBundesland
    : DEFAULT_BUNDESLAND;

  const scopedApplications = useMemo(
    () => applications.filter((application) => application.type === mode),
    [applications, mode],
  );

  const entries = useMemo(
    () => buildCalendarEntries(scopedApplications),
    [scopedApplications],
  );

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    firstRelevantDate(entries),
  );
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(firstRelevantDate(entries)),
  );

  // Applications load asynchronously, so jump to the next appointment once the
  // data arrives (only if the user has not navigated yet).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || entries.length === 0) return;
    didInit.current = true;
    const target = firstRelevantDate(entries);
    setSelectedDate(target);
    setMonth(startOfMonth(target));
  }, [entries]);

  const dayEntries = useMemo(
    () =>
      entries.filter((entry) => isSameDay(entry.date, selectedDate)),
    [entries, selectedDate],
  );

  const monthEntries = useMemo(() => {
    const start = startOfMonth(month).getTime();
    const end = endOfMonth(month).getTime();
    return entries.filter((entry) => {
      const time = entry.date.getTime();
      return time >= start && time <= end;
    });
  }, [entries, month]);

  const selectedHoliday = useMemo(
    () =>
      holidaysByDayKey([selectedDate.getFullYear()], region).get(
        dayKey(selectedDate),
      ) ?? null,
    [selectedDate, region],
  );

  const upcoming = useMemo(
    () =>
      scopedApplications
        .filter((application) => {
          const days = daysUntil(application.interviewAt);
          return days !== null && days >= 0;
        })
        .sort(
          (a, b) =>
            (toDate(a.interviewAt)?.getTime() ?? 0) -
            (toDate(b.interviewAt)?.getTime() ?? 0),
        ),
    [scopedApplications],
  );

  const hasApplications = scopedApplications.length > 0;

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
  }

  function exportMonth() {
    downloadEntriesIcs(
      monthEntries,
      `${month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`,
    );
  }

  return (
    <>
      <PageHeader
        title="Kalender"
        description={`Gesprächstermine und Wiedervorlagen deiner ${labels.title}.`}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={exportMonth}
            disabled={monthEntries.length === 0}
          >
            <Download className="mr-2 size-4" />
            Monat exportieren
            {monthEntries.length > 0 ? (
              <span className="ml-1 text-muted-foreground">
                ({monthEntries.length})
              </span>
            ) : null}
          </Button>
        }
      />

      {loading ? <CalendarSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
          icon={Inbox}
          title="Daten konnten nicht geladen werden"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
          }
        />
      ) : null}

      {!loading && !error && !hasApplications ? (
        <EmptyState
          icon={Inbox}
          title={labels.emptyTitle}
          description={`${labels.emptyDescription} Der Gmail-Sync importiert immer beide Bereiche (Ausbildungen und Jobs) gleichzeitig.`}
          action={
            <Button asChild variant="outline">
              <Link href="/settings">Zu den Einstellungen</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !error && hasApplications ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
            <MonthCalendar
              month={month}
              onMonthChange={setMonth}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              entries={entries}
              region={region}
            />
            <CalendarAgenda
              date={selectedDate}
              entries={dayEntries}
              holiday={selectedHoliday}
            />
          </div>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                Anstehende Termine
              </CardTitle>
              <CardDescription>
                Alle Gesprächstermine in zeitlicher Reihenfolge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Keine anstehenden Termine"
                  description="Sobald du einen Gesprächstermin einträgst, erscheint er hier."
                  className="py-10"
                />
              ) : (
                <ScrollArea className="max-h-[28rem] [&_[data-slot=scroll-area-viewport]>div]:block!">
                  <div className="grid w-full min-w-0 gap-2 pe-1 [&>*]:min-w-0 lg:grid-cols-2">
                    {upcoming.map((application) => (
                      <InterviewRow
                        key={application.id}
                        application={application}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
