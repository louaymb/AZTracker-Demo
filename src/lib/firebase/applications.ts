"use client";

import { DEMO_MODE } from "@/lib/demo/flag";
import * as demo from "@/lib/demo/applications";
import * as firestore from "./applications.firestore";

export const mapApplication: typeof firestore.mapApplication = DEMO_MODE
  ? demo.mapApplication
  : firestore.mapApplication;

export const mapEmail: typeof firestore.mapEmail = DEMO_MODE
  ? demo.mapEmail
  : firestore.mapEmail;

export const subscribeApplications: typeof firestore.subscribeApplications =
  DEMO_MODE ? demo.subscribeApplications : firestore.subscribeApplications;

export const subscribeApplication: typeof firestore.subscribeApplication =
  DEMO_MODE ? demo.subscribeApplication : firestore.subscribeApplication;

export const subscribeApplicationEmails: typeof firestore.subscribeApplicationEmails =
  DEMO_MODE ? demo.subscribeApplicationEmails : firestore.subscribeApplicationEmails;

export const getApplication: typeof firestore.getApplication = DEMO_MODE
  ? demo.getApplication
  : firestore.getApplication;

export const createApplication: typeof firestore.createApplication = DEMO_MODE
  ? demo.createApplication
  : firestore.createApplication;

export const updateApplication: typeof firestore.updateApplication = DEMO_MODE
  ? demo.updateApplication
  : firestore.updateApplication;

export const updateApplicationsStatus: typeof firestore.updateApplicationsStatus =
  DEMO_MODE ? demo.updateApplicationsStatus : firestore.updateApplicationsStatus;

export const deleteApplications: typeof firestore.deleteApplications = DEMO_MODE
  ? demo.deleteApplications
  : firestore.deleteApplications;

export const updateApplicationStatus: typeof firestore.updateApplicationStatus =
  DEMO_MODE ? demo.updateApplicationStatus : firestore.updateApplicationStatus;

export const deleteApplication: typeof firestore.deleteApplication = DEMO_MODE
  ? demo.deleteApplication
  : firestore.deleteApplication;
