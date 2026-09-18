"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_OPTIONS,
  MODE_CONFIG,
  STATUS_OPTIONS,
  STATUS_ORDER,
  SOURCE_OPTIONS,
  type ModeConfig,
} from "@/lib/constants";
import { createApplication, updateApplication } from "@/lib/firebase/applications";
import {
  fromDateInputValue,
  fromDateTimeInputValue,
  toDateInputValue,
  toDateTimeInputValue,
} from "@/lib/format";
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  ApplicationType,
  EmploymentType,
} from "@/types";

const NO_EMPLOYMENT_TYPE = "__none__";

const statusValues = STATUS_ORDER as [
  ApplicationStatus,
  ...ApplicationStatus[],
];

const typeValues = APPLICATION_TYPES as [
  ApplicationType,
  ...ApplicationType[],
];

const employmentTypeValues = EMPLOYMENT_TYPES as [
  EmploymentType,
  ...EmploymentType[],
];

const formSchema = z.object({
  type: z.enum(typeValues),
  ausbildungsberuf: z
    .string()
    .trim()
    .min(1, "Bitte einen Beruf bzw. eine Position angeben."),
  unternehmen: z.string().trim().min(1, "Bitte ein Unternehmen angeben."),
  standort: z.string().trim(),
  status: z.enum(statusValues),
  bewerbungsdatum: z.string(),
  quelle: z.string(),
  stellenlink: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
      message: "Bitte eine gültige URL angeben (mit http:// oder https://).",
    }),
  ansprechpartner: z.string().trim(),
  notizen: z.string(),
  followUpAt: z.string(),
  interviewAt: z.string(),
  employmentType: z.union([z.enum(employmentTypeValues), z.literal("")]),
});

type FormValues = z.infer<typeof formSchema>;

