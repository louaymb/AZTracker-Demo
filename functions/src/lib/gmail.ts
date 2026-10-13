import { OAuth2Client } from "google-auth-library";
import { google, type gmail_v1 } from "googleapis";

import {
  GMAIL_CALLBACK_URL,
  GMAIL_SCOPES,
  MAX_EMAIL_BODY_CHARS,
  config,
} from "../config";

export function createOAuthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: config.gmailClientId,
    clientSecret: config.gmailClientSecret,
    redirectUri: GMAIL_CALLBACK_URL,
  });
}

export function buildGmailAuthUrl(state: string): string {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    response_type: "code",
    scope: [...GMAIL_SCOPES],
    state,
  });
}

/** Exchange a one-time authorization code for OAuth tokens. */
export async function exchangeCode(code: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function authorizedClient(refreshToken: string): OAuth2Client {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function gmailFromAuth(auth: OAuth2Client): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth });
}

export function gmailClient(refreshToken: string): gmail_v1.Gmail {
  return gmailFromAuth(authorizedClient(refreshToken));
}

export async function getProfileEmail(client: gmail_v1.Gmail): Promise<string> {
  const response = await client.users.getProfile({ userId: "me" });
  return response.data.emailAddress ?? "";
}

/**
 * List message ids matching `query`, following pagination until `maxResults`
 * is reached.
 */
export async function listMessageIds(
  client: gmail_v1.Gmail,
  query: string,
  maxResults: number,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxResults) {
    const response = await client.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(100, maxResults - ids.length),
      pageToken,
    });

    const messages = response.data.messages ?? [];
    for (const message of messages) {
      if (message.id) ids.push(message.id);
      if (ids.length >= maxResults) break;
    }

    pageToken = response.data.nextPageToken ?? undefined;
    if (!pageToken || messages.length === 0) break;
  }

  return ids;
}

export async function getFullMessage(
  client: gmail_v1.Gmail,
  messageId: string,
): Promise<gmail_v1.Schema$Message> {
  const response = await client.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  return response.data;
}

export async function getFullThread(
  client: gmail_v1.Gmail,
  threadId: string,
): Promise<gmail_v1.Schema$Thread> {
  const response = await client.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });
  return response.data;
}

export function getHeader(
  message: gmail_v1.Schema$Message,
  name: string,
): string {
  const headers = message.payload?.headers ?? [];
  const match = headers.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  );
  return match?.value ?? "";
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&auml;/gi, "ä")
    .replace(/&ouml;/gi, "ö")
    .replace(/&uuml;/gi, "ü")
    .replace(/&Auml;/gi, "Ä")
    .replace(/&Ouml;/gi, "Ö")
    .replace(/&Uuml;/gi, "Ü")
    .replace(/&szlig;/gi, "ß");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function walkParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  plain: string[],
  html: string[],
): void {
  if (!part) return;
  const mimeType = part.mimeType ?? "";
  const data = part.body?.data;

  if (data) {
    if (mimeType === "text/plain") plain.push(decodeBase64Url(data));
    else if (mimeType === "text/html") html.push(decodeBase64Url(data));
  }

  for (const child of part.parts ?? []) walkParts(child, plain, html);
}

/** Prefer the plain-text body, fall back to stripped HTML, truncate. */
export function extractBodyText(message: gmail_v1.Schema$Message): string {
  const plain: string[] = [];
  const html: string[] = [];
  walkParts(message.payload ?? undefined, plain, html);

  const raw = plain.length > 0 ? plain.join("\n") : stripHtml(html.join("\n"));
  return raw.replace(/\r\n/g, "\n").trim().slice(0, MAX_EMAIL_BODY_CHARS);
}

/** Extract the bare e-mail address out of a `From`/`To` header value. */
export function extractEmailAddress(headerValue: string): string {
  const bracketed = headerValue.match(/<([^>]+)>/);
  const raw = bracketed ? bracketed[1] : headerValue;
  return raw.trim().toLowerCase();
}

/**
 * Detect a rejected/expired OAuth grant (`invalid_grant`) or an unauthenticated
 * request, so the sync can clear the dead token and ask the user to reconnect.
 */
export function isGmailAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: number;
    status?: number;
    message?: string;
    response?: {
      status?: number;
      data?: { error?: string | { message?: string } };
    };
  };

  const status = candidate.code ?? candidate.status ?? candidate.response?.status;
  if (status === 401) return true;

  if (String(candidate.message ?? "").includes("invalid_grant")) return true;

  const dataError = candidate.response?.data?.error;
  if (dataError === "invalid_grant") return true;
  if (
    typeof dataError === "object" &&
    String(dataError?.message ?? "").includes("invalid_grant")
  ) {
    return true;
  }

  return false;
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function formatAddress(headerValue: string): string {
  const raw = headerValue.replace(/[\r\n]+/g, " ").trim();
  const match = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (!match) return raw;

  const name = match[1].trim().replace(/^"(.*)"$/, "$1");
  const email = match[2].trim();
  if (!name) return email;

  const encodedName = /^[\x20-\x7E]*$/.test(name)
    ? `"${name}"`
    : `=?UTF-8?B?${Buffer.from(name, "utf-8").toString("base64")}?=`;
  return `${encodedName} <${email}>`;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export interface RawEmailInput {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}

/** Build a base64url encoded RFC 2822 UTF-8 plain-text message. */
export function buildRawEmail(input: RawEmailInput): string {
  const headers = [
    `To: ${formatAddress(input.to)}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (input.inReplyTo) headers.push(`In-Reply-To: ${sanitizeHeaderValue(input.inReplyTo)}`);
  if (input.references) headers.push(`References: ${sanitizeHeaderValue(input.references)}`);

  const body = Buffer.from(input.body, "utf-8").toString("base64");
  const message = `${headers.join("\r\n")}\r\n\r\n${body}`;
  return Buffer.from(message, "utf-8").toString("base64url");
}

export async function sendGmailMessage(
  client: gmail_v1.Gmail,
  raw: string,
  threadId: string,
): Promise<gmail_v1.Schema$Message> {
  const response = await client.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId },
  });
  return response.data;
}
