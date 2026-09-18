"use client";

import { Timestamp } from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  ApplicationResearch,
  EmailIntent,
  InterviewPrep,
  ReplyDraft,
  SyncResult,
} from "@/types";
import { DEMO_EMAIL } from "./flag";
import { buildInterviewPrepFixture, buildResearchFixture } from "./generators";
import { getState, nextId, update } from "./store";

export interface SyncOptions {
  /** Ignore `lastSyncAt` and scan the whole lookback window again. */
  fullSync?: boolean;
  /** ISO date – only scan mails received on or after this day. */
  sinceDate?: string;
  maxMessages?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function buildSyncApplications(): {
  applications: Application[];
  emails: ApplicationEmail[];
} {
  const now = Timestamp.now();
  const definitions: Array<
    Pick<
      Application,
      | "type"
      | "ausbildungsberuf"
      | "roleCategory"
      | "unternehmen"
      | "standort"
      | "status"
      | "employmentType"
      | "quelle"
      | "ansprechpartner"
      | "stellenlink"
    > & { emailSubject: string; emailBody: string }
  > = [
    {
      type: "ausbildung",
      ausbildungsberuf: "Fachinformatiker für Anwendungsentwicklung",
      roleCategory: "Fachinformatiker für Anwendungsentwicklung",
      unternehmen: "SAP SE",
      standort: "Walldorf",
      status: "beworben",
      employmentType: "ausbildung",
      quelle: "unternehmenswebsite",
      ansprechpartner: "",
      stellenlink: "https://jobs.sap.com/ausbildung",
      emailSubject: "Eingangsbestätigung Ihrer Bewerbung",
      emailBody:
        "Guten Tag,\n\nvielen Dank für Ihre Bewerbung als Fachinformatiker für Anwendungsentwicklung. Wir haben Ihre Unterlagen erhalten und melden uns zeitnah bei Ihnen.\n\nFreundliche Grüße\nSAP Recruiting",
    },
    {
      type: "ausbildung",
      ausbildungsberuf: "Fachinformatiker für Systemintegration",
      roleCategory: "Fachinformatiker für Systemintegration",
      unternehmen: "Deutsche Telekom AG",
      standort: "Bonn",
      status: "einladung",
      employmentType: "ausbildung",
      quelle: "stepstone",
      ansprechpartner: "Frau Anja Schulte",
      stellenlink: "https://telekom.com/karriere/ausbildung",
      emailSubject: "Einladung zum Online-Assessment",
      emailBody:
        "Guten Tag,\n\nwir laden Sie herzlich zum Online-Assessment ein. Die Bearbeitung nimmt etwa 40 Minuten in Anspruch.\n\nFreundliche Grüße\nAnja Schulte\nDeutsche Telekom AG",
    },
  ];

  const picked = definitions.slice(0, 2 + (Date.now() % 2));
  const applications: Application[] = [];
  const emails: ApplicationEmail[] = [];

  for (const definition of picked) {
    const appId = nextId("app");
    const threadId = nextId("thread");
    const receivedAt = new Date(now.toDate().getTime() - 5 * 60 * 1000);

    applications.push({
      id: appId,
      type: definition.type,
      ausbildungsberuf: definition.ausbildungsberuf,
      roleCategory: definition.roleCategory,
      unternehmen: definition.unternehmen,
      standort: definition.standort,
      status: definition.status,
      bewerbungsdatum: now,
      quelle: definition.quelle,
      stellenlink: definition.stellenlink,
      ansprechpartner: definition.ansprechpartner,
      notizen: "Automatisch durch die Gmail-Synchronisierung erkannt.",
      employmentType: definition.employmentType,
      gmailThreadIds: [threadId],
      createdAt: now,
      updatedAt: now,
      lastEmailAt: Timestamp.fromDate(receivedAt),
      followUpAt: null,
      interviewAt: null,
      research: null,
      interviewPrep: null,
      attachments: [],
    });

    emails.push({
      id: nextId("mail"),
      applicationId: appId,
      gmailMessageId: nextId("msg"),
      gmailThreadId: threadId,
      from: `bewerbung@${slugify(definition.unternehmen)}.de`,
      to: DEMO_EMAIL,
      subject: definition.emailSubject,
      snippet: definition.emailBody.split("\n\n")[1] ?? definition.emailBody,
      bodyText: definition.emailBody,
      receivedAt: Timestamp.fromDate(receivedAt),
      direction: "inbound",
      suggestedStatus: definition.status,
      aiRelevant: true,
      aiConfidence: 0.93,
      aiSummary: `${definition.emailSubject} – ${definition.unternehmen}`,
      aiReasoning:
        "Die E-Mail wurde als Bewerbungsnachricht klassifiziert und einer neuen Bewerbung zugeordnet.",
      createdAt: now,
    });
  }

  return { applications, emails };
}

export async function triggerGmailSync(
  options: SyncOptions = {},
): Promise<SyncResult> {
  await delay(1500 + Math.floor(Math.random() * 1000));

  const { applications, emails } = buildSyncApplications();
  const runId = nextId("run");
  const startedAt = Timestamp.now();
  const scanned = options.maxMessages
    ? Math.min(options.maxMessages, 18 + applications.length)
    : 18 + applications.length;

  update((draft) => {
    draft.applications = [...applications, ...draft.applications];
    draft.emails = [...emails, ...draft.emails];
    draft.syncRuns = [
      {
        id: runId,
        trigger: "manual",
        status: "success",
        startedAt,
        finishedAt: Timestamp.now(),
        messagesScanned: scanned,
        messagesRelevant: applications.length + 2,
        applicationsCreated: applications.length,
        applicationsMatched: 2,
        errors: [],
      },
      ...draft.syncRuns,
    ];
  });

  return {
    runId,
    messagesScanned: scanned,
    messagesRelevant: applications.length + 2,
    applicationsCreated: applications.length,
    applicationsMatched: 2,
    errors: [],
  };
}

export async function getGmailAuthUrl(): Promise<string> {
  throw new Error("Im Demo-Modus nicht verfügbar.");
}

export async function disconnectGmail(): Promise<void> {
  await delay(400);
}

export async function researchApplication(
  applicationId: string,
): Promise<ApplicationResearch | null> {
  await delay(1200);

  const application = getState().applications.find(
    (entry) => entry.id === applicationId,
  );
  if (!application) return null;

  const research = application.research ?? buildResearchFixture(application);

  update((draft) => {
    draft.applications = draft.applications.map((entry) =>
      entry.id === applicationId
        ? { ...entry, research, updatedAt: Timestamp.now() }
        : entry,
    );
  });

  return research;
}

export async function generateInterviewPrep(
  applicationId: string,
): Promise<InterviewPrep> {
  await delay(1200);

  const application = getState().applications.find(
    (entry) => entry.id === applicationId,
  );

  const prep =
    application?.interviewPrep ??
    buildInterviewPrepFixture(
      application ?? {
        ausbildungsberuf: "Auszubildende/-r",
        unternehmen: "das Unternehmen",
      },
    );

  update((draft) => {
    draft.applications = draft.applications.map((entry) =>
      entry.id === applicationId
        ? { ...entry, interviewPrep: prep, updatedAt: Timestamp.now() }
        : entry,
    );
  });

  return prep;
}

export async function generateReplyDraft(
  applicationId: string,
  threadId?: string,
  intent: EmailIntent = "reply",
): Promise<ReplyDraft> {
  await delay(1200);

  const application = getState().applications.find(
    (entry) => entry.id === applicationId,
  );

  const company = application?.unternehmen ?? "das Unternehmen";
  const role = application?.ausbildungsberuf ?? "die ausgeschriebene Position";
  const resolvedThreadId =
    threadId ?? application?.gmailThreadIds[0] ?? nextId("thread");
  const isFollowUp = intent === "follow_up";

  const subject = isFollowUp
    ? `Nachfrage zu meiner Bewerbung als ${role}`
    : `Re: Ihre Nachricht zu meiner Bewerbung als ${role}`;

  const body = isFollowUp
    ? `Guten Tag,\n\nich hoffe, Sie hatten einen guten Start in die Woche. Ich bewerbe mich um die Position als ${role} bei ${company} und wollte mich nach dem aktuellen Stand des Auswahlverfahrens erkundigen.\n\nÜber eine kurze Rückmeldung würde ich mich sehr freuen.\n\nMit freundlichen Grüßen\nLena Beispiel`
    : `Guten Tag,\n\nvielen Dank für Ihre Nachricht und die damit verbundene Einladung. Sehr gerne nehme ich diese wahr.\n\nBitte lassen Sie mich wissen, ob für den Termin noch weitere Unterlagen benötigt werden. Ich freue mich auf das Gespräch und die Möglichkeit, mich als ${role} bei ${company} vorzustellen.\n\nMit freundlichen Grüßen\nLena Beispiel`;

  return {
    applicationId,
    threadId: resolvedThreadId,
    to: `bewerbung@${slugify(company)}.de`,
    subject,
    body,
    intent,
  };
}

export async function sendReply(
  draft: ReplyDraft,
): Promise<{ messageId: string }> {
  await delay(1000);

  const messageId = nextId("msg");
  const now = Timestamp.now();
  const email: ApplicationEmail = {
    id: nextId("mail"),
    applicationId: draft.applicationId,
    gmailMessageId: messageId,
    gmailThreadId: draft.threadId,
    from: DEMO_EMAIL,
    to: draft.to,
    subject: draft.subject,
    snippet: draft.body.slice(0, 160),
    bodyText: draft.body,
    receivedAt: now,
    direction: "outbound",
    suggestedStatus: null,
    aiRelevant: true,
    aiConfidence: 1,
    aiSummary: "Gesendete Antwort des Bewerbers.",
    aiReasoning: "Ausgehende Nachricht aus dem Demo-Modus.",
    createdAt: now,
  };

  update((inner) => {
    inner.emails = [email, ...inner.emails];
    inner.applications = inner.applications.map((entry) =>
      entry.id === draft.applicationId
        ? {
            ...entry,
            lastEmailAt: now,
            updatedAt: now,
            gmailThreadIds:
              draft.threadId && !entry.gmailThreadIds.includes(draft.threadId)
                ? [...entry.gmailThreadIds, draft.threadId]
                : entry.gmailThreadIds,
          }
        : entry,
    );
  });

  return { messageId };
}
