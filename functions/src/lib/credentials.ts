import { Timestamp, db } from "./admin";
import { gmailPrivateDocPath } from "./owner";

/**
 * Remove the stored Gmail OAuth credentials for `uid` and mark the account as
 * disconnected. Used when the user disconnects manually and when Google
 * rejects the refresh token (`invalid_grant`), so the UI can prompt a reconnect.
 */
export async function revokeGmailCredentials(uid: string): Promise<void> {
  await db.doc(gmailPrivateDocPath(uid)).delete();
  await db.doc(`users/${uid}`).set(
    {
      gmailConnected: false,
      gmailEmail: "",
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
}
