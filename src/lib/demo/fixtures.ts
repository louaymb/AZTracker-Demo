import { Timestamp } from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  ApplicationResearch,
  InterviewPrep,
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

function makeInterviewPrep(
  data: Pick<InterviewPrep, "roleSummary" | "questions"> &
    Partial<InterviewPrep>,
): InterviewPrep {
  return {
    generalTips: [],
    questionsToAsk: [],
    generatedAt: ts(daysAgo(3, 18)),
    ...data,
  };
}

const firma1Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf das Vorstellungsgespräch als Fachinformatiker für Systemintegration bei Firma 1 GmbH in München. Erwartet werden solide Netzwerk-Grundlagen, Serviceorientierung und Interesse an Cloud-Technologien.",
  questions: [
    {
      question: "Stellen Sie sich kurz vor.",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe mich früh für Technik begeistert. Aufgabe: Meine Eltern suchten 2023 eine Lösung für ihr Heimnetzwerk. Aktion: Ich habe einen Router eingerichtet, ein Mesh-System aufgebaut und alles dokumentiert. Ergebnis: Das Netzwerk läuft stabil und ich wusste, dass ich Systemintegration beruflich machen möchte.",
      tips: "90 Sekunden nicht überschreiten, roten Faden von der Motivation zur Ausbildung legen.",
    },
    {
      question: "Erklären Sie, wie ein DNS-Resolver funktioniert.",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Browser öffnet example.com. Aufgabe: Die IP-Adresse muss gefunden werden. Aktion: Der Resolver fragt Root-, TLD- und autoritative Server der Reihe nach und cached die Antwort. Ergebnis: Der Browser verbindet sich mit der gelieferten IP-Adresse.",
      tips: "Rekursive und iterative Abfrage unterscheiden, TTL und Caching erwähnen.",
    },
    {
      question: "Was ist der Unterschied zwischen TCP und UDP?",
      category: "Fachlich",
      starAnswer:
        "Situation: Daten müssen übertragen werden. Aufgabe: Passendes Protokoll wählen. Aktion: TCP nutzt Handshake, Reihenfolge und Wiederholung; UDP verzichtet darauf für geringe Latenz. Ergebnis: TCP für HTTP, UDP für Streaming und DNS.",
      tips: "Praxisbeispiele nennen, nicht nur Definitionen.",
    },
    {
      question: "Was verstehen Sie unter Virtualisierung?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Server soll mehrere Dienste isoliert betreiben. Aufgabe: Ressourcen optimal nutzen. Aktion: Über einen Hypervisor laufen mehrere virtuelle Maschinen auf einer Hardware. Ergebnis: Bessere Auslastung, Snapshot-basierte Backups und einfachere Migrationen.",
      tips: "Type-1- und Type-2-Hypervisor kurz abgrenzen.",
    },
    {
      question: "Wie gehen Sie mit einem unzufriedenen Kunden um?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ein Kunde war wegen langer Wartezeit verärgert. Aufgabe: Deeskalieren und Lösung finden. Aktion: Zuerst zugehört, Verständnis gezeigt, dann eine Zwischenlösung angeboten und den Status proaktiv gemeldet. Ergebnis: Der Kunde bewertete den Service am Ende positiv.",
      tips: "Keine Schuldzuweisungen, lösungsorientiert bleiben.",
    },
    {
      question: "Warum möchten Sie bei Firma 1 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe mehrere Ausbildungsbetriebe verglichen. Aufgabe: Den besten Lernort finden. Aktion: Die Breite der Kundenprojekte und das eigene Ausbildungszentrum haben mich überzeugt. Ergebnis: Ich möchte dort meine Karriere in der Systemintegration starten.",
      tips: "Bezug zur Stellenausschreibung herstellen, nicht allgemein bleiben.",
    },
    {
      question: "Wie gehen Sie vor, wenn Sie eine Netzwerkstörung nicht selbst lösen können?",
      category: "Verhalten",
      starAnswer:
        "Situation: Bei einem Schulprojekt kam ein VLAN-Fehler auf. Aufgabe: Den Fehler systematisch eingrenzen. Aktion: Ich habe Logs geprüft, die Konfiguration mit der Dokumentation verglichen und nach Recherche Kollegen um Rat gefragt. Ergebnis: Der Fehler war ein fehlendes Tagging am Uplink und war schnell behoben.",
      tips: "Systematik zeigen und dass Hilfe holen kein Zeichen von Schwäche ist.",
    },
  ],
  generalTips: [
    "Aktuelle IT-Themen wie Cloud und IT-Sicherheit anlesen.",
    "Beispiele aus Schule, Praktika und Hobbys konkret parat haben.",
    "Fragen zum Ausbildungsablauf und zu Übernahmechancen vorbereiten.",
    "Den Standort München und die Kundenbranchen von Firma 1 erwähnen.",
    "Eigene Netzwerk- oder Bastelprojekte in einem Satz zusammenfassen.",
    "Ruhige, verständliche Erklärungen üben, nicht in Fachjargon flüchten.",
  ],
  questionsToAsk: [
    "Wie ist der Rotationsplan durch die Fachabteilungen aufgebaut?",
    "In welchen Teams werden Auszubildende im ersten Jahr eingesetzt?",
    "Wie viele Auszubildende übernehmen Sie im Schnitt?",
    "Welche Zertifizierungen kann ich während der Ausbildung machen?",
    "Wie viel Kundenkontakt habe ich bereits im ersten Jahr?",
  ],
});

