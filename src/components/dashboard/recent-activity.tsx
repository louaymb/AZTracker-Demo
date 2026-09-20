"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { modeConfig, roleCategoryOf } from "@/lib/constants";
import { formatRelative, sortByDateDesc } from "@/lib/format";
import { applicationHref } from "@/lib/navigation";
import type { Application } from "@/types";

export function RecentActivity({
  applications,
}: {
  applications: Application[];
}) {
  const recent = useMemo(
    () => sortByDateDesc(applications, (application) => application.updatedAt).slice(0, 5),
    [applications],
  );

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle>Letzte Aktivitäten</CardTitle>
        <CardDescription className="leading-relaxed">
          Die zuletzt aktualisierten Bewerbungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {recent.length === 0 ? (
          <EmptyState
            icon={History}
            title="Noch keine Aktivitäten"
            description="Sobald sich bei deinen Bewerbungen etwas tut, erscheint es hier."
            className="py-10"
          />
        ) : (
          <ScrollArea className="h-80 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <ul className="flex w-full min-w-0 flex-col divide-y pe-1">
              {recent.map((application) => (
                <li key={application.id} className="min-w-0">
                  <Link
                    href={applicationHref(application.id)}
                    className="flex min-w-0 items-center justify-between gap-4 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm leading-snug font-medium">
                        {application.unternehmen || "Unbekanntes Unternehmen"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {roleCategoryOf(application) ||
                          `${modeConfig(application.type).roleLabel} offen`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-3">
                      <StatusBadge status={application.status} />
                      <span className="text-xs whitespace-nowrap text-muted-foreground sm:text-right sm:text-sm">
                        {formatRelative(application.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
