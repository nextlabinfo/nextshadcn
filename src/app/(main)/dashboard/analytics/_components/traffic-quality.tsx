"use client";

import { Ellipsis } from "lucide-react";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import type { TrafficPoint } from "@/lib/dashboards/types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  visitors: {
    color: "var(--chart-3)",
    label: "Visitors",
  },
  pageviews: {
    color: "var(--muted-foreground)",
    label: "Pageviews",
  },
} satisfies ChartConfig;

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function TrafficQuality({ series }: { series: TrafficPoint[] }) {
  const tickInterval = series.length > 6 ? Math.floor(series.length / 4) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Traffic Quality</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-68 w-full">
          <ComposedChart data={series} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              interval={tickInterval}
              tickFormatter={formatDay}
              tickLine={false}
              tickMargin={14}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) => formatCompact(Number(value))}
              tickLine={false}
              tickMargin={10}
              width={40}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent className="w-40" labelFormatter={(_, payload) => formatDay(String(payload?.[0]?.payload?.day ?? ""))} />}
            />
            <Line
              dataKey="pageviews"
              dot={false}
              stroke="var(--color-pageviews)"
              strokeOpacity={0.65}
              strokeDasharray="4 4"
              strokeWidth={1.75}
              type="linear"
            />
            <Line
              dataKey="visitors"
              dot={false}
              activeDot={{ r: 4 }}
              stroke="var(--color-visitors)"
              strokeWidth={2.5}
              type="linear"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
