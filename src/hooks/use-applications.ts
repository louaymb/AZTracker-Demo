"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { subscribeApplications } from "@/lib/firebase/applications";
import type { Application } from "@/types";

export interface UseApplicationsResult {
  applications: Application[];
  loading: boolean;
  error: string | null;
}

/** Real-time subscription to all of the user's applications. */
export function useApplications(): UseApplicationsResult {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeApplications(
      (data) => {
        setApplications(data);
        setLoading(false);
        setError(null);
      },
      (cause) => {
        setError(cause.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  return { applications, loading, error };
}
