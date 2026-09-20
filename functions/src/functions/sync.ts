import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db, logger } from "../lib/admin";
import { assertOwner, gmailPrivateDocPath, resolveOwnerUid } from "../lib/owner";
import { runSync } from "../lib/sync";

interface SyncGmailData {
  fullSync?: unknown;
  sinceDate?: unknown;
  maxMessages?: unknown;
}

export const syncGmail = onCall(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 540,
    memory: "512MiB",
    enforceAppCheck: false,
  },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);
    const data = (request.data ?? {}) as SyncGmailData;

    return runSync({
      uid,
      trigger: "manual",
      fullSync: data.fullSync === true,
      sinceDate:
        typeof data.sinceDate === "string" && data.sinceDate.length > 0
          ? data.sinceDate
          : undefined,
      maxMessages:
        typeof data.maxMessages === "number" && data.maxMessages > 0
          ? Math.floor(data.maxMessages)
          : undefined,
    });
  },
);

export const syncGmailScheduled = onSchedule(
  {
    region: "us-central1",
    schedule: "every 6 hours",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const ownerUid = await resolveOwnerUid();
    if (!ownerUid) {
      logger.info("Kein Eigentümer konfiguriert – Sync übersprungen.");
      return;
    }

    const userSnapshot = await db.doc(`users/${ownerUid}`).get();
    if (!userSnapshot.exists || userSnapshot.get("gmailConnected") !== true) {
      logger.info("Gmail ist nicht verbunden – Sync übersprungen.");
      return;
    }

    const credentialsSnapshot = await db
      .doc(gmailPrivateDocPath(ownerUid))
      .get();
    const refreshToken = credentialsSnapshot.get("refreshToken");
    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      logger.info("Kein Gmail-Refresh-Token vorhanden – Sync übersprungen.");
      return;
    }

    try {
      await runSync({ uid: ownerUid, trigger: "schedule" });
    } catch (error) {
      // A concurrent manual sync is expected and not an error.
      if (error instanceof HttpsError && error.code === "failed-precondition") {
        logger.info("Sync übersprungen: es läuft bereits eine Synchronisierung.");
        return;
      }
      throw error;
    }
  },
);
