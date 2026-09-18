"use client";

import { CheckCircle2, ChevronRight, Send } from "lucide-react";
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
import { ACTIVE_STATUSES, modeConfig, roleCategoryOf } from "@/lib/constants";
import { daysSince } from "@/lib/format";
import { applicationHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";

interface NeedsAttentionProps {
  applications: Application[];
  thresholdDays: number;
}

export function NeedsAttention({
  applications,
  thresholdDays,
}: NeedsAttentionProps) {
  const items = useMemo(
    () =>
      applications
        .filter((application) =>
          ACTIVE_STATUSES.includes(application.status),
        )
        .map((application) => ({
          application,
          days: daysSince(application.lastEmailAt ?? application.updatedAt) ?? 0,
        }))
        .filter((item) => item.days > thresholdDays)
        .sort((a, b) => b.days - a.days),
    [applications, thresholdDays],
  );

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>Braucht Aufmerksamkeit</span>
          {items.length > 0 ? (
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? "Eintrag" : "Einträge"}
            </span>
          ) : null}
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Aktive Bewerbungen ohne Rückmeldung seit mehr als {thresholdDays}{" "}
          Tagen.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Alles im Griff"
            description="Aktuell wartet keine Bewerbung zu lange auf eine Antwort."
            className="border-emerald-500/30 py-10"
          />
        ) : (
          <ScrollArea className="h-80 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <ul className="flex w-full min-w-0 flex-col gap-2 pe-1">
              {items.map(({ application, days }) => {
                const critical = days > thresholdDays * 2;
                return (
                  <li key={application.id} className="min-w-0">
                    <div
                      className={cn(
                        "flex min-w-0 items-center gap-2 rounded-lg border border-l-4 p-2.5 transition-colors hover:bg-muted/60",
                        critical
                          ? "border-l-red-500 bg-red-500/5"
                          : "border-l-amber-500 bg-amber-500/5",
                      )}
                    >
                      <Link
                        href={applicationHref(application.id)}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm leading-snug font-medium">
                            {application.unternehmen ||
                              "Unbekanntes Unternehmen"}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {roleCategoryOf(application) ||
                              `${modeConfig(application.type).roleLabel} offen`}
                          </p>
                          <div className="mt-1.5">
                            <StatusBadge status={application.status} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              critical
                                ? "text-red-600 dark:text-red-400"
                                : "text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {days} Tage
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ohne Antwort
                          </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0"
                      >
                        <Link
                          href={`${applicationHref(application.id)}&intent=follow_up`}
                          aria-label="Nachfassen"
                        >
                          <Send className="size-3.5" />
                          <span className="hidden sm:inline">Nachfassen</span>
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
