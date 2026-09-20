"use client";

import { DEMO_MODE } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/functions";
import * as firestore from "./functions.firestore";

export type { SyncOptions } from "./functions.firestore";

export const triggerGmailSync: typeof firestore.triggerGmailSync = DEMO_MODE
  ? demo.triggerGmailSync
  : firestore.triggerGmailSync;

export const getGmailAuthUrl: typeof firestore.getGmailAuthUrl = DEMO_MODE
  ? demo.getGmailAuthUrl
  : firestore.getGmailAuthUrl;

export const disconnectGmail: typeof firestore.disconnectGmail = DEMO_MODE
  ? demo.disconnectGmail
  : firestore.disconnectGmail;

export const researchApplication: typeof firestore.researchApplication =
  DEMO_MODE ? demo.researchApplication : firestore.researchApplication;

export const generateReplyDraft: typeof firestore.generateReplyDraft =
  DEMO_MODE ? demo.generateReplyDraft : firestore.generateReplyDraft;

export const generateInterviewPrep: typeof firestore.generateInterviewPrep =
  DEMO_MODE ? demo.generateInterviewPrep : firestore.generateInterviewPrep;

export const sendReply: typeof firestore.sendReply = DEMO_MODE
  ? demo.sendReply
  : firestore.sendReply;
