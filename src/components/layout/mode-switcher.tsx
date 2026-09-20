"use client";

import { Briefcase, GraduationCap, type LucideIcon } from "lucide-react";

import { useAppMode } from "@/components/providers/app-mode-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODE_CONFIG } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo/flag";
import { cn } from "@/lib/utils";
import type { ApplicationType } from "@/types";

const MODE_OPTIONS: ApplicationType[] = ["ausbildung", "job"];

const MODE_ICONS: Record<ApplicationType, LucideIcon> = {
  ausbildung: GraduationCap,
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
        if (value === "ausbildung" || value === "job") {
          setMode(value);
        }
      }}
      variant="outline"
      size={size}
      aria-label="Bereich wählen: Ausbildungen oder Jobs"
      className={cn("w-fit max-w-full min-w-0 gap-0.5", className)}
    >
      {MODE_OPTIONS.map((option) => {
        const Icon = MODE_ICONS[option];
        const config = MODE_CONFIG[option];
        const active = mode === option;

        return (
          <Tooltip key={option}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={option}
                aria-label={config.title}
                className="min-w-0 justify-center gap-1.5 px-2 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground!"
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
