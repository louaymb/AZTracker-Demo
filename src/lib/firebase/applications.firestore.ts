"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  ApplicationInput,
  ApplicationStatus,
  ApplicationType,
  EmploymentType,
} from "@/types";
import { APPLICATIONS_COLLECTION, EMAILS_SUBCOLLECTION } from "@/lib/constants";
import { db } from "./client";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
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
    direction: (asString(data.direction, "unknown") as ApplicationEmail["direction"]) || "unknown",
    suggestedStatus: (data.suggestedStatus as ApplicationStatus | null) ?? null,
    aiRelevant: data.aiRelevant === true,
    aiConfidence: asNumber(data.aiConfidence),
    aiSummary: asString(data.aiSummary),
    aiReasoning: asString(data.aiReasoning),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

/** Live subscription to every application, newest activity first. */
export function subscribeApplications(
  onData: (applications: Application[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => mapApplication(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

export function subscribeApplication(
  id: string,
  onData: (application: Application | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, APPLICATIONS_COLLECTION, id),
    (snapshot) =>
      onData(snapshot.exists() ? mapApplication(snapshot.id, snapshot.data()) : null),
    (error) => onError?.(error),
  );
}

export function subscribeApplicationEmails(
  applicationId: string,
  onData: (emails: ApplicationEmail[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION, applicationId, EMAILS_SUBCOLLECTION),
    orderBy("receivedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) =>
      onData(snapshot.docs.map((d) => mapEmail(d.id, d.data(), applicationId))),
    (error) => onError?.(error),
  );
}

export async function getApplication(id: string): Promise<Application | null> {
  const snapshot = await getDoc(doc(db, APPLICATIONS_COLLECTION, id));
  return snapshot.exists() ? mapApplication(snapshot.id, snapshot.data()) : null;
}

function toTimestamp(value: Date | null): Timestamp | null {
  return value ? Timestamp.fromDate(value) : null;
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, APPLICATIONS_COLLECTION), {
    userId,
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
    followUpAt: toTimestamp(input.followUpAt),
    interviewAt: toTimestamp(input.interviewAt),
    gmailThreadIds: [],
    lastEmailAt: null,
    research: null,
    interviewPrep: null,
    attachments: [],
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateApplication(
  id: string,
  input: Partial<ApplicationInput>,
): Promise<void> {
  const payload: DocumentData = { updatedAt: serverTimestamp() };

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
  if (input.ansprechpartner !== undefined) payload.ansprechpartner = input.ansprechpartner.trim();
  if (input.notizen !== undefined) payload.notizen = input.notizen;
  if ("bewerbungsdatum" in input) payload.bewerbungsdatum = toTimestamp(input.bewerbungsdatum ?? null);
  if ("followUpAt" in input) payload.followUpAt = toTimestamp(input.followUpAt ?? null);
  if ("interviewAt" in input) payload.interviewAt = toTimestamp(input.interviewAt ?? null);

  await updateDoc(doc(db, APPLICATIONS_COLLECTION, id), payload);
}

export async function updateApplicationsStatus(
  ids: string[],
  status: ApplicationStatus,
): Promise<void> {
  if (ids.length === 0) return;
  const now = serverTimestamp();
  for (let index = 0; index < ids.length; index += 400) {
    const batch = writeBatch(db);
    for (const id of ids.slice(index, index + 400)) {
      batch.update(doc(db, APPLICATIONS_COLLECTION, id), { status, updatedAt: now });
    }
    await batch.commit();
  }
}

export async function deleteApplications(ids: string[]): Promise<void> {
  for (const id of ids) {
    const emails = await getDocs(
      collection(db, APPLICATIONS_COLLECTION, id, EMAILS_SUBCOLLECTION),
    );
    const batch = writeBatch(db);
    for (const email of emails.docs) batch.delete(email.ref);
    batch.delete(doc(db, APPLICATIONS_COLLECTION, id));
    await batch.commit();
  }
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, APPLICATIONS_COLLECTION, id));
}
