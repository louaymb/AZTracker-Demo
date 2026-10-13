"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/export";
import type { Application } from "@/types";

interface ExportCsvButtonProps {
  applications: Application[];
  className?: string;
}

export function ExportCsvButton({
  applications,
  className,
}: ExportCsvButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={applications.length === 0}
      onClick={() => downloadCsv(applications)}
    >
      <Download className="size-4" />
      CSV exportieren
    </Button>
  );
}
