"use client";

import { Timestamp, type DocumentData, type Unsubscribe } from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  ApplicationInput,
  ApplicationStatus,
  ApplicationType,
  EmploymentType,
} from "@/types";
import { getState, nextId, subscribe, update } from "./store";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function mapApplication(id: string, data: DocumentData): Application {
  return {
    id,
    type: (asString(data.type, "ausbildung") as ApplicationType) || "ausbildung",
    ausbildungsberuf: asString(data.ausbildungsberuf),
    roleCategory: asString(data.roleCategory) || asString(data.ausbildungsberuf),
    unternehmen: asString(data.unternehmen),
    standort: asString(data.standort),
    status: (asString(data.status, "entwurf") as ApplicationStatus) || "entwurf",
    bewerbungsdatum: (data.bewerbungsdatum as Timestamp | null) ?? null,
    quelle: asString(data.quelle, "sonstiges"),
    stellenlink: asString(data.stellenlink),
    ansprechpartner: asString(data.ansprechpartner),
    notizen: asString(data.notizen),
    employmentType: (data.employmentType as EmploymentType | null) ?? null,
    gmailThreadIds: asStringArray(data.gmailThreadIds),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
    lastEmailAt: (data.lastEmailAt as Timestamp | null) ?? null,
    followUpAt: (data.followUpAt as Timestamp | null) ?? null,
    interviewAt: (data.interviewAt as Timestamp | null) ?? null,
    research: data.research ?? null,
    interviewPrep: data.interviewPrep ?? null,
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };
}

