import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProductivitySummary = {
  activeProjects: number;
  doneProjects: number;
  avgProgress: number;
  totalTasks: number;
  doneTasks: number;
};

export function WeeklySummaryCard({ summary }: { summary: ProductivitySummary }) {
  const pct = summary.totalTasks > 0 ? Math.round((summary.doneTasks / summary.totalTasks) * 100) : 0;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>This Week</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">You’re doing great. Keep the momentum going.</p>
        <div className="flex flex-col gap-2">
          <div className="font-medium">
            {summary.doneTasks} of {summary.totalTasks} tasks completed
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
