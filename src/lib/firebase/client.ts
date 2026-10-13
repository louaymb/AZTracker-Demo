"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const configured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

export const firebaseApp = configured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : (null as unknown as FirebaseApp);

export const auth = configured
  ? getAuth(firebaseApp)
  : (null as unknown as Auth);

export const db = configured
  ? getFirestore(firebaseApp)
  : (null as unknown as Firestore);

export const storage = configured
  ? getStorage(firebaseApp)
  : (null as unknown as FirebaseStorage);

export const FUNCTIONS_REGION =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1";

export const functions = configured
  ? getFunctions(firebaseApp, FUNCTIONS_REGION)
  : (null as unknown as Functions);

/** Scope requested during sign-in so the user sees the Gmail consent upfront. */
export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope(GMAIL_READONLY_SCOPE);
googleProvider.setCustomParameters({
  prompt: "select_account",
  access_type: "offline",
});
