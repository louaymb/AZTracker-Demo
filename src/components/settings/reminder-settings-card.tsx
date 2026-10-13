"use client";

import { Controller, useForm } from "react-hook-form";
import { BellRing, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateUserSettings } from "@/lib/firebase/user";

interface ReminderFormValues {
  needsAttentionAfterDays: number;
  defaultFollowUpDays: number;
  followUpRemindersEnabled: boolean;
}

export function ReminderSettingsCard() {
  const { profile, user } = useAuth();

  const form = useForm<ReminderFormValues>({
    values: {
      needsAttentionAfterDays: profile?.settings?.needsAttentionAfterDays ?? 14,
      defaultFollowUpDays: profile?.settings?.defaultFollowUpDays ?? 7,
      followUpRemindersEnabled:
        profile?.settings?.followUpRemindersEnabled ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await updateUserSettings(user.uid, {
        needsAttentionAfterDays: Number(values.needsAttentionAfterDays) || 14,
        defaultFollowUpDays: Number(values.defaultFollowUpDays) || 7,
        followUpRemindersEnabled: values.followUpRemindersEnabled,
      });
      toast.success("Einstellungen gespeichert");
    } catch (cause) {
      toast.error("Einstellungen konnten nicht gespeichert werden.", {
        description:
          cause instanceof Error ? cause.message : "Unbekannter Fehler.",
      });
    }
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4" />
          Erinnerungen
        </CardTitle>
        <CardDescription>
          Lege fest, wann eine Bewerbung als vernachlässigt gilt und wie
          Wiedervorlagen berechnet werden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="needsAttentionAfterDays">
                Aufmerksamkeit nach Tagen
              </FieldLabel>
              <Input
                id="needsAttentionAfterDays"
                type="number"
                min={1}
                max={180}
                className="h-10 w-full sm:h-8"
                {...form.register("needsAttentionAfterDays", {
                  valueAsNumber: true,
                })}
              />
              <FieldDescription>
                Bewerbungen ohne Rückmeldung werden nach dieser Anzahl Tage in
                „Braucht Aufmerksamkeit“ angezeigt.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="defaultFollowUpDays">
                Wiedervorlage nach Tagen
              </FieldLabel>
              <Input
                id="defaultFollowUpDays"
                type="number"
                min={1}
                max={90}
                className="h-10 w-full sm:h-8"
                {...form.register("defaultFollowUpDays", { valueAsNumber: true })}
              />
              <FieldDescription>
                Standard-Zeitraum für eine Nachfass-Erinnerung bei neuen
                Bewerbungen.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal" className="gap-3">
              <div className="min-w-0 flex-1">
                <FieldLabel htmlFor="followUpRemindersEnabled">
                  Nachfass-Erinnerungen aktiviert
                </FieldLabel>
                <FieldDescription>
                  Zeigt fällige Wiedervorlagen auf dem Dashboard an.
                </FieldDescription>
              </div>
              <Controller
                control={form.control}
                name="followUpRemindersEnabled"
                render={({ field }) => (
                  <Switch
                    id="followUpRemindersEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="h-10 w-full sm:h-8 sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Speichern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
