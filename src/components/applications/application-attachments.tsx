"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { deleteAttachment, uploadAttachment } from "@/lib/firebase/storage";
import { formatDate } from "@/lib/format";
import type { Application, ApplicationAttachment } from "@/types";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.odt,.rtf,.txt,.jpg,.jpeg,.png";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

interface ApplicationAttachmentsProps {
  application: Application;
}

export function ApplicationAttachments({
  application,
}: ApplicationAttachmentsProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const attachments = application.attachments ?? [];

  async function handleFiles(files: FileList | null) {
    if (!user || !files?.length) return;
    const file = files[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Die Datei ist zu groß (maximal 15 MB).");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await uploadAttachment(user.uid, application.id, file);
      toast.success("Anhang hochgeladen");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Upload fehlgeschlagen.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(attachment: ApplicationAttachment) {
    setDeletingId(attachment.id);
    try {
      await deleteAttachment(application.id, attachment);
      toast.success("Anhang gelöscht");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Löschen fehlgeschlagen.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">Anhänge</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full sm:h-8 sm:w-auto"
          disabled={uploading || !user}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Wird hochgeladen …" : "Datei auswählen"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          disabled={uploading}
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {uploading ? (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      ) : null}

      {attachments.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Noch keine Anhänge. PDF, Word, ODT, RTF, TXT oder Bilder bis 15 MB.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium">
                  {attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.size)}
                  {attachment.uploadedAt
                    ? ` · ${formatDate(attachment.uploadedAt)}`
                    : ""}
                </p>
              </div>
              <Button asChild variant="ghost" size="icon-sm">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${attachment.name} herunterladen`}
                >
                  <Download className="size-4" />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={deletingId === attachment.id}
                onClick={() => void handleDelete(attachment)}
                aria-label={`${attachment.name} löschen`}
              >
                {deletingId === attachment.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
