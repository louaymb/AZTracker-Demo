"use client";

import { RefreshCw } from "lucide-react";

import { useGmailSync } from "@/hooks/use-sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  fullSync?: boolean;
  label?: string;
  /** Hide the text label on narrow screens (icon-only), e.g. in the header. */
  hideLabelOnMobile?: boolean;
}

export function SyncButton({
  variant = "outline",
  className,
  fullSync = false,
  label = "Jetzt synchronisieren",
  hideLabelOnMobile = false,
}: SyncButtonProps) {
  const { syncing, run } = useGmailSync();
  const text = syncing ? "Synchronisiere …" : label;

  return (
    <Button
      variant={variant}
      className={cn(className)}
      disabled={syncing}
      aria-label={label}
      onClick={() => void run({ fullSync })}
    >
      <RefreshCw
        className={cn(
          "size-4",
          hideLabelOnMobile ? "lg:mr-2" : "mr-2",
          syncing && "animate-spin",
        )}
      />
      <span className={cn(hideLabelOnMobile && "hidden lg:inline")}>
        {text}
      </span>
    </Button>
  );
}
