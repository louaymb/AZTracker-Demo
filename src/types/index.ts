import type { Timestamp } from "firebase/firestore";

/**
 * Bewerbungsstatus. Order matters – it is the order of the Kanban columns and
 * of the status pipeline in the UI.
 */
export type ApplicationStatus =
  | "entwurf"
  | "beworben"
  | "warte_auf_antwort"
  | "einladung"
  | "vorstellungsgespraech"
  | "absage"
  | "zusage"
  | "abgebrochen";

/**
 * The app tracks two separate worlds that must never mix in the UI:
 * Ausbildungsplätze and regular jobs (Teilzeit, Minijob, …).
 */
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

/** Where the application was found / submitted. */
export type ApplicationSource =
  | "linkedin"
  | "indeed"
  | "unternehmenswebsite"
  | "stepstone"
  | "xing"
  | "ausbildungsportal"
  | "empfehlung"
  | "sonstiges";

/** A single tracked application (Ausbildung or job). */
export interface Application {
  id: string;
  /** Ausbildungsplatz or regular job. */
  type: ApplicationType;
  /** Role / Ausbildungsberuf / Position. */
  ausbildungsberuf: string;
  /**
   * Canonical role category so the same occupation is grouped together even
   * when the title is worded differently (e.g. "Fachinformatiker Systemintegration"
   * vs "Fachinformatiker/-in für Systemintegration"). Falls back to
   * `ausbildungsberuf` when empty.
   */
  roleCategory: string;
  unternehmen: string;
  standort: string;
  status: ApplicationStatus;
  bewerbungsdatum: Timestamp | null;
  quelle: ApplicationSource | string;
  stellenlink: string;
  ansprechpartner: string;
  notizen: string;
  employmentType: EmploymentType | null;
  gmailThreadIds: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastEmailAt: Timestamp | null;
  followUpAt: Timestamp | null;
  /** Actual interview / Gesprächstermin. */
  interviewAt: Timestamp | null;
  research: ApplicationResearch | null;
  interviewPrep: InterviewPrep | null;
  attachments: ApplicationAttachment[];
}

/** Fields the user can edit through the UI. */
export interface ApplicationInput {
  type: ApplicationType;
  ausbildungsberuf: string;
  unternehmen: string;
  standort: string;
  status: ApplicationStatus;
  bewerbungsdatum: Date | null;
  quelle: ApplicationSource | string;
  stellenlink: string;
  ansprechpartner: string;
  notizen: string;
  employmentType: EmploymentType | null;
  followUpAt: Date | null;
  interviewAt: Date | null;
}

/** A Gmail message linked to an application. Stored as a subcollection. */
export interface ApplicationEmail {
  id: string;
  applicationId: string;
  gmailMessageId: string;
  gmailThreadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: Timestamp | null;
  direction: "inbound" | "outbound" | "unknown";
  suggestedStatus: ApplicationStatus | null;
  aiRelevant: boolean;
  aiConfidence: number;
  aiSummary: string;
  aiReasoning: string;
  createdAt: Timestamp | null;
}

export interface ResearchSource {
  title: string;
  url: string;
}

/**
 * AI generated company / role research. Populated from the Stellenlink found in
 * the e-mail when available, otherwise from a Google Search grounded lookup.
 */
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

export interface ApplicationAttachment {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Timestamp | null;
}

export interface UserSettings {
  /** Applications without a reply for longer than this are flagged. */
  needsAttentionAfterDays: number;
  followUpRemindersEnabled: boolean;
  defaultFollowUpDays: number;
  /** Region code used to show German public holidays (e.g. "NW"). */
  bundesland?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  gmailConnected: boolean;
  gmailEmail: string;
  lastSyncAt: Timestamp | null;
  settings: UserSettings;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type SyncTrigger = "manual" | "schedule" | "initial";
export type SyncStatus = "running" | "success" | "error";

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
  /** Existing application this mail belongs to, if the AI could match one. */
  matchApplicationId: string | null;
  matchConfidence: number;
  reasoning: string;
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
  /** Suggested answer, structured with the STAR method. */
  starAnswer: string;
  tips: string;
}

/** AI generated interview preparation based on the Stellenausschreibung. */
export interface InterviewPrep {
  roleSummary: string;
  questions: InterviewQuestion[];
  generalTips: string[];
  questionsToAsk: string[];
  generatedAt: Timestamp | null;
}
