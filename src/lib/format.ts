import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
} from "date-fns";
import { de } from "date-fns/locale";
import type { Timestamp } from "firebase/firestore";

/** Anything we might get back for a date field. */
export type DateLike = Date | Timestamp | string | number | null | undefined;

/** Normalise Firestore Timestamps / strings / numbers into a `Date`. */
export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const d = value.toDate();
    return isValid(d) ? d : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(d) ? d : null;
  }
  return null;
}

export function formatDate(value: DateLike, fallback = "–"): string {
  const date = toDate(value);
  return date ? format(date, "dd.MM.yyyy", { locale: de }) : fallback;
}

export function formatDateTime(value: DateLike, fallback = "–"): string {
  const date = toDate(value);
  return date ? format(date, "dd.MM.yyyy, HH:mm 'Uhr'", { locale: de }) : fallback;
}

export function formatShortDate(value: DateLike, fallback = "–"): string {
  const date = toDate(value);
  return date ? format(date, "dd.MM.yy", { locale: de }) : fallback;
}

/** "vor 3 Tagen", "in 2 Tagen" … */
export function formatRelative(value: DateLike, fallback = "–"): string {
  const date = toDate(value);
  if (!date) return fallback;
  return formatDistanceToNow(date, { addSuffix: true, locale: de });
}

/** Whole calendar days between `value` and now. Negative = in the future. */
export function daysSince(value: DateLike): number | null {
  const date = toDate(value);
  if (!date) return null;
  return differenceInCalendarDays(new Date(), date);
}

export function daysUntil(value: DateLike): number | null {
  const days = daysSince(value);
  return days === null ? null : -days;
}

/** Value for `<input type="date">`. */
export function toDateInputValue(value: DateLike): string {
  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}

/** Parse the value of an `<input type="date">` (local time, no timezone drift). */
export function fromDateInputValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Value for `<input type="datetime-local">`. */
export function toDateTimeInputValue(value: DateLike): string {
  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

/** Parse the value of an `<input type="datetime-local">` (local time). */
export function fromDateTimeInputValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function sortByDateDesc<T>(
  items: T[],
  getValue: (item: T) => DateLike,
): T[] {
  return [...items].sort((a, b) => {
    const aDate = toDate(getValue(a))?.getTime() ?? 0;
    const bDate = toDate(getValue(b))?.getTime() ?? 0;
    return bDate - aDate;
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
