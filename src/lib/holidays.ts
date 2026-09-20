import { getHolidays, type Region } from "feiertagejs";

export type Bundesland = Region;

export interface BundeslandOption {
  value: Region;
  label: string;
}

export const BUNDESLAENDER: BundeslandOption[] = [
  { value: "BW", label: "Baden-Württemberg" },
  { value: "BY", label: "Bayern" },
  { value: "BE", label: "Berlin" },
  { value: "BB", label: "Brandenburg" },
  { value: "HB", label: "Bremen" },
  { value: "HH", label: "Hamburg" },
  { value: "HE", label: "Hessen" },
  { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" },
  { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" },
  { value: "SL", label: "Saarland" },
  { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" },
  { value: "SH", label: "Schleswig-Holstein" },
  { value: "TH", label: "Thüringen" },
  { value: "BUND", label: "Deutschlandweit" },
];

export const DEFAULT_BUNDESLAND: Region = "NW";

export interface GermanHoliday {
  date: Date;
  name: string;
}

export function isBundesland(value: unknown): value is Region {
  return (
    typeof value === "string" &&
    BUNDESLAENDER.some((option) => option.value === value)
  );
}

export function bundeslandLabel(value: string | undefined): string {
  return (
    BUNDESLAENDER.find((option) => option.value === value)?.label ??
    BUNDESLAENDER.find((option) => option.value === DEFAULT_BUNDESLAND)!.label
  );
}

export function holidaysForYear(
  year: number,
  region: Region,
): GermanHoliday[] {
  return getHolidays(year, region).map((holiday) => ({
    date: holiday.date,
    name: holiday.translate("de") ?? holiday.name,
  }));
}

/** Holidays for several years, keyed by `yyyy-MM-dd` for fast day lookup. */
export function holidaysByDayKey(
  years: number[],
  region: Region,
): Map<string, GermanHoliday> {
  const map = new Map<string, GermanHoliday>();
  for (const year of years) {
    for (const holiday of holidaysForYear(year, region)) {
      const key = [
        holiday.date.getFullYear(),
        String(holiday.date.getMonth() + 1).padStart(2, "0"),
        String(holiday.date.getDate()).padStart(2, "0"),
      ].join("-");
      map.set(key, holiday);
    }
  }
  return map;
}

export function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
