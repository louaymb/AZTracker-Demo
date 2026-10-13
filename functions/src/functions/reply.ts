import { HttpsError, onCall } from "firebase-functions/v2/https";

import { assertOwner } from "../lib/owner";
import { buildReplyDraft, sendReplyMessage } from "../lib/reply";

interface GenerateReplyData {
  applicationId?: unknown;
  threadId?: unknown;
  intent?: unknown;
}

interface SendReplyData {
  applicationId?: unknown;
  threadId?: unknown;
  to?: unknown;
  subject?: unknown;
  body?: unknown;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${field} fehlt.`);
  }
  return value.trim();
}

export const generateReplyDraft = onCall(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);

    const data = (request.data ?? {}) as GenerateReplyData;
    const applicationId = requiredString(data.applicationId, "applicationId");
    const threadId =
      typeof data.threadId === "string" && data.threadId.trim().length > 0
        ? data.threadId.trim()
        : undefined;
    const intent = data.intent === "follow_up" ? "follow_up" : "reply";

    const draft = await buildReplyDraft({
      applicationId,
      threadId,
      intent,
      uid,
    });
    return { draft };
  },
);

export const sendReply = onCall(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);

    const data = (request.data ?? {}) as SendReplyData;
    const threadId =
      typeof data.threadId === "string" ? data.threadId.trim() : "";

    const messageId = await sendReplyMessage({
      applicationId: requiredString(data.applicationId, "applicationId"),
      // Empty for a follow-up that isn't attached to an existing thread.
      threadId,
      to: requiredString(data.to, "Empfänger"),
      subject: requiredString(data.subject, "Betreff"),
      body: requiredString(data.body, "Nachricht"),
      uid,
    });

    return { ok: true, messageId: messageId.messageId };
  },
);
