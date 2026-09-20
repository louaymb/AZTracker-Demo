"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
import { DemoBanner } from "@/components/layout/demo-banner";
import { useAuth } from "@/components/providers/auth-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DEMO_MODE } from "@/lib/demo/flag";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <GraduationCap className="size-8" />
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Lade AusbildungTracker …
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <main
            className={cn(
              "min-w-0 flex-1 p-4 md:p-6",
              DEMO_MODE && "pb-16 md:pb-16",
            )}
          >
            {children}
          </main>
        </SidebarInset>
        {DEMO_MODE ? <DemoBanner /> : null}
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
