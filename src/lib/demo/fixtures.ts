import { Timestamp } from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  ApplicationResearch,
  SyncRun,
  UserSettings,
} from "@/types";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 9, minute = 0): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Date(date.getTime() - days * DAY);
}

function daysFromNow(days: number, hour = 10, minute = 0): Date {
  return daysAgo(-days, hour, minute);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function ts(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function makeResearch(
  data: Pick<
    ApplicationResearch,
    "summary" | "companySummary" | "roleSummary" | "jobDescription"
  > &
    Partial<ApplicationResearch>,
): ApplicationResearch {
  return {
    requirements: [],
    benefits: [],
    salary: "",
    workingHours: "",
    employmentType: "",
    startDate: "",
    applicationDeadline: "",
    website: "",
    address: "",
    fetchedFromLink: true,
    sources: [],
    researchedAt: ts(daysAgo(18, 12)),
    ...data,
  };
}

const firma1Research: ApplicationResearch = makeResearch({
  summary:
    "Firma 1 GmbH ist ein mittelständisches Systemhaus mit Standort in München, das mittelständische Kunden bei Netzwerk, Server und Cloud betreut. Die Ausbildung ist klar strukturiert, bietet früh eigene Kundenkontakte und eine gute Übernahmeperspektive.",
  companySummary:
    "Die Firma 1 GmbH wurde 2004 gegründet und beschäftigt an sechs Standorten rund 480 Mitarbeitende. Der Münchner Standort betreut vor allem Kunden aus Handel, Industrie und öffentlichem Sektor und betreibt ein eigenes Rechenzentrum.",
  roleSummary:
    "Als Fachinformatiker für Systemintegration lernst du, Netzwerke, Server und Arbeitsplätze zu planen, einzurichten und zu betreuen. Du arbeitest im Münchner Serviceteam und begleitest Kundenprojekte von der Installation bis zum laufenden Betrieb.",
  jobDescription:
    "Die dreijährige Ausbildung verbindet Berufsschule und betriebliche Praxis. Schwerpunkte sind Netzwerktechnik mit gängigen Switching- und WLAN-Komponenten, Windows- und Linux-Server, Virtualisierung, Monitoring sowie IT-Service-Management. Ab dem zweiten Ausbildungsjahr übernimmst du eigene Tickets und kleinere Kundenprojekte.",
  requirements: [
    "Fachhochschulreife oder Abitur",
    "Gute Noten in Mathematik, Informatik und Englisch",
    "Ausgeprägtes Interesse an Netzwerk- und Servertechnik",
    "Erste Erfahrung mit PCs und Heimnetzwerken von Vorteil",
    "Sorgfältige und kundenorientierte Arbeitsweise",
    "Teamfähigkeit und Lernbereitschaft",
  ],
  benefits: [
    "Ausbildungsvergütung über Tarif",
    "30 Urlaubstage und flexible Gleitzeit",
    "Zuschuss zum Deutschlandticket",
    "Eigenes Ausbildungszentrum mit Zertifizierungskursen",
    "Übernahmeperspektive nach der Ausbildung",
    "Kostenlose Getränke und Betriebssport",
  ],
  salary: "1.150 € im 1. Jahr, 1.250 € im 2. Jahr, 1.400 € im 3. Jahr",
  workingHours: "38 Stunden pro Woche, Gleitzeit zwischen 7 und 19 Uhr",
  employmentType: "Ausbildung",
  startDate: "01.09.",
  applicationDeadline: "31.01.",
  website: "https://karriere.firma1-gmbh.de",
  address: "Riesenfeldstraße 12, 80687 München",
  sources: [
    {
      title: "Firma 1 GmbH – Karriere",
      url: "https://karriere.firma1-gmbh.de",
    },
    {
      title: "Standort München – Über uns",
      url: "https://karriere.firma1-gmbh.de/standort-muenchen",
    },
    {
      title: "Ausbildung Fachinformatiker Systemintegration",
      url: "https://karriere.firma1-gmbh.de/ausbildung/systemintegration",
    },
  ],
});

const firma2Research: ApplicationResearch = makeResearch({
  summary:
    "Firma 2 GmbH entwickelt Software für Logistik und Finanzwesen und bildet am Standort Nürnberg mit modernen agilen Methoden aus. Auszubildende arbeiten von Beginn an in Scrum-Teams an echten Produktfeatures.",
  companySummary:
    "Die Firma 2 GmbH mit Hauptsitz in Nürnberg beschäftigt rund 1.200 Mitarbeitende an vier Standorten. Das Unternehmen entwickelt eigene Cloud-Plattformen für Logistik- und Finanzprozesse und legt großen Wert auf saubere Architektur und automatisierte Tests.",
  roleSummary:
    "In der Anwendungsentwicklung lernst du, Software in Java und TypeScript zu konzipieren, umzusetzen und zu testen. Du arbeitest von Anfang an in einem Scrum-Team und bringst eigene Features bis in die Produktion.",
  jobDescription:
    "Die Ausbildung vermittelt Programmierung in Java und TypeScript, objektorientierte Entwurfsmuster, Datenbanken und SQL sowie Webtechnologien. Dazu kommen Software-Testing, Versionsverwaltung mit Git und Grundlagen von Cloud und DevOps. In eigenen Ausbildungsprojekten arbeitest du zusätzlich an einer internen Anwendung.",
  requirements: [
    "Abitur oder sehr gute Fachhochschulreife",
    "Logisch-analytisches Denken und Freude am Problemlösen",
    "Erste Programmiererfahrung, etwa mit Python oder Java, von Vorteil",
    "Gute Englischkenntnisse für Dokumentation und Code",
    "Teamfähigkeit und Eigeninitiative",
    "Interesse an agiler Softwareentwicklung",
  ],
  benefits: [
    "Tarifliche Ausbildungsvergütung",
    "30 Urlaubstage und Homeoffice-Anteil",
    "Betriebskantine und Getränke-Flatrate",
    "Eigene Akademie mit Zertifizierungen",
    "Sehr hohe Übernahmequote",
    "Zuschuss zum Deutschlandticket",
  ],
  salary: "1.200 € im 1. Jahr, 1.300 € im 2. Jahr, 1.450 € im 3. Jahr",
  workingHours: "39 Stunden pro Woche, Vertrauensarbeitszeit",
  employmentType: "Ausbildung",
  startDate: "01.09.",
  applicationDeadline: "15.02.",
  website: "https://bewerbung.firma2-gmbh.de",
  address: "Fürther Straße 210, 90429 Nürnberg",
  sources: [
    {
      title: "Firma 2 GmbH – Ausbildung",
      url: "https://bewerbung.firma2-gmbh.de",
    },
    {
      title: "Fachinformatiker Anwendungsentwicklung",
      url: "https://bewerbung.firma2-gmbh.de/ausbildung/anwendungsentwicklung",
    },
  ],
});

const firma3Research: ApplicationResearch = makeResearch({
  summary:
    "Firma 3 GmbH ist ein Stuttgarter Systemhaus für IT-Infrastruktur und Gebäudetechnik. Die Ausbildung verbindet Elektrotechnik mit IT und bietet Einblicke in Montage, Netzwerktechnik und Service.",
  companySummary:
    "Die Firma 3 GmbH mit Sitz in Stuttgart beschäftigt rund 300 Mitarbeitende und betreut Kunden in Baden-Württemberg. Das Leistungsspektrum reicht von strukturierter Verkabelung und IT-Hardware bis zu Mess-, Steuer- und Regelungstechnik.",
  roleSummary:
    "Als IT-System-Elektroniker montierst, installierst und wartest du IT-Systeme, Peripherie und Netzwerkkomponenten. Du arbeitest an der Schnittstelle zwischen Elektrotechnik und IT und bist regelmäßig bei Kunden vor Ort.",
  jobDescription:
    "Zu den Ausbildungsinhalten zählen das Einrichten von Arbeitsplätzen und Servern, das Verkabeln von Netzwerken, Elektro- und Messtechnik sowie die systematische Fehlersuche an Hardware. Der Umgang mit Kunden, Tickets und technischer Dokumentation gehört zum Alltag.",
  requirements: [
    "Guter Realschulabschluss oder Fachhochschulreife",
    "Handwerkliches Geschick und Freude an praktischer Arbeit",
    "Interesse an Elektronik, Elektrotechnik und IT",
    "Grundverständnis für Netzwerke von Vorteil",
    "Zuverlässigkeit und Serviceorientierung",
    "Bereitschaft zu gelegentlichen Einsätzen beim Kunden",
  ],
  benefits: [
    "Tarifliche Ausbildungsvergütung",
    "29 Urlaubstage",
    "Fahrkostenzuschuss und Jobticket",
    "Betriebliche Altersvorsorge",
    "Interne Prüfungsvorbereitung und Werkstattkurse",
    "Übernahme nach erfolgreichem Abschluss angestrebt",
  ],
  salary: "1.050 € im 1. Jahr, 1.120 € im 2. Jahr, 1.250 € im 3. Jahr",
  workingHours: "40 Stunden pro Woche",
  employmentType: "Ausbildung",
  startDate: "01.09.",
  applicationDeadline: "28.02.",
  website: "https://karriere.firma3-gmbh.de",
  address: "Daimlerstraße 47, 70372 Stuttgart",
  sources: [
    {
      title: "Firma 3 GmbH – Ausbildung",
      url: "https://karriere.firma3-gmbh.de",
    },
    {
      title: "IT-System-Elektroniker/-in",
      url: "https://karriere.firma3-gmbh.de/ausbildung/it-system-elektroniker",
    },
  ],
});

const firma4Research: ApplicationResearch = makeResearch({
  summary:
    "Die Firma 4 GmbH ist ein regionales Kreditinstitut mit eigener IT-Abteilung am Standort Köln. Auszubildende lernen den Betrieb einer hochverfügbaren Bank-IT kennen und arbeiten eng mit den Fachbereichen zusammen.",
  companySummary:
    "Die Firma 4 GmbH mit Hauptsitz in Köln beschäftigt rund 2.500 Mitarbeitende und betreibt über 120 Filialen in der Region. Die IT versorgt Filialen, Rechenzentren und Online-Banking mit stabilen und sicheren Systemen.",
  roleSummary:
    "Als Fachinformatiker für Systemintegration betreust du Server, Netzwerke und Arbeitsplätze in einer regulierten Umgebung. Du lernst, Ausfälle zu vermeiden, Systeme zu überwachen und Änderungen sauber zu dokumentieren.",
  jobDescription:
    "Die Ausbildung umfasst Netzwerktechnik, Windows- und Linux-Systeme, Virtualisierung, Backup- und Notfallkonzepte sowie IT-Sicherheit und IT-Betrieb nach ITIL. Datenschutz und Compliance spielen im Bankumfeld eine besondere Rolle.",
  requirements: [
    "Fachhochschulreife oder Abitur",
    "Gute Noten in Mathematik, Deutsch und Englisch",
    "Interesse an IT-Systemen und IT-Sicherheit",
    "Sorgfalt und Verantwortungsbewusstsein",
    "Diskretion und Zuverlässigkeit",
    "Teamfähigkeit und Freude am Kundenkontakt",
  ],
  benefits: [
    "Tarifliche Ausbildungsvergütung nach Bankentarif",
    "30 Urlaubstage",
    "Vergünstigte ÖPNV-Tickets",
    "Betriebliche Altersvorsorge und vermögenswirksame Leistungen",
    "Strukturierte Einarbeitung mit Patensystem",
    "Sehr gute Übernahme- und Weiterbildungschancen",
  ],
  salary: "1.100 € im 1. Jahr, 1.200 € im 2. Jahr, 1.350 € im 3. Jahr",
  workingHours: "39 Stunden pro Woche, Kernzeit mit Gleitzeit",
  employmentType: "Ausbildung",
  startDate: "01.08.",
  applicationDeadline: "31.03.",
  website: "https://bewerbung.firma4-gmbh.de",
  address: "Hohenzollernring 88, 50672 Köln",
  sources: [
    {
      title: "Firma 4 GmbH – Karriere",
      url: "https://bewerbung.firma4-gmbh.de",
    },
    {
      title: "Ausbildung bei der Bank – Ablauf",
      url: "https://bewerbung.firma4-gmbh.de/ausbildung",
    },
  ],
});

const firma5Research: ApplicationResearch = makeResearch({
  summary:
    "Firma 5 GmbH entwickelt Steuerungs- und Leitsysteme für den Maschinenbau. Die Ausbildung in der Anwendungsentwicklung verbindet Programmierung mit Industrieautomation und läuft in einem erfahrenen Entwicklungsteam.",
  companySummary:
    "Die Firma 5 GmbH mit Sitz in Erlangen beschäftigt rund 3.500 Mitarbeitende und ist auf Automatisierungstechnik und industrielle Software spezialisiert. Kunden sind Maschinenbauer und Anlagenbetreiber in ganz Europa.",
  roleSummary:
    "Als Fachinformatiker für Anwendungsentwicklung entwickelst du Software für Steuerungen, Bedienoberflächen und Datenauswertung. Du arbeitest mit Ingenieurinnen und Ingenieuren zusammen und siehst deine Programme direkt an der Anlage im Einsatz.",
  jobDescription:
    "Die Ausbildung vermittelt Programmierung in C# und Python, objektorientierte Entwurfsmuster, Datenbanken und SQL sowie Grundlagen der Steuerungstechnik. Dazu kommen Versionsverwaltung mit Git, Softwaretests und die Anbindung an industrielle Schnittstellen wie OPC UA.",
  requirements: [
    "Abitur oder gute Fachhochschulreife",
    "Ausgeprägtes Interesse an Technik und Software",
    "Logisch-analytisches Denken",
    "Erste Programmiererfahrung von Vorteil",
    "Gute Englischkenntnisse für technische Dokumentation",
    "Sorgfalt und Teamfähigkeit",
  ],
  benefits: [
    "Tarifliche Ausbildungsvergütung",
    "30 Urlaubstage und Gleitzeit",
    "Zuschuss zum Deutschlandticket",
    "Kantine und Betriebssport",
    "Ausbildungsprojekte mit echten Anlagen",
    "Übernahmeperspektive und Weiterbildung",
  ],
  salary: "1.180 € im 1. Jahr, 1.280 € im 2. Jahr, 1.420 € im 3. Jahr",
  workingHours: "39 Stunden pro Woche, Gleitzeit",
  employmentType: "Ausbildung",
  startDate: "01.09.",
  applicationDeadline: "15.01.",
  website: "https://karriere.firma5-gmbh.de",
  address: "Karl-Zucker-Straße 5, 91052 Erlangen",
  sources: [
    {
      title: "Firma 5 GmbH – Karriere",
      url: "https://karriere.firma5-gmbh.de",
    },
    {
      title: "Automatisierungstechnik – Über uns",
      url: "https://karriere.firma5-gmbh.de/unternehmen",
    },
    {
      title: "Ausbildung Anwendungsentwicklung",
      url: "https://karriere.firma5-gmbh.de/ausbildung/anwendungsentwicklung",
    },
  ],
});

const firma6Research: ApplicationResearch = makeResearch({
  summary:
    "Die Firma 6 GmbH ist eine große gesetzliche Krankenkasse mit eigenem Daten- und IT-Bereich in Wuppertal. Die Ausbildung im Bereich Daten- und Prozessanalyse verbindet Datenqualität, Reporting und Prozessautomatisierung.",
  companySummary:
    "Die Firma 6 GmbH mit Hauptsitz in Wuppertal betreut rund acht Millionen Versicherte und beschäftigt über 10.000 Menschen. Datenmanagement und Automatisierung sind zentrale Zukunftsthemen des Unternehmens.",
  roleSummary:
    "Als Fachinformatiker für Daten- und Prozessanalyse untersuchst du Geschäftsprozesse, baust Auswertungen und sorgst für verlässliche Datenflüsse zwischen den Fachabteilungen. Du arbeitest mit Datenbanken, BI-Werkzeugen und Skripten.",
  jobDescription:
    "Die Ausbildung umfasst Datenbanken und SQL, Datenmodellierung, Statistik-Grundlagen, Prozessanalyse sowie den Umgang mit BI-Werkzeugen. Du begleitest Projekte zur Automatisierung wiederkehrender Auswertungen und lernst, Ergebnisse verständlich zu präsentieren.",
  requirements: [
    "Fachhochschulreife oder Abitur",
    "Freude am Umgang mit Zahlen und Daten",
    "Grundverständnis für Datenbanken und Tabellenkalkulation",
    "Analytisches und strukturiertes Denken",
    "Gewissenhaftigkeit und Diskretion",
    "Kommunikationsstärke gegenüber Fachabteilungen",
  ],
  benefits: [
    "Tarifliche Ausbildungsvergütung",
    "30 Urlaubstage und Homeoffice nach Absprache",
    "Gute Sozialleistungen und Betriebsrente",
    "Umfangreiche Weiterbildungen zu Daten und BI",
    "Krisensicherer Arbeitgeber",
    "Zuschuss zum Deutschlandticket",
  ],
  salary: "1.150 € im 1. Jahr, 1.250 € im 2. Jahr, 1.380 € im 3. Jahr",
  workingHours: "39 Stunden pro Woche, Gleitzeit",
  employmentType: "Ausbildung",
  startDate: "01.08.",
  applicationDeadline: "31.01.",
  website: "https://karriere.firma6-gmbh.de",
  address: "Friedrich-Ebert-Straße 212, 42117 Wuppertal",
  sources: [
    {
      title: "Firma 6 GmbH – Karriere",
      url: "https://karriere.firma6-gmbh.de",
    },
    {
      title: "Ausbildung Daten- und Prozessanalyse",
      url: "https://karriere.firma6-gmbh.de/ausbildung/it",
    },
  ],
});

const firma7Research: ApplicationResearch = makeResearch({
  summary:
    "Firma 7 GmbH ist ein Düsseldorfer IT-Dienstleister für mittelständische Kunden. Die Ausbildung legt den Schwerpunkt auf Netzwerke, Managed Services und Cloud und bereitet früh auf eigene Kundenprojekte vor.",
  companySummary:
    "Die Firma 7 GmbH mit Sitz in Düsseldorf beschäftigt rund 210 Mitarbeitende. Das Unternehmen plant, betreibt und überwacht IT-Infrastrukturen für Kunden aus Handel, Handwerk und Gesundheitswesen im Rheinland.",
  roleSummary:
    "Als Fachinformatiker für Systemintegration kümmerst du dich um Netzwerke, Firewalls, Server und Cloud-Dienste. Du arbeitest im Managed-Service-Team und lernst, Störungen strukturiert zu analysieren und nachhaltig zu beheben.",
  jobDescription:
    "Die Ausbildung umfasst Netzwerkgrundlagen mit Routing, Switching und VLANs, Firewall- und VPN-Technik, Windows- und Linux-Server, Virtualisierung sowie Monitoring und Backup. Ergänzend lernst du Cloud-Grundlagen und die Dokumentation von Kundenumgebungen.",
  requirements: [
    "Fachhochschulreife oder Abitur",
    "Gute Noten in Mathematik, Informatik und Englisch",
    "Interesse an Netzwerken und IT-Sicherheit",
    "Selbstständige und sorgfältige Arbeitsweise",
    "Kundenorientierung und Kommunikationsfreude",
    "Lernbereitschaft und Teamgeist",
  ],
  benefits: [
    "Ausbildungsvergütung über Tarif",
    "30 Urlaubstage und flexible Arbeitszeiten",
    "Zuschuss zum Deutschlandticket",
    "Zertifizierungskurse im Ausbildungszentrum",
    "Übernahmeperspektive und Weiterbildung",
    "Moderne Arbeitsplätze mit aktueller Technik",
  ],
  salary: "1.100 € im 1. Jahr, 1.220 € im 2. Jahr, 1.350 € im 3. Jahr",
  workingHours: "40 Stunden pro Woche, Gleitzeit",
  employmentType: "Ausbildung",
  startDate: "01.09.",
  applicationDeadline: "30.04.",
  website: "https://karriere.firma7-gmbh.de",
  address: "Rather Straße 110, 40476 Düsseldorf",
  sources: [
    {
      title: "Firma 7 GmbH – Karriere",
      url: "https://karriere.firma7-gmbh.de",
    },
    {
      title: "Managed Services – Leistungen",
      url: "https://karriere.firma7-gmbh.de/leistungen",
    },
  ],
});

export function buildResearch(application: Application): ApplicationResearch {
  return makeResearch({
    summary: `Die Stellenausschreibung als ${application.ausbildungsberuf} bei ${application.unternehmen} in ${application.standort} liegt vor. Die Position ist für einen Einstieg gut geeignet und bietet eine strukturierte Einarbeitung.`,
    companySummary: `${application.unternehmen} ist ein etabliertes Unternehmen am Standort ${application.standort} und bildet regelmäßig aus.`,
    roleSummary: `Als ${application.ausbildungsberuf} übernimmst du vielfältige Aufgaben im Tagesgeschäft und arbeitest eng mit den Kolleginnen und Kollegen zusammen.`,
    jobDescription: `Die Tätigkeit als ${application.ausbildungsberuf} umfasst die eigenständige Bearbeitung der übertragenen Aufgaben, die Abstimmung im Team und die sorgfältige Dokumentation der Ergebnisse.`,
    requirements: [
      "Abgeschlossene Schulausbildung oder vergleichbare Qualifikation",
      "Zuverlässigkeit und Teamfähigkeit",
      "Bereitschaft, Neues zu lernen",
    ],
    benefits: ["Geregelte Arbeitszeiten", "Einarbeitung durch erfahrene Kollegen"],
    salary: "nach Absprache",
    workingHours: "nach Absprache",
    employmentType:
      application.employmentType === "ausbildung"
        ? "Ausbildung"
        : "Teilzeit / Minijob",
    startDate: "nach Absprache",
    applicationDeadline: "laufend",
    website: application.stellenlink,
    address: application.standort,
    fetchedFromLink: Boolean(application.stellenlink),
    sources: application.stellenlink
      ? [{ title: "Stellenausschreibung", url: application.stellenlink }]
      : [],
    researchedAt: ts(new Date()),
  });
}

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: "app-001",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Systemintegration",
    roleCategory: "Fachinformatiker für Systemintegration",
    unternehmen: "Firma 1 GmbH",
    standort: "München",
    status: "vorstellungsgespraech",
    bewerbungsdatum: ts(daysAgo(40, 8)),
    quelle: "unternehmenswebsite",
    stellenlink:
      "https://karriere.firma1-gmbh.de/ausbildung/systemintegration",
    ansprechpartner: "Frau Sandra Krämer",
    notizen:
      "Erstes Gespräch lief gut. Zweite Runde im Assessment-Center am Standort München.",
    employmentType: "ausbildung",
    gmailThreadIds: ["thread-firma1"],
    createdAt: ts(daysAgo(40, 8)),
    updatedAt: ts(daysAgo(2, 15)),
    lastEmailAt: ts(daysAgo(2, 15)),
    followUpAt: null,
    interviewAt: ts(daysFromNow(5, 11)),
    research: firma1Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-002",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Anwendungsentwicklung",
    roleCategory: "Fachinformatiker für Anwendungsentwicklung",
    unternehmen: "Firma 2 GmbH",
    standort: "Nürnberg",
    status: "einladung",
    bewerbungsdatum: ts(daysAgo(30, 10)),
    quelle: "ausbildungsportal",
    stellenlink:
      "https://bewerbung.firma2-gmbh.de/ausbildung/anwendungsentwicklung",
    ansprechpartner: "Herr Tobias Winter",
    notizen: "Online-Test bis Ende der Woche absolvieren, danach folgt das Gespräch.",
    employmentType: "ausbildung",
    gmailThreadIds: ["thread-firma2"],
    createdAt: ts(daysAgo(30, 10)),
    updatedAt: ts(hoursAgo(20)),
    lastEmailAt: ts(hoursAgo(20)),
    followUpAt: null,
    interviewAt: ts(daysFromNow(12, 14)),
    research: firma2Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-003",
    type: "ausbildung",
    ausbildungsberuf: "IT-System-Elektroniker",
    roleCategory: "IT-System-Elektroniker",
    unternehmen: "Firma 3 GmbH",
    standort: "Stuttgart",
    status: "warte_auf_antwort",
    bewerbungsdatum: ts(daysAgo(25, 9, 30)),
    quelle: "stepstone",
    stellenlink:
      "https://karriere.firma3-gmbh.de/ausbildung/it-system-elektroniker",
    ansprechpartner: "Frau Julia Berg",
    notizen: "Nachfassen, falls bis Freitag keine Rückmeldung kommt.",
    employmentType: "ausbildung",
    gmailThreadIds: ["thread-firma3"],
    createdAt: ts(daysAgo(25, 9, 30)),
    updatedAt: ts(daysAgo(20, 16)),
    lastEmailAt: ts(daysAgo(21, 11)),
    followUpAt: ts(daysFromNow(3, 9)),
    interviewAt: null,
    research: firma3Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-004",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Systemintegration",
    roleCategory: "Fachinformatiker für Systemintegration",
    unternehmen: "Firma 4 GmbH",
    standort: "Köln",
    status: "beworben",
    bewerbungsdatum: ts(daysAgo(12, 8, 15)),
    quelle: "unternehmenswebsite",
    stellenlink: "https://bewerbung.firma4-gmbh.de/ausbildung",
    ansprechpartner: "",
    notizen: "",
    employmentType: "ausbildung",
    gmailThreadIds: [],
    createdAt: ts(daysAgo(12, 8, 15)),
    updatedAt: ts(daysAgo(12, 8, 15)),
    lastEmailAt: null,
    followUpAt: null,
    interviewAt: null,
    research: firma4Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-005",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Anwendungsentwicklung",
    roleCategory: "Fachinformatiker für Anwendungsentwicklung",
    unternehmen: "Firma 5 GmbH",
    standort: "Erlangen",
    status: "absage",
    bewerbungsdatum: ts(daysAgo(45, 7, 45)),
    quelle: "linkedin",
    stellenlink:
      "https://karriere.firma5-gmbh.de/ausbildung/anwendungsentwicklung",
    ansprechpartner: "Herr Markus Vogel",
    notizen:
      "Absage nach dem Online-Test. Feedback: Programmieraufgabe zu langsam gelöst.",
    employmentType: "ausbildung",
    gmailThreadIds: ["thread-firma5"],
    createdAt: ts(daysAgo(45, 7, 45)),
    updatedAt: ts(daysAgo(10, 9)),
    lastEmailAt: ts(daysAgo(10, 9)),
    followUpAt: null,
    interviewAt: null,
    research: firma5Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-006",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Daten- und Prozessanalyse",
    roleCategory: "Fachinformatiker für Daten- und Prozessanalyse",
    unternehmen: "Firma 6 GmbH",
    standort: "Wuppertal",
    status: "zusage",
    bewerbungsdatum: ts(daysAgo(50, 11)),
    quelle: "empfehlung",
    stellenlink:
      "https://karriere.firma6-gmbh.de/ausbildung/it",
    ansprechpartner: "Frau Nadine Krüger",
    notizen: "Zusage erhalten! Vertrag unterschrieben, Ausbildungsstart am 01.08.",
    employmentType: "ausbildung",
    gmailThreadIds: ["thread-firma6"],
    createdAt: ts(daysAgo(50, 11)),
    updatedAt: ts(daysAgo(5, 13)),
    lastEmailAt: ts(daysAgo(5, 13)),
    followUpAt: null,
    interviewAt: null,
    research: firma6Research,
    interviewPrep: null,
    attachments: [],
  },
  {
    id: "app-007",
    type: "ausbildung",
    ausbildungsberuf: "Fachinformatiker für Systemintegration",
    roleCategory: "Fachinformatiker für Systemintegration",
    unternehmen: "Firma 7 GmbH",
    standort: "Düsseldorf",
    status: "entwurf",
    bewerbungsdatum: null,
    quelle: "sonstiges",
    stellenlink: "",
    ansprechpartner: "",
    notizen: "Anschreiben noch an die neue Stellenausschreibung anpassen.",
    employmentType: "ausbildung",
    gmailThreadIds: [],
    createdAt: ts(daysAgo(3, 17)),
    updatedAt: ts(daysAgo(3, 17)),
    lastEmailAt: null,
    followUpAt: null,
    interviewAt: null,
    research: firma7Research,
    interviewPrep: null,
    attachments: [],
  },
];

