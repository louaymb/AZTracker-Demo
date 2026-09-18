import { HttpsError, onCall } from "firebase-functions/v2/https";

import { Timestamp, db } from "../lib/admin";
import { generateInterviewPrep as generateInterviewPrepContent } from "../lib/interview";
import { APPLICATIONS_COLLECTION, assertOwner } from "../lib/owner";
import type { ApplicationType, InterviewPrep } from "../types";

interface GenerateInterviewPrepData {
  applicationId?: unknown;
}

type StoredInterviewPrep = InterviewPrep & { generatedAt: Timestamp };

const APPLICATION_TYPES: string[] = ["ausbildung", "job"];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asApplicationType(value: unknown): ApplicationType | undefined {
  return typeof value === "string" && APPLICATION_TYPES.includes(value)
    ? (value as ApplicationType)
    : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export const generateInterviewPrep = onCall(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    await assertOwner(request.auth?.uid);

    const data = (request.data ?? {}) as GenerateInterviewPrepData;
    const applicationId =
      typeof data.applicationId === "string" ? data.applicationId.trim() : "";
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "applicationId fehlt.");
    }

    const applicationRef = db
      .collection(APPLICATIONS_COLLECTION)
      .doc(applicationId);
    const snapshot = await applicationRef.get();
    if (!snapshot.exists) {
      throw new HttpsError("not-found", "Bewerbung nicht gefunden.");
    }

    const application = snapshot.data() ?? {};
    const research =
      application.research && typeof application.research === "object"
        ? (application.research as Record<string, unknown>)
        : {};

    const prep = await generateInterviewPrepContent({
      unternehmen: asString(application.unternehmen),
      ausbildungsberuf: asString(application.ausbildungsberuf),
      standort: asString(application.standort),
      type: asApplicationType(application.type),
      roleSummary: asString(research.roleSummary),
      jobDescription: asString(research.jobDescription),
      requirements: asStringArray(research.requirements),
    });

    const stored: StoredInterviewPrep = {
      ...prep,
      generatedAt: Timestamp.now(),
    };

    await applicationRef.update({
      interviewPrep: stored,
      updatedAt: Timestamp.now(),
    });

    return { prep: stored };
  },
);
