"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { roleCategoryOf } from "@/lib/constants";
import { deleteApplication } from "@/lib/firebase/applications";
import type { Application } from "@/types";

interface ApplicationDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onDeleted?: (id: string) => void;
}

export function ApplicationDeleteDialog({
  open,
  onOpenChange,
  application,
  onDeleted,
}: ApplicationDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!application) return;
    setDeleting(true);
    try {
      await deleteApplication(application.id);
      toast.success("Bewerbung gelöscht");
      onDeleted?.(application.id);
      onOpenChange(false);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Löschen fehlgeschlagen.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bewerbung löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {application
              ? `Die Bewerbung bei ${application.unternehmen} (${roleCategoryOf(application)}) wird endgültig gelöscht. Das kann nicht rückgängig gemacht werden.`
              : "Diese Bewerbung wird endgültig gelöscht."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
