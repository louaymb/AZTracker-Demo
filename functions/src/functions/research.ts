import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { config } from "../config";
import { db, logger } from "../lib/admin";
import { APPLICATIONS_COLLECTION, assertOwner, resolveOwnerUid } from "../lib/owner";
import { researchAndStoreApplication } from "../lib/research";

interface ResearchApplicationData {
  applicationId?: unknown;
}

export const researchApplication = onCall(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);

    const data = (request.data ?? {}) as ResearchApplicationData;
    const applicationId =
      typeof data.applicationId === "string" ? data.applicationId : "";
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "applicationId fehlt.");
    }

    const research = await researchAndStoreApplication(applicationId, uid);
    return { research };
  },
);

const ENRICH_QUERY_LIMIT = 20;

/**
 * Runs automatically for every newly created application — whether it came from
 * the Gmail sync or was added manually in the UI.
 */
export const onApplicationCreated = onDocumentCreated(
  {
    document: "applications/{applicationId}",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "512MiB",
    // Keep the Gemini fan-out from the sync in check (it creates many at once).
    maxInstances: 3,
    retry: false,
  },
  async (event) => {
    if (!config.enableAutoEnrichment) return;

    const snapshot = event.data;
    if (!snapshot) return;

    const unternehmen = snapshot.get("unternehmen");
    if (typeof unternehmen !== "string" || unternehmen.trim().length === 0) {
      return;
    }

    const ownerUid = await resolveOwnerUid();
    if (!ownerUid) {
      logger.info("Kein Eigentümer konfiguriert – Recherche übersprungen.");
      return;
    }

    try {
      await researchAndStoreApplication(snapshot.id, ownerUid);
      logger.info(`Automatische Recherche für ${snapshot.id} abgeschlossen.`);
    } catch (error) {
      logger.error(
        `Automatische Recherche für ${snapshot.id} fehlgeschlagen.`,
        error,
      );
    }
  },
);

export const enrichApplicationsScheduled = onSchedule(
  {
    region: "us-central1",
    schedule: "every 60 minutes",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    if (!config.enableAutoEnrichment) {
      logger.info("Automatische Recherche ist deaktiviert – übersprungen.");
      return;
    }

    const ownerUid = await resolveOwnerUid();
    if (!ownerUid) {
      logger.info("Kein Eigentümer konfiguriert – Recherche übersprungen.");
      return;
    }

    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where("research", "==", null)
      .limit(ENRICH_QUERY_LIMIT)
      .get();

    const candidates = snapshot.docs
      .filter((doc) => {
        const unternehmen = doc.get("unternehmen");
        return typeof unternehmen === "string" && unternehmen.trim().length > 0;
      })
      .slice(0, config.enrichBatchSize);

    if (candidates.length === 0) {
      logger.info("Keine Bewerbungen für die Recherche gefunden.");
      return;
    }

    for (const doc of candidates) {
      try {
        await researchAndStoreApplication(doc.id, ownerUid);
      } catch (error) {
        logger.error(`Recherche für Bewerbung ${doc.id} fehlgeschlagen.`, error);
      }
    }
  },
);
