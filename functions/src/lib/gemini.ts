import { GoogleGenAI, Type, type Tool } from "@google/genai";

import { config } from "../config";
import { logger } from "./admin";
import {
  STATUS_ORDER,
  type ApplicationStatus,
  type ApplicationType,
  type ApplicationResearch,
  type EmailClassification,
  type EmploymentType,
  type ResearchSource,
} from "../types";

export interface ApplicationSummaryForMatching {
  id: string;
  type: ApplicationType;
  unternehmen: string;
  ausbildungsberuf: string;
  standort: string;
  status: ApplicationStatus;
  employmentType: EmploymentType | null;
}

export interface ClassificationInput {
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  applications: ApplicationSummaryForMatching[];
  /** Canonical role categories already in use; the model should reuse one. */
  roleCategories?: string[];
}

export interface ResearchInput {
  unternehmen: string;
  ausbildungsberuf: string;
  standort: string;
  stellenlink?: string;
  type?: ApplicationType;
  employmentType?: EmploymentType | null;
}

export type ResearchOutput = Omit<ApplicationResearch, "researchedAt">;

let cachedClient: GoogleGenAI | null = null;

function ai(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      vertexai: true,
      project: config.projectId,
      location: config.vertexLocation,
    });
  }
  return cachedClient;
}

const CLASSIFICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    relevant: { type: Type.BOOLEAN },
    confidence: { type: Type.NUMBER },
    applicationType: { type: Type.STRING, nullable: true },
    employmentType: { type: Type.STRING, nullable: true },
    summary: { type: Type.STRING },
    unternehmen: { type: Type.STRING },
    ausbildungsberuf: { type: Type.STRING },
    roleCategory: { type: Type.STRING },
    standort: { type: Type.STRING },
    suggestedStatus: { type: Type.STRING, nullable: true },
    ansprechpartner: { type: Type.STRING },
    stellenlink: { type: Type.STRING },
    matchApplicationId: { type: Type.STRING, nullable: true },
    matchConfidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING },
  },
  required: [
    "relevant",
    "confidence",
    "applicationType",
    "employmentType",
    "summary",
    "unternehmen",
    "ausbildungsberuf",
    "roleCategory",
    "standort",
    "suggestedStatus",
    "ansprechpartner",
    "stellenlink",
    "matchApplicationId",
    "matchConfidence",
    "reasoning",
  ],
  propertyOrdering: [
    "relevant",
    "confidence",
    "applicationType",
    "employmentType",
    "summary",
    "unternehmen",
    "ausbildungsberuf",
    "roleCategory",
    "standort",
    "suggestedStatus",
    "ansprechpartner",
    "stellenlink",
    "matchApplicationId",
    "matchConfidence",
    "reasoning",
  ],
};

const RESEARCH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    companySummary: { type: Type.STRING },
    roleSummary: { type: Type.STRING },
    jobDescription: { type: Type.STRING },
    requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
    salary: { type: Type.STRING },
    workingHours: { type: Type.STRING },
    employmentType: { type: Type.STRING },
    startDate: { type: Type.STRING },
    applicationDeadline: { type: Type.STRING },
    website: { type: Type.STRING },
    address: { type: Type.STRING },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["title", "url"],
      },
    },
  },
  required: [
    "summary",
    "companySummary",
    "roleSummary",
    "jobDescription",
    "requirements",
    "benefits",
    "salary",
    "workingHours",
    "employmentType",
    "startDate",
    "applicationDeadline",
    "website",
    "address",
    "sources",
  ],
};

const APPLICATION_TYPES: ApplicationType[] = ["ausbildung", "job"];

