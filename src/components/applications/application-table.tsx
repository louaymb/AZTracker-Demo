"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ApplicationDeleteDialog } from "./application-delete-dialog";
import { ApplicationFormDialog } from "./application-form-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { useAppMode } from "@/components/providers/app-mode-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EMPLOYMENT_TYPE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_ORDER,
  roleCategoryOf,
} from "@/lib/constants";
import {
  deleteApplications,
  updateApplicationsStatus,
} from "@/lib/firebase/applications";
import { downloadCsv } from "@/lib/export";
import { formatDate, formatRelative, toDate } from "@/lib/format";
import { applicationHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type {
  Application,
  ApplicationSource,
  ApplicationStatus,
} from "@/types";

export type ApplicationSortKey =
  | "unternehmen"
  | "standort"
  | "status"
  | "bewerbungsdatum"
  | "quelle"
  | "lastEmailAt";

export interface ApplicationSortState {
  key: ApplicationSortKey;
  direction: "asc" | "desc";
}

function compareApplications(
  a: Application,
  b: Application,
  key: ApplicationSortKey,
): number {
  switch (key) {
    case "status":
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    case "bewerbungsdatum": {
      const av = toDate(a.bewerbungsdatum)?.getTime() ?? 0;
      const bv = toDate(b.bewerbungsdatum)?.getTime() ?? 0;
      return av - bv;
    }
    case "lastEmailAt": {
      const av = toDate(a.lastEmailAt)?.getTime() ?? 0;
      const bv = toDate(b.lastEmailAt)?.getTime() ?? 0;
      return av - bv;
    }
    case "quelle": {
      const av = SOURCE_LABELS[a.quelle as ApplicationSource] ?? a.quelle;
      const bv = SOURCE_LABELS[b.quelle as ApplicationSource] ?? b.quelle;
      return av.localeCompare(bv, "de", { sensitivity: "base" });
    }
    case "standort":
      return a.standort.localeCompare(b.standort, "de", {
        sensitivity: "base",
      });
    default:
      return a.unternehmen.localeCompare(b.unternehmen, "de", {
        sensitivity: "base",
      });
  }
}

export function sortApplications(
  applications: Application[],
  sort: ApplicationSortState,
): Application[] {
  const sorted = [...applications].sort((a, b) =>
    compareApplications(a, b, sort.key),
  );
  return sort.direction === "asc" ? sorted : sorted.reverse();
}

const COLUMNS: { key: ApplicationSortKey; label: string }[] = [
  { key: "unternehmen", label: "Unternehmen" },
  { key: "standort", label: "Standort" },
  { key: "status", label: "Status" },
  { key: "bewerbungsdatum", label: "Bewerbungsdatum" },
  { key: "quelle", label: "Quelle" },
  { key: "lastEmailAt", label: "Letzte E-Mail" },
];

interface RowActionsProps {
  application: Application;
  onView: (application: Application) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}

function RowActions({
  application,
  onView,
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Aktionen"
          className="size-10 shrink-0 sm:size-7"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={() => onView(application)}>
          <Eye className="size-4" />
          Ansehen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(application)}>
          <Pencil className="size-4" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(application)}
        >
          <Trash2 className="size-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ApplicationTableProps {
  applications: Application[];
  sort: ApplicationSortState;
  onSortChange: (sort: ApplicationSortState) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ApplicationTable({
  applications,
  sort,
  onSortChange,
  loading = false,
  emptyMessage = "Keine Bewerbungen vorhanden.",
}: ApplicationTableProps) {
  const router = useRouter();
  const { labels } = useAppMode();
  const [editTarget, setEditTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelected((previous) => {
      if (previous.size === 0) return previous;
      const visible = new Set(applications.map((application) => application.id));
      let dropped = false;
      const next = new Set<string>();
      for (const id of previous) {
        if (visible.has(id)) next.add(id);
        else dropped = true;
      }
      return dropped ? next : previous;
    });
  }, [applications]);

  const selectedApplications = applications.filter((application) =>
    selected.has(application.id),
  );
  const selectedIds = selectedApplications.map((application) => application.id);
  const allSelected =
    applications.length > 0 && selected.size === applications.length;
  const someSelected = selected.size > 0 && !allSelected;

  function clearSelection() {
    setSelected(new Set());
  }

  function toggleAll(checked: boolean | "indeterminate") {
    setSelected(
      checked
        ? new Set(applications.map((application) => application.id))
        : new Set(),
    );
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkStatus(status: ApplicationStatus) {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await updateApplicationsStatus(selectedIds, status);
      toast.success(`Status geändert: ${STATUS_LABELS[status]}`, {
        description: `${selectedIds.length} ${
          selectedIds.length === 1 ? "Bewerbung" : "Bewerbungen"
        }`,
      });
      clearSelection();
    } catch (cause) {
      toast.error("Status konnte nicht geändert werden.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await deleteApplications(selectedIds);
      toast.success(
        selectedIds.length === 1
          ? "Bewerbung gelöscht"
          : `${selectedIds.length} Bewerbungen gelöscht`,
      );
      clearSelection();
    } catch (cause) {
      toast.error("Löschen fehlgeschlagen.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleBulkExport() {
    downloadCsv(selectedApplications);
    toast.success("CSV exportiert", {
      description: `${selectedApplications.length} ${
        selectedApplications.length === 1 ? "Bewerbung" : "Bewerbungen"
      }`,
    });
  }

  function handleSort(key: ApplicationSortKey) {
    if (sort.key === key) {
      onSortChange({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
      return;
    }
    onSortChange({ key, direction: "asc" });
  }

  function openApplication(application: Application) {
    router.push(applicationHref(application.id));
  }

  function SortIcon({ column }: { column: ApplicationSortKey }) {
    if (sort.key !== column) {
      return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
    }
    return sort.direction === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  }

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-2 rounded-xl border p-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 ? (
        <div className="sticky top-14 z-10 mb-3 flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="px-1 text-sm font-medium">
            {selected.size} ausgewählt
          </span>
          <Button
            type="button"
            variant="ghost"
            className="h-10 sm:h-8"
            disabled={busy}
            onClick={clearSelection}
          >
            <X className="size-4" />
            Auswahl aufheben
          </Button>
          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select
              value=""
              disabled={busy}
              onValueChange={(value) =>
                void handleBulkStatus(value as ApplicationStatus)
              }
            >
              <SelectTrigger className="h-10 w-full min-w-0 sm:h-8 sm:w-44">
                <SelectValue placeholder="Status ändern" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full min-w-0 sm:h-8 sm:w-auto"
              disabled={busy}
              onClick={handleBulkExport}
            >
              <Download className="size-4" />
              Als CSV exportieren
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-10 w-full min-w-0 sm:h-8 sm:w-auto"
                  disabled={busy}
                >
                  <Trash2 className="size-4" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selected.size} Bewerbungen löschen?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Die ausgewählten Bewerbungen werden endgültig gelöscht. Das
                    kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={busy}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleBulkDelete();
                    }}
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : null}

      <div className="hidden w-full min-w-0 max-w-full md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={toggleAll}
                  onClick={(event) => event.stopPropagation()}
                  aria-label="Alle auswählen"
                />
              </TableHead>
              {COLUMNS.map((column) => (
                <TableHead key={column.key}>
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-foreground/80"
                  >
                    {column.label}
                    <SortIcon column={column.key} />
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-12 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 2}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow
                  key={application.id}
                  className="cursor-pointer"
                  onClick={() => openApplication(application)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(application.id)}
                      onCheckedChange={(checked) =>
                        toggleRow(application.id, checked === true)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`${application.unternehmen} auswählen`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{application.unternehmen}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        {roleCategoryOf(application) || labels.roleLabel}
                      </span>
                      {application.employmentType ? (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[10px] font-normal"
                        >
                          {EMPLOYMENT_TYPE_LABELS[application.employmentType]}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{application.standort || "–"}</TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell>{formatDate(application.bewerbungsdatum)}</TableCell>
                  <TableCell>
                    {SOURCE_LABELS[
                      application.quelle as ApplicationSource
                    ] ?? application.quelle}
                  </TableCell>
                  <TableCell>{formatRelative(application.lastEmailAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions
                        application={application}
                        onView={openApplication}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="w-full min-w-0 space-y-2 md:hidden">
        {applications.length === 0 ? (
          <p className="rounded-xl border px-3 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              role="button"
              tabIndex={0}
              onClick={() => openApplication(application)}
              onKeyDown={(event) => {
                if (event.key === "Enter") openApplication(application);
              }}
              className={cn(
                "flex items-start gap-2 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50",
              )}
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={selected.has(application.id)}
                  onCheckedChange={(checked) =>
                    toggleRow(application.id, checked === true)
                  }
                  aria-label={`${application.unternehmen} auswählen`}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">
                  {application.unternehmen}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleCategoryOf(application) || labels.roleLabel}
                  {application.standort ? ` · ${application.standort}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <StatusBadge status={application.status} />
                  {application.employmentType ? (
                    <Badge
                      variant="outline"
                      className="h-5 font-normal"
                    >
                      {EMPLOYMENT_TYPE_LABELS[application.employmentType]}
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    Beworben: {formatDate(application.bewerbungsdatum)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Letzte E-Mail: {formatRelative(application.lastEmailAt)}
                </p>
              </div>
              <RowActions
                application={application}
                onView={openApplication}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            </div>
          ))
        )}
      </div>

      <ApplicationFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        application={editTarget}
      />
      <ApplicationDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        application={deleteTarget}
      />
    </>
  );
}
