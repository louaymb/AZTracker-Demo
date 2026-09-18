"use client";

import {
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

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
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { modeConfig, roleCategoryOf } from "@/lib/constants";
import {
  daysSince,
  daysUntil,
  formatDate,
  formatDateTime,
  formatRelative,
  sortByDateDesc,
  toDate,
} from "@/lib/format";
import { applicationHref } from "@/lib/navigation";
import type { Application } from "@/types";

const FOLLOW_UP_WINDOW_DAYS = 14;

function roleLabelOf(application: Application): string {
  return (
    roleCategoryOf(application) ||
    `${modeConfig(application.type).roleLabel} offen`
  );
}

function AppointmentItem({ application }: { application: Application }) {
  const googleUrl = googleCalendarUrl(application);

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-l-4 border-l-purple-500 p-2.5">
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

export function UpcomingInterviews({
  applications,
}: {
  applications: Application[];
}) {
  const appointments = useMemo(
    () =>
      applications
        .filter((application) => {
          const days = daysUntil(application.interviewAt);
          return days !== null && days >= 0;
        })
        .sort(
          (a, b) =>
            (toDate(a.interviewAt)?.getTime() ?? 0) -
            (toDate(b.interviewAt)?.getTime() ?? 0),
        ),
    [applications],
  );

  const appointmentIds = useMemo(
    () => new Set(appointments.map((application) => application.id)),
    [appointments],
  );

  const interviews = useMemo(
    () =>
      sortByDateDesc(
        applications.filter(
          (application) =>
            !appointmentIds.has(application.id) &&
            (application.status === "einladung" ||
              application.status === "vorstellungsgespraech"),
        ),
        (application) => application.lastEmailAt ?? application.updatedAt,
      ),
    [applications, appointmentIds],
  );

  const interviewIds = useMemo(
    () => new Set(interviews.map((application) => application.id)),
    [interviews],
  );

  const followUps = useMemo(() => {
    return applications
      .filter((application) => {
        if (appointmentIds.has(application.id)) return false;
        if (interviewIds.has(application.id)) return false;
        if (!toDate(application.followUpAt)) return false;
        const days = daysSince(application.followUpAt);
        return days !== null && days >= -FOLLOW_UP_WINDOW_DAYS;
      })
      .sort((a, b) => {
        const aTime = toDate(a.followUpAt)?.getTime() ?? 0;
        const bTime = toDate(b.followUpAt)?.getTime() ?? 0;
        return aTime - bTime;
      });
  }, [applications, appointmentIds, interviewIds]);

  const isEmpty =
    appointments.length === 0 &&
    interviews.length === 0 &&
    followUps.length === 0;
  const totalItems =
    appointments.length + interviews.length + followUps.length;

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>Anstehende Termine</span>
          {totalItems > 0 ? (
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} {totalItems === 1 ? "Eintrag" : "Einträge"}
            </span>
          ) : null}
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Gesprächstermine, Einladungen und Wiedervorlagen.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {isEmpty ? (
          <EmptyState
            icon={CalendarClock}
            title="Keine anstehenden Termine"
            description="Sobald du einen Gesprächstermin einträgst oder Wiedervorlagen anstehen, erscheinen sie hier."
            className="py-10"
          />
        ) : (
          <ScrollArea className="h-80 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <div className="flex w-full min-w-0 flex-col gap-4 pe-1">
              {appointments.length > 0 ? (
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="truncate text-xs font-medium text-muted-foreground uppercase">
                    Gesprächstermine
                  </p>
                  {appointments.map((application) => (
                    <AppointmentItem
                      key={application.id}
                      application={application}
                    />
                  ))}
                </div>
              ) : null}

              {interviews.length > 0 ? (
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="truncate text-xs font-medium text-muted-foreground uppercase">
                    Gespräche & Einladungen
                  </p>
                  {interviews.map((application) => (
                    <Link
                      key={application.id}
                      href={applicationHref(application.id)}
                      className="flex min-w-0 items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-snug font-medium">
                          {application.unternehmen || "Unbekanntes Unternehmen"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {roleLabelOf(application)}
                        </p>
                        <div className="mt-1.5">
                          <StatusBadge status={application.status} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatRelative(
                            application.lastEmailAt ?? application.updatedAt,
                          )}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : null}

              {followUps.length > 0 ? (
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="truncate text-xs font-medium text-muted-foreground uppercase">
                    Wiedervorlage
                  </p>
                  {followUps.map((application) => (
                    <Link
                      key={application.id}
                      href={applicationHref(application.id)}
                      className="flex min-w-0 items-center gap-3 rounded-lg border border-l-4 border-l-sky-500 p-2.5 transition-colors hover:bg-muted/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-snug font-medium">
                          {application.unternehmen || "Unbekanntes Unternehmen"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {roleLabelOf(application)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatDate(application.followUpAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(application.followUpAt)}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
