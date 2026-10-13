"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  triggerGmailSync,
  type SyncOptions,
} from "@/lib/firebase/functions";
import type { SyncResult } from "@/types";

export interface UseGmailSyncResult {
  syncing: boolean;
  lastResult: SyncResult | null;
  run: (options?: SyncOptions) => Promise<SyncResult | null>;
}

export function useGmailSync(): UseGmailSyncResult {
  const { profile } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const run = useCallback(
    async (options?: SyncOptions): Promise<SyncResult | null> => {
      if (!profile?.gmailConnected) {
        toast.error("Gmail ist noch nicht verbunden.", {
          description: "Verbinde dein Postfach zuerst unter Einstellungen.",
        });
        return null;
      }

      setSyncing(true);
      const toastId = toast.loading("Gmail wird synchronisiert …");

      try {
        const result = await triggerGmailSync(options);
        setLastResult(result);

        const summary = `${result.messagesScanned} E-Mails geprüft · ${result.applicationsCreated} neu · ${result.applicationsMatched} zugeordnet`;

        if (result.errors.length > 0) {
          toast.warning("Synchronisierung mit Hinweisen abgeschlossen", {
            id: toastId,
            description: summary,
          });
        } else {
          toast.success("Synchronisierung abgeschlossen", {
            id: toastId,
            description: summary,
          });
        }
        return result;
      } catch (cause) {
        toast.error("Synchronisierung fehlgeschlagen", {
          id: toastId,
          description:
            cause instanceof Error ? cause.message : "Unbekannter Fehler.",
        });
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [profile?.gmailConnected],
  );

  return { syncing, lastResult, run };
}
