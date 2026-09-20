# AusbildungTracker

**Bewerbungen um Ausbildungs- und Arbeitsplätze intelligent verwalten.**

AusbildungTracker ist eine Web-App, mit der ich meine Bewerbungen an einer
einzigen Stelle verwalte: Kanban-Board, filterbare Tabelle, Terminkalender,
Statistiken und ein automatischer Abgleich mit meinem Gmail-Postfach inklusive
KI-Unterstützung.

> **Demo-Hinweis:** Diese öffentliche Version ist eine **Demo mit Beispieldaten**.
> Alle Bewerbungen, Unternehmen und E-Mails sind Beispielinhalte. **Alle
> Firmennamen, Personen, Adressen und Links sind frei erfunden.** Jede
> Ähnlichkeit mit realen Unternehmen oder Personen ist rein zufällig. Es findet
> keine Anmeldung, kein Gmail-Zugriff und keine Übertragung echter Daten statt.
> Die Demo läuft vollständig im Browser.

## Live-Demo

🔗 **https://az-tracker-demo.vercel.app**

---

## Funktionen

**Bewerbungen verwalten**
- Kanban-Board mit Drag & Drop durch die Status-Pipeline
  (Entwurf → Beworben → Warte auf Antwort → Einladung →
  Vorstellungsgespräch → Absage / Zusage / Abgebrochen)
- Tabellenansicht mit Suche, Filtern, Sortierung und Gruppierung nach Beruf
- Mehrfachauswahl mit Sammelaktionen: Status ändern, löschen, CSV-Export
- Detailseite mit Notizen, Ansprechpartner, Stellenlink und PDF-Anhängen

**Automatischer Gmail-Abgleich** *(in der Demo simuliert)*
- Findet Bewerbungs-E-Mails im Postfach und ordnet sie automatisch der
  passenden Bewerbung zu – oder legt eine neue an
- Vollständige E-Mail-Zeitlinie pro Bewerbung mit Link zum Gmail-Thread
- Läuft serverseitig in Cloud Functions; der Gmail-Zugriff erfolgt
  ausschließlich lesend

**KI-Unterstützung (Google Gemini über Vertex AI)**
- Erkennt relevante E-Mails und extrahiert Unternehmen, Position, Standort,
  Ansprechpartner und Stellenlink
- Fasst gleiche Berufe zu einer einheitlichen Kategorie zusammen
- Recherchiert Stellenanzeigen: Anforderungen, Benefits, Vergütung,
  Arbeitszeiten, Starttermin und Bewerbungsfrist
- Formuliert Antwort- und Nachfass-E-Mails im Kontext des gesamten Verlaufs

**Kalender & Überblick**
- Monatskalender mit Gesprächsterminen und Wiedervorlagen
- Deutsche Feiertage je Bundesland farblich hervorgehoben
- Export als ICS-Datei oder direkt in den Google-Kalender
- Dashboard mit Antwortquote, Statistik nach Beruf, „Braucht Aufmerksamkeit“
  und den nächsten Terminen

**Weitere Details**
- Dunkelmodus, vollständig deutschsprachige Oberfläche, mobil optimiert

---

## Technik

AusbildungTracker ist eine **Full-Stack-Web-App**: ein Next.js-Frontend, ein
serverloses Backend auf **Firebase Cloud Functions** und **Cloud Firestore** als
Datenbank. Alle sicherheitsrelevanten Vorgänge – der Gmail-Zugriff und die
KI-Aufrufe – laufen ausschließlich serverseitig; das Frontend erhält niemals
Zugangsdaten oder API-Schlüssel.

| Bereich        | Eingesetzt                                                                     |
| -------------- | ------------------------------------------------------------------------------ |
| Frontend       | Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4                 |
| UI             | shadcn/ui, Lucide Icons, Recharts, dnd-kit                                     |
| Backend        | Firebase Cloud Functions (Node.js 22, TypeScript, 2nd Gen)                     |
| Datenbank      | Cloud Firestore (native), Firebase Storage für PDF-Anhänge                     |
| Anmeldung      | Firebase Authentication (Google Sign-In, Single-Owner-Zugriff)                 |
| Schnittstellen | Gmail API (OAuth 2.0) und Google Gemini über Vertex AI                         |
| Deployment     | Firebase Hosting (Haupt-App) bzw. Vercel (Demo), CI/CD über GitHub Actions     |

---

## Architektur & technische Highlights

- **Full-Stack-Architektur:** Next.js-Frontend, Firebase Cloud Functions als
  serverloses Backend und Firestore als Datenbank. Das Frontend wird als
  statischer Export über das Firebase-Hosting-CDN ausgeliefert, alle Daten- und
  Integrationslogik liegt im Backend.
- **Gmail-Integration:** OAuth 2.0 mit dem Scope `gmail.readonly`. Das
  Refresh-Token wird serverseitig in Cloud Functions gespeichert und ist über
  die Firestore-Security-Rules für den Client unerreichbar; sämtliche
  Gmail-Aufrufe finden ausschließlich im Backend statt.
- **Synchronisierungs-Pipeline:** Eine geplante (alle 6 Stunden) und manuell
  auslösbare Cloud Function durchsucht das Postfach anhand deutscher
  Suchbegriffe, verarbeitet Nachrichten dedupliziert (Message-ID-Registry),
  verhindert parallele Läufe über eine Firestore-Sperre und protokolliert jeden
  Lauf inklusive Fehlern.
- **KI-Klassifizierung mit Vertex AI:** Gemini entscheidet über die Relevanz,
  extrahiert Unternehmen, Position, Standort, Ansprechpartner und Stellenlink,
  normalisiert Berufsbezeichnungen zu einer einheitlichen Kategorie und ordnet
  jede E-Mail dem passenden Vorgang zu. Die Ausgaben sind über ein festes
  JSON-Schema strukturiert; für die Recherche kommt Google-Search-Grounding zum
  Einsatz.
- **Statuslogik:** Der Bewerbungsstatus wird regelbasiert nur vorwärts bewegt;
  abgeschlossene Vorgänge (Absage, Zusage, Abgebrochen) bleiben unverändert.
- **Sicherheit:** Single-Owner-Modell – jede Cloud Function prüft die
  Berechtigung serverseitig, Firestore- und Storage-Regeln erlauben den Zugriff
  ausschließlich für das eigene Konto.
- **Automatisierung:** GitHub Actions baut und deployt bei jedem Push auf `main`
  die Cloud Functions, die Firestore-/Storage-Regeln und das Hosting –
  schlüssellos über Workload Identity Federation, ohne hinterlegte
  Service-Account-Schlüssel.
- **Frontend:** Drag & Drop (dnd-kit), Diagramme (Recharts), barrierefreie
  UI-Komponenten (shadcn/ui), ICS-Export, deutsche Feiertage je Bundesland,
  Dark Mode, vollständig responsiv und deutschsprachig.
- **Demo-Version:** Die öffentliche Demo läuft bewusst ohne Backend. Sie nutzt
  Beispieldaten im Browser und simuliert Gmail-Abgleich und KI-Aufrufe, damit
  keine echten Daten übertragen und keine API-Kosten verursacht werden. Der
  Funktionsumfang entspricht der echten Anwendung.

---

## Über dieses Projekt

Dieses Projekt habe ich eigenständig konzipiert und umgesetzt, um meine
praktischen Kenntnisse in der modernen Webentwicklung zu zeigen – als Teil
meiner Bewerbung um einen Ausbildungsplatz im Bereich **Fachinformatiker**.

Fragen oder Feedback gerne über [GitHub](https://github.com/louaymb).
