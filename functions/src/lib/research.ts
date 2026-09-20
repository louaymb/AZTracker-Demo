import { HttpsError } from "firebase-functions/v2/https";

import { Timestamp, db, logger } from "./admin";
import { researchCompany } from "./gemini";
import { APPLICATIONS_COLLECTION } from "./owner";
import type {
  ApplicationResearch,
  ApplicationType,
  EmploymentType,
} from "../types";

const APPLICATION_TYPES: string[] = ["ausbildung", "job"];

const EMPLOYMENT_TYPES: string[] = [
  "ausbildung",
  "duales_studium",
  "vollzeit",
  "teilzeit",
  "minijob",
  "werkstudent",
  "praktikum",
  "aushilfe",
  "sonstiges",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asApplicationType(value: unknown): ApplicationType | null {
  return typeof value === "string" && APPLICATION_TYPES.includes(value)
    ? (value as ApplicationType)
    : null;
}

function asEmploymentType(value: unknown): EmploymentType | null {
  return typeof value === "string" && EMPLOYMENT_TYPES.includes(value)
    ? (value as EmploymentType)
    : null;
}

/**
 * Research a single application and persist the result. Shared by the
 * `researchApplication` callable and `enrichApplicationsScheduled`.
 * Throws `not-found` when the application does not exist; returns null when
 * there is nothing to research (empty company).
 */
export async function researchAndStoreApplication(
  applicationId: string,
  uid: string,
): Promise<ApplicationResearch | null> {
  const applicationRef = db
    .collection(APPLICATIONS_COLLECTION)
    .doc(applicationId);
  const snapshot = await applicationRef.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Bewerbung nicht gefunden.");
  }

  const application = snapshot.data() ?? {};
  const unternehmen = asString(application.unternehmen);
  if (!unternehmen) {
    logger.info(
      `Bewerbung ${applicationId} hat kein Unternehmen – Recherche übersprungen.`,
    );
    return null;
  }

  const result = await researchCompany({
    unternehmen,
    ausbildungsberuf: asString(application.ausbildungsberuf),
    standort: asString(application.standort),
    stellenlink: asString(application.stellenlink),
    type: asApplicationType(application.type) ?? undefined,
    employmentType: asEmploymentType(application.employmentType),
  });

  const research: ApplicationResearch = {
    ...result,
    researchedAt: Timestamp.now(),
  };

  await applicationRef.update({
    research,
    updatedAt: Timestamp.now(),
  });

  logger.info(
    `Recherche für Bewerbung ${applicationId} gespeichert (uid=${uid}).`,
  );

  return research;
}
