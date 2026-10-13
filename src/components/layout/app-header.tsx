"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNavItem } from "@/lib/navigation";
import { useCommandPalette } from "./command-palette";
import { ModeSwitcher } from "./mode-switcher";
import { SyncButton } from "./sync-button";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const pathname = usePathname();
  const navItem = findNavItem(pathname);
  const { open } = useCommandPalette();

  return (
    <header className="sticky top-0 z-20 flex h-14 min-w-0 shrink-0 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-2 sm:px-3">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="!h-4 shrink-0" />
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
        {navItem?.title ?? "AusbildungTracker"}
      </h1>
      <ModeSwitcher size="sm" />

      <div className="ml-auto flex min-w-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={open}
          aria-label="Befehlspalette öffnen"
          className="text-muted-foreground"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="hidden lg:inline">Suchen</span>
          <kbd className="ml-1 hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline">
            ⌘K
          </kbd>
        </Button>
        <SyncButton variant="ghost" label="Sync" hideLabelOnMobile />
        <ThemeToggle />
      </div>
    </header>
  );
}
