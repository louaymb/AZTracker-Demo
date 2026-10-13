"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateReplyDraft, sendReply } from "@/lib/firebase/functions";
import type { EmailIntent } from "@/types";

interface ReplyDialogProps {
  applicationId: string;
  threadId?: string;
  defaultSubject?: string;
  intent?: EmailIntent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

function isSendPermissionError(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") return false;
  const message = String((cause as { message?: unknown }).message ?? "");
  return /berechtigung/i.test(message);
}

export function ReplyDialog({
  applicationId,
  threadId,
  defaultSubject,
  intent = "reply",
  open,
  onOpenChange,
}: ReplyDialogProps) {
  const isFollowUp = intent === "follow_up";
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (open) {
      setTo("");
      setSubject(defaultSubject ?? "");
      setBody("");
      setPermissionError(false);
    }
  }, [open, defaultSubject]);

  const canSend =
    to.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    !sending &&
    !generating;

  async function handleGenerate() {
    setGenerating(true);
    setPermissionError(false);
    try {
      const draft = await generateReplyDraft(applicationId, threadId, intent);
      setTo(draft.to);
      setSubject(draft.subject || defaultSubject || "");
      setBody(draft.body);
    } catch (cause) {
      toast.error(
        errorMessage(
          cause,
          isFollowUp
            ? "KI-Nachfrage konnte nicht generiert werden."
            : "KI-Antwort konnte nicht generiert werden.",
        ),
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setPermissionError(false);
    try {
      await sendReply({
        applicationId,
        threadId: threadId ?? "",
        to: to.trim(),
        subject: subject.trim(),
        body,
        intent,
      });
      toast.success(isFollowUp ? "Nachfrage gesendet" : "Antwort gesendet");
      onOpenChange(false);
    } catch (cause) {
      if (isSendPermissionError(cause)) setPermissionError(true);
      toast.error(
        errorMessage(
          cause,
          isFollowUp
            ? "Nachfrage konnte nicht gesendet werden."
            : "Antwort konnte nicht gesendet werden.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>
            {isFollowUp ? "Nachfassen" : "Antwort verfassen"}
          </DialogTitle>
          <DialogDescription>
            {isFollowUp
              ? "Formuliere eine freundliche Nachfrage zum Stand der Bewerbung und sende sie über Gmail."
              : "Entwirf eine Antwort auf die verknüpfte E-Mail und sende sie direkt über Gmail."}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="min-h-0 flex-1 gap-4 overflow-y-auto pr-1">
          <Field>
            <FieldLabel htmlFor="reply-to">Empfänger</FieldLabel>
            <Input
              id="reply-to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder={
                isFollowUp
                  ? "E-Mail-Adresse des Ansprechpartners"
                  : "Wird beim Generieren ermittelt"
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="reply-subject">Betreff</FieldLabel>
            <Input
              id="reply-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={isFollowUp ? "Nachfassen: …" : "Re: …"}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="reply-body">Nachricht</FieldLabel>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              className="min-h-[200px]"
              placeholder={isFollowUp ? "Schreibe deine Nachfrage …" : "Schreibe deine Antwort …"}
            />
            <FieldDescription>
              {isFollowUp
                ? "Lass die Nachfrage von der KI formulieren und passe sie anschließend an."
                : "Lass die Antwort von der KI formulieren und passe sie anschließend an."}
            </FieldDescription>
          </Field>

          {permissionError ? (
            <p className="text-sm text-destructive">
              Zum Senden fehlt die Berechtigung. Bitte verbinde Gmail in den{" "}
              <Link
                href="/settings"
                className="font-medium underline underline-offset-4"
              >
                Einstellungen
              </Link>{" "}
              erneut.
            </p>
          ) : null}
        </FieldGroup>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => void handleGenerate()}
            disabled={generating || sending}
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isFollowUp ? "KI-Nachfrage generieren" : "KI-Antwort generieren"}
          </Button>
          <Button
            type="button"
            className="h-10 w-full sm:h-8 sm:w-auto"
            onClick={() => void handleSend()}
            disabled={!canSend}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
