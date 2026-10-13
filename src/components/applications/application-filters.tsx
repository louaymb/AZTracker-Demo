"use client";

import { ListFilter, RotateCcw, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppMode } from "@/components/providers/app-mode-provider";
import {
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/lib/constants";
import type { ApplicationSource, ApplicationStatus } from "@/types";

const ALL_VALUE = "__all__";

export interface ApplicationFiltersValue {
  search: string;
  statuses: ApplicationStatus[];
  beruf: string;
  quelle: string;
  from: string;
  to: string;
  groupByBeruf: boolean;
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationFiltersValue = {
  search: "",
  statuses: [],
  beruf: "",
  quelle: "",
  from: "",
  to: "",
  groupByBeruf: false,
};

export function countActiveFilters(value: ApplicationFiltersValue): number {
  let count = 0;
  if (value.search.trim()) count += 1;
  if (value.statuses.length > 0) count += 1;
  if (value.beruf) count += 1;
  if (value.quelle) count += 1;
  if (value.from) count += 1;
  if (value.to) count += 1;
  if (value.groupByBeruf) count += 1;
  return count;
}

interface ApplicationFiltersProps {
  value: ApplicationFiltersValue;
  onChange: (value: ApplicationFiltersValue) => void;
  berufe: string[];
  onReset: () => void;
}

export function ApplicationFilters({
  value,
  onChange,
  berufe,
  onReset,
}: ApplicationFiltersProps) {
  const activeCount = countActiveFilters(value);
  const { labels } = useAppMode();

  function update(patch: Partial<ApplicationFiltersValue>) {
    onChange({ ...value, ...patch });
  }

  function toggleStatus(status: ApplicationStatus) {
    const statuses = value.statuses.includes(status)
      ? value.statuses.filter((item) => item !== status)
      : [...value.statuses, status];
    update({ statuses });
  }

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];

  if (value.search.trim()) {
    activeFilters.push({
      key: "search",
      label: `Suche: „${value.search.trim()}“`,
      clear: () => update({ search: "" }),
    });
  }
  if (value.statuses.length > 0) {
    activeFilters.push({
      key: "statuses",
      label: `Status: ${value.statuses
        .map((status) => STATUS_LABELS[status])
        .join(", ")}`,
      clear: () => update({ statuses: [] }),
    });
  }
  if (value.beruf) {
    activeFilters.push({
      key: "beruf",
      label: `${labels.roleLabel}: ${value.beruf}`,
      clear: () => update({ beruf: "" }),
    });
  }
  if (value.quelle) {
    activeFilters.push({
      key: "quelle",
      label: `Quelle: ${
        SOURCE_LABELS[value.quelle as ApplicationSource] ?? value.quelle
      }`,
      clear: () => update({ quelle: "" }),
    });
  }
  if (value.from || value.to) {
    activeFilters.push({
      key: "date",
      label: `Datum: ${value.from || "…"} – ${value.to || "…"}`,
      clear: () => update({ from: "", to: "" }),
    });
  }
  if (value.groupByBeruf) {
    activeFilters.push({
      key: "group",
      label: `Gruppiert nach ${labels.roleLabel}`,
      clear: () => update({ groupByBeruf: false }),
    });
  }

  return (
    <div className="mb-4 rounded-xl border bg-card p-3">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Suchen (Unternehmen, Beruf, Ort, Notizen …)"
            className="pl-8"
            aria-label="Bewerbungen durchsuchen"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex min-w-0 items-center gap-1.5">
                <ListFilter className="size-4 shrink-0" />
                Status
              </span>
              {value.statuses.length > 0 ? (
                <Badge variant="secondary">{value.statuses.length}</Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(16rem,calc(100vw-2rem))] p-1.5"
          >
            <div className="max-h-[min(60svh,20rem)] space-y-1 overflow-y-auto">
              {STATUS_OPTIONS.map((option) => {
                const checked = value.statuses.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-2 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleStatus(option.value)}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={value.beruf || ALL_VALUE}
          onValueChange={(next) =>
            update({ beruf: next === ALL_VALUE ? "" : next })
          }
        >
          <SelectTrigger className="w-full" aria-label={labels.roleLabel}>
            <SelectValue placeholder={labels.roleLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle {labels.title}</SelectItem>
            {berufe.map((beruf) => (
              <SelectItem key={beruf} value={beruf}>
                {beruf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.quelle || ALL_VALUE}
          onValueChange={(next) =>
            update({ quelle: next === ALL_VALUE ? "" : next })
          }
        >
          <SelectTrigger className="w-full" aria-label="Quelle">
            <SelectValue placeholder="Quelle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle Quellen</SelectItem>
            {SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={value.from}
            onChange={(event) => update({ from: event.target.value })}
            className="min-w-0 flex-1 basis-32"
            aria-label="Bewerbungsdatum von"
          />
          <span className="text-sm text-muted-foreground">bis</span>
          <Input
            type="date"
            value={value.to}
            onChange={(event) => update({ to: event.target.value })}
            className="min-w-0 flex-1 basis-32"
            aria-label="Bewerbungsdatum bis"
          />
        </div>

        <div className="flex items-center gap-2 lg:col-span-3">
          <Switch
            id="group-by-beruf"
            checked={value.groupByBeruf}
            onCheckedChange={(checked) => update({ groupByBeruf: checked })}
          />
          <Label htmlFor="group-by-beruf">
            Gruppieren nach {labels.roleLabel}
          </Label>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {activeFilters.length > 0 ? (
            activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="h-auto max-w-full gap-1 py-1 pr-1 font-normal"
              >
                <span className="min-w-0 truncate">{filter.label}</span>
                <button
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Filter ${filter.label} entfernen`}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Keine Filter aktiv</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 self-start sm:self-auto"
          onClick={onReset}
          disabled={activeCount === 0}
        >
          <RotateCcw className="size-4" />
          Zurücksetzen
        </Button>
      </div>
    </div>
  );
}
