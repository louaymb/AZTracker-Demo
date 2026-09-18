"use client";

import {
  Activity,
  CalendarCheck,
  Inbox,
  Percent,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVE_STATUSES } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/types";

const RESPONDED_STATUSES: ApplicationStatus[] = [
  "einladung",
  "vorstellungsgespraech",
  "absage",
  "zusage",
];

interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}

export function StatCards({ applications }: { applications: Application[] }) {
  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((application) =>
      ACTIVE_STATUSES.includes(application.status),
    ).length;

    const nonDraft = applications.filter(
      (application) => application.status !== "entwurf",
    );
    const responded = nonDraft.filter((application) =>
      RESPONDED_STATUSES.includes(application.status),
    ).length;
    const responseRate = nonDraft.length
      ? (responded / nonDraft.length) * 100
      : null;

    return {
      total,
      active,
      responseRate,
      invitations: applications.filter(
        (application) => application.status === "einladung",
      ).length,
      acceptances: applications.filter(
        (application) => application.status === "zusage",
      ).length,
      rejections: applications.filter(
        (application) => application.status === "absage",
      ).length,
    };
  }, [applications]);

  const items: StatItem[] = [
    {
      label: "Gesamt",
      value: stats.total.toLocaleString("de-DE"),
      icon: Inbox,
      accent: "text-foreground",
    },
    {
      label: "Aktive Bewerbungen",
      value: stats.active.toLocaleString("de-DE"),
      icon: Activity,
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Antwortquote",
      value:
        stats.responseRate === null
          ? "–"
          : `${stats.responseRate.toLocaleString("de-DE", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} %`,
      icon: Percent,
      accent: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Einladungen",
      value: stats.invitations.toLocaleString("de-DE"),
      icon: CalendarCheck,
      accent: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Zusagen",
      value: stats.acceptances.toLocaleString("de-DE"),
      icon: ThumbsUp,
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Absagen",
      value: stats.rejections.toLocaleString("de-DE"),
      icon: ThumbsDown,
      accent: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} size="sm" className="min-w-0">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="min-w-0 truncate text-sm leading-snug font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className={`size-4 shrink-0 ${item.accent}`} />
          </CardHeader>
          <CardContent className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
