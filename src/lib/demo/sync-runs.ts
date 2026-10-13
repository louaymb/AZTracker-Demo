"use client";

import type { Unsubscribe } from "firebase/firestore";

import type { SyncRun } from "@/types";
import { getState, subscribe } from "./store";

export function subscribeSyncRuns(
  onData: (runs: SyncRun[]) => void,
  onError?: (error: Error) => void,
  max = 10,
): Unsubscribe {
  const emit = () => {
    try {
      onData([...getState().syncRuns].slice(0, max));
    } catch (cause) {
      onError?.(cause as Error);
    }
  };
  const unsubscribe = subscribe(emit);
  emit();
  return unsubscribe;
}
