"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { BerufChart } from "@/components/dashboard/beruf-chart";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { UpcomingInterviews } from "@/components/dashboard/upcoming-interviews";
import { PageHeader } from "@/components/layout/page-header";
import { SyncButton } from "@/components/layout/sync-button";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { applications, loading, error } = useApplications();
  const { profile } = useAuth();
  const { mode, labels } = useAppMode();

  const scopedApplications = useMemo(
    () => applications.filter((application) => application.type === mode),
    [applications, mode],
  );

  const needsAttentionAfterDays =
    profile?.settings?.needsAttentionAfterDays ?? 14;
  const hasApplications = scopedApplications.length > 0;

  return (
    <>
      <PageHeader
        title={`Übersicht · ${labels.title}`}
        description={labels.dashboardDescription}
        action={<SyncButton />}
      />

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
          icon={Inbox}
          title="Daten konnten nicht geladen werden"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
          }
        />
      ) : null}

      {!loading && !error && !hasApplications ? (
        <EmptyState
          icon={Inbox}
          title={labels.emptyTitle}
          description={`${labels.emptyDescription} Der Gmail-Sync importiert immer beide Bereiche (Ausbildungen und Jobs) gleichzeitig.`}
          action={
            <Button asChild>
              <Link href="/settings">Zu den Einstellungen</Link>
            </Button>
          }
        />
      ) : null}

      {!loading && !error && hasApplications ? (
        <div className="space-y-6">
          <StatCards applications={scopedApplications} />
          <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <NeedsAttention
              applications={scopedApplications}
              thresholdDays={needsAttentionAfterDays}
            />
            <UpcomingInterviews applications={scopedApplications} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <StatusChart applications={scopedApplications} />
            <BerufChart applications={scopedApplications} />
          </div>
          <RecentActivity applications={scopedApplications} />
        </div>
      ) : null}
    </>
  );
}
