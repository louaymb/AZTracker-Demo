"use client";

import { useState } from "react";
import { CalendarClock, Loader2, RefreshCw } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGmailSync } from "@/hooks/use-sync";
import { formatDateTime } from "@/lib/format";

export function SyncCard() {
  const { profile } = useAuth();
  const { syncing, run } = useGmailSync();
  const [sinceDate, setSinceDate] = useState("");

  const connected = profile?.gmailConnected ?? false;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-4" />
          Synchronisierung
        </CardTitle>
        <CardDescription>
          Gleicht dein Postfach mit den Bewerbungen ab. Eine automatische
          Synchronisierung läuft zusätzlich alle 6 Stunden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Letzte Synchronisierung:{" "}
          <span className="font-medium text-foreground">
            {formatDateTime(profile?.lastSyncAt, "Noch nie")}
          </span>
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            className="h-10 w-full whitespace-normal sm:h-8 sm:w-auto"
            disabled={!connected || syncing}
            onClick={() => void run()}
          >
            {syncing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Jetzt synchronisieren
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full whitespace-normal sm:h-8 sm:w-auto"
            disabled={!connected || syncing}
            onClick={() => void run({ fullSync: true })}
          >
            Vollständige Synchronisierung
          </Button>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="sinceDate" className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            Alte E-Mails ab Datum importieren
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="sinceDate"
              type="date"
              value={sinceDate}
              onChange={(event) => setSinceDate(event.target.value)}
              className="h-10 w-full min-w-0 sm:h-8 sm:w-auto"
              disabled={!connected || syncing}
            />
            <Button
              variant="secondary"
              className="h-10 w-full whitespace-normal sm:h-8 sm:w-auto"
              disabled={!connected || syncing || !sinceDate}
              onClick={() => void run({ fullSync: true, sinceDate })}
            >
              Ab diesem Datum scannen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nützlich für den Erstimport: Durchsucht dein Postfach rückwirkend
            nach Bewerbungs-E-Mails.
          </p>
        </div>

        {!connected && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Verbinde zuerst dein Gmail-Konto.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
