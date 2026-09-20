import { HttpsError } from "firebase-functions/v2/https";

import {
  MAX_APPLICATIONS_FOR_MATCHING,
  config,
} from "../config";
import {
  EMAILS_SUBCOLLECTION,
  APPLICATIONS_COLLECTION,
  PROCESSED_EMAILS_COLLECTION,
  SYNC_RUNS_COLLECTION,
  gmailPrivateDocPath,
} from "./owner";
import { FieldValue, Timestamp, db, logger } from "./admin";
import {
  extractBodyText,
  extractEmailAddress,
  getFullMessage,
  getHeader,
  gmailClient,
  isGmailAuthError,
  listMessageIds,
} from "./gmail";
import { classifyEmail } from "./gemini";
import { revokeGmailCredentials } from "./credentials";
import {
  STATUS_RANK,
  TERMINAL_STATUSES,
  type ApplicationStatus,
  type ApplicationType,
  type EmploymentType,
  type SyncResult,
  type SyncTrigger,
} from "../types";

export interface RunSyncOptions {
  uid: string;
  trigger: Exclude<SyncTrigger, "initial">;
  fullSync?: boolean;
  sinceDate?: string;
  maxMessages?: number;
}

interface ApplicationState {
  id: string;
  type: ApplicationType;
  unternehmen: string;
  ausbildungsberuf: string;
  roleCategory: string;
  standort: string;
  status: ApplicationStatus;
  employmentType: EmploymentType | null;
  lastEmailAt: Timestamp | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CONCURRENCY = 2;
const MAX_ROLE_CATEGORIES = 60;

const EMPLOYMENT_TYPES: string[] = [
  "ausbildung",
  "duales_studium",
  "vollzeit",
  "teilzeit",
  "minijob",
  "werkstudent",
  "praktikum",
  "aushilfe",
  "sonstiges",
];

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && value in STATUS_RANK;
}

function isApplicationType(value: unknown): value is ApplicationType {
  return value === "ausbildung" || value === "job";
}

function isEmploymentType(value: unknown): value is EmploymentType {
  return typeof value === "string" && EMPLOYMENT_TYPES.includes(value);
}

function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function gmailDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function toTimestamp(millis: number): Timestamp {
  return Number.isFinite(millis) && millis > 0
    ? Timestamp.fromMillis(millis)
    : Timestamp.now();
}

function laterOf(a: Timestamp | null, b: Timestamp): Timestamp {
  if (!a) return b;
  return a.toMillis() >= b.toMillis() ? a : b;
}

function directionFor(
  fromHeader: string,
  connectedEmail: string,
): "inbound" | "outbound" | "unknown" {
  const from = extractEmailAddress(fromHeader);
  if (!from || !connectedEmail) return "unknown";
  return from === connectedEmail.toLowerCase() ? "outbound" : "inbound";
}

const SYNC_LOCK_TTL_MS = 15 * 60 * 1000;

function syncLockRef(uid: string) {
  return db.doc(`users/${uid}/private/syncLock`);
}

/**
 * Best-effort lock so a scheduled sync and a manual sync can never run at the
 * same time and process the same messages twice. The lock expires on its own
 * after `SYNC_LOCK_TTL_MS` in case a previous run crashed.
 */
async function acquireSyncLock(uid: string): Promise<boolean> {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(syncLockRef(uid));
    const startedAt = snapshot.exists ? snapshot.get("startedAt") : null;
    const isStale =
      !(startedAt instanceof Timestamp) ||
      Date.now() - startedAt.toMillis() > SYNC_LOCK_TTL_MS;

    if (!isStale) return false;

    transaction.set(syncLockRef(uid), { startedAt: Timestamp.now(), uid });
    return true;
  });
}

async function releaseSyncLock(uid: string): Promise<void> {
  await syncLockRef(uid)
    .delete()
    .catch(() => undefined);
}

