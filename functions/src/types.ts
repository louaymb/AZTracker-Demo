/**
 * Mirror of the relevant domain types from `src/types/index.ts` (frontend
 * single source of truth). Field names MUST stay identical. This file exists
 * because Cloud Functions is a separate npm project and cannot import from the
 * Next.js app's path aliases.
 */

import type { Timestamp } from "firebase-admin/firestore";

export type ApplicationStatus =
  | "entwurf"
  | "beworben"
  | "warte_auf_antwort"
  | "einladung"
  | "vorstellungsgespraech"
  | "absage"
  | "zusage"
  | "abgebrochen";

export type ApplicationType = "ausbildung" | "job";

export type EmploymentType =
  | "ausbildung"
  | "duales_studium"
  | "vollzeit"
  | "teilzeit"
  | "minijob"
  | "werkstudent"
  | "praktikum"
  | "aushilfe"
  | "sonstiges";

export type SyncTrigger = "manual" | "schedule" | "initial";
export type SyncStatus = "running" | "success" | "error";

/** Kanban / pipeline order. Rank is the array index. */
export const STATUS_ORDER: ApplicationStatus[] = [
  "entwurf",
  "beworben",
  "warte_auf_antwort",
  "einladung",
  "vorstellungsgespraech",
  "absage",
  "zusage",
  "abgebrochen",
];

/** Statuses that close an application – no further progression. */
export const TERMINAL_STATUSES: ApplicationStatus[] = [
  "absage",
  "zusage",
  "abgebrochen",
];

export const STATUS_RANK: Record<ApplicationStatus, number> = STATUS_ORDER.reduce(
  (acc, status, index) => {
    acc[status] = index;
    return acc;
  },
  {} as Record<ApplicationStatus, number>,
);

/** Result returned by the AI mail classifier running in a Cloud Function. */
export interface EmailClassification {
  relevant: boolean;
  confidence: number;
  /** Which world this mail belongs to; null when irrelevant. */
  applicationType: ApplicationType | null;
  employmentType: EmploymentType | null;
  summary: string;
  unternehmen: string;
  ausbildungsberuf: string;
  /** Canonical occupation, reused across differently worded titles. */
  roleCategory: string;
  standort: string;
  suggestedStatus: ApplicationStatus | null;
  ansprechpartner: string;
  /** Job posting URL found in the mail body, when present. */
  stellenlink: string;
  matchApplicationId: string | null;
  matchConfidence: number;
  reasoning: string;
}

export interface SyncRun {
  id: string;
  trigger: SyncTrigger;
  status: SyncStatus;
  startedAt: Timestamp | null;
  finishedAt: Timestamp | null;
  messagesScanned: number;
  messagesRelevant: number;
  applicationsCreated: number;
  applicationsMatched: number;
  errors: string[];
}

export interface SyncResult {
  runId: string;
  messagesScanned: number;
  messagesRelevant: number;
  applicationsCreated: number;
  applicationsMatched: number;
  errors: string[];
}

/** An AI generated reply draft for a linked Gmail thread. */
export interface ReplyDraft {
  applicationId: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
  intent: EmailIntent;
}

/** What kind of mail the draft generator should write. */
export type EmailIntent = "reply" | "follow_up";

export interface InterviewQuestion {
  question: string;
  category: string;
  starAnswer: string;
  tips: string;
}

/** AI generated interview preparation based on the Stellenausschreibung. */
export interface InterviewPrep {
  roleSummary: string;
  questions: InterviewQuestion[];
  generalTips: string[];
  questionsToAsk: string[];
}

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ApplicationResearch {
  summary: string;
  companySummary: string;
  roleSummary: string;
  jobDescription: string;
  requirements: string[];
  benefits: string[];
  salary: string;
  workingHours: string;
  employmentType: string;
  startDate: string;
  applicationDeadline: string;
  website: string;
  address: string;
  /** Whether the Stellenlink itself could be fetched. */
  fetchedFromLink: boolean;
  sources: ResearchSource[];
  researchedAt: Timestamp | null;
}
