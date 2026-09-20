"use client";

import { DEMO_MODE } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/sync-runs";
import * as firestore from "./sync-runs.firestore";

export const subscribeSyncRuns: typeof firestore.subscribeSyncRuns = DEMO_MODE
  ? demo.subscribeSyncRuns
  : firestore.subscribeSyncRuns;
