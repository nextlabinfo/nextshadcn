"use client";

import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TrafficSourceSlice } from "@/lib/dashboards/types";

const trafficConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-3)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function StoreTraffic({ sources }: { sources: TrafficSourceSlice[] }) {
  const trafficData = sources.map((source) => ({
    label: source.source,
    visitors: source.visitors,
    orders: source.orders,
  }));
  const totalVisitors = sources.reduce((sum, source) => sum + source.visitors, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Store Traffic</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {compactFormatter.format(totalVisitors)} visits
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={trafficConfig} className="h-54 w-full">
          <AreaChart accessibilityLayer data={trafficData} margin={{ bottom: 0, left: 0, right: 0, top: 8 }}>
            <defs>
              <linearGradient id="fillVisitors" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={6} width={36} yAxisId="traffic" />
            <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }} />
            <ChartLegend align="right" verticalAlign="top" content={<ChartLegendContent className="justify-end" />} />
            <Area
              dataKey="visitors"
              dot={false}
              fill="url(#fillVisitors)"
              stroke="var(--color-visitors)"
              strokeWidth={2}
              type="monotone"
              yAxisId="traffic"
            />
            <Line
              dataKey="orders"
              dot={false}
              stroke="var(--color-orders)"
              strokeLinecap="round"
              strokeWidth={1.2}
              type="monotone"
              yAxisId="traffic"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
