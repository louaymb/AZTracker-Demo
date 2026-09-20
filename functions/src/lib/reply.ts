import { GoogleGenAI, Type } from "@google/genai";
import { HttpsError } from "firebase-functions/v2/https";
import type { DocumentData } from "firebase-admin/firestore";
import type { gmail_v1 } from "googleapis";

import { config } from "../config";
import { Timestamp, db, logger } from "./admin";
import {
  buildRawEmail,
  extractBodyText,
  extractEmailAddress,
  getFullThread,
  getHeader,
  gmailClient,
  sendGmailMessage,
} from "./gmail";
import {
  APPLICATIONS_COLLECTION,
  EMAILS_SUBCOLLECTION,
  gmailPrivateDocPath,
} from "./owner";
import type { EmailIntent, ReplyDraft } from "../types";

const MAX_CONTEXT_CHARS = 12000;

let cachedClient: GoogleGenAI | null = null;

function ai(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      vertexai: true,
      project: config.projectId,
      location: config.vertexLocation,
    });
  }
  return cachedClient;
}

const REPLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
  },
  required: ["subject", "body"],
  propertyOrdering: ["subject", "body"],
};

interface GmailCredentials {
  refreshToken: string;
  email: string;
}

interface DecodedMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  messageId: string;
  references: string;
  internalDate: number;
  inbound: boolean;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function loadGmailCredentials(uid: string): Promise<GmailCredentials> {
  const snapshot = await db.doc(gmailPrivateDocPath(uid)).get();
  const refreshToken = snapshot.get("refreshToken");
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new HttpsError("failed-precondition", "Gmail ist nicht verbunden.");
  }
  const email = asString(snapshot.get("email")).toLowerCase();
  return { refreshToken, email };
}

