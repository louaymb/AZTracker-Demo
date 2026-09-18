"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Euro,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { modeConfig } from "@/lib/constants";
import { researchApplication } from "@/lib/firebase/functions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";

interface ApplicationResearchCardProps {
  application: Application;
}

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

function FactItem({ icon: Icon, label, value, href }: Fact) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 space-y-0.5">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="text-sm break-words">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              {value}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}

export function ApplicationResearchCard({
  application,
}: ApplicationResearchCardProps) {
  const [loading, setLoading] = useState(false);
  const [jobDescriptionOpen, setJobDescriptionOpen] = useState(false);
  const research = application.research;
  const mode = modeConfig(application.type);

  async function handleResearch() {
    setLoading(true);
    try {
      const result = await researchApplication(application.id);
      toast.success(
        result
          ? "Recherche abgeschlossen"
          : "Keine Recherche-Ergebnisse gefunden.",
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Recherche fehlgeschlagen.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!research) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Noch keine Recherche"
        description="Lass dir von der KI das Unternehmen und die Stelle zusammenfassen. Die Ergebnisse werden an dieser Bewerbung gespeichert."
        action={
          <Button onClick={() => void handleResearch()} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Recherche starten
          </Button>
        }
      />
    );
  }

  const jobDescription = research.jobDescription ?? "";
  const isLongJobDescription = jobDescription.length > 400;

  const requirements = Array.isArray(research.requirements)
    ? research.requirements.filter(Boolean)
    : [];
  const benefits = Array.isArray(research.benefits)
    ? research.benefits.filter(Boolean)
    : [];

  const seenUrls = new Set<string>();
  const sources = (
    Array.isArray(research.sources) ? research.sources : []
  )
    .filter((source) => {
      const url = source?.url;
      if (!url || seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    })
    .slice(0, 6);

  const facts: Fact[] = [];
  if (research.salary) {
    facts.push({ icon: Euro, label: "Vergütung", value: research.salary });
  }
  if (research.workingHours) {
    facts.push({
      icon: Clock,
      label: "Arbeitszeit",
      value: research.workingHours,
    });
  }
  if (research.employmentType) {
    facts.push({
      icon: BadgeCheck,
      label: "Anstellungsart",
      value: research.employmentType,
    });
  }
  if (research.startDate) {
    facts.push({
      icon: CalendarCheck,
      label: "Start",
      value: research.startDate,
    });
  }
  if (research.applicationDeadline) {
    facts.push({
      icon: CalendarClock,
      label: "Bewerbungsfrist",
      value: research.applicationDeadline,
    });
  }
  if (research.address) {
    facts.push({ icon: MapPin, label: "Adresse", value: research.address });
  }
  if (research.website) {
    facts.push({
      icon: Globe,
      label: "Website",
      value: research.website,
      href: research.website,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Zuletzt recherchiert am {formatDateTime(research.researchedAt)}
          </p>
          <Badge
            variant={research.fetchedFromLink ? "default" : "secondary"}
            className="font-normal"
          >
            {research.fetchedFromLink ? "Aus Stellenanzeige" : "Websuche"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full sm:h-8 sm:w-auto"
          onClick={() => void handleResearch()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Neu recherchieren
        </Button>
      </div>

      {research.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
            {research.summary}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {research.companySummary ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                Unternehmen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {research.companySummary}
            </CardContent>
          </Card>
        ) : null}

        {research.roleSummary ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                {mode.roleLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {research.roleSummary}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {jobDescription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Stellenbeschreibung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible
              open={jobDescriptionOpen}
              onOpenChange={setJobDescriptionOpen}
            >
              <p
                className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground",
                  !jobDescriptionOpen &&
                    isLongJobDescription &&
                    "line-clamp-5",
                )}
              >
                {jobDescription}
              </p>
              {isLongJobDescription ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 mt-1 text-muted-foreground"
                  >
                    {jobDescriptionOpen ? "Weniger anzeigen" : "Mehr anzeigen"}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        jobDescriptionOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </Collapsible>
          </CardContent>
        </Card>
      ) : null}

      {requirements.length > 0 || benefits.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {requirements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  Anforderungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {requirements.map((requirement, index) => (
                    <li
                      key={`${requirement}-${index}`}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="min-w-0 break-words">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {benefits.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li
                      key={`${benefit}-${index}`}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      <span className="min-w-0 break-words">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {facts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-muted-foreground" />
              Eckdaten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {facts.map((fact) => (
                <FactItem key={fact.label} {...fact} />
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {sources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="size-4 text-muted-foreground" />
              Quellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <span className="break-all">
                      {source.title || source.url}
                    </span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <p className="text-sm text-muted-foreground">
        Diese Angaben werden von einer KI erstellt und können ungenau sein.
      </p>
    </div>
  );
}
