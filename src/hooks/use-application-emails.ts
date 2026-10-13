"use client";

import { useEffect, useState } from "react";

import { subscribeApplicationEmails } from "@/lib/firebase/applications";
import type { ApplicationEmail } from "@/types";

export interface UseApplicationEmailsResult {
  emails: ApplicationEmail[];
  loading: boolean;
  error: string | null;
}

/** Real-time subscription to the Gmail mails linked to one application. */
export function useApplicationEmails(
  applicationId: string,
): UseApplicationEmailsResult {
  const [emails, setEmails] = useState<ApplicationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setEmails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeApplicationEmails(
      applicationId,
      (data) => {
        setEmails(data);
        setLoading(false);
        setError(null);
      },
      (cause) => {
        setError(cause.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [applicationId]);

  return { emails, loading, error };
}
