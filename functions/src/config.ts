/**
 * Typed access to Cloud Functions environment variables (loaded from
 * `functions/.env`). Every value has a sane default so the functions can be
 * imported during `tsc` without env vars present.
 */

function readInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

const DEFAULT_SEARCH_QUERY =
  '(Bewerbung OR Bewerbungsbestätigung OR Vorstellungsgespräch OR Absage OR Zusage OR Einladung OR "Assessment Center" OR Ausbildungsplatz OR Ausbildung OR Bewerbungsgespräch)';

export const config = {
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    "azubitracker",
  vertexLocation: process.env.VERTEX_LOCATION ?? "us-central1",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  gmailClientId: process.env.GMAIL_CLIENT_ID ?? "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  oauthStateSecret:
    process.env.OAUTH_STATE_SECRET ?? process.env.GMAIL_CLIENT_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  firstSyncLookbackDays: readInt(process.env.FIRST_SYNC_LOOKBACK_DAYS, 365),
  maxMessagesPerSync: readInt(process.env.MAX_MESSAGES_PER_SYNC, 200),
  gmailSearchQuery: process.env.GMAIL_SEARCH_QUERY ?? DEFAULT_SEARCH_QUERY,
  enableWebResearch: readBool(process.env.ENABLE_WEB_RESEARCH, true),
  syncStartDate: process.env.SYNC_START_DATE ?? "2026-09-01",
  enrichBatchSize: readInt(process.env.ENRICH_BATCH_SIZE, 3),
  enableAutoEnrichment: readBool(process.env.ENABLE_AUTO_ENRICHMENT, true),
} as const;

export const GMAIL_CALLBACK_URL =
  "https://us-central1-azubitracker.cloudfunctions.net/gmailOAuthCallback";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export const MAX_EMAIL_BODY_CHARS = 6000;
export const MAX_APPLICATIONS_FOR_MATCHING = 300;
