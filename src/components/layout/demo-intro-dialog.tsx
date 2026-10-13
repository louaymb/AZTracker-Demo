"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DEMO_MODE } from "@/lib/demo/flag";

const DISMISSED_KEY = "azubitracker:demo-intro-dismissed";

export function DemoIntroDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!DEMO_MODE) return;
    try {
      if (window.localStorage.getItem(DISMISSED_KEY) !== "true") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  if (!DEMO_MODE) return null;

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (dontShowAgain) {
        try {
          window.localStorage.setItem(DISMISSED_KEY, "true");
        } catch {
          // Storage unavailable – the dialog will simply show again next time.
        }
      }
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Willkommen zur Demo</DialogTitle>
          <DialogDescription className="pt-2">
            Das ist eine Demo der Hauptanwendung AusbildungTracker, mit der du
            Bewerbungen für Ausbildungen, duale Studienplätze und Jobs verfolgen
            kannst. Alle Daten sind erfunden. Es gibt keine echten Bewerbungen
            und keinen Gmail-Zugriff. Änderungen werden nur in diesem Browser
            gespeichert.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Checkbox
            id="demo-intro-dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label htmlFor="demo-intro-dont-show" className="font-normal">
            Nicht mehr anzeigen
          </Label>
        </div>
        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>Demo starten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
