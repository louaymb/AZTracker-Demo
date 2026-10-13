"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  MessageCircleQuestion,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useApplications } from "@/hooks/use-applications";
import type {
  BulkRunSummary,
  UseBulkRunResult,
} from "@/hooks/use-bulk-run";
import { DEMO_MODE } from "@/lib/demo/flag";
import {
  generateInterviewPrep,
  researchApplication,
} from "@/lib/firebase/functions";

type BulkJobKind = "research" | "interview";

interface PendingJob {
  kind: BulkJobKind;
  ids: string[];
}

const JOB_LABELS: Record<BulkJobKind, string> = {
  research: "Recherche",
  interview: "Interview-Vorbereitung",
};

const JOB_TASKS: Record<BulkJobKind, (applicationId: string) => Promise<unknown>> = {
  research: researchApplication,
  interview: generateInterviewPrep,
};

function nounFor(count: number): string {
  return count === 1 ? "Bewerbung" : "Bewerbungen";
}

function countText(
  count: number | null,
  missingLabel: string,
  loading: boolean,
): string {
  if (count === null) return loading ? "Lädt …" : "Nicht verfügbar";
  if (count === 0) return `Keine Bewerbung ${missingLabel}`;
  return `${count} ${nounFor(count)} ${missingLabel}`;
}

function confirmTitle({ kind, ids }: PendingJob): string {
  const count = ids.length;
  return kind === "research"
    ? `Recherche für ${count} ${nounFor(count)} starten?`
    : `Interview-Vorbereitung für ${count} ${nounFor(count)} starten?`;
}

function reportSummary(label: string, summary: BulkRunSummary) {
  if (summary.cancelled) {
    toast.info(`${label} abgebrochen`, {
      description: `${summary.completed} von ${summary.total} verarbeitet.`,
    });
    return;
  }

  if (summary.failed === 0) {
    toast.success(`${label} abgeschlossen`, {
      description: `${summary.completed} ${nounFor(summary.completed)} verarbeitet.`,
    });
    return;
  }

  toast.warning(`${label} mit Fehlern abgeschlossen`, {
    description: `${summary.completed - summary.failed} erfolgreich, ${summary.failed} fehlgeschlagen.${summary.firstError ? ` ${summary.firstError}` : ""}`,
  });
}

interface BulkRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  countText: string;
  actionLabel: string;
  disabled: boolean;
  onStart: () => void;
}

function BulkRow({
  icon: Icon,
  title,
  description,
  hint,
  countText,
  actionLabel,
  disabled,
  onStart,
}: BulkRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2 font-medium">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm font-medium">{countText}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Button
        className="h-10 w-full shrink-0 whitespace-normal sm:h-8 sm:w-auto"
        disabled={disabled}
        onClick={onStart}
      >
        <Sparkles className="size-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

interface BulkAiCardProps {
  bulk: UseBulkRunResult;
}

export function BulkAiCard({ bulk }: BulkAiCardProps) {
  const { applications, loading, error } = useApplications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<PendingJob>({
    kind: "research",
    ids: [],
  });

  const ready = !loading && !error;
  const running = bulk.state.running;

  const researchIds = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            !application.research &&
            application.unternehmen.trim().length > 0,
        )
        .map((application) => application.id),
    [applications],
  );

  const interviewIds = useMemo(
    () =>
      applications
        .filter((application) => !application.interviewPrep)
        .map((application) => application.id),
    [applications],
  );

  function requestJob(kind: BulkJobKind) {
    setPendingJob({
      kind,
      ids: kind === "research" ? researchIds : interviewIds,
    });
    setDialogOpen(true);
  }

  async function startPendingJob() {
    const label = JOB_LABELS[pendingJob.kind];
    const summary = await bulk.run({
      label,
      ids: pendingJob.ids,
      task: JOB_TASKS[pendingJob.kind],
    });
    if (summary) reportSummary(label, summary);
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          KI-Aufgaben für alle Bewerbungen
        </CardTitle>
        <CardDescription>
          Führt Recherche und Interview-Vorbereitung für alle Bewerbungen aus,
          bei denen die Angabe noch fehlt. Jeder Lauf verbraucht viele
          KI-Tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <p className="text-sm text-destructive">
            Bewerbungen konnten nicht geladen werden: {error}
          </p>
        ) : null}

        <BulkRow
          icon={Search}
          title="Recherche"
          description="Fasst Unternehmen und Stelle per KI zusammen."
          countText={countText(
            ready ? researchIds.length : null,
            "ohne Recherche",
            loading,
          )}
          actionLabel="Fehlende Recherchen starten"
          disabled={!ready || running || researchIds.length === 0}
          onStart={() => requestJob("research")}
        />

        {DEMO_MODE ? null : (
          <>
            <Separator />
            <BulkRow
              icon={MessageCircleQuestion}
              title="Interview-Vorbereitung"
              description="Erstellt wahrscheinliche Fragen, Antwortvorschläge und Tipps."
              hint="Am besten nach der Recherche starten, damit die Vorbereitung deren Ergebnisse nutzt."
              countText={countText(
                ready ? interviewIds.length : null,
                "ohne Vorbereitung",
                loading,
              )}
              actionLabel="Fehlende Vorbereitungen starten"
              disabled={!ready || running || interviewIds.length === 0}
              onStart={() => requestJob("interview")}
            />
          </>
        )}

        {running ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Loader2 className="size-4 animate-spin" />
                {bulk.state.label} läuft …
              </p>
              <p className="text-muted-foreground">
                {bulk.state.completed} von {bulk.state.total} verarbeitet
                {bulk.state.failed > 0
                  ? ` · ${bulk.state.failed} fehlgeschlagen`
                  : ""}
              </p>
            </div>
            <Progress
              value={(bulk.state.completed / bulk.state.total) * 100}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Der Lauf stoppt nach den gerade laufenden Anfragen.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full sm:h-8 sm:w-auto"
                onClick={() => bulk.cancel()}
              >
                <X className="size-4" />
                Lauf abbrechen
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle(pendingJob)}</AlertDialogTitle>
            <AlertDialogDescription>
              Für jede Bewerbung wird eine KI-Anfrage gestellt, die viele
              KI-Tokens verbraucht. Bereits vorhandene Ergebnisse bleiben
              unverändert. Der Lauf läuft nur, solange diese Einstellungsseite
              geöffnet ist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => void startPendingJob()}>
              Jetzt starten
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
