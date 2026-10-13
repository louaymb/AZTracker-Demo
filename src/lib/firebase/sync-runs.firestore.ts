"use client";

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";

import { SYNC_RUNS_COLLECTION } from "@/lib/constants";
import { db } from "./client";
import type { SyncRun } from "@/types";

export function subscribeSyncRuns(
  onData: (runs: SyncRun[]) => void,
  onError?: (error: Error) => void,
  max = 10,
): Unsubscribe {
  const q = query(
    collection(db, SYNC_RUNS_COLLECTION),
    orderBy("startedAt", "desc"),
    limit(max),
  );

  return onSnapshot(
    q,
    (snapshot) =>
      onData(
        snapshot.docs.map((document) => ({
          ...(document.data() as Omit<SyncRun, "id">),
          id: document.id,
        })),
      ),
    (error) => onError?.(error),
  );
}