const EMPLOYMENT_TYPES: EmploymentType[] = [
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

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function asStatus(value: unknown): ApplicationStatus | null {
  return typeof value === "string" &&
    (STATUS_ORDER as string[]).includes(value)
    ? (value as ApplicationStatus)
    : null;
}

function asApplicationType(value: unknown): ApplicationType | null {
  return typeof value === "string" &&
    (APPLICATION_TYPES as string[]).includes(value)
    ? (value as ApplicationType)
    : null;
}

function asEmploymentType(value: unknown): EmploymentType | null {
  return typeof value === "string" &&
    (EMPLOYMENT_TYPES as string[]).includes(value)
    ? (value as EmploymentType)
    : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    const text = asString(entry);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

/** Parse model output defensively: strip markdown fences, take the JSON object. */
function parseJsonObject<T>(text: string): Partial<T> | null {
  if (!text) return null;
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Partial<T>;
  } catch {
    return null;
  }
}

function buildClassificationPrompt(input: ClassificationInput): string {
  const applicationsJson = JSON.stringify(input.applications, null, 2);
  const roleCategoriesJson = JSON.stringify(input.roleCategories ?? []);

  return `Du bist ein Assistent, der E-Mails für die Verfolgung von Ausbildungsplätzen und Jobs in Deutschland klassifiziert.

Aufgabe:
1. Entscheide, ob die E-Mail für die Bewerbungsverfolgung relevant ist.
2. Entscheide, ob es um eine Ausbildung (inkl. duales Studium) oder um einen regulären Job geht.
3. Extrahiere strukturierte Informationen über Unternehmen, Ausbildungsberuf/Position und Standort.
4. Ordne die E-Mail nach Möglichkeit einer bereits erfassten Bewerbung zu.

WICHTIG - applicationType:
- "ausbildung": Ausbildungsplatz, duales Studium, Azubi-Stelle.
- "job": reguläre Anstellung (Teilzeit, Minijob, Vollzeit, Aushilfe, Werkstudent, Praktikum).
- null: wenn "relevant" false ist.

WICHTIG - employmentType (nur diese Werte): "ausbildung", "duales_studium", "vollzeit", "teilzeit", "minijob", "werkstudent", "praktikum", "aushilfe", "sonstiges" oder null.
Wähle "ausbildung" nur bei einer klassischen Ausbildung, "duales_studium" bei einem dualen Studium. Nutze null, wenn die Beschäftigungsart nicht erkennbar ist.

WICHTIG - roleCategory:
- Bilde eine kanonische deutsche Berufsbezeichnung für die Tätigkeit, damit gleichartige Berufe in einen Topf fallen.
- Wenn eine der unten stehenden bereits verwendeten Berufskategorien dieselbe Tätigkeit eindeutig meint, übernimm sie exakt und unverändert.
- Sonst erzeuge eine knappe kanonische Berufsbezeichnung ohne Unternehmensnamen und ohne Standort.
- Normalisiere: entferne "(m/w/d)", "(w/m/d)" und "/-in"; vereinheitliche Schreibvarianten (z. B. "Systemintegration", "System-Integration", "System Integration" → eine Schreibweise); behalte einen aussagekräftigen Zusatz wie "Teilzeit" nur, wenn er die Tätigkeit verändert.
- Ist keine Berufsbezeichnung erkennbar, gib einen leeren String zurück.

WICHTIG - stellenlink: Falls in der E-Mail ein Link zu einem Stellenangebot steht (Indeed, LinkedIn, StepStone, Xing, Karriereseite des Unternehmens, ...), gib genau diese URL an. Wenn kein solcher Link vorhanden ist, gib einen leeren String zurück.

Sei konservativ. Setze "relevant" nur dann auf true, wenn sich die E-Mail eindeutig auf eine konkrete Bewerbung, ein Bewerbungsverfahren, eine Bestätigung, eine Einladung, ein Vorstellungsgespräch, eine Absage oder eine Zusage bezieht. Newsletter, Werbung, allgemeine Job-Benachrichtigungen, Job-Alert-Zusammenfassungen, Stellenangebote ohne konkreten Bewerbungsbezug und Spam sind NICHT relevant.

Statuswerte (nur diese sind erlaubt):
- "entwurf": Bewerbung noch nicht abgeschickt
- "beworben": Bewerbung wurde abgeschickt
- "warte_auf_antwort": Eingangsbestätigung / Rückmeldung steht aus
- "einladung": Einladung zu Gespräch oder Test
- "vorstellungsgespraech": Termin für ein Vorstellungsgespräch
- "absage": Ablehnung
- "zusage": Zusage
- "abgebrochen": Bewerbung zurückgezogen oder abgebrochen
Setze "suggestedStatus" auf null, wenn die E-Mail keinen klaren Statuswechsel nahelegt. Wähle niemals einen Status, der nicht in der Liste steht.

Ordne die E-Mail nur einer bereits erfassten Bewerbung mit demselben applicationType zu. "matchApplicationId" muss entweder null sein oder eine "id" aus der unten stehenden Liste bereits erfasster Bewerbungen. Verwende "matchConfidence" (0 bis 1) für deine Sicherheit bei der Zuordnung.

Antworte ausschließlich mit einem JSON-Objekt in exakt dieser Struktur:
{
  "relevant": boolean,
  "confidence": number,
  "applicationType": "ausbildung" | "job" | null,
  "employmentType": string | null,
  "summary": string,
  "unternehmen": string,
  "ausbildungsberuf": string,
  "roleCategory": string,
  "standort": string,
  "suggestedStatus": string | null,
  "ansprechpartner": string,
  "stellenlink": string,
  "matchApplicationId": string | null,
  "matchConfidence": number,
  "reasoning": string
}

Alle Textfelder auf Deutsch. Lasse Felder, die du nicht sicher bestimmen kannst, als leeren String.

Bereits verwendete Berufskategorien (bevorzugt exakt wiederverwenden):
${roleCategoriesJson}

Bereits erfasste Bewerbungen:
${applicationsJson}

E-Mail:
Von: ${input.from}
An: ${input.to}
Datum: ${input.date}
Betreff: ${input.subject}

Text:
${input.body}`;
}

export async function classifyEmail(
  input: ClassificationInput,
): Promise<EmailClassification> {
  const response = await ai().models.generateContent({
    model: config.geminiModel,
    contents: buildClassificationPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseSchema: CLASSIFICATION_SCHEMA,
      temperature: 0,
    },
  });

  const parsed = parseJsonObject<EmailClassification>(response.text ?? "");
  if (!parsed) {
    logger.warn("Gemini-Klassifizierung lieferte kein gültiges JSON.");
    return {
      relevant: false,
      confidence: 0,
      applicationType: null,
      employmentType: null,
      summary: "",
      unternehmen: "",
      ausbildungsberuf: "",
      roleCategory: "",
      standort: "",
      suggestedStatus: null,
      ansprechpartner: "",
      stellenlink: "",
      matchApplicationId: null,
      matchConfidence: 0,
      reasoning: "",
    };
  }

  const matchApplicationId = asString(parsed.matchApplicationId);
  return {
    relevant: asBoolean(parsed.relevant),
    confidence: clamp01(asNumber(parsed.confidence)),
    applicationType: asApplicationType(parsed.applicationType),
    employmentType: asEmploymentType(parsed.employmentType),
    summary: asString(parsed.summary),
    unternehmen: asString(parsed.unternehmen),
    ausbildungsberuf: asString(parsed.ausbildungsberuf),
    roleCategory: asString(parsed.roleCategory),
    standort: asString(parsed.standort),
    suggestedStatus: asStatus(parsed.suggestedStatus),
    ansprechpartner: asString(parsed.ansprechpartner),
    stellenlink: asString(parsed.stellenlink),
    matchApplicationId: matchApplicationId.length > 0 ? matchApplicationId : null,
    matchConfidence: clamp01(asNumber(parsed.matchConfidence)),
    reasoning: asString(parsed.reasoning),
  };
}

