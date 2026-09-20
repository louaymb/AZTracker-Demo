"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  Download,
  ExternalLink,
  MapPin,
  MessageSquarePlus,
  Pencil,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ApplicationAttachments } from "./application-attachments";
import { ApplicationDeleteDialog } from "./application-delete-dialog";
import { ApplicationFormDialog } from "./application-form-dialog";
import { ApplicationResearchCard } from "./application-research-card";
import { ApplicationTimeline } from "./application-timeline";
import { InterviewPrepCard } from "./interview-prep-card";
import { ReplyDialog } from "./reply-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useApplicationEmails } from "@/hooks/use-application-emails";
import {
  EMPLOYMENT_TYPE_LABELS,
  NO_VALUE,
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  modeConfig,
  roleCategoryOf,
} from "@/lib/constants";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { DEMO_MODE } from "@/lib/demo/flag";
import { subscribeApplication, updateApplicationStatus } from "@/lib/firebase/applications";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import type {
  Application,
  ApplicationSource,
  ApplicationStatus,
  EmailIntent,
} from "@/types";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyIntent, setReplyIntent] = useState<EmailIntent>("reply");
  const [tab, setTab] = useState("overview");

  const { emails, loading: emailsLoading } =
    useApplicationEmails(applicationId);

  useEffect(() => {
    if (!applicationId) {
      setApplication(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeApplication(
      applicationId,
      (data) => {
        setApplication(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [applicationId]);

  useEffect(() => {
    if (searchParams.get("intent") === "follow_up") {
      setReplyIntent("follow_up");
      setReplyOpen(true);
    }
  }, [searchParams]);

  function openReply(intent: EmailIntent) {
    setReplyIntent(intent);
    setReplyOpen(true);
  }

  async function handleStatusChange(status: string) {
    if (!application) return;
    const next = status as ApplicationStatus;
    if (next === application.status) return;

    try {
      await updateApplicationStatus(application.id, next);
      toast.success(`Status: ${STATUS_LABELS[next]}`);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Status konnte nicht geändert werden.",
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/applications">
            <ArrowLeft className="size-4" />
            Zurück zu Bewerbungen
          </Link>
        </Button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/applications">
            <ArrowLeft className="size-4" />
            Zurück zu Bewerbungen
          </Link>
        </Button>
        <EmptyState
          title="Bewerbung nicht gefunden"
          description="Diese Bewerbung existiert nicht mehr oder wurde gelöscht."
          action={
            <Button asChild>
              <Link href="/applications">Zur Übersicht</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const quelleLabel =
    SOURCE_LABELS[application.quelle as ApplicationSource] ??
    application.quelle ??
    NO_VALUE;
  const calendarUrl = googleCalendarUrl(application);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/applications">
          <ArrowLeft className="size-4" />
          Zurück zu Bewerbungen
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words">
              {application.unternehmen}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-sm text-muted-foreground break-words">
            {roleCategoryOf(application)}
            {application.standort ? (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {application.standort}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <Select
            value={application.status}
            onValueChange={(next) => void handleStatusChange(next)}
          >
            <SelectTrigger
              className="w-full sm:w-[190px]"
              aria-label="Status ändern"
            >
              <SelectValue />
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
            variant="outline"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => openReply("reply")}
          >
            <MessageSquarePlus className="size-4" />
            Antwort verfassen
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => openReply("follow_up")}
          >
            <Send className="size-4" />
            Nachfassen
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => setTab("research")}
          >
            <Sparkles className="size-4" />
            Recherche
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
            Bearbeiten
          </Button>
          <Button
            variant="destructive"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Löschen
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="emails">
            E-Mail-Verlauf
            {emails.length > 0 ? ` (${emails.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="research">Recherche</TabsTrigger>
          {DEMO_MODE ? null : (
            <TabsTrigger value="interview">Interview</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label={modeConfig(application.type).roleLabel}>
                  {roleCategoryOf(application) || NO_VALUE}
                </DetailItem>
                {application.employmentType ? (
                  <DetailItem label="Anstellungsart">
                    {EMPLOYMENT_TYPE_LABELS[application.employmentType] ??
                      application.employmentType}
                  </DetailItem>
                ) : null}
                <DetailItem label="Unternehmen">
                  {application.unternehmen || NO_VALUE}
                </DetailItem>
                <DetailItem label="Standort">
                  {application.standort || NO_VALUE}
                </DetailItem>
                <DetailItem label="Status">
                  <StatusBadge status={application.status} />
                </DetailItem>
                <DetailItem label="Bewerbungsdatum">
                  {formatDate(application.bewerbungsdatum)}
                </DetailItem>
                <DetailItem label="Quelle">{quelleLabel}</DetailItem>
                <DetailItem label="Ansprechpartner">
                  {application.ansprechpartner || NO_VALUE}
                </DetailItem>
                <DetailItem label="Wiedervorlage">
                  {application.followUpAt
                    ? `${formatDate(application.followUpAt)} (${formatRelative(application.followUpAt)})`
                    : NO_VALUE}
                </DetailItem>
                <DetailItem label="Gesprächstermin">
                  {application.interviewAt ? (
                    <div className="space-y-2">
                      <p>{formatDateTime(application.interviewAt)}</p>
                      <div className="flex flex-wrap gap-2">
                        {calendarUrl ? (
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={calendarUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <CalendarPlus className="size-4" />
                              Google Kalender
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadIcs(application)}
                        >
                          <Download className="size-4" />
                          ICS
                        </Button>
                      </div>
                    </div>
                  ) : (
                    NO_VALUE
                  )}
                </DetailItem>
                <DetailItem label="Letzte E-Mail">
                  {formatRelative(application.lastEmailAt)}
                </DetailItem>
                <DetailItem label="Stellenlink">
                  {application.stellenlink ? (
                    <a
                      href={application.stellenlink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Zur Stellenanzeige
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    NO_VALUE
                  )}
                </DetailItem>
                <DetailItem label="Erstellt am">
                  {formatDateTime(application.createdAt)}
                </DetailItem>
                <DetailItem label="Aktualisiert am">
                  {formatDateTime(application.updatedAt)}
                </DetailItem>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              {application.notizen ? (
                <p className="text-sm whitespace-pre-wrap">
                  {application.notizen}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keine Notizen hinterlegt.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <ApplicationAttachments application={application} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>E-Mail-Verlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationTimeline
                emails={emails}
                loading={emailsLoading}
                onComposeReply={() => openReply("reply")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recherche</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationResearchCard application={application} />
            </CardContent>
          </Card>
        </TabsContent>

        {DEMO_MODE ? null : (
          <TabsContent value="interview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Interview-Vorbereitung</CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewPrepCard application={application} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ApplicationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        application={application}
      />
      <ApplicationDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        application={application}
        onDeleted={() => router.push("/applications")}
      />
      <ReplyDialog
        applicationId={application.id}
        threadId={application.gmailThreadIds?.[0]}
        defaultSubject={
          replyIntent === "follow_up"
            ? `Nachfassen: ${roleCategoryOf(application) || "Bewerbung"}`
            : undefined
        }
        intent={replyIntent}
        open={replyOpen}
        onOpenChange={setReplyOpen}
      />
    </div>
  );
}
