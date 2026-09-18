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
- Erstellt eine Interview-Vorbereitung mit typischen Fragen und
  STAR-Antwortvorschlägen
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

| Bereich    | Eingesetzt                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4          |
| UI         | shadcn/ui, Lucide Icons, Recharts, dnd-kit                              |
| Backend    | Firebase Cloud Functions (Node.js 22, TypeScript)                       |
| Datenbank  | Cloud Firestore, Firebase Storage                                       |
| Anmeldung  | Firebase Authentication (Google Sign-In)                                |
| Schnittstellen | Gmail API (OAuth 2.0) und Google Gemini über Vertex AI              |
| Deployment | Statischer Export auf Vercel bzw. Firebase Hosting, CI/CD über GitHub Actions |

---

## Technische Highlights

- **Statischer Export:** Die App benötigt kein eigenes Backend für die
  Auslieferung und läuft als statische Website.
- **Gmail-Integration:** OAuth 2.0 mit Refresh-Token, das serverseitig in Cloud
  Functions gespeichert und über Firestore-Regeln für den Client unerreichbar
  gehalten wird.
- **KI-Klassifizierung:** Strukturierte Gemini-Ausgaben über ein festes
  JSON-Schema, inklusive Google-Search-Grounding für die Recherche.
- **Sicherheit:** Single-Owner-Modell mit Firestore- und Storage-Security-Rules;
  jede Funktion prüft die Berechtigung serverseitig.
- **Datenschutz im Demo-Modus:** Kein Backend, keine Anmeldung – alle
  Beispieldaten liegen ausschließlich lokal im Browser.

---

## Über dieses Projekt

Dieses Projekt habe ich eigenständig konzipiert und umgesetzt, um meine
praktischen Kenntnisse in der modernen Webentwicklung zu zeigen – als Teil
meiner Bewerbung um einen Ausbildungsplatz im Bereich **Fachinformatiker**.

Fragen oder Feedback gerne über [GitHub](https://github.com/louaymb).
