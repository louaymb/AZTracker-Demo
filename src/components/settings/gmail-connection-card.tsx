"use client";

import { useState } from "react";
import { CircleCheck, Info, Loader2, Mail, TriangleAlert, Unplug } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { disconnectGmail, getGmailAuthUrl } from "@/lib/firebase/functions";
import { DEMO_MODE } from "@/lib/demo/flag";

export function GmailConnectionCard() {
  const { profile } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const connected = profile?.gmailConnected ?? false;

  if (DEMO_MODE) {
    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Gmail-Verbindung
          </CardTitle>
          <CardDescription>
            AusbildungTracker liest deine E-Mails ausschließlich lesend
            (<code>gmail.readonly</code>), um Bewerbungen automatisch zu erkennen.
            Der Zugriff erfolgt nur serverseitig über Cloud Functions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/40 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-0.5 text-sm">
              <p className="font-medium">Demo-Modus</p>
              <p className="text-muted-foreground">
                Im Demo-Modus ist keine Gmail-Verbindung möglich.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await getGmailAuthUrl();
      window.location.assign(url);
    } catch (cause) {
      toast.error("Verbindung konnte nicht gestartet werden.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectGmail();
      toast.success("Gmail-Verbindung getrennt");
    } catch (cause) {
      toast.error("Verbindung konnte nicht getrennt werden.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" />
          Gmail-Verbindung
        </CardTitle>
        <CardDescription>
          AusbildungTracker liest deine E-Mails ausschließlich lesend
          (<code>gmail.readonly</code>), um Bewerbungen automatisch zu erkennen.
          Der Zugriff erfolgt nur serverseitig über Cloud Functions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 space-y-0.5 text-sm">
              <p className="font-medium">Verbunden</p>
              <p className="truncate text-muted-foreground">
                {profile?.gmailEmail || "Gmail-Konto verknüpft"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 space-y-0.5 text-sm">
              <p className="font-medium">Nicht verbunden</p>
              <p className="text-muted-foreground">
                Verbinde dein Postfach, um den automatischen Abgleich zu
                aktivieren.
              </p>
              {profile?.lastSyncAt ? (
                <p className="text-muted-foreground">
                  Die Verbindung ist abgelaufen oder wurde widerrufen. Bitte
                  Gmail erneut verbinden.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {connected ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full whitespace-normal sm:h-8 sm:w-auto"
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Unplug className="mr-2 size-4" />
                )}
                Verbindung trennen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gmail-Verbindung trennen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Der gespeicherte Zugriffsschlüssel wird gelöscht. Bereits
                  importierte Bewerbungen und E-Mails bleiben erhalten, es
                  werden aber keine neuen E-Mails mehr abgeglichen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleDisconnect()}>
                  Trennen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="h-10 w-full whitespace-normal sm:h-8 sm:w-auto"
          >
            {connecting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            Gmail verbinden
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
