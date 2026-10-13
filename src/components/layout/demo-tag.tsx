"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEMO_MODE } from "@/lib/demo/flag";
import { resetDemo } from "@/lib/demo/store";

export function DemoTag() {
  if (!DEMO_MODE) return null;

  function handleReset() {
    resetDemo();
    toast.success("Demo-Daten wurden zurückgesetzt");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Demo-Version: Informationen anzeigen"
          className="fixed right-3 bottom-3 z-50 flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur transition-colors hover:bg-amber-500/25 dark:text-amber-300"
        >
          <TriangleAlert className="size-3.5" />
          DEMO
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-72 space-y-3 text-sm">
        <div className="space-y-1">
          <p className="font-semibold">Demo-Version</p>
          <p className="text-muted-foreground">
            Dies ist eine Demo der Hauptanwendung AusbildungTracker mit
            erfundenen Beispieldaten. Es gibt keine echten Bewerbungen und
            keinen Gmail-Zugriff. Änderungen bleiben nur in diesem Browser.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={handleReset}
        >
          <RotateCcw className="size-3.5" />
          Demo-Daten zurücksetzen
        </Button>
      </PopoverContent>
    </Popover>
  );
}
