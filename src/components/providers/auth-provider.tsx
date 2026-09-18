"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot, Timestamp, type Unsubscribe } from "firebase/firestore";

import { USERS_COLLECTION } from "@/lib/constants";
import { DEMO_EMAIL, DEMO_MODE, DEMO_USER } from "@/lib/demo/flag";
import { DEMO_SETTINGS } from "@/lib/demo/fixtures";
import { getState, subscribe as subscribeDemoStore } from "@/lib/demo/store";
import {
  claimOwnership,
  ensureUserProfile,
  onAuthChanged,
  signInWithGoogle,
  signOutUser,
} from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/types";

const DEMO_PROFILE: UserProfile = {
  uid: DEMO_USER.uid,
  email: DEMO_USER.email,
  displayName: DEMO_USER.displayName,
  photoURL: "",
  gmailConnected: true,
  gmailEmail: DEMO_EMAIL,
  lastSyncAt: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)),
  settings: { ...DEMO_SETTINGS },
  createdAt: Timestamp.fromDate(new Date()),
  updatedAt: Timestamp.fromDate(new Date()),
};

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  unauthorized: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      setUser(DEMO_USER as unknown as User);
      setProfile({ ...DEMO_PROFILE, settings: { ...getState().settings } });
      setLoading(false);

      const unsubscribeDemo = subscribeDemoStore(() => {
        setProfile((previous) =>
          previous
            ? { ...previous, settings: { ...getState().settings } }
            : previous,
        );
      });

      return unsubscribeDemo;
    }

    profileUnsubRef.current?.();
    profileUnsubRef.current = null;

    const unsubscribe = onAuthChanged(async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const isOwner = await claimOwnership(nextUser.uid);

        if (!isOwner) {
          setUnauthorized(true);
          setError(
            "Dieses Konto ist nicht für AusbildungTracker freigegeben.",
          );
          await signOutUser();
          return;
        }

        setUnauthorized(false);
        setError(null);
        await ensureUserProfile(nextUser);
        setUser(nextUser);

        profileUnsubRef.current = onSnapshot(
          doc(db, USERS_COLLECTION, nextUser.uid),
          (snapshot) => {
            setProfile(
              snapshot.exists()
                ? ({ ...(snapshot.data() as UserProfile), uid: snapshot.id })
                : null,
            );
          },
          () => setProfile(null),
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
        );
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      profileUnsubRef.current?.();
      profileUnsubRef.current = null;
    };
  }, []);

  const signIn = useCallback(async () => {
    if (DEMO_MODE) return;
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Anmeldung fehlgeschlagen.";
      // Popup closed by the user is not a real error.
      if (!message.includes("popup-closed-by-user")) {
        setError(message);
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (DEMO_MODE) return;
    await signOutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signingIn,
      unauthorized,
      error,
      signIn,
      signOut,
    }),
    [user, profile, loading, signingIn, unauthorized, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden.");
  }
  return context;
}