const firma2Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf den Online-Test und das Gespräch als Fachinformatiker für Anwendungsentwicklung bei Firma 2 GmbH in Nürnberg. Erwartet werden Programmiergrundlagen, Logik und strukturiertes Denken.",
  questions: [
    {
      question: "Was ist Objektorientierung?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Programm wächst und wird unübersichtlich. Aufgabe: Struktur schaffen. Aktion: Daten und Verhalten werden in Klassen gekapselt und über Vererbung und Interfaces wiederverwendet. Ergebnis: Der Code bleibt wartbar und testbar.",
      tips: "Kapselung, Vererbung, Polymorphie und Abstraktion jeweils in einem Satz erklären.",
    },
    {
      question: "Erklären Sie den Unterschied zwischen einer Liste und einer Menge.",
      category: "Fachlich",
      starAnswer:
        "Situation: Daten sollen gespeichert werden. Aufgabe: Passende Datenstruktur wählen. Aktion: Eine Liste erhält die Reihenfolge und erlaubt Duplikate, eine Menge nicht. Ergebnis: Für eindeutige Schlüssel nutze ich eine Menge.",
      tips: "Laufzeitkomplexität von Suchen kurz erwähnen.",
    },
    {
      question: "Was ist Git und wozu dient ein Branch?",
      category: "Fachlich",
      starAnswer:
        "Situation: Mehrere Personen arbeiten an einem Projekt. Aufgabe: Änderungen parallel entwickeln. Aktion: Jeder arbeitet auf einem Branch und führt die Änderungen über Merges zusammen. Ergebnis: Konflikte werden kontrolliert aufgelöst und die Historie bleibt nachvollziehbar.",
      tips: "Pull Requests und Code Reviews als Teamprozess nennen.",
    },
    {
      question: "Wie testen Sie Ihren Code?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ich habe eine Funktion für einen Verein geschrieben. Aufgabe: Fehler früh finden. Aktion: Ich habe Unit-Tests für Randfälle geschrieben und eine kleine Testdatenbank genutzt. Ergebnis: Ein Fehler bei leeren Eingaben fiel vor der Auslieferung auf.",
      tips: "Unit-Tests, Integrationstests und manuelles Testen unterscheiden.",
    },
    {
      question: "Wie finden Sie Fehler in einem fremden Codebestand?",
      category: "Verhalten",
      starAnswer:
        "Situation: In einem Gruppenprojekt funktionierte ein Feature nicht. Aufgabe: Den Fehler finden, ohne den Autor zu fragen. Aktion: Ich habe die Einstiegspunkte gelesen, Debug-Ausgaben ergänzt und den Ablauf nachvollzogen. Ergebnis: Der Fehler lag in einer falschen Annahme über die Datenstruktur.",
      tips: "Systematisches Vorgehen und Lesen von Code betonen.",
    },
    {
      question: "Was gefällt Ihnen am Programmieren?",
      category: "Persönlich",
      starAnswer:
        "Situation: In meiner Freizeit habe ich ein kleines Quiz-Spiel gebaut. Aufgabe: Die Logik musste stabil laufen. Aktion: Ich habe schrittweise Funktionen ergänzt und Debugging betrieben. Ergebnis: Das fertige Spiel motiviert mich, Software beruflich zu entwickeln.",
      tips: "Ehrliche Begeisterung zeigen und an ein konkretes Projekt knüpfen.",
    },
    {
      question: "Warum möchten Sie bei Firma 2 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe mich über mehrere Arbeitgeber informiert. Aufgabe: Den passenden Einstieg finden. Aktion: Die eigenen Produkte, die agile Arbeitsweise und die betriebseigene Akademie haben mich überzeugt. Ergebnis: Ich möchte hier meine Ausbildung beginnen und dauerhaft mitentwickeln.",
      tips: "Konkrete Bezüge zur Ausschreibung und zum Produkt herstellen.",
    },
    {
      question: "Wie reagieren Sie, wenn ein Code-Review viele Änderungen fordert?",
      category: "Verhalten",
      starAnswer:
        "Situation: In einem Schulprojekt bekam ich umfangreiches Feedback. Aufgabe: Die Hinweise sinnvoll einarbeiten. Aktion: Ich habe die Kommentare sortiert, Rückfragen gestellt und die Änderungen in kleinen Schritten umgesetzt. Ergebnis: Der Code wurde deutlich klarer und ich habe viel gelernt.",
      tips: "Feedback als Chance darstellen, sachlich bleiben.",
    },
  ],
  generalTips: [
    "Online-Tests mit Notizblatt und sauberem Vorgehen üben.",
    "Ein eigenes Projekt in zwei Minuten erklären können.",
    "Grundlagen in Java oder TypeScript wiederholen.",
    "Git-Befehle für den Alltag sicher beherrschen.",
    "Etwas über Scrum und agile Planung lesen.",
    "Beispiele für saubere Tests und Refactoring vorbereiten.",
  ],
  questionsToAsk: [
    "Welche Technologien setzt das Team im Alltag ein?",
    "Wie läuft der Online-Test genau ab?",
    "Besteht die Möglichkeit, ein Praktikum vor dem Start zu machen?",
    "Wie arbeiten Auszubildende in die Scrum-Teams eingebunden?",
    "Welche Sprache wird im Team für Code und Dokumentation genutzt?",
  ],
});

