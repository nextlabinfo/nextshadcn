import { Info } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcademyKpis } from "@/lib/dashboards/types";

export function KpiCards({ kpis }: { kpis: AcademyKpis }) {
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Students Taught</CardTitle>
            <CardAction>
              <Info className="size-3 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-3xl text-foreground leading-none tracking-tight">
                {kpis.totalStudents.toLocaleString()}
              </span>
            </div>
            <div className="text-right text-muted-foreground text-xs">enrolled across all courses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Courses</CardTitle>
            <CardAction>
              <Info className="size-3 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-3xl text-foreground leading-none tracking-tight">{kpis.activeCourses}</span>
            </div>
            <div className="text-right text-muted-foreground text-xs">currently published</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg. Rating</CardTitle>
            <CardAction>
              <Info className="size-3 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="text-3xl text-foreground leading-none tracking-tight">{kpis.avgRating.toFixed(1)}</div>

            <div className="text-right text-muted-foreground text-xs">across all courses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assignments Due</CardTitle>
            <CardAction>
              <Info className="size-3 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="text-3xl text-foreground leading-none tracking-tight">{kpis.assignmentsDue}</div>

            <div className="text-right text-muted-foreground text-xs">open or grading</div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
