"use client";

import { Timestamp } from "firebase/firestore";

import type {
  Application,
  ApplicationEmail,
  SyncRun,
  UserSettings,
} from "@/types";
import {
  DEMO_APPLICATIONS,
  DEMO_EMAILS,
  DEMO_SETTINGS,
  DEMO_SYNC_RUNS,
} from "./fixtures";

export interface DemoState {
  applications: Application[];
  emails: ApplicationEmail[];
  settings: UserSettings;
  syncRuns: SyncRun[];
}

const STORAGE_KEY = "azubitracker:demo:v1";

let state: DemoState | null = null;
let idCounter = 0;

const listeners = new Set<() => void>();

export function nextId(prefix = "demo"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function createSeedState(): DemoState {
  return {
    applications: [...DEMO_APPLICATIONS],
    emails: [...DEMO_EMAILS],
    settings: { ...DEMO_SETTINGS },
    syncRuns: [...DEMO_SYNC_RUNS],
  };
}

function reviveTimestamp(value: unknown): Timestamp | null {
  if (
    value &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "firestore/timestamp/1.0"
  ) {
    const { seconds, nanoseconds } = value as {
      seconds: number;
      nanoseconds: number;
    };
    return new Timestamp(seconds, nanoseconds);
  }
  return null;
}

function deserialize(raw: string): DemoState {
  return JSON.parse(raw, (_key, value) => reviveTimestamp(value) ?? value) as DemoState;
}

function persist(next: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage disabled – the in-memory state still works.
  }
}

function loadState(): DemoState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return deserialize(raw);
  } catch {
    // Corrupt payload – fall back to a fresh seed.
  }
  const seeded = createSeedState();
  persist(seeded);
  return seeded;
}

function ensureState(): DemoState {
  if (!state) state = loadState();
  return state;
}

export function getState(): DemoState {
  return ensureState();
}

export function subscribe(listener: () => void): () => void {
  ensureState();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function update(mutator: (draft: DemoState) => void): void {
  const current = ensureState();
  mutator(current);
  state = current;
  persist(current);
  notify();
}

export function resetDemo(): void {
  state = createSeedState();
  persist(state);
  notify();
}
