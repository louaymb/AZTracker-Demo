"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { STATUS_ACCENT_CLASS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";

import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  needsAttentionAfterDays: number;
  onStatusChange: (application: Application, status: ApplicationStatus) => void;
}

export function KanbanColumn({
  status,
  applications,
  needsAttentionAfterDays,
  onStatusChange,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const { labels } = useAppMode();

  return (
    <section className="flex h-[calc(100svh-14rem)] min-h-[360px] w-[85vw] min-w-0 max-w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-muted/30 sm:min-h-[420px] sm:w-72 sm:max-w-none">
      <div className={cn("h-1 w-full", STATUS_ACCENT_CLASS[status])} />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <h3 className="min-w-0 truncate text-sm font-medium">{STATUS_LABELS[status]}</h3>
        <span className="shrink-0 rounded-full bg-background px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
          {applications.length}
        </span>
      </div>

      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[140px] min-w-0 flex-col gap-2 p-2 transition-colors",
            isOver && "bg-primary/5 ring-2 ring-primary/30 ring-inset",
          )}
        >
          {applications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              <Inbox className="size-4" />
              Keine {labels.title}
            </div>
          ) : (
            applications.map((application) => (
              <KanbanCard
                key={application.id}
                application={application}
                status={status}
                needsAttentionAfterDays={needsAttentionAfterDays}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
