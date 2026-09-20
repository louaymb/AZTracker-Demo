"use client";

import { useState } from "react";
import {
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateInterviewPrep } from "@/lib/firebase/functions";
import { formatDateTime } from "@/lib/format";
import type { Application } from "@/types";

interface InterviewPrepCardProps {
  application: Application;
}

function TipList({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 text-sm leading-snug"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function InterviewPrepCard({ application }: InterviewPrepCardProps) {
  const [loading, setLoading] = useState(false);
  const prep = application.interviewPrep;

  async function handleGenerate() {
    setLoading(true);
    try {
      await generateInterviewPrep(application.id);
      toast.success("Interview-Vorbereitung erstellt");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Interview-Vorbereitung konnte nicht generiert werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!prep) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Noch keine Interview-Vorbereitung"
        description="Lass dir von der KI wahrscheinliche Fragen, Antwortvorschläge und Tipps für dein Gespräch erstellen."
        action={
          <Button onClick={() => void handleGenerate()} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Vorbereitung generieren
          </Button>
        }
      />
    );
  }

  const roleSummary = prep.roleSummary?.trim() ?? "";
  const questions = Array.isArray(prep.questions) ? prep.questions : [];
  const generalTips = Array.isArray(prep.generalTips)
    ? prep.generalTips.filter((tip) => tip?.trim())
    : [];
  const questionsToAsk = Array.isArray(prep.questionsToAsk)
    ? prep.questionsToAsk.filter((question) => question?.trim())
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {prep.generatedAt
            ? `Erstellt am ${formatDateTime(prep.generatedAt)}`
            : "Interview-Vorbereitung"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full sm:h-8 sm:w-auto"
          onClick={() => void handleGenerate()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Neu generieren
        </Button>
      </div>

      {roleSummary ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" />
              Kurzbeschreibung
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
            {roleSummary}
          </CardContent>
        </Card>
      ) : null}

      {questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4 text-muted-foreground" />
              Mögliche Fragen ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {questions.map((question, index) => (
                <AccordionItem
                  key={`${question.question}-${index}`}
                  value={`question-${index}`}
                >
                  <AccordionTrigger>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 pr-2 sm:flex-row sm:items-center sm:gap-2">
                      <span className="min-w-0 break-words">
                        {question.question}
                      </span>
                      {question.category ? (
                        <Badge
                          variant="secondary"
                          className="w-fit shrink-0 font-normal"
                        >
                          {question.category}
                        </Badge>
                      ) : null}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {question.starAnswer ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Antwortvorschlag (STAR)
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {question.starAnswer}
                        </p>
                      </div>
                    ) : null}
                    {question.tips ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Tipp
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {question.tips}
                        </p>
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {generalTips.length > 0 ? (
          <TipList
            icon={Lightbulb}
            title="Allgemeine Tipps"
            items={generalTips}
          />
        ) : null}
        {questionsToAsk.length > 0 ? (
          <TipList
            icon={MessageCircleQuestion}
            title="Fragen an das Unternehmen"
            items={questionsToAsk}
          />
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        Diese Vorbereitung wird von einer KI erstellt und kann ungenau sein.
      </p>
    </div>
  );
}
