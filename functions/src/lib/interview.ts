import { GoogleGenAI, Type } from "@google/genai";
import { HttpsError } from "firebase-functions/v2/https";

import { config } from "../config";
import { logger } from "./admin";
import type { ApplicationType, InterviewPrep, InterviewQuestion } from "../types";

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

const INTERVIEW_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    roleSummary: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          category: { type: Type.STRING },
          starAnswer: { type: Type.STRING },
          tips: { type: Type.STRING },
        },
        required: ["question", "category", "starAnswer", "tips"],
        propertyOrdering: ["question", "category", "starAnswer", "tips"],
      },
    },
    generalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["roleSummary", "questions", "generalTips", "questionsToAsk"],
  propertyOrdering: [
    "roleSummary",
    "questions",
    "generalTips",
    "questionsToAsk",
  ],
};

export interface InterviewPrepInput {
  unternehmen: string;
  ausbildungsberuf: string;
  standort: string;
  type?: ApplicationType;
  roleSummary?: string;
  jobDescription?: string;
  requirements?: string[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
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

function normalizeQuestions(value: unknown): InterviewQuestion[] {
  if (!Array.isArray(value)) return [];
  const questions: InterviewQuestion[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const question = asString(record.question);
    if (!question) continue;
    questions.push({
      question,
      category: asString(record.category) || "Allgemein",
      starAnswer: asString(record.starAnswer),
      tips: asString(record.tips),
    });
  }
  return questions;
}

function parseJsonObject(text: string): Partial<InterviewPrep> | null {
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
    return JSON.parse(cleaned.slice(start, end + 1)) as Partial<InterviewPrep>;
  } catch {
    return null;
  }
}

function buildInterviewPrompt(input: InterviewPrepInput): string {
  const roleLabel = input.type === "job" ? "Stelle (Job)" : "Ausbildung";
  const requirements =
    input.requirements && input.requirements.length > 0
      ? input.requirements.map((requirement) => `- ${requirement}`).join("\n")
      : "Keine Angaben vorhanden.";

  return `Du bist ein Karriere-Coach, der Bewerberinnen und Bewerber auf Deutsch auf Vorstellungsgespräche vorbereitet.

Erstelle eine strukturierte Interview-Vorbereitung für folgende Bewerbung:
- Unternehmen: ${input.unternehmen || "unbekannt"}
- ${roleLabel}: ${input.ausbildungsberuf || "unbekannt"}
- Standort: ${input.standort || "unbekannt"}

Recherche zum Unternehmen und zur Stelle:
- Kurzbeschreibung der Stelle: ${input.roleSummary || "keine Angabe"}
- Stellenbeschreibung: ${input.jobDescription || "keine Angabe"}
- Anforderungen:
${requirements}

Erstelle:
- roleSummary: eine kurze deutsche Zusammenfassung (2–3 Sätze), worum es in der Stelle geht.
- questions: 8 bis 12 wahrscheinliche Interviewfragen. Mische die Kategorien "Fachlich", "Persönlich", "Verhalten" und "Fragen an das Unternehmen". Jede Frage hat:
  - category: eine der Kategorien ("Fachlich", "Persönlich", "Verhalten", "Fragen an das Unternehmen").
  - starAnswer: ein konkreter Antwortvorschlag nach der STAR-Methode (Situation, Task, Action, Result) auf Deutsch. Nutze Platzhalter in eckigen Klammern für persönliche Details, erfinde keine Fakten über die Person.
  - tips: ein kurzer Hinweis, worauf bei der Antwort zu achten ist.
- generalTips: 5 bis 8 allgemeine Tipps für das Gespräch.
- questionsToAsk: 4 bis 6 gute Fragen, die die Bewerberin oder der Bewerber dem Unternehmen stellen kann.

Alle Textfelder auf Deutsch. Erfinde keine konkreten Fakten über die Person, Termine oder Zusagen.

Antworte ausschließlich mit einem JSON-Objekt in exakt dieser Struktur:
{
  "roleSummary": string,
  "questions": [{ "question": string, "category": string, "starAnswer": string, "tips": string }],
  "generalTips": string[],
  "questionsToAsk": string[]
}`;
}

export async function generateInterviewPrep(
  input: InterviewPrepInput,
): Promise<InterviewPrep> {
  let text = "";
  try {
    const response = await ai().models.generateContent({
      model: config.geminiModel,
      contents: buildInterviewPrompt(input),
      config: {
        responseMimeType: "application/json",
        responseSchema: INTERVIEW_SCHEMA,
        temperature: 0.5,
      },
    });
    text = response.text ?? "";
  } catch (error) {
    logger.error("Gemini-Interviewvorbereitung fehlgeschlagen.", error);
    throw new HttpsError(
      "internal",
      "Die Interview-Vorbereitung konnte nicht generiert werden.",
    );
  }

  const parsed = parseJsonObject(text);
  if (!parsed) {
    throw new HttpsError(
      "internal",
      "Die Interview-Vorbereitung konnte nicht generiert werden.",
    );
  }

  return {
    roleSummary: asString(parsed.roleSummary),
    questions: normalizeQuestions(parsed.questions),
    generalTips: asStringArray(parsed.generalTips),
    questionsToAsk: asStringArray(parsed.questionsToAsk),
  };
}