function messageInternalDate(message: gmail_v1.Schema$Message): number {
  const value = Number(message.internalDate ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function decodeThread(
  thread: gmail_v1.Schema$Thread,
  connectedEmail: string,
): DecodedMessage[] {
  const messages = (thread.messages ?? []).map((message) => {
    const from = getHeader(message, "From");
    const fromAddress = extractEmailAddress(from);
    return {
      id: message.id ?? "",
      from,
      to: getHeader(message, "To"),
      subject: getHeader(message, "Subject"),
      date: getHeader(message, "Date"),
      body: extractBodyText(message),
      messageId: getHeader(message, "Message-ID"),
      references: getHeader(message, "References"),
      internalDate: messageInternalDate(message),
      inbound: connectedEmail.length === 0 || fromAddress !== connectedEmail,
    };
  });

  return messages.sort((a, b) => a.internalDate - b.internalDate);
}

function buildContext(messages: DecodedMessage[]): string {
  const blocks = messages.map(
    (message) =>
      `--- ${message.inbound ? "Eingehend" : "Ausgehend"} ---\n` +
      `Von: ${message.from}\nAn: ${message.to}\nDatum: ${message.date}\nBetreff: ${message.subject}\n\n${message.body}`,
  );

  const selected: string[] = [];
  let total = 0;
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (total + block.length > MAX_CONTEXT_CHARS) {
      const remaining = MAX_CONTEXT_CHARS - total;
      if (selected.length === 0 && remaining > 0) {
        selected.unshift(block.slice(-remaining));
      }
      break;
    }
    selected.unshift(block);
    total += block.length;
  }

  return selected.join("\n\n");
}

function withReplyPrefix(subject: string): string {
  const trimmed = subject.trim();
  if (!trimmed) return "Re:";
  return /^re\s*:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

const STATUS_LABELS: Record<string, string> = {
  entwurf: "Entwurf",
  beworben: "Beworben",
  warte_auf_antwort: "Warte auf Antwort",
  einladung: "Einladung",
  vorstellungsgespraech: "Vorstellungsgespräch",
  absage: "Absage",
  zusage: "Zusage",
  abgebrochen: "Abgebrochen",
};

function statusLabel(status: string): string {
  const key = status.trim();
  if (!key) return "unbekannt";
  return STATUS_LABELS[key] ?? key;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

function formatPromptDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "unbekannt";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function daysSince(value: unknown): number | null {
  const date = toDate(value);
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function buildApplicationContext(application: DocumentData): string {
  const applied = daysSince(application.bewerbungsdatum);
  return [
    `- Unternehmen: ${asString(application.unternehmen) || "unbekannt"}`,
    `- Position: ${asString(application.ausbildungsberuf) || "unbekannt"}`,
    `- Standort: ${asString(application.standort) || "unbekannt"}`,
    `- Status: ${statusLabel(asString(application.status))}`,
    `- Beworben am: ${formatPromptDate(application.bewerbungsdatum)}`,
    `- Tage seit Bewerbung: ${applied === null ? "unbekannt" : applied}`,
    `- Ansprechpartner: ${asString(application.ansprechpartner) || "unbekannt"}`,
  ].join("\n");
}

function followUpSubject(application: DocumentData): string {
  const role = asString(application.ausbildungsberuf).trim();
  return role ? `Nachfassen: ${role}` : "Nachfassen: Bewerbung";
}

function applicationRecipient(application: DocumentData): string {
  const ansprechpartner = asString(application.ansprechpartner).trim();
  return ansprechpartner.includes("@") ? ansprechpartner : "";
}

function buildReplyPrompt(
  application: DocumentData,
  context: string,
  intent: EmailIntent,
): string {
  if (intent === "follow_up") {
    const threadBlock = context
      ? `\nE-Mail-Verlauf (älteste zuerst):\n${context}\n`
      : "";

    return `Du bist ein Assistent, der höfliche Nachfragen zu Bewerbungen auf Deutsch verfasst.

Schreibe eine freundliche, kurze Nachfrage zum aktuellen Stand der Bewerbung.

Kontext der Bewerbung:
${buildApplicationContext(application)}
${threadBlock}
Regeln:
- Formuliere eine höfliche Nachfrage zum Stand der Bewerbung.
- Beziehe dich auf die Bewerbung und die seit dem Absenden vergangene Zeit.
- Verwende die Höflichkeitsform "Sie".
- Maximal etwa 150 Wörter.
- Erfinde keine Fakten, Termine, Namen, Zusagen oder Absagen. Fehlende Informationen lässt du offen bzw. formulierst neutral.
- Beende den Text mit einer neutralen Grußformel wie "Mit freundlichen Grüßen", aber ohne Namen oder Unterschrift – die Person ergänzt das selbst.
- Der Betreff ist kurz.

Antworte ausschließlich mit einem JSON-Objekt in exakt dieser Struktur:
{
  "subject": string,
  "body": string
}`;
  }

  return `Du bist ein Assistent, der professionelle Antwort-E-Mails auf Deutsch für Bewerbungsverfahren verfasst.

Schreibe eine passende Antwort auf den folgenden E-Mail-Verlauf einer Bewerbung.

Kontext der Bewerbung:
${buildApplicationContext(application)}

E-Mail-Verlauf (älteste zuerst):
${context}

Regeln:
- Antworte professionell, freundlich und passend zum Gesprächsverlauf sowie zum Bewerbungsstatus.
- Verwende die Höflichkeitsform "Sie".
- Maximal etwa 180 Wörter.
- Erfinde keine Fakten, Termine, Namen, Zusagen oder Absagen. Fehlende Informationen lässt du offen bzw. formulierst neutral.
- Beende den Text mit einer neutralen Grußformel wie "Mit freundlichen Grüßen", aber ohne Namen oder Unterschrift – die Person ergänzt das selbst.
- Der Betreff ist kurz und beginnt mit "Re: ".

Antworte ausschließlich mit einem JSON-Objekt in exakt dieser Struktur:
{
  "subject": string,
  "body": string
}`;
}

function parseDraft(text: string): { subject: string; body: string } | null {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      subject?: unknown;
      body?: unknown;
    };
    const body = asString(parsed.body).trim();
    if (!body) return null;
    return { subject: asString(parsed.subject).trim(), body };
  } catch {
    return null;
  }
}

async function requestDraft(
  application: DocumentData,
  context: string,
  fallbackSubject: string,
  intent: EmailIntent,
): Promise<{ subject: string; body: string }> {
  try {
    const response = await ai().models.generateContent({
      model: config.geminiModel,
      contents: buildReplyPrompt(application, context, intent),
      config: {
        responseMimeType: "application/json",
        responseSchema: REPLY_SCHEMA,
        temperature: 0.4,
      },
    });

    const parsed = parseDraft(response.text ?? "");
    if (parsed) return parsed;

    return { subject: fallbackSubject, body: (response.text ?? "").trim() };
  } catch (error) {
    logger.error("Gemini-Antwortentwurf fehlgeschlagen.", error);
    throw new HttpsError(
      "internal",
      "Die KI-Antwort konnte nicht generiert werden.",
    );
  }
}

function isInsufficientScopeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: number | string;
    status?: number;
    message?: string;
    response?: { status?: number; data?: { error?: unknown } };
  };

  const status = Number(
    candidate.code ?? candidate.status ?? candidate.response?.status,
  );
  if (status === 403) return true;

  const message = String(candidate.message ?? "").toLowerCase();
  if (message.includes("insufficient") && message.includes("scope")) {
    return true;
  }

  const data = candidate.response?.data?.error;
  const text = typeof data === "string" ? data : JSON.stringify(data ?? "");
  const normalized = text.toLowerCase();
  return normalized.includes("insufficient") && normalized.includes("scope");
}

export interface BuildReplyDraftInput {
  applicationId: string;
  threadId?: string;
  intent?: EmailIntent;
  uid: string;
}