export function mapEmail(
  id: string,
  data: DocumentData,
  applicationId: string,
): ApplicationEmail {
  return {
    id,
    applicationId: asString(data.applicationId, applicationId),
    gmailMessageId: asString(data.gmailMessageId),
    gmailThreadId: asString(data.gmailThreadId),
    from: asString(data.from),
    to: asString(data.to),
    subject: asString(data.subject),
    snippet: asString(data.snippet),
    bodyText: asString(data.bodyText),
    receivedAt: (data.receivedAt as Timestamp | null) ?? null,
    direction:
      (asString(data.direction, "unknown") as ApplicationEmail["direction"]) ||
      "unknown",
    suggestedStatus: (data.suggestedStatus as ApplicationStatus | null) ?? null,
    aiRelevant: data.aiRelevant === true,
    aiConfidence: asNumber(data.aiConfidence),
    aiSummary: asString(data.aiSummary),
    aiReasoning: asString(data.aiReasoning),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

function timeOf(value: Timestamp | null): number {
  return value?.toMillis() ?? 0;
}

function updatedTime(application: Application): number {
  return timeOf(application.updatedAt) || timeOf(application.createdAt);
}

function readApplications(): Application[] {
  return [...getState().applications].sort(
    (a, b) => updatedTime(b) - updatedTime(a),
  );
}

function readEmails(applicationId: string): ApplicationEmail[] {
  return getState()
    .emails.filter((email) => email.applicationId === applicationId)
    .sort((a, b) => timeOf(b.receivedAt) - timeOf(a.receivedAt));
}

export function subscribeApplications(
  onData: (applications: Application[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const emit = () => {
    try {
      onData(readApplications());
    } catch (cause) {
      onError?.(cause as Error);
    }
  };
  const unsubscribe = subscribe(emit);
  emit();
  return unsubscribe;
}

export function subscribeApplication(
  id: string,
  onData: (application: Application | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const emit = () => {
    try {
      onData(getState().applications.find((entry) => entry.id === id) ?? null);
    } catch (cause) {
      onError?.(cause as Error);
    }
  };
  const unsubscribe = subscribe(emit);
  emit();
  return unsubscribe;
}

export function subscribeApplicationEmails(
  applicationId: string,
  onData: (emails: ApplicationEmail[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const emit = () => {
    try {
      onData(readEmails(applicationId));
    } catch (cause) {
      onError?.(cause as Error);
    }
  };
  const unsubscribe = subscribe(emit);
  emit();
  return unsubscribe;
}

export async function getApplication(id: string): Promise<Application | null> {
  return getState().applications.find((entry) => entry.id === id) ?? null;
}

function toTimestamp(value: Date | null): Timestamp | null {
  return value ? Timestamp.fromDate(value) : null;
}

export async function createApplication(
  _userId: string,
  input: ApplicationInput,
): Promise<string> {
  const id = nextId("app");
  const now = Timestamp.now();
  const application: Application = {
    id,
    type: input.type,
    ausbildungsberuf: input.ausbildungsberuf.trim(),
    roleCategory: input.ausbildungsberuf.trim(),
    unternehmen: input.unternehmen.trim(),
    standort: input.standort.trim(),
    status: input.status,
    bewerbungsdatum: toTimestamp(input.bewerbungsdatum),
    quelle: input.quelle,
    stellenlink: input.stellenlink.trim(),
    ansprechpartner: input.ansprechpartner.trim(),
    notizen: input.notizen,
    employmentType: input.employmentType,
    gmailThreadIds: [],
    createdAt: now,
    updatedAt: now,
    lastEmailAt: null,
    followUpAt: toTimestamp(input.followUpAt),
    interviewAt: toTimestamp(input.interviewAt),
    research: null,
    interviewPrep: null,
    attachments: [],
  };

  update((draft) => {
    draft.applications = [application, ...draft.applications];
  });

  return id;
}

export async function updateApplication(
  id: string,
  input: Partial<ApplicationInput>,
): Promise<void> {
  const payload: Partial<Application> = { updatedAt: Timestamp.now() };

  if (input.ausbildungsberuf !== undefined) {
    payload.ausbildungsberuf = input.ausbildungsberuf.trim();
    payload.roleCategory = input.ausbildungsberuf.trim();
  }
  if (input.type !== undefined) payload.type = input.type;
  if ("employmentType" in input) payload.employmentType = input.employmentType ?? null;
  if (input.unternehmen !== undefined) payload.unternehmen = input.unternehmen.trim();
  if (input.standort !== undefined) payload.standort = input.standort.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.quelle !== undefined) payload.quelle = input.quelle;
  if (input.stellenlink !== undefined) payload.stellenlink = input.stellenlink.trim();
  if (input.ansprechpartner !== undefined) {
    payload.ansprechpartner = input.ansprechpartner.trim();
  }
  if (input.notizen !== undefined) payload.notizen = input.notizen;
  if ("bewerbungsdatum" in input) {
    payload.bewerbungsdatum = toTimestamp(input.bewerbungsdatum ?? null);
  }
  if ("followUpAt" in input) {
    payload.followUpAt = toTimestamp(input.followUpAt ?? null);
  }
  if ("interviewAt" in input) {
    payload.interviewAt = toTimestamp(input.interviewAt ?? null);
  }

  update((draft) => {
    draft.applications = draft.applications.map((application) =>
      application.id === id ? { ...application, ...payload } : application,
    );
  });
}

export async function updateApplicationsStatus(
  ids: string[],
  status: ApplicationStatus,
): Promise<void> {
  if (ids.length === 0) return;
  const now = Timestamp.now();
  const idSet = new Set(ids);
  update((draft) => {
    draft.applications = draft.applications.map((application) =>
      idSet.has(application.id)
        ? { ...application, status, updatedAt: now }
        : application,
    );
  });
}

export async function deleteApplications(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  update((draft) => {
    draft.applications = draft.applications.filter(
      (application) => !idSet.has(application.id),
    );
    draft.emails = draft.emails.filter(
      (email) => !idSet.has(email.applicationId),
    );
  });
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  update((draft) => {
    draft.applications = draft.applications.map((application) =>
      application.id === id
        ? { ...application, status, updatedAt: Timestamp.now() }
        : application,
    );
  });
}

export async function deleteApplication(id: string): Promise<void> {
  update((draft) => {
    draft.applications = draft.applications.filter(
      (application) => application.id !== id,
    );
    draft.emails = draft.emails.filter((email) => email.applicationId !== id);
  });
}