export const DEMO_EMAILS: ApplicationEmail[] = [
  {
    id: "mail-001",
    applicationId: "app-001",
    gmailMessageId: "msg-001",
    gmailThreadId: "thread-firma1",
    from: "sandra.kraemer@firma1-gmbh.de",
    to: "demo@aztracker.app",
    subject:
      "Einladung zum Vorstellungsgespräch – Fachinformatiker für Systemintegration",
    snippet:
      "vielen Dank für Ihre Bewerbung. Wir laden Sie herzlich zum Gespräch am Standort München ein.",
    bodyText:
      "Guten Tag,\n\nvielen Dank für Ihre Bewerbung als Fachinformatiker für Systemintegration. Wir laden Sie herzlich zu einem Vorstellungsgespräch am Standort München ein.\n\nBitte bringen Sie Ihre Bewerbungsunterlagen vollständig mit. Die Gesprächsdauer beträgt etwa 60 Minuten.\n\nViele Grüße\nSandra Krämer\nFirma 1 GmbH",
    receivedAt: ts(daysAgo(2, 15)),
    direction: "inbound",
    suggestedStatus: "vorstellungsgespraech",
    aiRelevant: true,
    aiConfidence: 0.97,
    aiSummary:
      "Einladung zum Vorstellungsgespräch bei Firma 1 GmbH.",
    aiReasoning:
      "Die E-Mail enthält eine konkrete Einladung mit Termin und Ort und ist damit eindeutig dem Status Vorstellungsgespräch zuzuordnen.",
    createdAt: ts(daysAgo(2, 15)),
  },
  {
    id: "mail-002",
    applicationId: "app-001",
    gmailMessageId: "msg-002",
    gmailThreadId: "thread-firma1",
    from: "demo@aztracker.app",
    to: "sandra.kraemer@firma1-gmbh.de",
    subject:
      "Re: Einladung zum Vorstellungsgespräch – Fachinformatiker für Systemintegration",
    snippet:
      "vielen Dank für die Einladung. Der Termin passt mir sehr gut, ich bestätige hiermit meine Teilnahme.",
    bodyText:
      "Guten Tag Frau Krämer,\n\nvielen Dank für die Einladung. Der Termin passt mir sehr gut, ich bestätige hiermit meine Teilnahme.\n\nViele Grüße\nLena Beispiel",
    receivedAt: ts(daysAgo(1, 10)),
    direction: "outbound",
    suggestedStatus: null,
    aiRelevant: true,
    aiConfidence: 0.9,
    aiSummary: "Eigene Terminbestätigung für das Vorstellungsgespräch.",
    aiReasoning:
      "Ausgehende Nachricht des Bewerbers zur Bestätigung des Termins.",
    createdAt: ts(daysAgo(1, 10)),
  },
  {
    id: "mail-003",
    applicationId: "app-002",
    gmailMessageId: "msg-003",
    gmailThreadId: "thread-firma2",
    from: "tobias.winter@firma2-gmbh.de",
    to: "demo@aztracker.app",
    subject: "Ihre Bewerbung als Fachinformatiker für Anwendungsentwicklung",
    snippet:
      "vielen Dank für Ihre Unterlagen. Gerne möchten wir Sie zum Online-Test einladen.",
    bodyText:
      "Guten Tag,\n\nvielen Dank für Ihre Bewerbung. Gerne möchten wir Sie zum Online-Test einladen. Der Test dauert etwa 45 Minuten und kann flexibel absolviert werden.\n\nBeste Grüße\nTobias Winter\nFirma 2 GmbH",
    receivedAt: ts(hoursAgo(20)),
    direction: "inbound",
    suggestedStatus: "einladung",
    aiRelevant: true,
    aiConfidence: 0.95,
    aiSummary: "Einladung zum Online-Test bei Firma 2 GmbH.",
    aiReasoning:
      "Die Nachricht enthält eine Einladung zu einem Auswahlverfahren.",
    createdAt: ts(hoursAgo(20)),
  },
  {
    id: "mail-004",
    applicationId: "app-002",
    gmailMessageId: "msg-004",
    gmailThreadId: "thread-firma2",
    from: "karriere@firma2-gmbh.de",
    to: "demo@aztracker.app",
    subject: "Eingangsbestätigung Ihrer Bewerbung",
    snippet:
      "wir bestätigen den Eingang Ihrer Bewerbung. Die Prüfung dauert in der Regel zwei Wochen.",
    bodyText:
      "Guten Tag,\n\nwir bestätigen den Eingang Ihrer Bewerbung. Die Prüfung dauert in der Regel zwei Wochen. Wir melden uns anschließend bei Ihnen.\n\nBeste Grüße\nIhr Firma 2 Recruiting-Team",
    receivedAt: ts(daysAgo(28, 13)),
    direction: "inbound",
    suggestedStatus: "beworben",
    aiRelevant: true,
    aiConfidence: 0.92,
    aiSummary: "Eingangsbestätigung der Bewerbung bei Firma 2 GmbH.",
    aiReasoning: "Bestätigung des Bewerbungseingangs ohne Termin.",
    createdAt: ts(daysAgo(28, 13)),
  },
  {
    id: "mail-005",
    applicationId: "app-003",
    gmailMessageId: "msg-005",
    gmailThreadId: "thread-firma3",
    from: "julia.berg@firma3-gmbh.de",
    to: "demo@aztracker.app",
    subject: "Ihre Bewerbung als IT-System-Elektroniker",
    snippet:
      "wir prüfen Ihre Unterlagen derzeit. Eine Rückmeldung erhalten Sie in den nächsten Tagen.",
    bodyText:
      "Guten Tag,\n\nwir prüfen Ihre Unterlagen derzeit intensiv. Eine Rückmeldung erhalten Sie in den nächsten Tagen. Vielen Dank für Ihre Geduld.\n\nFreundliche Grüße\nJulia Berg\nFirma 3 GmbH",
    receivedAt: ts(daysAgo(21, 11)),
    direction: "inbound",
    suggestedStatus: "warte_auf_antwort",
    aiRelevant: true,
    aiConfidence: 0.88,
    aiSummary: "Zwischenstand: Unterlagen werden geprüft.",
    aiReasoning: "Es wird auf eine spätere Rückmeldung verwiesen.",
    createdAt: ts(daysAgo(21, 11)),
  },
  {
    id: "mail-006",
    applicationId: "app-003",
    gmailMessageId: "msg-006",
    gmailThreadId: "thread-firma3",
    from: "demo@aztracker.app",
    to: "julia.berg@firma3-gmbh.de",
    subject: "Re: Ihre Bewerbung als IT-System-Elektroniker",
    snippet:
      "vielen Dank für die Zwischeninfo. Ich freue mich auf Ihre Rückmeldung.",
    bodyText:
      "Guten Tag Frau Berg,\n\nvielen Dank für die Zwischeninfo. Ich freue mich auf Ihre Rückmeldung.\n\nFreundliche Grüße\nLena Beispiel",
    receivedAt: ts(daysAgo(20, 16)),
    direction: "outbound",
    suggestedStatus: null,
    aiRelevant: true,
    aiConfidence: 0.85,
    aiSummary: "Eigene Antwort auf die Zwischenmeldung.",
    aiReasoning: "Ausgehende Nachricht des Bewerbers.",
    createdAt: ts(daysAgo(20, 16)),
  },
];

export const DEMO_SYNC_RUNS: SyncRun[] = [
  {
    id: "run-001",
    trigger: "initial",
    status: "success",
    startedAt: ts(daysAgo(45, 7, 5)),
    finishedAt: ts(daysAgo(45, 7, 8)),
    messagesScanned: 184,
    messagesRelevant: 46,
    applicationsCreated: 11,
    applicationsMatched: 19,
    errors: [],
  },
  {
    id: "run-002",
    trigger: "schedule",
    status: "success",
    startedAt: ts(daysAgo(1, 6, 0)),
    finishedAt: ts(daysAgo(1, 6, 2)),
    messagesScanned: 27,
    messagesRelevant: 4,
    applicationsCreated: 1,
    applicationsMatched: 3,
    errors: [],
  },
];

export const DEMO_SETTINGS: UserSettings = {
  needsAttentionAfterDays: 14,
  followUpRemindersEnabled: true,
  defaultFollowUpDays: 7,
  bundesland: "NW",
};
