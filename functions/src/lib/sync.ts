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
  resolveApplicationType,
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
  gmailThreadIds: string[];
  stellenlink: string;
  referenceNumber: string;
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

function isEmploymentType(value: unknown): value is EmploymentType {
  return typeof value === "string" && EMPLOYMENT_TYPES.includes(value);
}

function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

const REFERENCE_LABEL =
  /(ausschreibungskennziffer|ausschreibungsnummer|referenznummer|referenz|kennziffer|kennnummer|bewerbernummer|bewerbungsnummer|vorgangsnummer|stellen[\s-]?id)/gi;

/**
 * Normalise a posting reference. Labels such as "Ausschreibungskennziffer"
 * are stripped so "Ausschreibungskennziffer 26198" and "26198" compare equal.
 */
function referenceKey(value: string): string {
  return value
    .replace(REFERENCE_LABEL, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function sameReference(a: string, b: string): boolean {
  const keyA = referenceKey(a);
  const keyB = referenceKey(b);
  return keyA.length >= 2 && keyA === keyB;
}

/** Generic text normalisation for company / role comparison. */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([mwfd]\/[mwfd]\/[mwfd]\)/g, "")
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .trim();
}

function companiesCompatible(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

const ROLE_STOPWORDS = new Set([
  "in",
  "m",
  "w",
  "d",
  "für",
  "der",
  "die",
  "das",
  "und",
  "als",
  "bei",
  "im",
  "zur",
  "zum",
]);

function roleTokens(value: string): string[] {
  return normalizeText(value)
    .replace(/\([^)]*\)/g, " ")
    .split(" ")
    .filter((token) => token.length > 1 && !ROLE_STOPWORDS.has(token));
}

/**
 * Whether the mail's role and the application's role refer to the same
 * position. Gender suffixes ("Fachinformatiker*in") and filler words are
 * ignored; every distinctive token of the shorter role must appear in the
 * longer one, so different specialisations do not match.
 */
function rolesCompatible(
  classification: { ausbildungsberuf: string; roleCategory: string },
  application: Pick<ApplicationState, "ausbildungsberuf" | "roleCategory">,
): boolean {
  const mailTokens = roleTokens(
    classification.roleCategory || classification.ausbildungsberuf,
  );
  const appTokens = roleTokens(
    application.roleCategory || application.ausbildungsberuf,
  );
  if (mailTokens.length === 0 || appTokens.length === 0) return false;
  const [shorter, longer] =
    mailTokens.length <= appTokens.length
      ? [mailTokens, new Set(appTokens)]
      : [appTokens, new Set(mailTokens)];
  return shorter.every((token) => longer.has(token));
}

const GENERIC_ROLE_TOKENS = new Set([
  "ausbildung",
  "ausbildungsplatz",
  "ausbildungsstellen",
  "azubi",
  "job",
  "stelle",
  "stellen",
  "position",
  "mitarbeiter",
  "kraft",
  "vollzeit",
  "teilzeit",
  "minijob",
  "werkstudent",
  "praktikum",
  "aushilfe",
  "bewerbung",
]);

/**
 * True when the mail unambiguously describes a different posting than the
 * given application. Several Ausbildungen can be confirmed inside one Gmail
 * thread (e.g. when applying through ausbildung.de), so a shared thread or a
 * shared company must never be enough on its own. A differing reference, a
 * different company or two clearly distinct roles all signal a separate
 * Bewerbung.
 */
function isDifferentPosting(
  classification: {
    unternehmen: string;
    ausbildungsberuf: string;
    roleCategory: string;
    referenceNumber: string;
  },
  application: Pick<
    ApplicationState,
    "unternehmen" | "ausbildungsberuf" | "roleCategory" | "referenceNumber"
  >,
): boolean {
  const mailReference = referenceKey(classification.referenceNumber);
  const appReference = referenceKey(application.referenceNumber);
  if (
    mailReference.length >= 2 &&
    appReference.length >= 2 &&
    mailReference !== appReference
  ) {
    return true;
  }

  if (
    classification.unternehmen.length > 0 &&
    application.unternehmen.length > 0 &&
    !companiesCompatible(classification.unternehmen, application.unternehmen)
  ) {
    return true;
  }

  const mailTokens = roleTokens(
    classification.roleCategory || classification.ausbildungsberuf,
  );
  const appTokens = roleTokens(
    application.roleCategory || application.ausbildungsberuf,
  );
  if (
    mailTokens.length > 0 &&
    appTokens.length > 0 &&
    !rolesCompatible(classification, application)
  ) {
    const mailHasDistinct = mailTokens.some(
      (token) => !GENERIC_ROLE_TOKENS.has(token),
    );
    const appHasDistinct = appTokens.some(
      (token) => !GENERIC_ROLE_TOKENS.has(token),
    );
    if (mailHasDistinct && appHasDistinct) return true;
  }

  return false;
}

