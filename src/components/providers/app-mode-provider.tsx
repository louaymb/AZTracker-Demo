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

import { modeConfig, type ModeConfig } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo/flag";
import type { ApplicationType } from "@/types";

const STORAGE_KEY = "azubitracker:mode";

interface AppModeContextValue {
  /** Which world the UI currently shows: Ausbildungen or Jobs. */
  mode: ApplicationType;
  setMode: (mode: ApplicationType) => void;
  /** Mode aware labels (role label, descriptions, …). */
  labels: ModeConfig;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ApplicationType>("ausbildung");

  useEffect(() => {
    // The public demo only shows Ausbildungen.
    if (DEMO_MODE) return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ausbildung" || stored === "job") {
      setModeState(stored);
    }
  }, []);

  const setMode = useCallback((next: ApplicationType) => {
    if (DEMO_MODE) return;

    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode) – the in-memory state is enough.
    }
  }, []);

  const effectiveMode: ApplicationType = DEMO_MODE ? "ausbildung" : mode;

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode: effectiveMode,
      setMode,
      labels: modeConfig(effectiveMode),
    }),
    [effectiveMode, setMode],
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode muss innerhalb von <AppModeProvider> verwendet werden.");
  }
  return context;
}
