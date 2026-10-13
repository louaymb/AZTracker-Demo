"use client";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { ACCESS_DOC_PATH, USERS_COLLECTION } from "@/lib/constants";
import { auth, db, googleProvider } from "./client";

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * The first account that ever signs in claims ownership of the app by creating
 * `settings/access`. Every later sign-in is verified against that document, so
 * only the owner can read or write any data.
 *
 * Returns `true` when `uid` is the owner.
 */
export async function claimOwnership(uid: string): Promise<boolean> {
  const accessRef = doc(db, ACCESS_DOC_PATH);

  try {
    const snapshot = await getDoc(accessRef);
    if (snapshot.exists()) {
      return snapshot.data().ownerUid === uid;
    }
  } catch {
    // No read permission → the app already belongs to somebody else.
    return false;
  }

  try {
    await setDoc(accessRef, { ownerUid: uid, claimedAt: serverTimestamp() });
    return true;
  } catch {
    // Lost a race against another session – re-check.
    try {
      const snapshot = await getDoc(accessRef);
      return snapshot.exists() && snapshot.data().ownerUid === uid;
    } catch {
      return false;
    }
  }
}

const DEFAULT_SETTINGS = {
  needsAttentionAfterDays: 14,
  followUpRemindersEnabled: true,
  defaultFollowUpDays: 7,
};

export async function ensureUserProfile(user: User): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      gmailConnected: false,
      gmailEmail: "",
      lastSyncAt: null,
      settings: DEFAULT_SETTINGS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(
    userRef,
    {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export type AuthStateChange = (user: User | null) => void;

export function onAuthChanged(callback: AuthStateChange): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