function sameLink(a: string, b: string): boolean {
  const left = a.trim().toLowerCase().replace(/\/+$/, "");
  const right = b.trim().toLowerCase().replace(/\/+$/, "");
  return left.length > 0 && left === right;
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
      const employmentType = isEmploymentType(data.employmentType)
        ? data.employmentType
        : null;
      applicationState.set(doc.id, {
        id: doc.id,
        type: resolveApplicationType(data.type, employmentType),
        unternehmen: typeof data.unternehmen === "string" ? data.unternehmen : "",
        ausbildungsberuf,
        roleCategory: storedRoleCategory || ausbildungsberuf,
        standort: typeof data.standort === "string" ? data.standort : "",
        status: isApplicationStatus(data.status) ? data.status : "beworben",
        employmentType,
        gmailThreadIds: Array.isArray(data.gmailThreadIds)
          ? data.gmailThreadIds.filter(
              (value: unknown): value is string => typeof value === "string",
            )
          : [],
        stellenlink:
          typeof data.stellenlink === "string" ? data.stellenlink.trim() : "",
        referenceNumber:
          typeof data.referenceNumber === "string"
            ? data.referenceNumber.trim()
            : "",
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
        threadId,
        applications: [...applicationState.values()].map((app) => ({
          id: app.id,
          type: app.type,
          unternehmen: app.unternehmen,
          ausbildungsberuf: app.ausbildungsberuf,
          roleCategory: app.roleCategory,
          standort: app.standort,
          status: app.status,
          employmentType: app.employmentType,
          referenceNumber: app.referenceNumber,
          gmailThreadIds: app.gmailThreadIds,
          stellenlink: app.stellenlink,
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
      const classifiedType = classification.applicationType;
      const allApplications = [...applicationState.values()];

      // 1) Prefer an application already linked to this Gmail thread, but only
      //    when the mail does not clearly describe a different posting. A
      //    single thread can hold several Bewerbungen (e.g. ausbildung.de
      //    confirmations), so thread membership alone is not enough.
      if (threadId) {
        const threadApplications = allApplications.filter((app) =>
          app.gmailThreadIds.includes(threadId),
        );
        application =
          threadApplications.find(
            (app) => !isDifferentPosting(classification, app),
          ) ?? null;
      }

      // 2) The posting reference (e.g. Ausschreibungskennziffer) uniquely
      //    identifies one Stellenausschreibung. This keeps several
      //    applications at the same company apart.
      if (
        !application &&
        classification.referenceNumber.length > 0
      ) {
        application =
          allApplications.find(
            (app) =>
              app.referenceNumber.length > 0 &&
              sameReference(app.referenceNumber, classification.referenceNumber) &&
              companiesCompatible(app.unternehmen, classification.unternehmen),
          ) ?? null;
      }

      // 3) Fall back to the classifier, but only accept its suggestion when it
      //    is corroborated by the reference number, the role or the link.
      //    A shared company alone is never enough.
      if (!application) {
        const matchedApp = classification.matchApplicationId
          ? applicationState.get(classification.matchApplicationId) ?? null
          : null;
        if (
          matchedApp &&
          classifiedType !== null &&
          matchedApp.type === classifiedType &&
          classification.matchConfidence >= 0.6
        ) {
          const hasMailReference = referenceKey(classification.referenceNumber).length >= 2;
          const hasAppReference = referenceKey(matchedApp.referenceNumber).length >= 2;
          const referenceConflict =
            hasMailReference &&
            hasAppReference &&
            !sameReference(classification.referenceNumber, matchedApp.referenceNumber);
          const corroborated =
            sameReference(classification.referenceNumber, matchedApp.referenceNumber) ||
            rolesCompatible(classification, matchedApp) ||
            sameLink(classification.stellenlink, matchedApp.stellenlink);

          if (!referenceConflict && corroborated) {
            application = matchedApp;
          }
        }
      }

      if (application) {
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
          gmailThreadIds: threadId ? [threadId] : [],
          stellenlink: classification.stellenlink,
          referenceNumber: classification.referenceNumber,
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
          referenceNumber: classification.referenceNumber,
          notizen: "",
          employmentType: classification.employmentType,
          gmailThreadIds: created.gmailThreadIds,
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
        if (!application.gmailThreadIds.includes(threadId)) {
          application.gmailThreadIds.push(threadId);
        }
      }

      // Learn the posting reference from the mail so later generic mails
      // (e.g. status updates without a role) can be matched reliably.
      if (
        !application.referenceNumber &&
        classification.referenceNumber.length > 0
      ) {
        updates.referenceNumber = classification.referenceNumber;
        application.referenceNumber = classification.referenceNumber;
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
