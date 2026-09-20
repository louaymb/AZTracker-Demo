"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/types";

const SHORT_LABELS: Record<ApplicationStatus, string> = {
  entwurf: "Entwurf",
  beworben: "Beworben",
  warte_auf_antwort: "Warte",
  einladung: "Einladung",
  vorstellungsgespraech: "Gespräch",
  absage: "Absage",
  zusage: "Zusage",
  abgebrochen: "Abbruch",
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const config: ChartConfig = {
  count: { label: "Bewerbungen" },
};

export function StatusChart({ applications }: { applications: Application[] }) {
  const data = useMemo(() => {
    const counts = new Map<ApplicationStatus, number>();
    applications.forEach((application) => {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    });
    return STATUS_ORDER.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }, [applications]);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Bewerbungen nach Status</CardTitle>
        <CardDescription>
          Verteilung aller Bewerbungen über die einzelnen Phasen.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <ChartContainer
          config={config}
          className="aspect-auto h-[280px] min-h-[240px] w-full min-w-0"
        >
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              interval={0}
              angle={-40}
              textAnchor="end"
              height={72}
              tickMargin={6}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: ApplicationStatus) =>
                SHORT_LABELS[value] ?? value
              }
            />
            <YAxis allowDecimals={false} width={24} tick={{ fontSize: 11 }} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    STATUS_LABELS[value as ApplicationStatus] ?? value
                  }
                />
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
