"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Mail,
  MessageSquarePlus,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationEmail } from "@/types";

const DIRECTION_CONFIG = {
  inbound: {
    label: "Eingehend",
    icon: ArrowDownLeft,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  outbound: {
    label: "Ausgehend",
    icon: ArrowUpRight,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  unknown: {
    label: "Unbekannt",
    icon: Mail,
    className: "bg-muted text-muted-foreground",
  },
} as const;

interface ApplicationTimelineProps {
  emails: ApplicationEmail[];
  loading?: boolean;
  onComposeReply?: () => void;
}

export function ApplicationTimeline({
  emails,
  loading = false,
  onComposeReply,
}: ApplicationTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Noch keine E-Mails verknüpft"
        description="Sobald eine passende Gmail-Nachricht gefunden wird, erscheint sie hier im Verlauf."
      />
    );
  }

  const hasThread = emails.some((email) => email.gmailThreadId.length > 0);

  return (
    <div className="space-y-4">
      {onComposeReply && hasThread ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={onComposeReply}
          >
            <MessageSquarePlus className="size-4" />
            Antwort verfassen
          </Button>
        </div>
      ) : null}

      <ol className="relative space-y-6 border-l pl-6">
        {emails.map((email) => {
          const direction = DIRECTION_CONFIG[email.direction];
          const DirectionIcon = direction.icon;

          return (
            <li key={email.id} className="relative">
              <span className="absolute top-1 -left-[31px] flex size-8 items-center justify-center rounded-full border bg-background">
                <DirectionIcon className="size-4 text-muted-foreground" />
              </span>

              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={email.subject}>
                      {email.subject || "(Kein Betreff)"}
                    </p>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={email.from}
                    >
                      {email.from || "Unbekannter Absender"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                      direction.className,
                    )}
                  >
                    <DirectionIcon className="size-3" />
                    {direction.label}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatDateTime(email.receivedAt)}
                </p>

                <p className="text-sm text-muted-foreground">
                  {email.aiSummary || email.snippet || "(Kein Inhalt)"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {email.suggestedStatus ? (
                    <StatusBadge status={email.suggestedStatus} />
                  ) : null}
                  {email.gmailThreadId ? (
                    <a
                      href={`https://mail.google.com/mail/u/0/#all/${email.gmailThreadId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      In Gmail öffnen
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
