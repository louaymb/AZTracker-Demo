"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ApplicationDetail } from "@/components/applications/application-detail";

function ApplicationDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  return <ApplicationDetail applicationId={id} />;
}

export default function ApplicationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Lade Bewerbung …
        </div>
      }
    >
      <ApplicationDetailContent />
    </Suspense>
  );
}
