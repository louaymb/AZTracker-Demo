import { HttpsError } from "firebase-functions/v2/https";

import { db } from "./admin";

export const ACCESS_DOC_PATH = "settings/access";
export const USERS_COLLECTION = "users";
export const APPLICATIONS_COLLECTION = "applications";
export const EMAILS_SUBCOLLECTION = "emails";
export const SYNC_RUNS_COLLECTION = "syncRuns";
export const PROCESSED_EMAILS_COLLECTION = "processedEmails";

export const gmailPrivateDocPath = (uid: string) => `${USERS_COLLECTION}/${uid}/private/gmail`;

/**
 * Resolve the single allowed owner uid from `settings/access`. Returns null
 * when the app has not been claimed yet.
 */
export async function resolveOwnerUid(): Promise<string | null> {
  const snapshot = await db.doc(ACCESS_DOC_PATH).get();
  if (!snapshot.exists) return null;
  const ownerUid = snapshot.get("ownerUid");
  return typeof ownerUid === "string" && ownerUid.length > 0 ? ownerUid : null;
}

/** Throw `permission-denied` unless `uid` is the configured owner. */
export async function assertOwner(uid: string | undefined): Promise<string> {
  const ownerUid = await resolveOwnerUid();
  if (!uid || !ownerUid || ownerUid !== uid) {
    throw new HttpsError("permission-denied", "Kein Zugriff.");
  }
  return uid;
}
