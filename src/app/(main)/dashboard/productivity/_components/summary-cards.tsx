import { ArrowRight, Clock3, Focus, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductivitySummary = {
  activeProjects: number;
  doneProjects: number;
  avgProgress: number;
  totalTasks: number;
  doneTasks: number;
};

export function SummaryCards({ summary }: { summary: ProductivitySummary }) {
  const summaryCards = [
    {
      title: "Tasks",
      value: `${summary.doneTasks}/${summary.totalTasks}`,
      description: "tasks completed",
      icon: Clock3,
    },
    {
      title: "This Week",
      value: `${summary.avgProgress}%`,
      description: "progress",
      icon: TrendingUp,
    },
    {
      title: "Projects",
      value: String(summary.activeProjects),
      description: "active projects",
      icon: Focus,
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((item) => (
        <Card key={item.title} className="shadow-xs">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="grid size-7 place-items-center rounded-lg border bg-muted">
                  <item.icon className="size-4" />
                </div>
                {item.title}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl leading-none tracking-tight">{item.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground tabular-nums leading-none">{item.description}</p>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
