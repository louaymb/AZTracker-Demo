import { STATUS_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Application, ApplicationSource, ApplicationStatus } from "@/types";

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, '""');
  return /[",;\n]/.test(text) ? `"${text}"` : text;
}

const COLUMNS: { header: string; value: (a: Application) => unknown }[] = [
  { header: "Ausbildungsberuf", value: (a) => a.ausbildungsberuf },
  { header: "Unternehmen", value: (a) => a.unternehmen },
  { header: "Standort", value: (a) => a.standort },
  { header: "Status", value: (a) => STATUS_LABELS[a.status as ApplicationStatus] ?? a.status },
  { header: "Bewerbungsdatum", value: (a) => formatDate(a.bewerbungsdatum, "") },
  { header: "Quelle", value: (a) => SOURCE_LABELS[a.quelle as ApplicationSource] ?? a.quelle },
  { header: "Ansprechpartner", value: (a) => a.ansprechpartner },
  { header: "Stellenlink", value: (a) => a.stellenlink },
  { header: "E-Mails", value: (a) => a.gmailThreadIds?.length ?? 0 },
  { header: "Letzte E-Mail", value: (a) => formatDate(a.lastEmailAt, "") },
  { header: "Wiedervorlage", value: (a) => formatDate(a.followUpAt, "") },
  { header: "Erstellt am", value: (a) => formatDate(a.createdAt, "") },
  { header: "Aktualisiert am", value: (a) => formatDate(a.updatedAt, "") },
  { header: "Notizen", value: (a) => a.notizen },
];

export function applicationsToCsv(applications: Application[]): string {
  const header = COLUMNS.map((c) => escapeCsvValue(c.header)).join(";");
  const rows = applications.map((application) =>
    COLUMNS.map((column) => escapeCsvValue(column.value(application))).join(";"),
  );
  // Excel needs a BOM to detect UTF-8 (umlauts).
  return "\uFEFF" + [header, ...rows].join("\r\n");
}

export function downloadCsv(applications: Application[], fileName?: string): void {
  const csv = applicationsToCsv(applications);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    fileName ??
    `bewerbungen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
