"use client";

import { DEMO_MODE } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/storage";
import * as firestore from "./storage.firestore";

export const uploadAttachment: typeof firestore.uploadAttachment = DEMO_MODE
  ? demo.uploadAttachment
  : firestore.uploadAttachment;

export const deleteAttachment: typeof firestore.deleteAttachment = DEMO_MODE
  ? demo.deleteAttachment
  : firestore.deleteAttachment;
