"use client";

import { DEMO_MODE } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/user";
import * as firestore from "./user.firestore";

export const updateUserSettings: typeof firestore.updateUserSettings = DEMO_MODE
  ? demo.updateUserSettings
  : firestore.updateUserSettings;
