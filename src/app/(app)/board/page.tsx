"use client";

import { Inbox, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/layout/page-header";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import { roleCategoryOf } from "@/lib/constants";

const ALL_BERUFE = "__alle__";

function BoardSkeleton() {
  return (
    <div className="-mx-4 flex w-full min-w-0 max-w-full gap-3 overflow-x-hidden px-4 md:mx-0 md:px-0">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[calc(100svh-14rem)] min-h-[360px] w-[85vw] max-w-[320px] shrink-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:min-h-[420px] sm:w-72 sm:max-w-none"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function BoardPage() {
  const { applications, loading } = useApplications();
  const { profile } = useAuth();
  const { mode, labels } = useAppMode();
  const [beruf, setBeruf] = useState(ALL_BERUFE);
  const [search, setSearch] = useState("");

  const scopedApplications = useMemo(
    () => applications.filter((application) => application.type === mode),
    [applications, mode],
  );

  useEffect(() => {
    setBeruf(ALL_BERUFE);
  }, [mode]);

  const berufe = useMemo(
    () =>
      Array.from(
        new Set(
          scopedApplications
            .map((application) => roleCategoryOf(application))
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "de")),
    [scopedApplications],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedApplications.filter((application) => {
      if (beruf !== ALL_BERUFE && roleCategoryOf(application) !== beruf) {
        return false;
      }
      if (!term) return true;
      return [
        application.unternehmen,
        roleCategoryOf(application),
        application.ausbildungsberuf,
        application.standort,
        application.ansprechpartner,
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [scopedApplications, beruf, search]);

  const needsAttentionAfterDays = profile?.settings?.needsAttentionAfterDays ?? 14;
  const hasApplications = scopedApplications.length > 0;

  return (
    <>
      <PageHeader
        title={`Kanban-Board · ${labels.title}`}
        description={labels.boardDescription}
      />

      {hasApplications ? (
        <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Bewerbungen durchsuchen …"
              className="pl-8"
              aria-label="Bewerbungen durchsuchen"
            />
          </div>
          {berufe.length > 0 ? (
            <Select value={beruf} onValueChange={setBeruf}>
              <SelectTrigger
                className="w-full sm:w-56"
                aria-label={`${labels.roleLabel} filtern`}
              >
                <SelectValue placeholder={labels.roleLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_BERUFE}>Alle {labels.title}</SelectItem>
                {berufe.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ) : null}

      {loading ? <BoardSkeleton /> : null}

      {!loading && !hasApplications ? (
        <EmptyState
          icon={Inbox}
          title={labels.emptyTitle}
          description={`${labels.emptyDescription} Der Gmail-Sync importiert immer beide Bereiche (Ausbildungen und Jobs) gleichzeitig.`}
          action={
            <Button asChild variant="outline">
              <Link href="/settings">
                <Settings2 />
                Gmail verbinden
              </Link>
            </Button>
          }
        />
      ) : null}

      {!loading && hasApplications && filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Keine Treffer"
          description={`Für deine Suche und die gewählte ${labels.roleLabel} gibt es keine Bewerbungen.`}
        />
      ) : null}

      {!loading && hasApplications && filtered.length > 0 ? (
        <KanbanBoard
          applications={filtered}
          needsAttentionAfterDays={needsAttentionAfterDays}
        />
      ) : null}
    </>
  );
}