export async function runSync(options: RunSyncOptions): Promise<SyncResult> {
  const { uid } = options;

  if (!(await acquireSyncLock(uid))) {
    throw new HttpsError(
      "failed-precondition",
      "Es läuft bereits eine Synchronisierung. Bitte versuche es in ein paar Minuten erneut.",
    );
  }

  try {
    return await runSyncLocked(options);
  } finally {
    await releaseSyncLock(uid);
  }
}

async function runSyncLocked(options: RunSyncOptions): Promise<SyncResult> {
  const { uid } = options;

  const credentialsSnapshot = await db.doc(gmailPrivateDocPath(uid)).get();
  const refreshToken = credentialsSnapshot.get("refreshToken");
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "Gmail ist nicht verbunden.",
    );
  }
  const storedEmail = credentialsSnapshot.get("email");
  const connectedEmail =
    typeof storedEmail === "string" ? storedEmail.toLowerCase() : "";

  const userSnapshot = await db.doc(`users/${uid}`).get();
  const lastSyncAtValue = userSnapshot.get("lastSyncAt");
  const lastSyncAt =
    lastSyncAtValue instanceof Timestamp ? lastSyncAtValue : null;
  const isInitial = !lastSyncAt;
  const trigger: SyncTrigger = isInitial ? "initial" : options.trigger;

  const runRef = db.collection(SYNC_RUNS_COLLECTION).doc();
  const runId = runRef.id;

  await runRef.set({
    trigger,
    status: "running",
    startedAt: Timestamp.now(),
    finishedAt: null,
    messagesScanned: 0,
    messagesRelevant: 0,
    applicationsCreated: 0,
    applicationsMatched: 0,
    errors: [],
  });

  let messagesScanned = 0;
  let messagesRelevant = 0;
  let applicationsCreated = 0;
  let applicationsMatched = 0;
  let failedMessages = 0;
  const errors: string[] = [];

  try {
    const now = new Date();
    const lookbackStart = new Date(
      now.getTime() - config.firstSyncLookbackDays * DAY_MS,
    );

    let afterDate: Date;
    const sinceDate = options.sinceDate ? new Date(options.sinceDate) : null;
    if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
      afterDate = sinceDate;
    } else if (isInitial || options.fullSync) {
      afterDate = lookbackStart;
    } else {
      afterDate = new Date(
        Math.max(lastSyncAt!.toDate().getTime(), lookbackStart.getTime()),
      );
    }

    // Mail older than SYNC_START_DATE is intentionally ignored: the tracker
    // only tracks applications from that date on. This applies to initial
    // syncs, fullSync and explicit sinceDate alike.
    const parsedSyncStart = new Date(config.syncStartDate);
    const syncStartMs = Number.isNaN(parsedSyncStart.getTime())
      ? 0
      : parsedSyncStart.getTime();
    if (syncStartMs > 0 && afterDate.getTime() < syncStartMs) {
      afterDate = new Date(syncStartMs);
    }

    // Gmail's `after:` is date-granular. Scan one extra day to avoid missing
    // mails that arrived between lastSyncAt and the start of the sync day;
    // processedEmails dedupe prevents double processing. The extra day must
    // not reach before the sync start date.
    const lookbackQueryStart = new Date(afterDate.getTime() - DAY_MS);
    const queryStart =
      syncStartMs > 0 && lookbackQueryStart.getTime() < syncStartMs
        ? new Date(syncStartMs)
        : lookbackQueryStart;
    const query = `${config.gmailSearchQuery} after:${gmailDate(queryStart)}`;
    const maxMessages = options.maxMessages ?? config.maxMessagesPerSync;

    const gmail = gmailClient(refreshToken);
    const messageIds = await listMessageIds(gmail, query, maxMessages);

    const applicationState = new Map<string, ApplicationState>();
    const applicationsSnapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .limit(MAX_APPLICATIONS_FOR_MATCHING)
      .get();

    for (const doc of applicationsSnapshot.docs) {
      const data = doc.data();
      const ausbildungsberuf =
        typeof data.ausbildungsberuf === "string" ? data.ausbildungsberuf : "";
      const storedRoleCategory =
        typeof data.roleCategory === "string" ? data.roleCategory.trim() : "";
      applicationState.set(doc.id, {
        id: doc.id,
        type: isApplicationType(data.type) ? data.type : "ausbildung",
        unternehmen: typeof data.unternehmen === "string" ? data.unternehmen : "",
        ausbildungsberuf,
        roleCategory: storedRoleCategory || ausbildungsberuf,
        standort: typeof data.standort === "string" ? data.standort : "",
        status: isApplicationStatus(data.status) ? data.status : "beworben",
        employmentType: isEmploymentType(data.employmentType)
          ? data.employmentType
          : null,
        lastEmailAt:
          data.lastEmailAt instanceof Timestamp ? data.lastEmailAt : null,
      });
    }

    const roleCategories = Array.from(
      new Set(
        [...applicationState.values()]
          .map((app) => app.roleCategory.trim())
          .filter(Boolean),
      ),
    ).slice(0, MAX_ROLE_CATEGORIES);

    const queue = [...messageIds];

    const processMessage = async (messageId: string): Promise<void> => {
      const processedRef = db.doc(
        `${PROCESSED_EMAILS_COLLECTION}/${messageId}`,
      );
      const alreadyProcessed = await processedRef.get();
      if (alreadyProcessed.exists) return;

      messagesScanned += 1;

      const message = await getFullMessage(gmail, messageId);
      const threadId = message.threadId ?? "";
      const subject = getHeader(message, "Subject");
      const from = getHeader(message, "From");
      const to = getHeader(message, "To");
      const dateHeader = getHeader(message, "Date");
      const snippet = message.snippet ?? "";
      const bodyText = extractBodyText(message);
      const internalMillis = Number(message.internalDate ?? 0);
      const receivedAt = toTimestamp(internalMillis);
      const direction = directionFor(from, connectedEmail);

      const classification = await classifyEmail({
        from,
        to,
        subject,
        date: dateHeader,
        body: bodyText,
        applications: [...applicationState.values()].map((app) => ({
          id: app.id,
          type: app.type,
          unternehmen: app.unternehmen,
          ausbildungsberuf: app.ausbildungsberuf,
          standort: app.standort,
          status: app.status,
          employmentType: app.employmentType,
        })),
        roleCategories,
      });

      if (!classification.relevant) {
        await processedRef.set({
          applicationId: null,
          processedAt: Timestamp.now(),
        });
        return;
      }

      messagesRelevant += 1;

      let application: ApplicationState | null = null;

      const matchedId = classification.matchApplicationId;
      const matchedApp = matchedId
        ? applicationState.get(matchedId) ?? null
        : null;
      const classifiedType = classification.applicationType;

      // Only match within the same world: an Ausbildungs mail must never be
      // merged into a regular job application and vice versa.
      if (
        matchedApp &&
        classifiedType !== null &&
        matchedApp.type === classifiedType &&
        classification.matchConfidence >= 0.6
      ) {
        application = matchedApp;
        applicationsMatched += 1;
      } else if (direction === "inbound" && classification.unternehmen.length > 0) {
        const newType: ApplicationType = classifiedType ?? "ausbildung";
        const roleCategory =
          classification.roleCategory || classification.ausbildungsberuf;
        const appRef = db.collection(APPLICATIONS_COLLECTION).doc();
        const created: ApplicationState = {
          id: appRef.id,
          type: newType,
          unternehmen: classification.unternehmen,
          ausbildungsberuf: classification.ausbildungsberuf,
          roleCategory,
          standort: classification.standort,
          status: "beworben",
          employmentType: classification.employmentType,
          lastEmailAt: receivedAt,
        };
        await appRef.set({
          type: newType,
          ausbildungsberuf: classification.ausbildungsberuf,
          roleCategory,
          unternehmen: classification.unternehmen,
          standort: classification.standort,
          status: "beworben",
          bewerbungsdatum: receivedAt,
          quelle: "sonstiges",
          stellenlink: classification.stellenlink,
          ansprechpartner: classification.ansprechpartner,
          notizen: "",
          employmentType: classification.employmentType,
          gmailThreadIds: [threadId],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastEmailAt: receivedAt,
          followUpAt: null,
          research: null,
          attachments: [],
        });
        applicationState.set(created.id, created);
        application = created;
        applicationsCreated += 1;
      } else {
        errors.push(
          `Keine Zuordnung möglich: ${subject || "(ohne Betreff)"}`,
        );
        return;
      }

      const emailRef = db
        .collection(APPLICATIONS_COLLECTION)
        .doc(application.id)
        .collection(EMAILS_SUBCOLLECTION)
        .doc(messageId);

      await emailRef.set({
        applicationId: application.id,
        gmailMessageId: messageId,
        gmailThreadId: threadId,
        from,
        to,
        subject,
        snippet,
        bodyText,
        receivedAt,
        direction,
        suggestedStatus: classification.suggestedStatus,
        aiRelevant: classification.relevant,
        aiConfidence: classification.confidence,
        aiSummary: classification.summary,
        aiReasoning: classification.reasoning,
        createdAt: Timestamp.now(),
      });

      const updates: Record<string, unknown> = {
        lastEmailAt: laterOf(application.lastEmailAt, receivedAt),
        updatedAt: Timestamp.now(),
      };
      if (threadId) {
        updates.gmailThreadIds = FieldValue.arrayUnion(threadId);
      }

      // Outbound mail and terminal statuses must never change the status.
      const suggested = classification.suggestedStatus;
      if (
        direction !== "outbound" &&
        suggested &&
        !isTerminal(application.status) &&
        STATUS_RANK[suggested] > STATUS_RANK[application.status]
      ) {
        updates.status = suggested;
        application.status = suggested;
      }

      application.lastEmailAt = laterOf(application.lastEmailAt, receivedAt);

      await db
        .collection(APPLICATIONS_COLLECTION)
        .doc(application.id)
        .update(updates);

      await processedRef.set({
        applicationId: application.id,
        processedAt: Timestamp.now(),
      });
    };

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const messageId = queue.shift();
        if (!messageId) break;
        try {
          await processMessage(messageId);
        } catch (error) {
          failedMessages += 1;
          logger.error(`Fehler beim Verarbeiten von ${messageId}.`, error);
          errors.push(`Fehler bei Nachricht ${messageId}.`);
        }
      }
    });

    await Promise.all(workers);

    await runRef.update({
      status: "success",
      finishedAt: Timestamp.now(),
      messagesScanned,
      messagesRelevant,
      applicationsCreated,
      applicationsMatched,
      errors,
    });

    // Only advance the watermark when every message was processed. Otherwise
    // the next (non-full) sync would skip the failed messages entirely.
    await db.doc(`users/${uid}`).set(
      {
        lastSyncAt: failedMessages === 0 ? Timestamp.now() : lastSyncAt,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    return {
      runId,
      messagesScanned,
      messagesRelevant,
      applicationsCreated,
      applicationsMatched,
      errors,
    };
  } catch (error) {
    logger.error("Gmail-Sync fehlgeschlagen.", error);

    // A dead grant (e.g. the 7-day Testing-mode expiry or a revoked token)
    // cannot recover on its own – drop the token and ask for a reconnect.
    if (isGmailAuthError(error)) {
      await revokeGmailCredentials(uid).catch(() => undefined);
      await runRef
        .update({
          status: "error",
          finishedAt: Timestamp.now(),
          messagesScanned,
          messagesRelevant,
          applicationsCreated,
          applicationsMatched,
          errors: [
            ...errors,
            "Gmail-Verbindung abgelaufen oder widerrufen.",
          ],
        })
        .catch(() => undefined);

      throw new HttpsError(
        "failed-precondition",
        "Die Gmail-Verbindung ist abgelaufen oder wurde widerrufen. Bitte verbinde Gmail in den Einstellungen erneut.",
      );
    }

    await runRef
      .update({
        status: "error",
        finishedAt: Timestamp.now(),
        messagesScanned,
        messagesRelevant,
        applicationsCreated,
        applicationsMatched,
        errors: [
          ...errors,
          error instanceof Error ? error.message : String(error),
        ],
      })
      .catch(() => undefined);
    throw error;
  }
}
