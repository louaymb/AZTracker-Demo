"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CONCURRENCY = 2;

export interface BulkRunState {
  running: boolean;
  label: string;
  total: number;
  completed: number;
  failed: number;
}

export interface BulkRunOptions {
  label: string;
  ids: string[];
  task: (id: string) => Promise<unknown>;
}

export interface BulkRunSummary {
  total: number;
  completed: number;
  failed: number;
  firstError: string | null;
  cancelled: boolean;
}

export interface UseBulkRunResult {
  state: BulkRunState;
  run: (options: BulkRunOptions) => Promise<BulkRunSummary | null>;
  cancel: () => void;
}

const IDLE_STATE: BulkRunState = {
  running: false,
  label: "",
  total: 0,
  completed: 0,
  failed: 0,
};

/**
 * Runs `task` for each id with a small fixed concurrency. Pending ids are not
 * picked up once the run is cancelled or the owning page unmounts, so no AI
 * request keeps spending tokens in the background.
 */
export function useBulkRun(): UseBulkRunResult {
  const [state, setState] = useState<BulkRunState>(IDLE_STATE);
  const runningRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const run = useCallback(async ({ label, ids, task }: BulkRunOptions) => {
    if (runningRef.current || ids.length === 0) return null;

    runningRef.current = true;
    cancelledRef.current = false;

    const queue = [...ids];
    let completed = 0;
    let failed = 0;
    let firstError: string | null = null;

    const publish = () => {
      setState({ running: true, label, total: ids.length, completed, failed });
    };
    publish();

    const worker = async () => {
      while (!cancelledRef.current) {
        const id = queue.shift();
        if (id === undefined) return;
        try {
          await task(id);
        } catch (cause) {
          failed += 1;
          if (firstError === null) {
            firstError =
              cause instanceof Error ? cause.message : "Unbekannter Fehler.";
          }
        }
        completed += 1;
        publish();
      }
    };

    try {
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker),
      );
    } finally {
      runningRef.current = false;
      setState(IDLE_STATE);
    }

    return {
      total: ids.length,
      completed,
      failed,
      firstError,
      cancelled: queue.length > 0,
    };
  }, []);

  return { state, run, cancel };
}
