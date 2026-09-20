import { addDays, format } from "date-fns";

import type { Application } from "@/types";
import { toDate } from "./format";

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

export type CalendarEntryKind = "interview" | "follow_up";

/** A single calendar item derived from an application. */
export interface CalendarEntry {
  key: string;
  application: Application;
  date: Date;
  kind: CalendarEntryKind;
}

interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

const EVENT_DURATION_MS = 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `YYYYMMDDTHHMMSSZ` in UTC – what ICS and Google Calendar expect. */
function toIcsDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function eventDescription(application: Application): string {
  return [
    application.ausbildungsberuf,
    application.ansprechpartner ? `Ansprechpartner: ${application.ansprechpartner}` : "",
    application.stellenlink,
  ]
    .filter(Boolean)
    .join("\n");
}

export function interviewEvent(application: Application): CalendarEvent | null {
  const start = toDate(application.interviewAt);
  if (!start) return null;

  return {
    title: `Vorstellungsgespräch: ${application.unternehmen || "Bewerbung"}`,
    description: eventDescription(application),
    location: application.standort || "",
    start,
    end: new Date(start.getTime() + EVENT_DURATION_MS),
  };
}

export function googleCalendarUrl(application: Application): string | null {
  const event = interviewEvent(application);
  if (!event) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.start)}/${toIcsDate(event.end)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Interviews and follow-ups from a set of applications, sorted by date. */
export function buildCalendarEntries(applications: Application[]): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const application of applications) {
    const interviewAt = toDate(application.interviewAt);
    if (interviewAt) {
      entries.push({
        key: `${application.id}:interview`,
        application,
        date: interviewAt,
        kind: "interview",
      });
    }

    const followUpAt = toDate(application.followUpAt);
    if (followUpAt) {
      entries.push({
        key: `${application.id}:follow_up`,
        application,
        date: followUpAt,
        kind: "follow_up",
      });
    }
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function entryTitle(entry: CalendarEntry): string {
  const company = entry.application.unternehmen || "Bewerbung";
  return entry.kind === "interview"
    ? `Vorstellungsgespräch: ${company}`
    : `Wiedervorlage: ${company}`;
}

export function buildIcsCalendar(
  events: IcsEvent[],
  calendarName = "AusbildungTracker",
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AusbildungTracker//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
  ];

  for (const event of events) {
    lines.push("BEGIN:VEVENT", `UID:${event.uid}`, `DTSTAMP:${toIcsDate(new Date())}`);
    if (event.allDay) {
      lines.push(
        `DTSTART;VALUE=DATE:${format(event.start, "yyyyMMdd")}`,
        `DTEND;VALUE=DATE:${format(addDays(event.end, 1), "yyyyMMdd")}`,
      );
    } else {
      lines.push(
        `DTSTART:${toIcsDate(event.start)}`,
        `DTEND:${toIcsDate(event.end)}`,
      );
    }
    lines.push(
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsContent(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildIcs(application: Application): string | null {
  const event = interviewEvent(application);
  if (!event) return null;

  return buildIcsCalendar([
    {
      uid: `${application.id}@azubitracker`,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
    },
  ]);
}

export function downloadIcs(application: Application): void {
  const ics = buildIcs(application);
  if (!ics) return;

  const name = (application.unternehmen || application.id)
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 60);
  downloadIcsContent(`gespraech-${name}.ics`, ics);
}

/** Download every entry of a month as one `.ics` file. */
export function downloadEntriesIcs(entries: CalendarEntry[], label: string): void {
  if (entries.length === 0) return;

  const events: IcsEvent[] = entries.map((entry) => ({
    uid: `${entry.key}@azubitracker`,
    title: entryTitle(entry),
    description: eventDescription(entry.application),
    location: entry.application.standort || "",
    start: entry.date,
    end:
      entry.kind === "interview"
        ? new Date(entry.date.getTime() + EVENT_DURATION_MS)
        : entry.date,
    allDay: entry.kind === "follow_up",
  }));

  downloadIcsContent(
    `termine-${label.replace(/[^\w]+/g, "-").toLowerCase()}.ics`,
    buildIcsCalendar(events, `AusbildungTracker – ${label}`),
  );
}
