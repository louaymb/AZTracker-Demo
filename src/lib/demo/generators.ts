import { Timestamp } from "firebase/firestore";

import type { Application, ApplicationResearch, InterviewPrep } from "@/types";
import { buildResearch } from "./fixtures";

export function buildResearchFixture(
  application: Application,
): ApplicationResearch {
  return buildResearch(application);
}

export function buildInterviewPrepFixture(
  application: Pick<Application, "ausbildungsberuf" | "unternehmen">,
): InterviewPrep {
  const role = application.ausbildungsberuf;
  const company = application.unternehmen;

  return {
    roleSummary: `Vorbereitung auf das Gespräch als ${role} bei ${company}. Erwartet werden Motivation, Grundlagenwissen und ein sicherer Auftritt.`,
    questions: [
      {
        question: "Stellen Sie sich kurz vor.",
        category: "Persönliches",
        starAnswer:
          "Situation: Ich habe mich früh für diesen Bereich interessiert. Aufgabe: Ich wollte meine Interessen mit einem konkreten Ziel verbinden. Aktion: Ich habe Praktika genutzt und mich gezielt weitergebildet. Ergebnis: Ich habe meinen Wunschberuf gefunden und bewerbe mich heute bei Ihnen.",
        tips: "Kurz halten und einen roten Faden von der Motivation zur Stelle ziehen.",
      },
      {
        question: `Warum möchten Sie als ${role} bei ${company} arbeiten?`,
        category: "Motivation",
        starAnswer:
          "Situation: Ich habe mehrere Arbeitgeber verglichen. Aufgabe: Den passenden Einstieg finden. Aktion: Die Aufgaben und Werte Ihres Unternehmens haben mich überzeugt. Ergebnis: Ich möchte mich langfristig einbringen und weiterentwickeln.",
        tips: "Konkret auf die Ausschreibung und das Unternehmen eingehen.",
      },
      {
        question: "Wie gehen Sie mit Stress und mehreren Aufgaben um?",
        category: "Arbeitsweise",
        starAnswer:
          "Situation: In der Prüfungsphase mussten mehrere Abgaben parallel fertig werden. Aufgabe: Den Überblick behalten. Aktion: Ich habe Prioritäten gesetzt und einen Zeitplan erstellt. Ergebnis: Alle Aufgaben wurden fristgerecht und in guter Qualität abgegeben.",
        tips: "Priorisierung und Kommunikation betonen.",
      },
      {
        question: "Was tun Sie, wenn Sie eine Aufgabe nicht lösen können?",
        category: "Arbeitsweise",
        starAnswer:
          "Situation: Bei einem Projekt kam ich an einer Stelle nicht weiter. Aufgabe: Die Blockade lösen. Aktion: Ich recherchierte systematisch und holte gezielt Unterstützung. Ergebnis: Die Lösung entstand im Austausch und das Projekt lief weiter.",
        tips: "Hilfe holen als Stärke darstellen, nicht als Schwäche.",
      },
      {
        question: "Wo sehen Sie Ihre Stärken und Schwächen?",
        category: "Persönliches",
        starAnswer:
          "Situation: Ein Feedbackgespräch hat mir meine Stärken gespiegelt. Aufgabe: Mich realistisch einschätzen. Aktion: Ich arbeite an meiner Ungeduld, indem ich Zwischenschritte plane. Ergebnis: Ich arbeite heute strukturierter und geduldiger.",
        tips: "Ehrlich bleiben und an jeder Schwäche eine Entwicklung zeigen.",
      },
      {
        question: "Haben Sie Fragen an uns?",
        category: "Abschluss",
        starAnswer:
          "Situation: Das Gespräch neigt sich dem Ende. Aufgabe: Offene Punkte klären. Aktion: Ich stelle vorbereitete Fragen zum Ablauf und zur Einarbeitung. Ergebnis: Ich habe ein klares Bild von den nächsten Schritten.",
        tips: "Immer zwei bis drei eigene Fragen vorbereiten.",
      },
    ],
    generalTips: [
      "Firmenwebsite und Stellenausschreibung vorher lesen.",
      "Beispiele aus Schule, Praktika und Hobbys parat haben.",
      "Pünktlich sein und Unterlagen geordnet mitbringen.",
    ],
    questionsToAsk: [
      "Wie läuft die Einarbeitung ab?",
      "Wie sieht ein typischer Arbeitstag im Team aus?",
      "Welche Entwicklungsmöglichkeiten gibt es?",
    ],
    generatedAt: Timestamp.now(),
  };
}
