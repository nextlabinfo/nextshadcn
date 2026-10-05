"use client";

import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Assignment } from "@/lib/dashboards/types";

function buildChartData(assignments: Assignment[]) {
  const now = Date.now();

  return assignments.map((a) => {
    const remaining = Math.max(a.total - a.submitted, 0);
    const isOverdue = a.status !== "closed" && a.dueDate !== null && new Date(a.dueDate).getTime() < now;

    return {
      className: a.courseTitle ?? a.title,
      submitted: a.submitted,
      pending: isOverdue ? 0 : remaining,
      overdue: isOverdue ? remaining : 0,
    };
  });
}

function SubmittedLegendIcon() {
  return <span className="block size-2 rounded-[2px] bg-chart-3" />;
}

function PendingLegendIcon() {
  return <span className="block size-2 rounded-[2px] bg-chart-2" />;
}

function OverdueLegendIcon() {
  return <span className="block size-2 rounded-[2px] bg-destructive" />;
}

const chartConfig = {
  submitted: {
    label: "Submitted",
    color: "var(--chart-3)",
    icon: SubmittedLegendIcon,
  },
  pending: {
    label: "Pending",
    color: "var(--chart-2)",
    icon: PendingLegendIcon,
  },
  overdue: {
    label: "Overdue",
    color: "var(--destructive)",
    icon: OverdueLegendIcon,
  },
} satisfies ChartConfig;

function AssignmentDotPattern({ color, id }: { color: string; id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill={color} fillOpacity="0.7" />
      <circle cx="1.5" cy="1.5" r="0.8" fill={color} fillOpacity="0.25" />
      <circle cx="4.5" cy="4.5" r="0.8" fill={color} fillOpacity="0.25" />
    </pattern>
  );
}

export function AssignmentStatus({ assignments }: { assignments: Assignment[] }) {
  const chartData = buildChartData(assignments);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Assignment Status</CardTitle>
        <CardAction className="flex items-center gap-1 text-muted-foreground text-xs">
          View Report <ArrowRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <defs>
              <AssignmentDotPattern color="var(--color-submitted)" id="assignment-submitted-pattern" />
              <AssignmentDotPattern color="var(--color-pending)" id="assignment-pending-pattern" />
              <AssignmentDotPattern color="var(--color-overdue)" id="assignment-overdue-pattern" />
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="className" tickLine={false} tickMargin={10} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            <ChartLegend content={<ChartLegendContent className="justify-start" />} verticalAlign="top" />
            <Bar
              dataKey="submitted"
              fill="url(#assignment-submitted-pattern)"
              radius={4}
              stroke="var(--color-submitted)"
              strokeOpacity={0.45}
              strokeWidth={0.5}
            />
            <Bar
              dataKey="pending"
              fill="url(#assignment-pending-pattern)"
              radius={4}
              stroke="var(--color-pending)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
            <Bar
              dataKey="overdue"
              fill="url(#assignment-overdue-pattern)"
              radius={4}
              stroke="var(--color-overdue)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
