"use client";

import type { ReactNode } from "react";

import { DemoIntroDialog } from "@/components/layout/demo-intro-dialog";
import { DemoTag } from "@/components/layout/demo-tag";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "./app-mode-provider";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppModeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <DemoTag />
            <DemoIntroDialog />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AppModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
