"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import { useAppMode } from "@/components/providers/app-mode-provider";
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
import { roleCategoryOf } from "@/lib/constants";
import type { Application } from "@/types";

const config: ChartConfig = {
  count: { label: "Bewerbungen" },
};

const MAX_BERUFE = 8;

export function BerufChart({ applications }: { applications: Application[] }) {
  const { labels } = useAppMode();

  const data = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((application) => {
      const beruf = roleCategoryOf(application) || "Ohne Angabe";
      counts.set(beruf, (counts.get(beruf) ?? 0) + 1);
    });

    const sorted = [...counts.entries()]
      .map(([beruf, count]) => ({ beruf, count }))
      .sort((a, b) => b.count - a.count || a.beruf.localeCompare(b.beruf, "de"));

    const top = sorted.slice(0, MAX_BERUFE);
    const rest = sorted.slice(MAX_BERUFE);
    if (rest.length > 0) {
      top.push({
        beruf: "Sonstige",
        count: rest.reduce((sum, item) => sum + item.count, 0),
      });
    }
    return top;
  }, [applications]);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Bewerbungen nach {labels.roleLabel}</CardTitle>
        <CardDescription>
          Die häufigsten Berufe, weitere sind unter „Sonstige“ zusammengefasst.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <ChartContainer
          config={config}
          className="aspect-auto min-h-[240px] w-full min-w-0"
          style={{ height: Math.max(240, data.length * 38 + 32) }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
          >
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="beruf"
              width={110}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) =>
                value.length > 16 ? `${value.slice(0, 15)}…` : value
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.beruf}
                  fill={
                    entry.beruf === "Sonstige"
                      ? "var(--chart-4)"
                      : "var(--chart-2)"
                  }
                  opacity={index === 0 ? 1 : 0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
