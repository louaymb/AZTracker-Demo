"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, History, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime, formatRelative } from "@/lib/format";
import { subscribeSyncRuns } from "@/lib/firebase/sync-runs";
import { cn } from "@/lib/utils";
import type { SyncRun } from "@/types";

const TRIGGER_LABELS: Record<SyncRun["trigger"], string> = {
  manual: "Manuell",
  schedule: "Automatisch",
  initial: "Erstimport",
};

export function SyncHistory() {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeSyncRuns(
      (data) => {
        setRuns(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, []);

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <History className="shrink-0 size-4" />
          Sync-Verlauf
          {runs.length > 0 ? (
            <span className="w-full text-sm font-normal text-muted-foreground sm:ml-auto sm:w-auto">
              {runs.length} {runs.length === 1 ? "Eintrag" : "Einträge"}
            </span>
          ) : null}
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Die letzten Synchronisierungen mit Anzahl erkannter E-Mails.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Lade Verlauf …
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Synchronisierung durchgeführt.
          </p>
        ) : (
          <ScrollArea className="h-80 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <ul className="w-full min-w-0 divide-y pe-1">
              {runs.map((run) => (
              <li
                key={run.id}
                className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm"
              >
                {run.status === "error" ? (
                  <CircleAlert className="size-4 shrink-0 text-destructive" />
                ) : run.status === "running" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <CircleCheck className="size-4 shrink-0 text-emerald-600" />
                )}

                <span className="font-medium whitespace-nowrap">
                  {TRIGGER_LABELS[run.trigger] ?? run.trigger}
                </span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(run.startedAt, "–")}
                </span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {formatRelative(run.startedAt, "")}
                </span>

                <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:text-sm">
                  <span className="whitespace-nowrap">
                    {run.messagesScanned} geprüft
                  </span>
                  <span className="whitespace-nowrap text-foreground">
                    {run.applicationsCreated} neu
                  </span>
                  <span className="whitespace-nowrap">
                    {run.applicationsMatched} zugeordnet
                  </span>
                  {run.errors?.length > 0 && (
                    <span className="whitespace-nowrap text-amber-600 dark:text-amber-500">
                      {run.errors.length} Hinweis
                      {run.errors.length === 1 ? "" : "e"}
                    </span>
                  )}
                </span>
              </li>
            ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export function SyncStatusDot({ status }: { status: SyncRun["status"] }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        status === "success" && "bg-emerald-500",
        status === "error" && "bg-destructive",
        status === "running" && "bg-amber-500",
      )}
    />
  );
}
