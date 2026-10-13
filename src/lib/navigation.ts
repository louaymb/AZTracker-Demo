import {
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  List,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Übersicht",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Statistiken und anstehende Aufgaben",
  },
  {
    title: "Kanban-Board",
    href: "/board",
    icon: KanbanSquare,
    description: "Bewerbungen per Drag & Drop verschieben",
  },
  {
    title: "Bewerbungen",
    href: "/applications",
    icon: List,
    description: "Tabellenansicht mit Filtern",
  },
  {
    title: "Kalender",
    href: "/calendar",
    icon: CalendarDays,
    description: "Gesprächstermine im Monatsüberblick",
  },
  {
    title: "Einstellungen",
    href: "/settings",
    icon: Settings,
    description: "Gmail verbinden und Synchronisierung",
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

/**
 * Detail pages are served from a static route (`/applications/detail`) because
 * the app is exported statically; the id travels as a query parameter.
 */
export function applicationHref(id: string): string {
  return `/applications/detail?id=${encodeURIComponent(id)}`;
}
