import { HttpsError } from "firebase-functions/v2/https";

import { Timestamp, db, logger } from "./admin";
import { researchCompany } from "./gemini";
import { APPLICATIONS_COLLECTION } from "./owner";
import {
  resolveApplicationType,
  type ApplicationResearch,
  type EmploymentType,
} from "../types";

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
    referenceNumber: asString(application.referenceNumber),
    type: resolveApplicationType(
      application.type,
      asEmploymentType(application.employmentType),
    ),
    employmentType: asEmploymentType(application.employmentType),
  });

  const research: ApplicationResearch = {
    ...result,
    researchedAt: Timestamp.now(),
  };

  const updates: Record<string, unknown> = {
    research,
    updatedAt: Timestamp.now(),
  };

  // The mail often only carries a reference number, not the role. When the
  // research found the concrete position, backfill the empty role so the list
  // and later matching have something to work with.
  if (!asString(application.ausbildungsberuf) && result.positionTitle) {
    updates.ausbildungsberuf = result.positionTitle;
    updates.roleCategory = result.positionTitle;
  }

  await applicationRef.update(updates);

  logger.info(
    `Recherche für Bewerbung ${applicationId} gespeichert (uid=${uid}).`,
  );

  return research;
}
