"use client";

import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Course } from "@/lib/dashboards/types";

type PerformanceHighlight = {
  className: string;
  start: number;
  duration: number;
  subject: string;
  score: number;
  students: { initials: string; name: string; achievement: string; score: number }[];
};

function buildHighlights(courses: Course[]): PerformanceHighlight[] {
  const seen = new Set<string>();
  const topCourses: Course[] = [];

  for (const course of [...courses].sort((a, b) => b.students - a.students)) {
    const key = course.category ?? course.title;
    if (seen.has(key)) continue;
    seen.add(key);
    topCourses.push(course);
    if (topCourses.length === 5) break;
  }

  return topCourses.map((course) => ({
    className: course.category ?? course.title,
    start: 0,
    duration: 4,
    subject: course.title,
    // rating is on a 0-5 scale; render it as a 0-100 fill.
    score: Math.round((course.rating / 5) * 100),
    students: [],
  }));
}

const chartConfig = {
  duration: {
    label: "Rating",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function PerformanceHighlightBar({
  height = 0,
  payload,
  width = 0,
  x = 0,
  y = 0,
}: {
  height?: number;
  payload?: PerformanceHighlight;
  width?: number;
  x?: number;
  y?: number;
}) {
  if (!payload) {
    return null;
  }

  const barHeight = Math.min(32, height);
  const barY = y + (height - barHeight) / 2;
  const radius = barHeight / 2;
  const fillWidth = Math.max(width * (payload.score / 100), 86);
  const avatarSize = 22;
  const avatarStart = x + 8;
  const avatarY = barY + (barHeight - avatarSize) / 2 - 1.5;
  const labelX = avatarStart + payload.students.length * 14 + 14;

  return (
    <g>
      <rect
        fill="color-mix(in oklch, var(--color-duration) 18%, transparent)"
        height={barHeight}
        rx={radius}
        width={width}
        x={x}
        y={barY}
      />
      <rect fill="var(--color-duration)" height={barHeight} rx={radius} width={fillWidth} x={x} y={barY} />

      {payload.students.map((student, index) => {
        const avatarX = avatarStart + index * 14;

        return (
          <foreignObject
            height={avatarSize + 4}
            key={student.initials}
            overflow="visible"
            width={avatarSize + 4}
            x={avatarX - 2}
            y={avatarY}
          >
            <Tooltip>
              <TooltipTrigger
                aria-label={student.name}
                className="flex size-5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
              >
                <Avatar className="size-5 bg-muted" size="sm">
                  <AvatarFallback className="text-foreground">{student.initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <div className="grid gap-1">
                  <p>{student.name}</p>
                  <p>
                    {student.achievement} · {student.score}%
                  </p>
                  <p>
                    {payload.className} · {payload.subject}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </foreignObject>
        );
      })}

      <text
        dominantBaseline="middle"
        x={labelX}
        y={barY + barHeight / 2 + 0.5}
        className="fill-primary-foreground font-medium text-xs"
      >
        {payload.subject}
      </text>

      <text
        dominantBaseline="middle"
        fill="var(--foreground)"
        fontSize={11}
        textAnchor="end"
        x={x + width - 10}
        y={barY + barHeight / 2 + 0.5}
        className="font-medium tabular-nums"
      >
        {payload.score}%
      </text>
    </g>
  );
}

export function PerformanceHighlights({ courses }: { courses: Course[] }) {
  const performanceHighlights = buildHighlights(courses);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Performance Highlights</CardTitle>
        <CardAction className="flex items-center gap-1 text-muted-foreground text-xs">
          View Insights <ArrowRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart
            accessibilityLayer
            data={performanceHighlights}
            layout="vertical"
            margin={{ bottom: 0, left: 0, right: 8, top: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 4" />
            <XAxis
              axisLine={false}
              domain={[0, 4]}
              tickFormatter={(value) => ["Mon", "Tue", "Wed", "Thu", "Fri"][Number(value)] ?? ""}
              tickLine={false}
              tickMargin={10}
              ticks={[0, 1, 2, 3, 4]}
              type="number"
            />
            <YAxis axisLine={false} dataKey="className" tickLine={false} tickMargin={10} type="category" width={45} />
            <Bar dataKey="start" fill="transparent" stackId="timeline" />
            <Bar dataKey="duration" shape={<PerformanceHighlightBar />} stackId="timeline" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
