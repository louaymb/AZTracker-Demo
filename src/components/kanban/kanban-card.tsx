"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppMode } from "@/components/providers/app-mode-provider";
import {
  ACTIVE_STATUSES,
  EMPLOYMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  roleCategoryOf,
} from "@/lib/constants";
import { daysSince, formatRelative } from "@/lib/format";
import { applicationHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";

export function isApplicationDue(
  application: Application,
  thresholdDays: number,
): boolean {
  if (!ACTIVE_STATUSES.includes(application.status)) return false;
  const days = daysSince(application.lastEmailAt ?? application.updatedAt);
  return days !== null && days > thresholdDays;
}

interface CardDetailsProps {
  application: Application;
  needsAttention: boolean;
  trailing?: ReactNode;
}

function CardDetails({
  application,
  needsAttention,
  trailing,
}: CardDetailsProps) {
  const { labels } = useAppMode();

  return (
    <>
      <div className="flex items-start justify-between gap-1.5">
        <Link
          href={applicationHref(application.id)}
          onPointerDown={(event) => event.stopPropagation()}
          className="line-clamp-2 min-w-0 text-sm leading-snug font-semibold hover:underline"
        >
          {application.unternehmen || "Unbekanntes Unternehmen"}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {needsAttention ? (
            <span
              title="Aufmerksamkeit erforderlich"
              aria-label="Aufmerksamkeit erforderlich"
              className="inline-flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400"
            >
              <AlertTriangle className="size-3" />
            </span>
          ) : null}
          {trailing}
        </div>
      </div>

      <div className="mt-1 flex items-start justify-between gap-1.5">
        <Link
          href={applicationHref(application.id)}
          onPointerDown={(event) => event.stopPropagation()}
          className="line-clamp-2 min-w-0 text-xs text-muted-foreground hover:underline"
        >
          {roleCategoryOf(application) || `${labels.roleLabel} offen`}
        </Link>
        {application.employmentType ? (
          <Badge
            variant="outline"
            className="h-4 shrink-0 px-1.5 text-[10px] font-normal"
          >
            {EMPLOYMENT_TYPE_LABELS[application.employmentType]}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3 shrink-0" />
        <span className="line-clamp-1 min-w-0">
          {application.standort || "Standort offen"}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {formatRelative(application.lastEmailAt ?? application.updatedAt)}
      </p>
    </>
  );
}

interface KanbanCardProps {
  application: Application;
  status: ApplicationStatus;
  needsAttentionAfterDays: number;
  onStatusChange: (application: Application, status: ApplicationStatus) => void;
}

export function KanbanCard({
  application,
  status,
  needsAttentionAfterDays,
  onStatusChange,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { status },
  });

  const needsAttention = isApplicationDue(application, needsAttentionAfterDays);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group/card min-w-0 cursor-grab touch-manipulation overflow-hidden rounded-lg border bg-card p-3 text-card-foreground shadow-xs transition-colors select-none hover:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <CardDetails
        application={application}
        needsAttention={needsAttention}
        trailing={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Aktionen"
                className="size-9 shrink-0 opacity-60 group-hover/card:opacity-100 sm:size-6"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <DropdownMenuItem asChild>
                <Link href={applicationHref(application.id)}>
                  <ExternalLink />
                  Details öffnen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status ändern</DropdownMenuLabel>
              {STATUS_ORDER.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onSelect={() => onStatusChange(application, option)}
                  disabled={option === status}
                >
                  {option === status ? (
                    <Check className="text-primary" />
                  ) : (
                    <span className="size-4" />
                  )}
                  {STATUS_LABELS[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  );
}

interface KanbanCardOverlayProps {
  application: Application;
  needsAttentionAfterDays: number;
}

export function KanbanCardOverlay({
  application,
  needsAttentionAfterDays,
}: KanbanCardOverlayProps) {
  const needsAttention = isApplicationDue(application, needsAttentionAfterDays);

  return (
    <div className="w-[264px] rotate-2 cursor-grabbing rounded-lg border bg-card p-3 text-card-foreground shadow-xl">
      <CardDetails application={application} needsAttention={needsAttention} />
    </div>
  );
}