const firma3Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf das Gespräch als IT-System-Elektroniker bei Firma 3 GmbH in Stuttgart. Erwartet werden elektrotechnische Grundlagen, handwerkliches Geschick und Freude am praktischen Arbeiten.",
  questions: [
    {
      question: "Erklären Sie das Ohmsche Gesetz und wo es Ihnen im Alltag begegnet.",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine Schaltung soll ausgelegt werden. Aufgabe: Den Zusammenhang aus Spannung, Strom und Widerstand verstehen. Aktion: U ist gleich R mal I, sodass sich bei bekannter Spannung und Widerstand der Strom berechnen lässt. Ergebnis: Ich kann Bauteile und Leitungsquerschnitte passend wählen.",
      tips: "Formel einmal umstellen und an einem Beispiel zeigen.",
    },
    {
      question: "Was ist der Unterschied zwischen Reihen- und Parallelschaltung?",
      category: "Fachlich",
      starAnswer:
        "Situation: Mehrere Widerstände sollen verschaltet werden. Aufgabe: Das passende Konzept wählen. Aktion: In Reihe addieren sich die Widerstände, parallel addieren sich die Leitwerte und die Spannung bleibt gleich. Ergebnis: Ich wähle die Schaltung passend zum gewünschten Verhalten.",
      tips: "Ein praktisches Beispiel aus dem Alltag ergänzen.",
    },
    {
      question: "Wie messen Sie Spannung und Strom mit einem Multimeter?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Arbeitsplatz soll überprüft werden. Aufgabe: Spannung und Strom korrekt messen. Aktion: Die Spannung wird parallel gemessen, der Strom in Reihe und mit passendem Messbereich. Ergebnis: Die Werte stimmen und die Messung selbst beeinflusst die Schaltung möglichst wenig.",
      tips: "Auf Messbereich, Polarität und Sicherheit achten.",
    },
    {
      question: "Worauf achten Sie beim Aufbau einer Netzwerkverkabelung?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Büro soll neue Netzwerkdosen erhalten. Aufgabe: Sauber und normgerecht verkabeln. Aktion: Ich achte auf die richtige Pin-Belegung, Kategorien der Kabel, Zugentlastung und eine klare Beschriftung. Ergebnis: Die Verbindungen messen sich fehlerfrei und lassen sich später leicht zuordnen.",
      tips: "Normen wie TIA-568 und strukturierte Verkabelung erwähnen.",
    },
    {
      question: "Was bedeutet ESD-Schutz und warum ist er wichtig?",
      category: "Fachlich",
      starAnswer:
        "Situation: Bauteile werden montiert oder getauscht. Aufgabe: Schäden durch statische Entladung vermeiden. Aktion: Ich nutze Erdungsarmband, ableitfähige Unterlagen und transportiere Platinen in Schutzhüllen. Ergebnis: Empfindliche Bauteile bleiben funktionsfähig und Ausfälle sinken.",
      tips: "Wirkung auch für den Kunden und die Kosten erklären.",
    },
    {
      question: "Wie gehen Sie bei der Fehlersuche an defekter Hardware vor?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ein Arbeitsplatz startete nicht mehr. Aufgabe: Die Ursache eingrenzen. Aktion: Ich habe systematisch Netzteil, Verkabelung und Komponenten geprüft und schrittweise ausgeschlossen. Ergebnis: Ein defektes Netzteil war die Ursache und wurde schnell ersetzt.",
      tips: "Vom Einfachen zum Komplexen arbeiten, dokumentieren.",
    },
    {
      question: "Warum möchten Sie bei Firma 3 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe handwerkliche und IT-begeisterte Betriebe verglichen. Aufgabe: Die passende Ausbildung finden. Aktion: Die Verbindung aus Elektrotechnik, Netzwerktechnik und Kundenkontakt hat mich überzeugt. Ergebnis: Ich möchte hier den praktischen Teil meiner Karriere starten.",
      tips: "Bezug zu Montage, Messtechnik und Service herstellen.",
    },
    {
      question: "Wie achten Sie auf Arbeitssicherheit?",
      category: "Verhalten",
      starAnswer:
        "Situation: Bei Reparaturen unter Spannung besteht Gefahr. Aufgabe: Sicher arbeiten. Aktion: Ich schalte spannungsfrei, prüfe das mit dem Messgerät und nutze Schutzausrüstung. Ergebnis: Unfälle werden vermieden und die Arbeit bleibt sauber nachvollziehbar.",
      tips: "Fünf Sicherheitsregeln der Elektrotechnik nennen.",
    },
  ],
  generalTips: [
    "Grundformeln der Elektrotechnik sicher wiederholen.",
    "Praktische Projekte aus Hobby oder Werkstatt parat haben.",
    "Zeigen, dass Sie sorgfältig und sicherheitsbewusst arbeiten.",
    "Sich über aktuelle Netzwerktechnik informieren.",
    "Kundenorientierung mit einem konkreten Beispiel belegen.",
    "Pünktlichkeit und sorgfältige Arbeitskleidung selbstverständlich einplanen.",
  ],
  questionsToAsk: [
    "Wie viel Zeit verbringe ich in der Werkstatt und beim Kunden?",
    "Mit welchen Messgeräten und Systemen arbeite ich?",
    "Wie läuft die Prüfungsvorbereitung im Haus ab?",
    "Welche Aufstiegschancen gibt es nach der Ausbildung?",
    "Wie ist das Ausbilderteam aufgestellt?",
  ],
});

