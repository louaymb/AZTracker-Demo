"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { AccountCard } from "@/components/settings/account-card";
import { CalendarSettingsCard } from "@/components/settings/calendar-settings-card";
import { GmailConnectionCard } from "@/components/settings/gmail-connection-card";
import { ReminderSettingsCard } from "@/components/settings/reminder-settings-card";
import { SyncCard } from "@/components/settings/sync-card";
import { SyncHistory } from "@/components/settings/sync-history";

function GmailCallbackToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const status = searchParams.get("gmail");
    if (!status) return;

    handled.current = true;

    if (status === "connected") {
      toast.success("Gmail erfolgreich verbunden");
    } else if (status === "error") {
      toast.error("Gmail-Verbindung fehlgeschlagen", {
        description: searchParams.get("reason") ?? undefined,
      });
    }

    router.replace("/settings");
  }, [searchParams, router]);

  return null;
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Einstellungen"
        description="Gmail verbinden, Synchronisierung steuern und Erinnerungen konfigurieren."
      />

      <Suspense fallback={null}>
        <GmailCallbackToast />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <GmailConnectionCard />
        <SyncCard />
        <ReminderSettingsCard />
        <CalendarSettingsCard />
        <AccountCard />
      </div>

      <div className="mt-6">
        <SyncHistory />
      </div>
    </>
  );
}
