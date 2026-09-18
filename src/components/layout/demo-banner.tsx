"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resetDemo } from "@/lib/demo/store";

export function DemoBanner() {
  function handleReset() {
    resetDemo();
    toast.success("Demo-Daten wurden zurückgesetzt");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 w-full max-w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex w-full max-w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-xs text-muted-foreground md:px-6">
        <TriangleAlert className="size-3.5 shrink-0 text-amber-500" />
        <p className="min-w-0 max-w-full flex-1 break-words">
          Demo-Modus — Beispieldaten, keine echten Bewerbungen, kein
          Gmail-Zugriff.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 gap-1.5 px-2 text-xs"
          onClick={handleReset}
        >
          <RotateCcw className="size-3.5" />
          Zurücksetzen
        </Button>
      </div>
    </div>
  );
}