const firma4Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf das Gespräch als Fachinformatiker für Systemintegration bei der Firma 4 GmbH in Köln. Erwartet werden Netzwerk- und Serverkenntnisse, Sorgfalt und ein sicheres Verständnis für IT-Sicherheit.",
  questions: [
    {
      question: "Was ist ein VLAN und wozu setzt man es ein?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Netzwerk soll logisch getrennt werden. Aufgabe: Bereiche voneinander abschirmen. Aktion: Über VLANs werden Ports und Geräte in getrennte Segmente gruppiert, auch wenn sie an einem Switch hängen. Ergebnis: Sicherheit und Übersicht steigen, Broadcast-Domänen werden kleiner.",
      tips: "Bezug zu Abteilungen und Sicherheit im Bankumfeld herstellen.",
    },
    {
      question: "Was ist Active Directory und wofür wird es genutzt?",
      category: "Fachlich",
      starAnswer:
        "Situation: Viele Benutzer und Computer müssen verwaltet werden. Aufgabe: Rechte zentral steuern. Aktion: Active Directory speichert Objekte und ermöglicht Anmeldung, Gruppenrichtlinien und Rechtevergabe. Ergebnis: Administration wird einheitlich und nachvollziehbar.",
      tips: "Domäne, Organisationale Einheit und Gruppenrichtlinien nennen.",
    },
    {
      question: "Wie sieht ein gutes Backup-Konzept aus?",
      category: "Fachlich",
      starAnswer:
        "Situation: Daten müssen vor Verlust geschützt werden. Aufgabe: Wiederherstellbarkeit sicherstellen. Aktion: Ich plane nach der 3-2-1-Regel, trenne Sicherung und Produktion und teste regelmäßig die Rücksicherung. Ergebnis: Im Notfall lassen sich Daten zuverlässig und fristgerecht wiederherstellen.",
      tips: "Von der 3-2-1-Regel und regelmäßigen Restore-Tests sprechen.",
    },
    {
      question: "Warum ist IT-Sicherheit im Bankumfeld besonders wichtig?",
      category: "Fachlich",
      starAnswer:
        "Situation: Banken verwalten sensible Daten und Geld. Aufgabe: Vertrauen und Gesetzeskonformität sichern. Aktion: Durch Patch-Management, Mehr-Faktor-Authentifizierung, Berechtigungskonzepte und Monitoring werden Risiken reduziert. Ergebnis: Systeme und Kundendaten bleiben geschützt.",
      tips: "Regulatorik wie BAIT und Datenschutz erwähnen.",
    },
    {
      question: "Wie gehen Sie mit vertraulichen Daten um?",
      category: "Verhalten",
      starAnswer:
        "Situation: Während eines Praktikums hatte ich Zugriff auf Kundendaten. Aufgabe: Vertraulichkeit wahren. Aktion: Ich habe nur notwendige Daten eingesehen, nichts geteilt und Bildschirme gesperrt. Ergebnis: Der Datenschutz blieb jederzeit gewahrt.",
      tips: "Datensparsamkeit und Sorgfalt betonen.",
    },
    {
      question: "Was tun Sie, wenn morgens ein Server nicht erreichbar ist?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ein Server war plötzlich nicht ansprechbar. Aufgabe: Ausfall schnell beheben. Aktion: Ich habe erst den Umfang geprüft, dann Netzwerk, Dienste und Logs systematisch kontrolliert und den Vorfall dokumentiert. Ergebnis: Die Ursache war ein Dienst, der nach dem Neustart nicht startete.",
      tips: "Ruhig, strukturiert und mit klarer Kommunikation vorgehen.",
    },
    {
      question: "Warum möchten Sie bei der Firma 4 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe Arbeitgeber in der Region verglichen. Aufgabe: Eine Ausbildung mit Zukunft finden. Aktion: Die Kombination aus regionaler Verwurzelung, hochverfügbarer IT und guten Sozialleistungen hat mich überzeugt. Ergebnis: Ich möchte hier langfristig bleiben und mich weiterbilden.",
      tips: "Regionalen Bezug und Interesse an stabiler IT zeigen.",
    },
    {
      question: "Wie priorisieren Sie mehrere gleichzeitige Tickets?",
      category: "Verhalten",
      starAnswer:
        "Situation: Drei Störungen kamen gleichzeitig. Aufgabe: Die Reihenfolge festlegen. Aktion: Ich habe nach Auswirkung und Dringlichkeit sortiert und die Betroffenen über den Zeitplan informiert. Ergebnis: Kritische Fälle waren schnell gelöst, niemand wartete ohne Information.",
      tips: "Eisenhower-Prinzip oder Priorisierung nach Auswirkung nennen.",
    },
  ],
  generalTips: [
    "Grundlagen zu Netzwerk und Servern sicher beherrschen.",
    "Etwas über IT-Sicherheit und Datenschutz lesen.",
    "Sorgfalt und Diskretion mit Beispielen belegen.",
    "Interesse an stabiler, hochverfügbarer IT zeigen.",
    "Regulatorische Themen wie BAIT grob einordnen können.",
    "Ruhige und strukturierte Antworten üben.",
  ],
  questionsToAsk: [
    "In welchen IT-Teams werden Auszubildende eingesetzt?",
    "Wie ist die IT zwischen Rechenzentrum und Filialen aufgeteilt?",
    "Wie werden Auszubildende auf Prüfungen vorbereitet?",
    "Welche Weiterbildungen sind nach der Ausbildung möglich?",
    "Wie viel Kontakt habe ich zu den Fachabteilungen?",
  ],
});

