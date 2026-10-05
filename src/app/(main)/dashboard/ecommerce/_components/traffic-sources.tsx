"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { TrafficSourceSlice } from "@/lib/dashboards/types";

const trafficSourcesConfig = {
  share: {
    label: "Visits",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("en-US");

type SourceRow = {
  name: string;
  visits: string;
  share: number;
};

type SourceLabelProps = LabelProps & {
  index?: number;
};

function getNumber(value: number | string | undefined) {
  return typeof value === "number" ? value : Number(value);
}

export function TrafficSources({ sources }: { sources: TrafficSourceSlice[] }) {
  const totalVisitors = sources.reduce((sum, source) => sum + source.visitors, 0);
  const rows: SourceRow[] = sources.map((source) => ({
    name: source.source,
    visits: integerFormatter.format(source.visitors),
    share: totalVisitors > 0 ? Math.round((source.visitors / totalVisitors) * 100) : 0,
  }));

  function TrafficSourceNameLabel({ height, index, x, y }: SourceLabelProps) {
    if (typeof index !== "number") {
      return null;
    }

    const source = rows[index];
    const xValue = getNumber(x);
    const yValue = getNumber(y);
    const heightValue = getNumber(height);

    if (!source || Number.isNaN(xValue) || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
      return null;
    }

    return (
      <text dominantBaseline="middle" textAnchor="start" x={2} y={yValue + heightValue / 2}>
        <tspan className="fill-foreground font-medium" fontSize={13} x={2} y={yValue + heightValue / 2 - 7}>
          {source.name}
        </tspan>
        <tspan className="fill-muted-foreground" fontSize={12} x={2} y={yValue + heightValue / 2 + 11}>
          {source.visits}
        </tspan>
      </text>
    );
  }

  function TrafficSourceShareLabel({ height, value, y }: LabelProps) {
    const yValue = getNumber(y);
    const heightValue = getNumber(height);

    if (value === undefined || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
      return null;
    }

    return (
      <text
        className="fill-muted-foreground"
        dominantBaseline="middle"
        dx={-6}
        fontSize={13}
        textAnchor="end"
        x="100%"
        y={yValue + heightValue / 2}
      >
        {value}%
      </text>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Traffic Sources</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {compactFormatter.format(totalVisitors)} visits
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={trafficSourcesConfig} className="h-54 w-full">
          <BarChart
            accessibilityLayer
            barCategoryGap={12}
            data={rows}
            layout="vertical"
            margin={{ bottom: 0, left: 100, right: 50, top: 0 }}
          >
            <defs>
              <pattern
                height="4"
                id="ecommerce-traffic-source-background-pattern"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
                width="4"
              >
                <rect height="6" width="6" fill="var(--muted)" fillOpacity="0.5" />
                <line
                  stroke="var(--muted-foreground)"
                  strokeOpacity="0.10"
                  strokeWidth="1.25"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="6"
                />
              </pattern>
            </defs>
            <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
            <YAxis dataKey="name" hide type="category" />
            <Bar
              background={{ fill: "url(#ecommerce-traffic-source-background-pattern)", radius: 8 }}
              barSize={36}
              dataKey="share"
              fill="var(--color-share)"
              fillOpacity={0.5}
              name="Visits"
              radius={8}
              stroke="var(--color-share)"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            >
              <LabelList content={<TrafficSourceNameLabel />} dataKey="name" />
              <LabelList content={<TrafficSourceShareLabel />} dataKey="share" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
