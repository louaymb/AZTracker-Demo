"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  KanbanSquare,
  LayoutDashboard,
  List,
  RefreshCw,
  RotateCcw,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { useAppMode } from "@/components/providers/app-mode-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useApplications } from "@/hooks/use-applications";
import { useGmailSync } from "@/hooks/use-sync";
import { STATUS_LABELS, roleCategoryOf } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo/flag";
import { applicationHref } from "@/lib/navigation";
import type { ApplicationType } from "@/types";

interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null);

const NAVIGATION_ITEMS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { title: "Kanban-Board", href: "/board", icon: KanbanSquare },
  { title: "Bewerbungen", href: "/applications", icon: List },
  { title: "Kalender", href: "/calendar", icon: CalendarDays },
  { title: "Einstellungen", href: "/settings", icon: Settings },
];

const MODE_ITEMS: {
  type: ApplicationType;
  label: string;
  icon: LucideIcon;
}[] = DEMO_MODE
  ? []
  : [
      {
        type: "ausbildung",
        label: "Zu Ausbildungen wechseln",
        icon: GraduationCap,
      },
      { type: "job", label: "Zu Jobs wechseln", icon: Briefcase },
    ];

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette muss innerhalb von <CommandPaletteProvider> verwendet werden.",
    );
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open: openPalette }),
    [openPalette],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { mode, setMode } = useAppMode();
  const { applications } = useApplications();
  const { run } = useGmailSync();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const results = useMemo(() => {
    return applications
      .filter((application) => {
        if (application.type !== mode) {
          return false;
        }
        if (!query) {
          return true;
        }
        return [
          application.unternehmen,
          roleCategoryOf(application),
          application.standort,
        ].some((field) => field.toLowerCase().includes(query));
      })
      .slice(0, 8);
  }, [applications, mode, query]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setSearch("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleSelect = useCallback(
    (action: () => void) => {
      handleOpenChange(false);
      action();
    },
    [handleOpenChange],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Befehlspalette"
      description="Suche nach Bewerbungen, Aktionen und Seiten."
    >
      <Command>
        <CommandInput
          placeholder="Suchen …"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading="Bewerbungen">
              {results.map((application) => (
                <CommandItem
                  key={application.id}
                  value={application.id}
                  className="min-w-0"
                  keywords={[
                    application.unternehmen,
                    roleCategoryOf(application),
                    application.standort,
                    STATUS_LABELS[application.status],
                  ]}
                  onSelect={() =>
                    handleSelect(() =>
                      router.push(applicationHref(application.id)),
                    )
                  }
                >
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      {application.unternehmen || "Ohne Unternehmen"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[
                        roleCategoryOf(application) || "Ohne Berufsbezeichnung",
                        application.standort,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <CommandShortcut className="shrink-0">
                    {STATUS_LABELS[application.status]}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator className="mx-0" />

          <CommandGroup heading="Aktionen">
            <CommandItem
              value="Jetzt synchronisieren"
              onSelect={() => handleSelect(() => void run())}
            >
              <RefreshCw className="size-4 shrink-0 text-muted-foreground" />
              Jetzt synchronisieren
            </CommandItem>
            <CommandItem
              value="Vollständige Synchronisation"
              onSelect={() =>
                handleSelect(() => void run({ fullSync: true }))
              }
            >
              <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
              Vollständige Synchronisation
            </CommandItem>
            {MODE_ITEMS.map(({ type, label, icon: Icon }) => (
              <CommandItem
                key={type}
                value={label}
                onSelect={() => handleSelect(() => setMode(type))}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="mx-0" />

          <CommandGroup heading="Navigation">
            {NAVIGATION_ITEMS.map(({ title, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={title}
                onSelect={() => handleSelect(() => router.push(href))}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