const firma5Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf den Online-Test und das Gespräch als Fachinformatiker für Anwendungsentwicklung bei Firma 5 GmbH in Erlangen. Erwartet werden Programmiergrundlagen, technisches Verständnis und saubere Arbeitsweise.",
  questions: [
    {
      question: "Was ist Objektorientierung und warum ist sie nützlich?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Programm wird mit der Zeit immer größer. Aufgabe: Es übersichtlich und erweiterbar halten. Aktion: Daten und Verhalten werden in Klassen gekapselt und über Vererbung und Interfaces wiederverwendet. Ergebnis: Die Software lässt sich leichter warten und testen.",
      tips: "Kapselung, Vererbung, Polymorphie und Abstraktion nennen.",
    },
    {
      question: "Erklären Sie den Unterschied zwischen statischer und dynamischer Typisierung.",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine Variable soll einen Wert aufnehmen. Aufgabe: Den passenden Sprachtyp einordnen. Aktion: Bei statischer Typisierung wird der Typ zur Übersetzungszeit geprüft, bei dynamischer zur Laufzeit. Ergebnis: Ich kann Vor- und Nachteile passend zum Projekt abwägen.",
      tips: "C# als statisch, Python als dynamisch einordnen.",
    },
    {
      question: "Was ist eine API und wofür braucht man Schnittstellen wie OPC UA?",
      category: "Fachlich",
      starAnswer:
        "Situation: Zwei Systeme sollen Daten austauschen. Aufgabe: Einen klaren Vertrag für den Austausch schaffen. Aktion: Eine API definiert Aufrufe, Formate und Fehler. OPC UA bringt diese Idee standardisiert in die Industrieautomation. Ergebnis: Maschinen und Software lassen sich unabhängig voneinander koppeln.",
      tips: "Schnittstelle als Vertrag erklären, Beispiel aus der Anlage nennen.",
    },
    {
      question: "Was ist ein Primärschlüssel in einer Datenbank?",
      category: "Fachlich",
      starAnswer:
        "Situation: Datensätze sollen eindeutig identifizierbar sein. Aufgabe: Eine eindeutige Kennung festlegen. Aktion: Der Primärschlüssel ist eindeutig und nicht null und identifiziert jede Zeile. Ergebnis: Beziehungen und Abfragen werden zuverlässig.",
      tips: "Fremdschlüssel und Normalisierung kurz erwähnen.",
    },
    {
      question: "Wie testen Sie Ihre Software?",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine neue Funktion war fertig. Aufgabe: Fehler früh erkennen. Aktion: Ich habe Unit-Tests für Normalfall und Randfälle geschrieben und die Funktion zusätzlich manuell geprüft. Ergebnis: Ein Fehler bei fehlerhaften Eingaben fiel vor der Auslieferung auf.",
      tips: "Automatisierte Tests und Testfälle unterscheiden.",
    },
    {
      question: "Wie arbeiten Sie sich in fremden oder älteren Code ein?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ich habe ein bestehendes Projekt übernommen. Aufgabe: Den Aufbau verstehen. Aktion: Ich habe die Einstiegspunkte gelesen, Abläufe dokumentiert und kleine Änderungen zuerst getestet. Ergebnis: Ich konnte Änderungen sicher umsetzen, ohne bestehende Funktionen zu brechen.",
      tips: "Lesen, Debuggen und kleine Schritte betonen.",
    },
    {
      question: "Warum möchten Sie bei Firma 5 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe mich über mehrere Arbeitgeber informiert. Aufgabe: Eine Ausbildung mit echtem Technikbezug finden. Aktion: Die Verbindung aus Softwareentwicklung und Industrieautomation hat mich überzeugt. Ergebnis: Ich möchte hier Programme entwickeln, die direkt an Anlagen wirken.",
      tips: "Bezug zu Automatisierung und Anlagen herstellen.",
    },
    {
      question: "Wie gehen Sie mit Rückschlägen und Fehlern um?",
      category: "Persönlich",
      starAnswer:
        "Situation: In einem Projekt funktionierte eine Lösung nicht wie geplant. Aufgabe: Den Rückschlag verarbeiten. Aktion: Ich habe den Fehler analysiert, gezielt recherchiert und eine Alternative umgesetzt. Ergebnis: Das Projekt lief weiter und ich habe daraus viel gelernt.",
      tips: "Lernbereitschaft und Ausdauer zeigen.",
    },
  ],
  generalTips: [
    "Programmiergrundlagen in C# oder Python wiederholen.",
    "Etwas über Automatisierungstechnik und Anlagen lesen.",
    "Ein eigenes Projekt klar und kurz vorstellen können.",
    "Grundlagen von SQL und Datenbanken sicher beherrschen.",
    "Interesse an industriellen Schnittstellen zeigen.",
    "Fehlerkultur und Lernbereitschaft glaubwürdig vermitteln.",
  ],
  questionsToAsk: [
    "An welchen Produkten arbeiten Auszubildende mit?",
    "Wie ist das Verhältnis von Software zu Anlagentechnik im Alltag?",
    "Welche Sprachen und Werkzeuge werden eingesetzt?",
    "Wie läuft die Einarbeitung in die Anlagensteuerung ab?",
    "Welche Weiterbildungen sind nach der Ausbildung möglich?",
  ],
});

