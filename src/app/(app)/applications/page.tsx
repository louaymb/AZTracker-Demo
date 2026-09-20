"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Plus, SearchX } from "lucide-react";

import {
  ApplicationFilters,
  DEFAULT_APPLICATION_FILTERS,
  type ApplicationFiltersValue,
} from "@/components/applications/application-filters";
import { ApplicationFormDialog } from "@/components/applications/application-form-dialog";
import {
  ApplicationTable,
  sortApplications,
  type ApplicationSortState,
} from "@/components/applications/application-table";
import { ExportCsvButton } from "@/components/applications/export-csv-button";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApplications } from "@/hooks/use-applications";
import { roleCategoryOf } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import type { Application } from "@/types";

const DEFAULT_SORT: ApplicationSortState = {
  key: "bewerbungsdatum",
  direction: "desc",
};

export default function ApplicationsPage() {
  const { applications, loading } = useApplications();
  const { mode, labels } = useAppMode();
  const [filters, setFilters] = useState<ApplicationFiltersValue>(
    DEFAULT_APPLICATION_FILTERS,
  );
  const [sort, setSort] = useState<ApplicationSortState>(DEFAULT_SORT);
  const [createOpen, setCreateOpen] = useState(false);

  const scopedApplications = useMemo(
    () => applications.filter((application) => application.type === mode),
    [applications, mode],
  );

  useEffect(() => {
    setFilters(DEFAULT_APPLICATION_FILTERS);
  }, [mode]);

  const berufe = useMemo(() => {
    const set = new Set(
      scopedApplications
        .map((application) => roleCategoryOf(application))
        .filter(Boolean),
    );
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [scopedApplications]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return scopedApplications.filter((application) => {
      if (term) {
        const haystack = [
          application.unternehmen,
          roleCategoryOf(application),
          application.ausbildungsberuf,
          application.standort,
          application.notizen,
          application.ansprechpartner,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(application.status)
      ) {
        return false;
      }

      if (filters.beruf && roleCategoryOf(application) !== filters.beruf) {
        return false;
      }

      if (filters.quelle && application.quelle !== filters.quelle) {
        return false;
      }

      if (filters.from || filters.to) {
        const day = toDateInputValue(application.bewerbungsdatum);
        if (!day) return false;
        if (filters.from && day < filters.from) return false;
        if (filters.to && day > filters.to) return false;
      }

      return true;
    });
  }, [scopedApplications, filters]);

  const sorted = useMemo(
    () => sortApplications(filtered, sort),
    [filtered, sort],
  );

  const groups = useMemo(() => {
    if (!filters.groupByBeruf) return null;
    const map = new Map<string, Application[]>();
    for (const application of sorted) {
      const key = roleCategoryOf(application) || `Ohne ${labels.roleLabel}`;
      const list = map.get(key);
      if (list) {
        list.push(application);
      } else {
        map.set(key, [application]);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"));
  }, [sorted, filters.groupByBeruf, labels.roleLabel]);

  const resetFilters = () => setFilters(DEFAULT_APPLICATION_FILTERS);

  const actions = (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
      <ExportCsvButton
        applications={sorted}
        className="h-10 min-w-0 flex-1 sm:h-8 sm:flex-none"
      />
      <Button
        onClick={() => setCreateOpen(true)}
        className="h-10 min-w-0 flex-1 sm:h-8 sm:flex-none"
      >
        <Plus className="size-4" />
        Neue Bewerbung
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title={`Bewerbungen · ${labels.title}`}
        description={labels.applicationsDescription}
        action={actions}
      />

      {!loading && scopedApplications.length > 0 ? (
        <ApplicationFilters
          value={filters}
          onChange={setFilters}
          berufe={berufe}
          onReset={resetFilters}
        />
      ) : null}

      {loading ? (
        <ApplicationTable
          applications={[]}
          sort={sort}
          onSortChange={setSort}
          loading
        />
      ) : scopedApplications.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title={labels.emptyTitle}
          description={`${labels.emptyDescription} Der Gmail-Sync importiert immer beide Bereiche (Ausbildungen und Jobs) gleichzeitig.`}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Erste Bewerbung anlegen
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Keine Treffer"
          description="Keine Bewerbung passt zu den aktuellen Filtern."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Filter zurücksetzen
            </Button>
          }
        />
      ) : groups ? (
        <div className="w-full min-w-0 space-y-6">
          {groups.map(([beruf, items]) => (
            <Card key={beruf} className="min-w-0">
              <CardHeader>
                <CardTitle>{beruf}</CardTitle>
                <CardDescription>
                  {items.length}{" "}
                  {items.length === 1 ? "Bewerbung" : "Bewerbungen"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 max-w-full md:px-0">
                <ApplicationTable
                  applications={items}
                  sort={sort}
                  onSortChange={setSort}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <ApplicationTable
          applications={sorted}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      <ApplicationFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
