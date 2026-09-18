import type {
  Application,
  ApplicationSource,
  ApplicationStatus,
  ApplicationType,
  EmploymentType,
} from "@/types";

/** Kanban / pipeline order. */
export const STATUS_ORDER: ApplicationStatus[] = [
  "entwurf",
  "beworben",
  "warte_auf_antwort",
  "einladung",
  "vorstellungsgespraech",
  "absage",
  "zusage",
  "abgebrochen",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  entwurf: "Entwurf",
  beworben: "Beworben",
  warte_auf_antwort: "Warte auf Antwort",
  einladung: "Einladung",
  vorstellungsgespraech: "Vorstellungsgespräch",
  absage: "Absage",
  zusage: "Zusage",
  abgebrochen: "Abgebrochen",
};

export const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
  entwurf: "Noch nicht abgeschickt.",
  beworben: "Bewerbung ist raus.",
  warte_auf_antwort: "Rückmeldung steht aus.",
  einladung: "Einladung zum Gespräch oder Test erhalten.",
  vorstellungsgespraech: "Gespräch findet statt oder fand statt.",
  absage: "Abgelehnt – abgeschlossen.",
  zusage: "Zusage erhalten – geschafft!",
  abgebrochen: "Von mir abgebrochen oder zurückgezogen.",
};

/** Tailwind classes for status pills. */
export const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  entwurf: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  beworben: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  warte_auf_antwort:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  einladung:
    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  vorstellungsgespraech:
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  absage: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  zusage:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  abgebrochen:
    "bg-zinc-500/10 text-zinc-500 line-through border-zinc-500/20 dark:text-zinc-400",
};

/** Solid accent colours used on the Kanban board. */
export const STATUS_ACCENT_CLASS: Record<ApplicationStatus, string> = {
  entwurf: "bg-zinc-400",
  beworben: "bg-blue-500",
  warte_auf_antwort: "bg-amber-500",
  einladung: "bg-violet-500",
  vorstellungsgespraech: "bg-purple-500",
  absage: "bg-red-500",
  zusage: "bg-emerald-500",
  abgebrochen: "bg-zinc-400",
};

/** Statuses that close an application – they do not need follow-ups. */
export const TERMINAL_STATUSES: ApplicationStatus[] = [
  "absage",
  "zusage",
  "abgebrochen",
];

/** Statuses that are considered "in progress". */
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "beworben",
  "warte_auf_antwort",
  "einladung",
  "vorstellungsgespraech",
];

export const SOURCE_LABELS: Record<ApplicationSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  unternehmenswebsite: "Unternehmenswebsite",
  stepstone: "StepStone",
  xing: "Xing",
  ausbildungsportal: "Ausbildungsportal",
  empfehlung: "Empfehlung",
  sonstiges: "Sonstiges",
};

export const SOURCE_OPTIONS: { value: ApplicationSource; label: string }[] = (
  Object.keys(SOURCE_LABELS) as ApplicationSource[]
).map((value) => ({ value, label: SOURCE_LABELS[value] }));

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] =
  STATUS_ORDER.map((value) => ({ value, label: STATUS_LABELS[value] }));

export const NO_VALUE = "–";

export const APPLICATION_TYPES: ApplicationType[] = ["ausbildung", "job"];

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  ausbildung: "Ausbildung",
  job: "Job",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  ausbildung: "Ausbildung",
  duales_studium: "Duales Studium",
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  minijob: "Minijob",
  werkstudent: "Werkstudent",
  praktikum: "Praktikum",
  aushilfe: "Aushilfe",
  sonstiges: "Sonstiges",
};

export const EMPLOYMENT_TYPES: EmploymentType[] = [
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

export const EMPLOYMENT_TYPE_OPTIONS: {
  value: EmploymentType;
  label: string;
}[] = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABELS[value],
}));

export interface ModeConfig {
  type: ApplicationType;
  /** Plural label used in the switcher and navigation. */
  title: string;
  singular: string;
  /** Label for the `ausbildungsberuf` field in this mode. */
  roleLabel: string;
  rolePlaceholder: string;
  companyPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  dashboardDescription: string;
  boardDescription: string;
  applicationsDescription: string;
  defaultEmploymentType: EmploymentType;
}

export const MODE_CONFIG: Record<ApplicationType, ModeConfig> = {
  ausbildung: {
    type: "ausbildung",
    title: "Ausbildungen",
    singular: "Ausbildung",
    roleLabel: "Ausbildungsberuf",
    rolePlaceholder: "z. B. Fachinformatiker für Systemintegration",
    companyPlaceholder: "z. B. Beispiel GmbH",
    emptyTitle: "Noch keine Ausbildungen",
    emptyDescription:
      "Verbinde Gmail unter den Einstellungen oder lege deine erste Ausbildung manuell an.",
    dashboardDescription:
      "Statistiken, anstehende Gespräche und Ausbildungen, die Aufmerksamkeit brauchen.",
    boardDescription: "Ausbildungen per Drag & Drop zwischen Status verschieben.",
    applicationsDescription:
      "Alle Ausbildungen in der Tabellenansicht mit Filtern.",
    defaultEmploymentType: "ausbildung",
  },
  job: {
    type: "job",
    title: "Jobs",
    singular: "Job",
    roleLabel: "Position",
    rolePlaceholder: "z. B. Verkäufer Teilzeit",
    companyPlaceholder: "z. B. Beispiel GmbH",
    emptyTitle: "Noch keine Jobs",
    emptyDescription:
      "Verbinde Gmail unter den Einstellungen oder lege deinen ersten Job manuell an.",
    dashboardDescription:
      "Statistiken, Termine und Jobs (Teilzeit, Minijob …), die Aufmerksamkeit brauchen.",
    boardDescription: "Jobs per Drag & Drop zwischen Status verschieben.",
    applicationsDescription: "Alle Jobs in der Tabellenansicht mit Filtern.",
    defaultEmploymentType: "teilzeit",
  },
};

export function modeConfig(type: ApplicationType): ModeConfig {
  return MODE_CONFIG[type];
}

/**
 * Canonical role used for grouping/filtering, so differently worded titles of
 * the same occupation end up in one bucket.
 */
export function roleCategoryOf(
  application: Pick<Application, "roleCategory" | "ausbildungsberuf">,
): string {
  return (
    application.roleCategory?.trim() ||
    application.ausbildungsberuf?.trim() ||
    ""
  );
}

export const APPLICATIONS_COLLECTION = "applications";
export const EMAILS_SUBCOLLECTION = "emails";
export const USERS_COLLECTION = "users";
export const SYNC_RUNS_COLLECTION = "syncRuns";
export const ACCESS_DOC_PATH = "settings/access";