function buildResearchPrompt(input: ResearchInput): string {
  const targetLabel = input.type === "job" ? "Stelle" : "Ausbildung";
  const requestedEmploymentType = input.employmentType
    ? `\nBereits bekannte Beschäftigungsart aus der Bewerbung: ${input.employmentType}.`
    : "";
  const linkLine = input.stellenlink
    ? `\nStellenlink: ${input.stellenlink}\nNutze den URL-Kontext, um die konkrete Stellenanzeige unter diesem Link zu lesen (Aufgaben, Anforderungen, Benefits, Vergütung, Arbeitszeiten, Start, Bewerbungsfrist).`
    : "\nEs ist kein Stellenlink vorhanden; stütze dich auf die Google-Suche.";

  return `Recherchiere auf Deutsch das Unternehmen "${input.unternehmen}" und die ${targetLabel} "${input.ausbildungsberuf}" in Deutschland, Standort "${input.standort}", im Kontext einer Bewerbung.
${linkLine}${requestedEmploymentType}

Nutze zusätzlich die Google-Suche, um Unternehmensdetails und alles zu ergänzen, was die Stellenanzeige nicht nennt. Erfinde keine Fakten – wenn du etwas nicht findest, sage das klar oder gib einen leeren String zurück.

Fülle folgende Felder:
- summary: 2–3 Sätze Gesamtüberblick auf Deutsch.
- companySummary: Branche, Größe, Standorte, Besonderheiten.
- roleSummary: Worum geht es in der ${targetLabel}, kurz zusammengefasst.
- jobDescription: Inhalt und Aufgaben der ${targetLabel}.
- requirements: Liste konkreter Voraussetzungen (z. B. Schulabschluss, Sprachkenntnisse, Erfahrung).
- benefits: Liste von Benefits, Perks, Weiterbildung.
- salary: exakte Vergütung, falls genannt, sonst eine realistische Spanne aus der Recherche, sonst "Keine Angabe".
- workingHours: Arbeitszeiten / Wochenstunden, falls bekannt.
- employmentType: eine der Beschäftigungsarten (ausbildung, duales_studium, vollzeit, teilzeit, minijob, werkstudent, praktikum, aushilfe, sonstiges) oder leer.
- startDate: Ausbildungs-/Arbeitsbeginn, falls bekannt.
- applicationDeadline: Bewerbungsfrist, falls bekannt.
- website: offizielle Website des Unternehmens, falls auffindbar.
- address: Anschrift, falls auffindbar.
- sources: Liste aus { "title", "url" }.

Antworte ausschließlich mit einem JSON-Objekt in exakt dieser Struktur:
{
  "summary": string,
  "companySummary": string,
  "roleSummary": string,
  "jobDescription": string,
  "requirements": string[],
  "benefits": string[],
  "salary": string,
  "workingHours": string,
  "employmentType": string,
  "startDate": string,
  "applicationDeadline": string,
  "website": string,
  "address": string,
  "sources": [{ "title": string, "url": string }]
}`;
}