function toFormValues(
  application: Application | null | undefined,
  mode: ApplicationType,
  labels: ModeConfig,
): FormValues {
  return {
    type: application?.type ?? mode,
    ausbildungsberuf: application?.ausbildungsberuf ?? "",
    unternehmen: application?.unternehmen ?? "",
    standort: application?.standort ?? "",
    status: application?.status ?? "entwurf",
    bewerbungsdatum: toDateInputValue(application?.bewerbungsdatum ?? null),
    quelle: application?.quelle || "sonstiges",
    stellenlink: application?.stellenlink ?? "",
    ansprechpartner: application?.ansprechpartner ?? "",
    notizen: application?.notizen ?? "",
    followUpAt: toDateInputValue(application?.followUpAt ?? null),
    interviewAt: toDateTimeInputValue(application?.interviewAt ?? null),
    employmentType: application
      ? (application.employmentType ?? "")
      : labels.defaultEmploymentType,
  };
}

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application | null;
  onSaved?: (id: string) => void;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  onSaved,
}: ApplicationFormDialogProps) {
  const { user } = useAuth();
  const { mode, labels } = useAppMode();
  const isEdit = Boolean(application);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(application, mode, labels),
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(application, mode, labels));
    }
  }, [open, application, form, mode, labels]);

  const errors = form.formState.errors;

  const quelleOptions = useMemo(() => {
    const current = application?.quelle;
    if (current && !SOURCE_OPTIONS.some((option) => option.value === current)) {
      return [...SOURCE_OPTIONS, { value: current, label: current }];
    }
    return SOURCE_OPTIONS;
  }, [application]);

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast.error("Du musst angemeldet sein.");
      return;
    }

    const input: ApplicationInput = {
      type: values.type,
      ausbildungsberuf: values.ausbildungsberuf,
      unternehmen: values.unternehmen,
      standort: values.standort,
      status: values.status,
      bewerbungsdatum: fromDateInputValue(values.bewerbungsdatum),
      quelle: values.quelle,
      stellenlink: values.stellenlink,
      ansprechpartner: values.ansprechpartner,
      notizen: values.notizen,
      employmentType:
        values.employmentType === "" ? null : values.employmentType,
      followUpAt: fromDateInputValue(values.followUpAt),
      interviewAt: fromDateTimeInputValue(values.interviewAt),
    };

    try {
      if (application) {
        await updateApplication(application.id, input);
        toast.success("Bewerbung aktualisiert");
        onSaved?.(application.id);
      } else {
        const id = await createApplication(user.uid, input);
        toast.success("Bewerbung gespeichert");
        onSaved?.(id);
      }
      onOpenChange(false);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>
            {isEdit ? "Bewerbung bearbeiten" : "Neue Bewerbung"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Passe die Angaben zu dieser Bewerbung an."
              : `Erfasse eine neue Bewerbung für den Bereich ${labels.title}. Pflichtfelder sind markiert.`}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
        >
          <FieldGroup className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 sm:pr-2">
            <Field>
              <FieldLabel htmlFor="type">Bereich</FieldLabel>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next);
                      if (!isEdit) {
                        form.setValue(
                          "employmentType",
                          MODE_CONFIG[next as ApplicationType]
                            .defaultEmploymentType,
                        );
                      }
                    }}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Bereich wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_TYPES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {APPLICATION_TYPE_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={!!errors.ausbildungsberuf}>
              <FieldLabel htmlFor="ausbildungsberuf">
                {labels.roleLabel} *
              </FieldLabel>
              <Input
                id="ausbildungsberuf"
                placeholder={labels.rolePlaceholder}
                aria-invalid={!!errors.ausbildungsberuf}
                {...form.register("ausbildungsberuf")}
              />
              {errors.ausbildungsberuf ? (
                <FieldError errors={[errors.ausbildungsberuf]} />
              ) : null}
            </Field>

            <Field data-invalid={!!errors.unternehmen}>
              <FieldLabel htmlFor="unternehmen">Unternehmen *</FieldLabel>
              <Input
                id="unternehmen"
                placeholder={labels.companyPlaceholder}
                aria-invalid={!!errors.unternehmen}
                {...form.register("unternehmen")}
              />
              {errors.unternehmen ? (
                <FieldError errors={[errors.unternehmen]} />
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="employmentType">
                Beschäftigungsart
              </FieldLabel>
              <Controller
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_EMPLOYMENT_TYPE}
                    onValueChange={(next) =>
                      field.onChange(
                        next === NO_EMPLOYMENT_TYPE ? "" : next,
                      )
                    }
                  >
                    <SelectTrigger id="employmentType" className="w-full">
                      <SelectValue placeholder="Beschäftigungsart wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_EMPLOYMENT_TYPE}>
                        Keine Angabe
                      </SelectItem>
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="standort">Standort</FieldLabel>
              <Input
                id="standort"
                placeholder="z. B. Berlin"
                {...form.register("standort")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bewerbungsdatum">
                Bewerbungsdatum
              </FieldLabel>
              <Input
                id="bewerbungsdatum"
                type="date"
                {...form.register("bewerbungsdatum")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="followUpAt">Wiedervorlage</FieldLabel>
              <Input
                id="followUpAt"
                type="date"
                {...form.register("followUpAt")}
              />
              <FieldDescription>
                Optional: Wann solltest du nachhaken?
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="interviewAt">Gesprächstermin</FieldLabel>
              <Input
                id="interviewAt"
                type="datetime-local"
                {...form.register("interviewAt")}
              />
              <FieldDescription>
                Optional: Datum und Uhrzeit des Gesprächs.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="quelle">Quelle</FieldLabel>
              <Controller
                control={form.control}
                name="quelle"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="quelle" className="w-full">
                      <SelectValue placeholder="Quelle wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {quelleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ansprechpartner">
                Ansprechpartner
              </FieldLabel>
              <Input
                id="ansprechpartner"
                placeholder="z. B. Frau Müller"
                {...form.register("ansprechpartner")}
              />
            </Field>

            <Field
              className="sm:col-span-2"
              data-invalid={!!errors.stellenlink}
            >
              <FieldLabel htmlFor="stellenlink">Stellenlink</FieldLabel>
              <Input
                id="stellenlink"
                type="url"
                placeholder="https://…"
                aria-invalid={!!errors.stellenlink}
                {...form.register("stellenlink")}
              />
              {errors.stellenlink ? (
                <FieldError errors={[errors.stellenlink]} />
              ) : null}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="notizen">Notizen</FieldLabel>
              <Textarea
                id="notizen"
                rows={4}
                placeholder="Eigene Notizen zur Bewerbung …"
                {...form.register("notizen")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="shrink-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full sm:h-8 sm:w-auto"
              >
                Abbrechen
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-10 w-full sm:h-8 sm:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {isEdit ? "Speichern" : "Bewerbung anlegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
