"use client";

import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserSettings } from "@/lib/firebase/user";
import {
  BUNDESLAENDER,
  DEFAULT_BUNDESLAND,
  bundeslandLabel,
} from "@/lib/holidays";

export function CalendarSettingsCard() {
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);

  const bundesland = profile?.settings?.bundesland ?? DEFAULT_BUNDESLAND;

  async function handleChange(value: string) {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserSettings(user.uid, { bundesland: value });
      toast.success(`Feiertage für ${bundeslandLabel(value)} aktiviert`);
    } catch (cause) {
      toast.error("Einstellung konnte nicht gespeichert werden.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          Kalender &amp; Feiertage
        </CardTitle>
        <CardDescription>
          Wähle dein Bundesland, damit gesetzliche Feiertage im Kalender
          markiert werden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bundesland" className="flex items-center gap-2">
              Bundesland
              {saving ? <Loader2 className="size-3 animate-spin" /> : null}
            </FieldLabel>
            <Select
              value={bundesland}
              onValueChange={(value) => void handleChange(value)}
              disabled={saving}
            >
              <SelectTrigger id="bundesland" className="h-10 w-full sm:h-8">
                <SelectValue placeholder="Bundesland wählen" />
              </SelectTrigger>
              <SelectContent>
                {BUNDESLAENDER.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Feiertage werden im Kalender rot hervorgehoben.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