interface GroundingChunk {
  web?: { uri?: string; title?: string } | null;
}

interface ResearchCallResult {
  text: string;
  response: unknown;
}

function extractGroundingSources(response: unknown): ResearchSource[] {
  const candidates = (
    response as {
      candidates?: Array<{
        groundingMetadata?: { groundingChunks?: GroundingChunk[] | null } | null;
      }>;
    }
  ).candidates;

  const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: ResearchSource[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (typeof uri === "string" && uri.length > 0) {
      sources.push({ title: chunk.web?.title ?? uri, url: uri });
    }
  }
  return sources;
}

/**
 * `urlContextMetadata` is the only reliable signal that the Stellenlink was
 * actually retrieved. When the SDK omits it (some endpoints do not return it)
 * fall back to "the urlContext call returned usable JSON".
 */
function linkWasFetched(response: unknown, parsed: unknown): boolean {
  const metadata = (
    response as {
      candidates?: Array<{
        urlContextMetadata?: {
          urlMetadata?: Array<{
            urlRetrievalStatus?: string;
            status?: string;
          }>;
        } | null;
      }>;
    }
  ).candidates?.[0]?.urlContextMetadata?.urlMetadata;

  if (Array.isArray(metadata)) {
    return metadata.some((entry) => {
      const status = entry.urlRetrievalStatus ?? entry.status;
      return typeof status === "string" && status.toLowerCase().includes("success");
    });
  }
  return Boolean(parsed);
}

function normalizeSources(value: unknown): ResearchSource[] {
  if (!Array.isArray(value)) return [];
  const sources: ResearchSource[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const url = asString(record.url);
    if (!url) continue;
    sources.push({ title: asString(record.title) || url, url });
  }
  return sources;
}

function dedupeSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>();
  const result: ResearchSource[] = [];
  for (const source of sources) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    result.push(source);
  }
  return result;
}

function firstUrl(sources: ResearchSource[]): string {
  return sources.length > 0 ? sources[0].url : "";
}

function firstNonEmpty(a: unknown, b: unknown): string {
  const first = asString(a);
  return first || asString(b);
}

function mergeResearch(
  a: Partial<ResearchOutput> | null,
  b: Partial<ResearchOutput> | null,
): Partial<ResearchOutput> {
  const left = a ?? {};
  const right = b ?? {};
  return {
    summary: firstNonEmpty(left.summary, right.summary),
    companySummary: firstNonEmpty(left.companySummary, right.companySummary),
    roleSummary: firstNonEmpty(left.roleSummary, right.roleSummary),
    jobDescription: firstNonEmpty(left.jobDescription, right.jobDescription),
    requirements: [
      ...normalizeStringArray(left.requirements),
      ...normalizeStringArray(right.requirements),
    ],
    benefits: [
      ...normalizeStringArray(left.benefits),
      ...normalizeStringArray(right.benefits),
    ],
    salary: firstNonEmpty(left.salary, right.salary),
    workingHours: firstNonEmpty(left.workingHours, right.workingHours),
    employmentType: firstNonEmpty(left.employmentType, right.employmentType),
    startDate: firstNonEmpty(left.startDate, right.startDate),
    applicationDeadline: firstNonEmpty(
      left.applicationDeadline,
      right.applicationDeadline,
    ),
    website: firstNonEmpty(left.website, right.website),
    address: firstNonEmpty(left.address, right.address),
    sources: [...normalizeSources(left.sources), ...normalizeSources(right.sources)],
  };
}

