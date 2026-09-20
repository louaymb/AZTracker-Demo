import { createHmac, timingSafeEqual } from "node:crypto";

import { onCall, onRequest } from "firebase-functions/v2/https";

import { GMAIL_SCOPES, config } from "../config";
import { Timestamp, db, logger } from "../lib/admin";
import {
  buildGmailAuthUrl,
  createOAuthClient,
  exchangeCode,
  getProfileEmail,
  gmailFromAuth,
} from "../lib/gmail";
import {
  assertOwner,
  gmailPrivateDocPath,
  resolveOwnerUid,
} from "../lib/owner";

function signState(uid: string): string {
  return createHmac("sha256", config.oauthStateSecret)
    .update(uid)
    .digest("base64url");
}

function buildState(uid: string): string {
  return `${uid}.${signState(uid)}`;
}

function verifyState(state: string): string | null {
  const separator = state.lastIndexOf(".");
  if (separator <= 0) return null;

  const uid = state.slice(0, separator);
  const provided = Buffer.from(state.slice(separator + 1));
  const expected = Buffer.from(signState(uid));

  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;
  return uid;
}

export const gmailAuthUrl = onCall(
  { region: "us-central1", invoker: "public" },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);
    return { url: buildGmailAuthUrl(buildState(uid)) };
  },
);

export const gmailOAuthCallback = onRequest(
  { region: "us-central1", cors: true, invoker: "public" },
  async (req, res) => {
    const redirect = (params: string) =>
      res.redirect(302, `${config.appUrl}/settings?${params}`);

    const error = typeof req.query.error === "string" ? req.query.error : "";
    if (error) {
      logger.warn(`Gmail-OAuth abgebrochen: ${error}`);
      return redirect(`gmail=error&reason=${encodeURIComponent(error)}`);
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state) {
      return redirect("gmail=error&reason=invalid_request");
    }

    const uid = verifyState(state);
    if (!uid) {
      logger.warn("Gmail-OAuth: ungültiger State.");
      return redirect("gmail=error&reason=invalid_state");
    }

    const ownerUid = await resolveOwnerUid();
    if (!ownerUid || ownerUid !== uid) {
      return redirect("gmail=error&reason=not_owner");
    }

    try {
      const tokens = await exchangeCode(code);
      const refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        logger.warn("Gmail-OAuth: kein Refresh-Token erhalten.");
        return redirect("gmail=error&reason=no_refresh_token");
      }

      const client = createOAuthClient();
      client.setCredentials(tokens);
      const profileEmail = await getProfileEmail(gmailFromAuth(client));

      await db.doc(gmailPrivateDocPath(uid)).set({
        refreshToken,
        email: profileEmail,
        scope: tokens.scope ?? GMAIL_SCOPES[0],
        connectedAt: Timestamp.now(),
      });

      await db.doc(`users/${uid}`).set(
        {
          gmailConnected: true,
          gmailEmail: profileEmail,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      logger.info(`Gmail verbunden für uid ${uid}.`);
      return redirect("gmail=connected");
    } catch (exchangeError) {
      logger.error("Gmail-OAuth-Tokenaustausch fehlgeschlagen.", exchangeError);
      return redirect("gmail=error&reason=oauth_exchange_failed");
    }
  },
);