const firma6Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf das Gespräch als Fachinformatiker für Daten- und Prozessanalyse bei der Firma 6 GmbH in Wuppertal. Erwartet werden analytisches Denken, Datenbankgrundlagen und Sorgfalt im Umgang mit Daten.",
  questions: [
    {
      question: "Was ist ein Primärschlüssel und warum ist er wichtig?",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine Tabelle enthält viele Datensätze. Aufgabe: Jeden Datensatz eindeutig identifizieren. Aktion: Der Primärschlüssel ist eindeutig und darf nicht leer sein. Ergebnis: Datensätze lassen sich zuverlässig verknüpfen und abfragen.",
      tips: "Fremdschlüssel und referenzielle Integrität erwähnen.",
    },
    {
      question: "Was ist der Unterschied zwischen WHERE und HAVING in SQL?",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine Abfrage soll gefiltert werden. Aufgabe: Den Filter an der richtigen Stelle setzen. Aktion: WHERE filtert einzelne Zeilen vor der Gruppierung, HAVING filtert Gruppen nach der Aggregation. Ergebnis: Auswertungen liefern genau die gewünschten Ergebnisse.",
      tips: "Ein kleines Beispiel mit GROUP BY und COUNT zeigen.",
    },
    {
      question: "Wie prüfen Sie die Qualität eines Datensatzes?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Datensatz enthielt auffällige Werte. Aufgabe: Fehler finden und einordnen. Aktion: Ich habe auf Vollständigkeit, Eindeutigkeit, Wertebereiche und Konsistenz geprüft und Auffälligkeiten dokumentiert. Ergebnis: Die fehlerhaften Zeilen konnten korrigiert werden.",
      tips: "Dimensionen der Datenqualität nennen.",
    },
    {
      question: "Was ist der Unterschied zwischen Mittelwert und Median?",
      category: "Fachlich",
      starAnswer:
        "Situation: Einkommen sollen zusammengefasst werden. Aufgabe: Den passenden Kennwert wählen. Aktion: Der Mittelwert reagiert stark auf Ausreißer, der Median beschreibt die mittlere Position. Ergebnis: Bei schiefen Verteilungen nutze ich den Median.",
      tips: "Ausreißerempfindlichkeit betonen.",
    },
    {
      question: "Wie würden Sie einen wiederkehrenden Prozess analysieren?",
      category: "Fachlich",
      starAnswer:
        "Situation: Eine monatliche Auswertung kostete viel Zeit. Aufgabe: Den Ablauf verstehen und verbessern. Aktion: Ich habe die Schritte aufgenommen, Engpässe markiert und eine Automatisierung vorgeschlagen. Ergebnis: Die Auswertung lief anschließend deutlich schneller und fehlerfreier.",
      tips: "Prozessaufnahme und Automatisierungspotenzial ansprechen.",
    },
    {
      question: "Wie erklären Sie ein komplexes Ergebnis einer fachfremden Person?",
      category: "Verhalten",
      starAnswer:
        "Situation: Eine Fachabteilung sollte ein Ergebnis verstehen. Aufgabe: Komplexität verständlich machen. Aktion: Ich habe Kernaussagen vorangestellt, ein einfaches Diagramm genutzt und Fachbegriffe vermieden. Ergebnis: Die Abteilung konnte die Entscheidung auf Basis der Daten treffen.",
      tips: "Zielgruppe beachten und visuell zusammenfassen.",
    },
    {
      question: "Warum möchten Sie bei der Firma 6 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe Arbeitgeber mit Datenbezug verglichen. Aufgabe: Eine sinnstiftende Ausbildung finden. Aktion: Die Verbindung aus Datensicherheit, Prozessanalyse und gesellschaftlichem Nutzen hat mich überzeugt. Ergebnis: Ich möchte hier meine Ausbildung beginnen und langfristig bleiben.",
      tips: "Sinn der Aufgabe und krisensicheren Arbeitgeber erwähnen.",
    },
    {
      question: "Wie stellen Sie den Datenschutz bei Ihrer Arbeit sicher?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ich arbeitete mit sensiblen Testdaten. Aufgabe: Den Datenschutz wahren. Aktion: Ich habe nur notwendige Daten verwendet, Zugriffe eingeschränkt und nichts außerhalb der Systeme gespeichert. Ergebnis: Die Daten blieben jederzeit geschützt.",
      tips: "Datensparsamkeit und sichere Ablage betonen.",
    },
  ],
  generalTips: [
    "SQL-Grundlagen sicher wiederholen, besonders GROUP BY und JOIN.",
    "Etwas über Datenqualität und Statistik lesen.",
    "Datenschutz und Sorgfalt mit Beispielen belegen.",
    "Eine Auswertung einfach und visuell erklären können.",
    "Interesse an Prozessanalyse und Automatisierung zeigen.",
    "Verständlich statt fachlich überladen antworten.",
  ],
  questionsToAsk: [
    "Mit welchen Daten und Fachabteilungen arbeiten Auszubildende?",
    "Welche BI- und Datenbankwerkzeuge werden eingesetzt?",
    "Wie werden Auszubildende in Projekte eingebunden?",
    "Wie ist der Datenschutz im Alltag organisiert?",
    "Welche Weiterbildungen gibt es im Datenbereich?",
  ],
});

