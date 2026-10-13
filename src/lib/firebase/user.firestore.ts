"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { USERS_COLLECTION } from "@/lib/constants";
import type { UserSettings } from "@/types";
import { db } from "./client";

/**
 * Merges settings field-by-field (`settings.<key>`) so different cards can
 * update independent values without overwriting each other.
 */
export async function updateUserSettings(
  uid: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      payload[`settings.${key}`] = value;
    }
  }

  await updateDoc(doc(db, USERS_COLLECTION, uid), payload);
}
