"use client";

import { BookOpen, Briefcase, GraduationCap, type LucideIcon } from "lucide-react";

import { useAppMode } from "@/components/providers/app-mode-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APPLICATION_TYPES, MODE_CONFIG, isApplicationType } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo/flag";
import { cn } from "@/lib/utils";
import type { ApplicationType } from "@/types";

const MODE_ICONS: Record<ApplicationType, LucideIcon> = {
  ausbildung: GraduationCap,
  duales_studium: BookOpen,
  job: Briefcase,
};

interface ModeSwitcherProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  /**
   * `responsive` hides the labels on narrow screens (icon-only) – used in the
   * header. `always` keeps them visible – used in the sidebar sheet.
   */
  labels?: "responsive" | "always";
}

export function ModeSwitcher({
  className,
  size = "default",
  labels = "responsive",
}: ModeSwitcherProps) {
  const { mode, setMode } = useAppMode();

  // The public demo is Ausbildungen-only, so there is nothing to switch.
  if (DEMO_MODE) return null;

  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (isApplicationType(value)) {
          setMode(value);
        }
      }}
      variant="outline"
      size={size}
      aria-label="Bereich wählen: Ausbildungen, Duales Studium oder Jobs"
      className={cn(
        "w-fit max-w-full min-w-0 gap-0.5",
        labels === "always" && "flex w-full flex-col items-stretch",
        className,
      )}
    >
      {APPLICATION_TYPES.map((option) => {
        const Icon = MODE_ICONS[option];
        const config = MODE_CONFIG[option];
        const active = mode === option;

        return (
          <Tooltip key={option}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={option}
                aria-label={config.title}
                className={cn(
                  "min-w-0 gap-1.5 px-2 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground!",
                  labels === "always" ? "w-full justify-start" : "justify-center",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    "truncate",
                    labels === "always" ? "inline" : "hidden lg:inline",
                  )}
                >
                  {config.title}
                </span>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="lg:hidden">
              {active ? `${config.title} (aktiv)` : `Zu ${config.title} wechseln`}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
