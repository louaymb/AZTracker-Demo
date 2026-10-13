"use client";

import { httpsCallable } from "firebase/functions";

import type {
  ApplicationResearch,
  EmailIntent,
  InterviewPrep,
  ReplyDraft,
  SyncResult,
} from "@/types";
import { functions } from "./client";

export interface SyncOptions {
  /** Ignore `lastSyncAt` and scan the whole lookback window again. */
  fullSync?: boolean;
  /** ISO date – only scan mails received on or after this day. */
  sinceDate?: string;
  maxMessages?: number;
}

export async function triggerGmailSync(
  options: SyncOptions = {},
): Promise<SyncResult> {
  const callable = httpsCallable<SyncOptions, SyncResult>(functions, "syncGmail");
  const result = await callable(options);
  return result.data;
}

/** Returns the Google consent URL the browser has to open to connect Gmail. */
export async function getGmailAuthUrl(): Promise<string> {
  const callable = httpsCallable<Record<string, never>, { url: string }>(
    functions,
    "gmailAuthUrl",
  );
  const result = await callable({});
  return result.data.url;
}

export async function disconnectGmail(): Promise<void> {
  const callable = httpsCallable<Record<string, never>, { ok: boolean }>(
    functions,
    "disconnectGmail",
  );
  await callable({});
}

export async function researchApplication(
  applicationId: string,
): Promise<ApplicationResearch | null> {
  const callable = httpsCallable<
    { applicationId: string },
    { research: ApplicationResearch | null }
  >(functions, "researchApplication");
  const result = await callable({ applicationId });
  return result.data.research;
}

export async function generateReplyDraft(
  applicationId: string,
  threadId?: string,
  intent: EmailIntent = "reply",
): Promise<ReplyDraft> {
  const callable = httpsCallable<
    { applicationId: string; threadId?: string; intent: EmailIntent },
    { draft: ReplyDraft }
  >(functions, "generateReplyDraft");
  const result = await callable({
    applicationId,
    ...(threadId ? { threadId } : {}),
    intent,
  });
  return result.data.draft;
}

export async function generateInterviewPrep(
  applicationId: string,
): Promise<InterviewPrep> {
  const callable = httpsCallable<
    { applicationId: string },
    { prep: InterviewPrep }
  >(functions, "generateInterviewPrep");
  const result = await callable({ applicationId });
  return result.data.prep;
}

export async function sendReply(
  draft: ReplyDraft,
): Promise<{ messageId: string }> {
  const callable = httpsCallable<ReplyDraft, { ok: boolean; messageId: string }>(
    functions,
    "sendReply",
  );
  const result = await callable(draft);
  return { messageId: result.data.messageId };
}
