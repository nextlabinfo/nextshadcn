"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import type { AnalyticsSource } from "@/lib/dashboards/types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const chartConfig = {
  visitors: {
    color: "var(--chart-1)",
    label: "Sessions",
  },
} satisfies ChartConfig;

type TrafficSourceDatum = {
  label: string;
  source: string;
  visitors: number;
};

const KIND_LABELS: Record<string, string> = {
  organic: "Organic Search",
  direct: "Direct",
  social: "Social",
  referral: "Referral",
  paid: "Paid",
  email: "Email",
};

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function toDatum(source: string, visitors: number): TrafficSourceDatum {
  return { label: formatCompact(visitors), source, visitors };
}

// Channels: aggregate sessions by the source "kind".
function buildSourcesData(sources: AnalyticsSource[]): TrafficSourceDatum[] {
  const totals = new Map<string, number>();
  for (const s of sources) {
    totals.set(s.kind, (totals.get(s.kind) ?? 0) + s.sessions);
  }
  return [...totals.entries()]
    .map(([kind, sessions]) => toDatum(KIND_LABELS[kind] ?? kind, sessions))
    .sort((a, b) => b.visitors - a.visitors);
}

// Referrers: individual named sources.
function buildReferrersData(sources: AnalyticsSource[]): TrafficSourceDatum[] {
  return [...sources]
    .sort((a, b) => b.sessions - a.sessions)
    .map((s) => toDatum(s.source, s.sessions));
}

// Campaigns: marketing-driven channels (paid + email) by named source.
function buildCampaignsData(sources: AnalyticsSource[]): TrafficSourceDatum[] {
  return sources
    .filter((s) => s.kind === "paid" || s.kind === "email")
    .sort((a, b) => b.sessions - a.sessions)
    .map((s) => toDatum(s.source, s.sessions));
}

function renderValueLabel(props: LabelProps) {
  const { height, value, y } = props;

  return (
    <text
      className="fill-foreground"
      dominantBaseline="middle"
      dx={-6}
      fontSize={14}
      textAnchor="end"
      x="100%"
      y={Number(y) + Number(height) / 2}
    >
      {value}
    </text>
  );
}

function TrafficSourceBarChart({ data }: { data: TrafficSourceDatum[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          right: 48,
        }}
      >
        <CartesianGrid horizontal={false} vertical={false} />
        <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="visitors" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="visitors" fill="var(--color-visitors)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="source" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="label" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function TopTrafficSources({ sources }: { sources: AnalyticsSource[] }) {
  const sourcesData = buildSourcesData(sources);
  const campaignsData = buildCampaignsData(sources);
  const referrersData = buildReferrersData(sources);

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Traffic Sources</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs defaultValue="sources" className="flex flex-col gap-3">
          <TabsList className="w-full justify-start border-b px-2.5" variant="line">
            <TabsTrigger className="flex-none font-normal" value="sources">
              Sources
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="campaigns">
              Campaigns
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="referrers">
              Referrers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="px-4">
            <TrafficSourceBarChart data={sourcesData} />
          </TabsContent>

          <TabsContent value="campaigns" className="px-4">
            <TrafficSourceBarChart data={campaignsData} />
          </TabsContent>
          <TabsContent value="referrers" className="px-4">
            <TrafficSourceBarChart data={referrersData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