function finalizeResearch(
  parsed: Partial<ResearchOutput>,
  fetchedFromLink: boolean,
  responses: unknown[],
): ResearchOutput {
  const sources = dedupeSources([
    ...normalizeSources(parsed.sources),
    ...responses.flatMap(extractGroundingSources),
  ]);

  return {
    summary: asString(parsed.summary),
    companySummary: asString(parsed.companySummary),
    roleSummary: asString(parsed.roleSummary),
    jobDescription: asString(parsed.jobDescription),
    requirements: normalizeStringArray(parsed.requirements),
    benefits: normalizeStringArray(parsed.benefits),
    salary: asString(parsed.salary) || "Keine Angabe",
    workingHours: asString(parsed.workingHours),
    employmentType: asString(parsed.employmentType),
    startDate: asString(parsed.startDate),
    applicationDeadline: asString(parsed.applicationDeadline),
    website: asString(parsed.website) || firstUrl(sources),
    address: asString(parsed.address),
    fetchedFromLink,
    sources,
  };
}

function failedResearch(input: ResearchInput): ResearchOutput {
  return {
    summary: `Für "${input.unternehmen}" konnte keine Recherche durchgeführt werden. Bitte später erneut versuchen.`,
    companySummary: "",
    roleSummary: "",
    jobDescription: "",
    requirements: [],
    benefits: [],
    salary: "Keine Angabe",
    workingHours: "",
    employmentType: "",
    startDate: "",
    applicationDeadline: "",
    website: "",
    address: "",
    fetchedFromLink: false,
    sources: [],
  };
}

async function callModel(
  prompt: string,
  tools?: Tool[],
): Promise<ResearchCallResult | null> {
  try {
    const response = await ai().models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: tools
        ? { tools, temperature: 0.2 }
        : {
            responseMimeType: "application/json",
            responseSchema: RESEARCH_SCHEMA,
            temperature: 0,
          },
    });
    return { text: response.text ?? "", response };
  } catch (error) {
    logger.warn("Gemini-Recherche-Aufruf fehlgeschlagen.", error);
    return null;
  }
}

async function runStructuredResearch(
  prompt: string,
  input: ResearchInput,
): Promise<ResearchOutput> {
  const result = await callModel(prompt);
  if (!result) return failedResearch(input);
  const parsed = parseJsonObject<ResearchOutput>(result.text);
  if (!parsed) {
    logger.warn("Gemini-Recherche lieferte kein gültiges JSON.");
    return failedResearch(input);
  }
  return finalizeResearch(parsed, false, [result.response]);
}

/**
 * Research a company / role. When a Stellenlink is present it is opened with
 * the URL-context tool; Google Search grounding is always used to fill the
 * gaps. Some endpoints reject `urlContext` + `googleSearch` in a single call,
 * so that case falls back to two sequential calls (link first, search second)
 * whose results are merged. A failed application never throws.
 */
export async function researchCompany(
  input: ResearchInput,
): Promise<ResearchOutput> {
  const prompt = buildResearchPrompt(input);
  const stellenlink = asString(input.stellenlink);

  if (!config.enableWebResearch) {
    return runStructuredResearch(prompt, input);
  }

  const searchTools: Tool[] = [{ googleSearch: {} }];

  if (stellenlink) {
    const combinedTools: Tool[] = [{ urlContext: {} }, { googleSearch: {} }];
    const combined = await callModel(prompt, combinedTools);
    if (combined) {
      const parsed = parseJsonObject<ResearchOutput>(combined.text);
      if (parsed) {
        return finalizeResearch(
          parsed,
          linkWasFetched(combined.response, parsed),
          [combined.response],
        );
      }
    }

    const linkResult = await callModel(prompt, [{ urlContext: {} }]);
    const searchResult = await callModel(prompt, searchTools);
    if (linkResult || searchResult) {
      const linkParsed = linkResult
        ? parseJsonObject<ResearchOutput>(linkResult.text)
        : null;
      const searchParsed = searchResult
        ? parseJsonObject<ResearchOutput>(searchResult.text)
        : null;
      if (linkParsed || searchParsed) {
        const responses = [linkResult?.response, searchResult?.response].filter(
          (response): response is unknown => response !== undefined,
        );
        return finalizeResearch(
          mergeResearch(linkParsed, searchParsed),
          linkParsed
            ? linkWasFetched(linkResult!.response, linkParsed)
            : false,
          responses,
        );
      }
    }
  } else {
    const searchResult = await callModel(prompt, searchTools);
    if (searchResult) {
      const parsed = parseJsonObject<ResearchOutput>(searchResult.text);
      if (parsed) {
        return finalizeResearch(parsed, false, [searchResult.response]);
      }
    }
  }

  logger.warn("Gemini-Recherche fehlgeschlagen – liefere leere Recherche.");
  return failedResearch(input);
}
