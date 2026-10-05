"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrmActivity, CrmLead } from "@/lib/dashboards/types";

const pipelineChartConfig = {
  qualified: {
    label: "Qualified",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const axisMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

function getRollingLeadData(leads: CrmLead[]) {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (11 - index));

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      date: date.toISOString(),
      qualified: 0,
    };
  });

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const lead of leads) {
    const created = new Date(lead.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const bucket = byKey.get(`${created.getFullYear()}-${created.getMonth()}`);
    if (bucket) bucket.qualified += 1;
  }

  return buckets.map(({ date, qualified }) => ({ date, qualified }));
}

export function PipelineActivity({ leads, activities }: { leads: CrmLead[]; activities: CrmActivity[] }) {
  const pipelineChartData = getRollingLeadData(leads);
  const totalQualified = pipelineChartData.reduce((sum, item) => sum + item.qualified, 0);
  const discoveryCallsBooked = activities.filter((activity) => activity.type === "call").length;
  const discoveryProgress = totalQualified > 0 ? Math.round((discoveryCallsBooked / totalQualified) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-12">
        <CardHeader>
          <CardTitle>Qualified Lead Flow</CardTitle>
          <CardAction>
            <Select defaultValue="last-12-months">
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-quarter">Last quarter</SelectItem>
                  <SelectItem value="last-12-months">Last 12 months</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <ChartContainer config={pipelineChartConfig} className="h-72 w-full lg:col-span-8">
              <BarChart data={pipelineChartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={38}>
                <defs>
                  <pattern
                    id="crm-qualified-pattern"
                    width="4"
                    height="4"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="6" height="6" fill="var(--color-qualified)" fillOpacity="0.15" />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="var(--color-qualified)"
                      strokeWidth="1.25"
                      strokeOpacity="0.40"
                    />
                  </pattern>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="0" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => axisMonthFormatter.format(new Date(String(value)))}
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(value) => tooltipMonthFormatter.format(new Date(String(value)))}
                    />
                  }
                />
                <Bar
                  dataKey="qualified"
                  fill="url(#crm-qualified-pattern)"
                  radius={[8, 8, 0, 0]}
                  stroke="var(--color-qualified)"
                  strokeOpacity={0.5}
                  strokeWidth={0.5}
                />
              </BarChart>
            </ChartContainer>

            <div className="flex flex-col gap-5 rounded-lg p-4 lg:col-span-4">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-4xl tabular-nums leading-none">
                  {totalQualified} <span className="font-normal text-lg text-muted-foreground">leads</span>
                </div>
                <p className="text-muted-foreground text-sm">Total qualified leads captured over the last 12 months.</p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                  Discovery Calls Booked
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="font-medium text-2xl tabular-nums leading-none">
                    {discoveryCallsBooked} <span className="font-normal text-muted-foreground text-sm">meetings</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {discoveryProgress}% of qualified leads booked a first call.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-0.5">
                  <Progress
                    value={discoveryProgress}
                    className="h-2.5 bg-chart-2/12 *:data-[slot='progress-indicator']:bg-chart-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-medium tabular-nums">{discoveryCallsBooked} booked</div>
                    <div className="text-muted-foreground tabular-nums">{totalQualified} qualified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