export async function buildReplyDraft(
  input: BuildReplyDraftInput,
): Promise<ReplyDraft> {
  const intent: EmailIntent = input.intent === "follow_up" ? "follow_up" : "reply";

  const applicationRef = db
    .collection(APPLICATIONS_COLLECTION)
    .doc(input.applicationId);
  const applicationSnapshot = await applicationRef.get();
  if (!applicationSnapshot.exists) {
    throw new HttpsError("not-found", "Bewerbung nicht gefunden.");
  }
  const application = applicationSnapshot.data() ?? {};

  const threadIds = Array.isArray(application.gmailThreadIds)
    ? application.gmailThreadIds.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      )
    : [];
  const threadId = input.threadId?.trim() || threadIds[0] || "";

  if (intent === "follow_up" && !threadId) {
    const subject = followUpSubject(application);
    const draft = await requestDraft(application, "", subject, intent);

    return {
      applicationId: input.applicationId,
      threadId: "",
      to: applicationRecipient(application),
      subject: draft.subject || subject,
      body: draft.body,
      intent,
    };
  }

  if (!threadId) {
    throw new HttpsError(
      "failed-precondition",
      "Keine verknüpfte E-Mail vorhanden.",
    );
  }

  const { refreshToken, email } = await loadGmailCredentials(input.uid);
  const gmail = gmailClient(refreshToken);
  const thread = await getFullThread(gmail, threadId);
  const messages = decodeThread(thread, email);
  if (messages.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "Keine Nachrichten im E-Mail-Verlauf gefunden.",
    );
  }

  const latest = messages[messages.length - 1];
  const inbound = [...messages].reverse().find((message) => message.inbound);
  const to = (inbound?.from || latest.from).trim();
  const context = buildContext(messages);

  if (intent === "follow_up") {
    const subject = withReplyPrefix(latest.subject);
    const draft = await requestDraft(application, context, subject, intent);
    return {
      applicationId: input.applicationId,
      threadId,
      to,
      subject,
      body: draft.body,
      intent,
    };
  }

  const subject = withReplyPrefix(latest.subject);
  const draft = await requestDraft(application, context, subject, intent);

  return {
    applicationId: input.applicationId,
    threadId,
    to,
    subject: draft.subject ? withReplyPrefix(draft.subject) : subject,
    body: draft.body,
    intent,
  };
}

export interface SendReplyInput {
  applicationId: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
  uid: string;
}

export async function sendReplyMessage(
  input: SendReplyInput,
): Promise<{ messageId: string }> {
  const threadId = input.threadId.trim();
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!to || !subject || !body) {
    throw new HttpsError(
      "invalid-argument",
      "Empfänger, Betreff und Nachricht dürfen nicht leer sein.",
    );
  }

  const applicationRef = db
    .collection(APPLICATIONS_COLLECTION)
    .doc(input.applicationId);
  const applicationSnapshot = await applicationRef.get();
  if (!applicationSnapshot.exists) {
    throw new HttpsError("not-found", "Bewerbung nicht gefunden.");
  }

  const { refreshToken, email } = await loadGmailCredentials(input.uid);
  const gmail = gmailClient(refreshToken);

  let inReplyTo = "";
  let references = "";
  if (threadId) {
    try {
      const thread = await getFullThread(gmail, threadId);
      const messages = [...(thread.messages ?? [])].sort(
        (a, b) => messageInternalDate(a) - messageInternalDate(b),
      );
      const last = messages[messages.length - 1];
      if (last) {
        inReplyTo = getHeader(last, "Message-ID");
        references = getHeader(last, "References");
        if (inReplyTo) {
          references = references ? `${references} ${inReplyTo}` : inReplyTo;
        }
      }
    } catch (error) {
      logger.warn("Antwort-Header konnten nicht geladen werden.", error);
    }
  }

  const raw = buildRawEmail({
    to,
    subject,
    body,
    inReplyTo,
    references,
  });

  let sent: gmail_v1.Schema$Message;
  try {
    sent = threadId
      ? await sendGmailMessage(gmail, raw, threadId)
      : (await gmail.users.messages.send({ userId: "me", requestBody: { raw } }))
          .data;
  } catch (error) {
    if (isInsufficientScopeError(error)) {
      throw new HttpsError(
        "failed-precondition",
        "Zum Senden fehlt die Berechtigung. Bitte verbinde Gmail in den Einstellungen erneut.",
      );
    }
    logger.error("Gmail-Antwort konnte nicht gesendet werden.", error);
    throw new HttpsError(
      "internal",
      "Die Antwort konnte nicht gesendet werden.",
    );
  }

  const messageId = sent.id ?? "";
  if (!messageId) {
    throw new HttpsError(
      "internal",
      "Gmail hat keine Nachrichten-ID zurückgegeben.",
    );
  }

  const now = Timestamp.now();
  const snippet = body.replace(/\s+/g, " ").trim().slice(0, 200);

  await applicationRef.collection(EMAILS_SUBCOLLECTION).doc(messageId).set({
    applicationId: input.applicationId,
    gmailMessageId: messageId,
    gmailThreadId: threadId,
    from: email,
    to,
    subject,
    snippet,
    bodyText: body,
    receivedAt: now,
    direction: "outbound",
    suggestedStatus: null,
    aiRelevant: true,
    aiConfidence: 1,
    aiSummary: "Gesendete Antwort",
    aiReasoning: "",
    createdAt: now,
  });

  await applicationRef.update({ lastEmailAt: now, updatedAt: now });

  return { messageId };
}
