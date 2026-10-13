"use client";

import type { UserSettings } from "@/types";
import { update } from "./store";

export async function updateUserSettings(
  _uid: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const patch: Partial<UserSettings> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      (patch as Record<string, unknown>)[key] = value;
    }
  }

  update((draft) => {
    draft.settings = { ...draft.settings, ...patch };
  });
}