const firma7Prep: InterviewPrep = makeInterviewPrep({
  roleSummary:
    "Vorbereitung auf das Gespräch als Fachinformatiker für Systemintegration bei Firma 7 GmbH in Düsseldorf. Erwartet werden Netzwerkgrundlagen, Serviceorientierung und Interesse an Managed Services.",
  questions: [
    {
      question: "Erklären Sie das OSI-Modell in eigenen Worten.",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Datenpaket wandert durch das Netzwerk. Aufgabe: Die einzelnen Schritte verstehen. Aktion: Das OSI-Modell beschreibt sieben Schichten von der physischen Übertragung bis zur Anwendung. Ergebnis: Ich kann Fehler gezielt einer Schicht zuordnen.",
      tips: "Die sieben Schichten kurz aufzählen, nicht auswendig leiern.",
    },
    {
      question: "Was ist der Unterschied zwischen Switch und Router?",
      category: "Fachlich",
      starAnswer:
        "Situation: Geräte sollen miteinander kommunizieren. Aufgabe: Das passende Gerät wählen. Aktion: Ein Switch verbindet Geräte in einem Netz über MAC-Adressen, ein Router verbindet verschiedene Netze über IP-Adressen. Ergebnis: Jedes Gerät erfüllt seine Aufgabe im Netz.",
      tips: "Broadcast-Domäne und Subnetz als Stichworte nennen.",
    },
    {
      question: "Wozu dient ein VLAN?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Netz soll logisch getrennt werden. Aufgabe: Sicherheit und Übersicht erhöhen. Aktion: Geräte werden unabhängig vom Standort in logische Segmente gruppiert. Ergebnis: Broadcasts bleiben begrenzt und Bereiche sind besser abschirmbar.",
      tips: "Trunk und Access-Port kurz erwähnen.",
    },
    {
      question: "Wie funktioniert eine Firewall?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Netz soll vor unerwünschtem Verkehr geschützt werden. Aufgabe: Den Datenverkehr kontrollieren. Aktion: Regeln erlauben oder verbieten Verbindungen anhand von Adresse, Port und Protokoll. Ergebnis: Nur notwendiger Verkehr passiert die Grenze.",
      tips: "Default-Deny und Regelreihenfolge erwähnen.",
    },
    {
      question: "Was ist ein VPN und wann setzt man es ein?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ein Mitarbeiter arbeitet von außerhalb. Aufgabe: Sicheren Zugriff ermöglichen. Aktion: Über einen verschlüsselten Tunnel werden die Daten zum Firmennetz übertragen. Ergebnis: Der Zugriff ist geschützt und das interne Netz bleibt abgeschirmt.",
      tips: "Verschlüsselung und Authentifizierung betonen.",
    },
    {
      question: "Wie überwachen Sie eine Netzwerkumgebung?",
      category: "Fachlich",
      starAnswer:
        "Situation: Ausfälle sollen früh auffallen. Aufgabe: Den Zustand laufend prüfen. Aktion: Über Monitoring werden Verfügbarkeit, Last und Alarmgrenzen überwacht und Meldungen priorisiert. Ergebnis: Störungen werden erkannt, bevor Kunden sie melden.",
      tips: "Monitoring und Alerting unterscheiden.",
    },
    {
      question: "Warum möchten Sie bei Firma 7 GmbH arbeiten?",
      category: "Persönlich",
      starAnswer:
        "Situation: Ich habe mehrere IT-Dienstleister verglichen. Aufgabe: Den passenden Betrieb finden. Aktion: Der Fokus auf Managed Services, Netze und Cloud sowie die Kundennähe haben mich überzeugt. Ergebnis: Ich möchte hier meine Ausbildung mit Praxisbezug starten.",
      tips: "Bezug zu Managed Services und Kundenprojekten herstellen.",
    },
    {
      question: "Wie gehen Sie bei einer Störungsmeldung strukturiert vor?",
      category: "Verhalten",
      starAnswer:
        "Situation: Ein Kunde meldete einen Verbindungsabbruch. Aufgabe: Die Ursache schnell finden. Aktion: Ich habe den Umfang geprüft, Kabel und Ports kontrolliert, Logs ausgewertet und die Schritte dokumentiert. Ergebnis: Ein defektes Patchkabel war die Ursache und der Kunde war schnell wieder online.",
      tips: "Vom Einfachen zum Komplexen, sauber dokumentieren.",
    },
  ],
  generalTips: [
    "Netzwerkgrundlagen zu Routing, Switching und VLAN wiederholen.",
    "Etwas über Firewalls, VPN und Monitoring lesen.",
    "Kundenorientierung mit einem Beispiel belegen.",
    "Aktuelle Cloud- und Security-Themen anlesen.",
    "Strukturiertes Vorgehen bei Störungen betonen.",
    "Den regionalen Kundenfokus des Systemhauses erwähnen.",
  ],
  questionsToAsk: [
    "Wie ist das Managed-Service-Team aufgestellt?",
    "Welche Netzwerk- und Security-Hersteller setzt ihr ein?",
    "Wie viel Kundenkontakt haben Auszubildende?",
    "Welche Zertifizierungen kann ich während der Ausbildung machen?",
    "Wie läuft die Übernahme nach der Ausbildung ab?",
  ],
});

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
    interviewPrep: firma1Prep,
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
    interviewPrep: firma2Prep,
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
    interviewPrep: firma3Prep,
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
    interviewPrep: firma4Prep,
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
    interviewPrep: firma5Prep,
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
    interviewPrep: firma6Prep,
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
    interviewPrep: firma7Prep,
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
